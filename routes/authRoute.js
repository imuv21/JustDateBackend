import express from 'express';
import authedUser from '../middlewares/authedUser.js';
import userCont from '../controllers/userCont.js';
import { signupValidator, loginValidator } from '../middlewares/validation.js';
const router = express.Router();

// Public routes
router.post('/signup', signupValidator, userCont.userSignup);
router.post('/verify-otp', userCont.verifyOtp);
router.post('/login', loginValidator, userCont.userLogin);
router.get('/logout', userCont.userLogout);
router.delete('/delete-user', userCont.deleteUser);

// Private routes
router.use(authedUser);
router.put('/update-profile', userCont.userProfileUpdate);


export default router;