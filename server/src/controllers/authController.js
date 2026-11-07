import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  setTokenCookies,
  clearTokenCookies
} from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

export async function register(req, res, next) {
  try {
    const { name, email, password, phone, role, assignedWard } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'citizen',
      assignedWard
    });

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          assignedWard: user.assignedWard
        },
        accessToken
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          assignedWard: user.assignedWard
        },
        accessToken
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    let token = req.cookies?.refreshToken;
    if (!token && req.body?.refreshToken) {
      token = req.body.refreshToken;
    }

    if (!token) {
      return next(new AppError('Refresh token missing.', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'wlw_super_secret_refresh_jwt_key_2026_production_grade'
    );

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token || !user.isActive) {
      return next(new AppError('Invalid or revoked refresh token.', 401));
    }

    const newAccessToken = signAccessToken(user._id, user.role);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken: newAccessToken
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
}

export async function logout(req, res) {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  }
  clearTokenCookies(res);
  res.status(200).json({
    success: true,
    data: { message: 'Successfully logged out.' },
    meta: { timestamp: new Date().toISOString() }
  });
}

export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        assignedWard: req.user.assignedWard
      }
    },
    meta: { timestamp: new Date().toISOString() }
  });
}

