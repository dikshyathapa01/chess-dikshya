import {Router} from "express";
import {auth} from '../middlewares/auth.js';
import {createUser, getAllUsers, getOneUser,loginUser, deleteUser} from './../controller/user.controller.js';

const router=Router();

router.post('/',createUser);
router.get('/',getAllUsers);
router.get('/:id',auth,getOneUser);
router.delete('/:id',deleteUser);
router.post('/login',loginUser);
export default router;