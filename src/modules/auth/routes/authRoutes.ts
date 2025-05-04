import { Router } from 'express';
import { dataValidation } from '../validations/dataValidation';
import { login, register, refreshToken, getUserLoggedIn } from '../controllers/authController';
import { authMiddleware } from '../../../shared/middleware/authMiddleware';

const router = Router();

router.get("/test", (req:any, res:any)=>{
  res.json({message:"ok"});
})

router.get("/me", authMiddleware.requireAuth, getUserLoggedIn)

router.post('/register', dataValidation.validateRegister, (req, res) =>
  register(req, res)
);
router.post('/login', dataValidation.validateLogin, (req, res) =>
  login(req, res)
);
router.post('/refresh', (req, res) => refreshToken(req, res));

export default router;