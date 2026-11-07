import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  trackReport,
  getNearbyReports
} from '../controllers/reportController.js';
import { optionalProtect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validator.js';
import { createReportSchema } from '../validators/schemas.js';

const router = Router();

// Public search for nearby open incidents (repeated leak detection)
router.get('/nearby', getNearbyReports);

// Public track report by trackingId (WLW-2026-XXXXXX)
router.get('/track/:trackingId', trackReport);

// List and get reports
router.get('/', getReports);
router.get('/:id', getReportById);

// Submit report (with up to 4 photos, draft or registered)
router.post(
  '/',
  optionalProtect,
  upload.array('photos', 4),
  validate(createReportSchema),
  createReport
);

export default router;

