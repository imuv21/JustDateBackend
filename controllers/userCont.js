import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { validationResult } from "express-validator";
import { userModel } from '../models/User.js';
import sendMail from '../middlewares/sendMail.js';
import dotenv from 'dotenv';
dotenv.config();

//Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPosters = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'JustDate/Posters' }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};

class userCont {

    //auth conts

    static userSignup = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        const user = await userModel.findOne({ email: email });

        if (user) {
            return res.status(400).json({ status: "failed", message: `User already exists` });
        } else {
            if (firstName && lastName && email && password && confirmPassword) {
                if (password !== confirmPassword) {
                    return res.status(400).json({ status: "failed", message: "Passwords do not match" });
                } else {
                    try {
                        const salt = await bcrypt.genSalt(10);
                        const hashPassword = await bcrypt.hash(password, salt);
                        const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
                        const otpExpiry = Date.now() + 2 * 60 * 1000; // OTP valid for 2 minutes

                        const newUser = new userModel({ firstName, lastName, email, password: hashPassword, otp, otpExpiry });
                        await newUser.save();

                        setTimeout(async () => {
                            const user = await userModel.findOne({ email: newUser.email });
                            if (user && user.isVerified !== 1) {
                                await userModel.deleteOne({ _id: user._id });
                            }
                        }, 2 * 60 * 1000);

                        const msg = `<div style="font-family: 'Roboto', sans-serif; width: 100%;">
        <div style="background: #5AB2FF; padding: 10px 20px; border-radius: 3px; border: none">
            <a href="" style="font-size:1.6em; color: white; text-decoration:none; font-weight:600">JustDate</a>
        </div>
        <p>Hello <span style="color: #5AB2FF; font-size: 1.2em; text-transform: capitalize;">${newUser.firstName}</span>!</p>
        <p>Thank you for choosing JustDate. Use the following OTP to complete your Sign Up procedure. This OTP is valid for 2 minutes.</p>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
            <div style="background: #5AB2FF; color: white; width: fit-content; border-radius: 3px; padding: 5px 10px; font-size: 1.4em;">${otp}</div>
        </div>
      
        <p>Regards,</p>
        <p>JustDate</p>
                                   </div>`;

                        await sendMail(newUser.email, 'Verify your email', msg);
                        return res.status(201).json({ status: "success", message: `Please verify your email using the OTP sent to ${newUser.email}` });
                    } catch (error) {
                        return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
                    }
                }
            } else {
                return res.status(400).json({ status: "failed", message: "All fields are required" });
            }
        }
    }

    static verifyOtp = async (req, res) => {

        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ status: "failed", message: "Email and OTP are required" });
        }

        try {
            const user = await userModel.findOne({ email: email });
            if (!user) {
                return res.status(400).json({ status: "failed", message: "User not found" });
            }
            if (user.otp !== otp) {
                return res.status(400).json({ status: "failed", message: "Invalid OTP" });
            }
            if (Date.now() > user.otpExpiry) {
                return res.status(400).json({ status: "failed", message: "OTP expired" });
            }

            await userModel.updateOne(
                { email },
                {
                    $unset: { otp: "", otpExpiry: "" },
                    $set: { isVerified: 1 }
                }
            );

            return res.status(200).json({ status: "success", message: "Email verified successfully. Please login now." });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    }

    static deleteUser = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ status: "failed", message: "Email and password are required" });
            }
            const user = await userModel.findOne({ email: email });
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ status: "failed", message: "Invalid password" });
            }
            await userModel.deleteOne({ _id: user._id });
            return res.status(200).json({ status: "success", message: "User deleted successfully" });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    }

    static userLogin = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const { email, password } = req.body;
            if (email && password) {
                const user = await userModel.findOne({ email: email });
                if (user !== null) {
                    const isMatch = await bcrypt.compare(password, user.password);
                    if ((user.email === email) && isMatch) {
                        const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
                        const userResponse = {
                            _id: user._id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            password: password,
                            interests: user.interests,
                            shows: user.shows,
                            isVerified: user.isVerified,
                            chats: user.chats,
                            likes: user.likes,
                            links: user.links
                        };
                        return res.status(200).json({ status: "success", message: "User logged in successfully", token: token, user: userResponse });
                    } else {
                        return res.status(400).json({ status: "failed", message: "Email or password is incorrect" });
                    }
                } else {
                    return res.status(400).json({ status: "failed", message: `User with email ${email} not found` });
                }
            } else {
                res.status(400).json({ status: "failed", message: "All fields are required" });
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    }

    static userLogout = async (req, res) => {
        try {
            res.status(200).json({ status: "success", message: "User logged out successfully" });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    }

    static userProfileUpdate = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const { firstName, lastName, interests, links } = req.body;
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found" });
            }
            const updateData = { firstName, lastName, interests };
            if (links) {
                updateData.links = links;
            }
            const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });
            if (updatedUser) {
                return res.status(200).json({ status: "success", message: "User profile updated successfully", user: updatedUser });
            } else {
                return res.status(404).json({ status: "failed", message: "Something went wrong" });
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    }

    static updateShows = async (req, res) => {
        try {
            const { shows } = req.body;
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found" });
            }
            let updatedShows = {};
            if (shows) {
                updatedShows.shows = shows;
            }
            const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: updatedShows }, { new: true });
            if (updatedUser) {
                return res.status(200).json({ status: "success", message: "User profile updated successfully", user: updatedUser });
            } else {
                return res.status(404).json({ status: "failed", message: "Something went wrong" });
            }
        } catch (error) {
            console.error("Error updating shows:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default userCont;