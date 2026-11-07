import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .sort('-createdAt')
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      data: notification,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read' },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

