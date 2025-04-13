import { Router } from 'express';
import { dataValidation } from '../validations/dataValidation';
import { login, register, refreshToken } from '../controllers/authController';

const router = Router();

router.get("/", (req:any, res:any)=>{
  res.json({message:"ok"});
})

router.post('/register', dataValidation.validateRegister, (req, res) =>
  register(req, res)
);
router.post('/login', dataValidation.validateLogin, (req, res) =>
  login(req, res)
);
router.post('/refresh', (req, res) => refreshToken(req, res));

export default router;