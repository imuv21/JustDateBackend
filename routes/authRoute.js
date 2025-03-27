import express from 'express';
import { signupValidator, loginValidator, forgotPasswordValidator, verifyPasswordOtpValidator, updateProfileValidator, detailsValidator } from '../middlewares/validation.js';
import authedUser from '../middlewares/authedUser.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import userCont from '../controllers/userCont.js';
const router = express.Router();

// Public routes
router.post('/signup', signupValidator, userCont.userSignup);
router.post('/verify-otp', userCont.verifyOtp);
router.post('/login', loginValidator, userCont.userLogin);
router.post('/forgot-password', rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), forgotPasswordValidator, userCont.forgotPassword);
router.post('/verify-password-otp', verifyPasswordOtpValidator, userCont.verifyPasswordOtp);

// Private routes
router.use(authedUser);
router.put('/update-profile', rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), updateProfileValidator, userCont.userProfileUpdate);
router.put('/update-details', detailsValidator, userCont.detailsUpdate);
router.put('/update-shows', userCont.updateShows);
router.get('/discover', userCont.discover);
router.delete('/delete-user', userCont.deleteUser);
router.post('/like/:likedUserId', userCont.like);

router.post('/send-message', userCont.sendMessages);
router.get('/get-message/:senderId/:receiverId', userCont.getMessages);

router.get('/get-match-users', userCont.matchUsers);
router.get('/get-like-users', userCont.likeUsers);

// rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 })

export default router;