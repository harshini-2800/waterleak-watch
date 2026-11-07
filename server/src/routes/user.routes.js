import { Router } from 'express';
import { getUsers, updateUserRole, getAuditLogs } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);

export default router;

