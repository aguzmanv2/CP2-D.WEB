import { Router } from 'express';
import { login, logout, profile, register } from '../controllers/auth.controller.js';
import { loginValidator, registerValidator } from '../validators/auth.validators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', verifyToken, logout);
router.get('/profile', verifyToken, profile);

export default router;

