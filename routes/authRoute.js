import express from 'express';
import { signupValidator, loginValidator, updateProfileValidator, detailsValidator } from '../middlewares/validation.js';
import authedUser from '../middlewares/authedUser.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import userCont from '../controllers/userCont.js';
const router = express.Router();

// Public routes
router.post('/signup', signupValidator, userCont.userSignup);
router.post('/verify-otp', userCont.verifyOtp);
router.post('/login', loginValidator, userCont.userLogin);
router.get('/logout', userCont.userLogout);

// Private routes
router.use(authedUser);
router.put('/update-profile', rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), updateProfileValidator, userCont.userProfileUpdate);
router.put('/update-details', detailsValidator, userCont.detailsUpdate);
router.get('/discover', userCont.discover);
router.put('/update-shows', userCont.updateShows);
router.delete('/delete-user', userCont.deleteUser);
router.post('/like/:likedUserId', userCont.like);

// rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 })

export default router;