const bcrypt = require('bcrypt');
const AuthError = require('../errors/auth-error');
const DuplicateError = require('../errors/duplicate-error');
const NotFoundError = require('../errors/not-found-error');
const Users = require('../models/user');

const getUsers = async (req, res, next) => {
  try {
    const data = await Users.find();

    return res.send(data);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const user = await Users.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true },
    );

    if (!user) {
      return next(new NotFoundError('Запрашиваемый пользователь не найден'));
    }

    return res.send(user);
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Users.create({
      name,
      email,
      password: passwordHash,
    });

    user.password = undefined;
    return res.send(user);
  } catch (error) {
    if (error.code === 11000) {
      return next(new DuplicateError('Пользователь с таким email уже зарегистрирован'));
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email }).select('+password');

    if (!user) {
      return next(new AuthError('Неправильные почта или пароль'));
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return next(new AuthError('Неправильные почта или пароль'));
    }

    return res.send(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  login,
};