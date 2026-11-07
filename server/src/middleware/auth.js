import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export function signAccessToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET || 'wlw_super_secret_access_jwt_key_2026_production_grade',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'wlw_super_secret_refresh_jwt_key_2026_production_grade',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

export function setTokenCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
}

export function clearTokenCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  });
}

export async function protect(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to gain access.', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'wlw_super_secret_access_jwt_key_2026_production_grade'
    );

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
}

export async function optionalProtect(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'wlw_super_secret_access_jwt_key_2026_production_grade'
    );

    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}

