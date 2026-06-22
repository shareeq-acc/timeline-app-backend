import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/authMiddleware';
import { uploadAvatarMiddleware } from '../middleware/uploadMiddleware';
import {
  updateProfile,
  uploadProfilePicture,
  getProfilePictures,
  selectProfilePicture,
} from '../controllers/userController';

const router = Router();

// Protect all user routes
router.use(authMiddleware.requireAuth);

router.put('/profile', updateProfile);
router.post('/profile-picture', uploadAvatarMiddleware, uploadProfilePicture);
router.get('/profile-pictures', getProfilePictures);
router.put('/profile-pictures/:id/select', selectProfilePicture);

export default router;
