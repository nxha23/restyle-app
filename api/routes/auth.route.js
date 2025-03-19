// api/routes/auth.route.js
import express from 'express';
import { google, signin, signup, signOut } from '../controller/auth.controller.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/signin
router.post('/signin', signin);

// POST /api/auth/google
router.post('/google', google);

// GET /api/auth/signout
router.get('/signout', signOut);

export default router;
