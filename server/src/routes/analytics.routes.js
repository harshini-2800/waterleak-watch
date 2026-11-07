import { Router } from 'express';
import {
  getSummary,
  getResolutionTime,
  getHotspots,
  getSlaMetrics,
  getTrend
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/resolution-time', getResolutionTime);
router.get('/hotspots', getHotspots);
router.get('/sla', getSlaMetrics);
router.get('/trend', getTrend);

export default router;

