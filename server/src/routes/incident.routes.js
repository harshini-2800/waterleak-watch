import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignCrew,
  upvoteIncident,
  mergeIncidents,
  uploadAfterPhoto
} from '../controllers/incidentController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validator.js';
import { upload } from '../middleware/upload.js';
import {
  updateStatusSchema,
  assignCrewSchema,
  upvoteSchema,
  mergeIncidentsSchema
} from '../validators/schemas.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.get('/', getIncidents);
router.get('/:id', getIncidentById);

// Status transition (Admin or Crew)
router.patch(
  '/:id/status',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.CREW),
  validate(updateStatusSchema),
  updateIncidentStatus
);

// Crew assignment (Admin only)
router.patch(
  '/:id/assign',
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(assignCrewSchema),
  assignCrew
);

// Citizen confirmation / upvote ("I see this too")
router.post(
  '/:id/upvote',
  optionalProtect,
  validate(upvoteSchema),
  upvoteIncident
);

// Crew completion / after-photo upload
router.post(
  '/:id/after-photo',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.CREW),
  upload.single('photo'),
  uploadAfterPhoto
);

// Admin merge incidents
router.post(
  '/merge',
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(mergeIncidentsSchema),
  mergeIncidents
);

export default router;

