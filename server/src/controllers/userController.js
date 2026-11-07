import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

export async function getUsers(req, res, next) {
  try {
    const { role, ward, isActive, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (ward) query.assignedWard = ward;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query).select('-refreshToken').sort('-createdAt');

    res.status(200).json({
      success: true,
      data: users,
      meta: { count: users.length, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role, assignedWard, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (role) user.role = role;
    if (assignedWard !== undefined) user.assignedWard = assignedWard;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await AuditLog.create({
      action: 'UPDATE_USER',
      performedBy: req.user._id,
      performerRole: req.user.role,
      targetEntity: 'User',
      targetId: user._id,
      details: { role, assignedWard, isActive }
    });

    res.status(200).json({
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: logs,
      meta: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

