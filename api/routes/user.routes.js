// routes/user.routes.js
import express from 'express';
import { test, updateUser, deleteUser, getUser, getUserWardrobeItems } from '../controller/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/wardrobe/:id', verifyToken, getUserWardrobeItems);
router.get('/:id', verifyToken, getUser);

export default router;
