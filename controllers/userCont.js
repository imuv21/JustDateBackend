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
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
            const { firstName, lastName, email, password } = req.body;
            const userExists = await userModel.findOne({ email });
            if (userExists) {
                return res.status(400).json({ status: "failed", message: `User already exists!` });
            }

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

            const msg = `
                <div style="font-family: 'Roboto', sans-serif; width: 100%;">
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

            await sendMail(newUser.email, 'Verify your account', msg);
            return res.status(201).json({ status: "success", message: `Please verify your email using the OTP sent to ${newUser.email}` });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error, Please try again later!" });
        }
    };

    static verifyOtp = async (req, res) => {
        try {
            const { email, otp } = req.body;
            if (!otp) {
                return res.status(400).json({ status: "failed", message: "OTP is required!" });
            }
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(400).json({ status: "failed", message: "User not found!" });
            }
            if (user.otp !== otp) {
                return res.status(400).json({ status: "failed", message: "Invalid OTP!" });
            }
            if (Date.now() > user.otpExpiry) {
                return res.status(400).json({ status: "failed", message: "OTP expired!" });
            }
            await userModel.updateOne({ email },
                {
                    $unset: { otp: "", otpExpiry: "" },
                    $set: { isVerified: 1 }
                }
            );
            return res.status(200).json({ status: "success", message: "Email verified successfully. Please login now." });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
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
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static userLogin = async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
            const { email, password } = req.body;
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User doesn't exist!" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ status: "failed", message: "Email or password is incorrect!" });
            }
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
                links: user.links,
                details: user.details,
            };
            return res.status(200).json({ status: "success", message: "User logged in successfully.", token, user: userResponse });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static forgotPassword = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
            const { email } = req.body;
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User doesn't exist!" });
            }

            const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
            const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
            await userModel.updateOne({ email },
                { $set: { otp, otpExpiry } }
            );

            const msg = `
                <div style="font-family: 'Roboto', sans-serif; width: 100%;">
                    <div style="background: #5AB2FF; padding: 10px 20px; border-radius: 3px; border: none">
                        <a href="#" style="font-size:1.6em; color: white; text-decoration:none; font-weight:600">Just Date</a>
                    </div>
                    <p>Hello there!</p>
                    <p>Use the following OTP to reset your password. This OTP is valid for 10 minutes.</p>
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                        <div style="background: #5AB2FF; color: white; width: fit-content; border-radius: 3px; padding: 5px 10px; font-size: 1.4em;">${otp}</div>
                    </div>
                    <p>Regards,</p>
                    <p>Just Date</p>
                </div>`;

            await sendMail(user.email, 'Reset Your Password', msg);
            return res.status(200).json({ status: "success", message: `OTP sent to ${user.email}.` });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error, please try again later!" });
        }
    };

    static verifyPasswordOtp = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
            const { email, otp, newPassword } = req.body;
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User doesn't exist!" });
            }
            if (user.otp !== otp) {
                return res.status(400).json({ status: "failed", message: "Invalid OTP!" });
            }
            if (Date.now() > user.otpExpiry) {
                return res.status(400).json({ status: "failed", message: "OTP expired!" });
            }
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(newPassword, salt);

            await userModel.updateOne({ email },
                {
                    $set: { password: hashPassword },
                    $unset: { otp: "", otpExpiry: "" }
                }
            );
            return res.status(200).json({ status: "success", message: "Password updated successfully." });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error, Please try again later!" });
        }
    };

    static userProfileUpdate = async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
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
                return res.status(200).json({ status: "success", message: "User profile updated successfully.", user: updatedUser });
            } else {
                return res.status(404).json({ status: "failed", message: "Something went wrong!" });
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static detailsUpdate = async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "failed", errors: errors.array() });
        }
        try {
            const { age, gender, height, location, bodyType, drinking, smoking, relationshipStatus } = req.body;
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found!" });
            }
            const updateData = { age, gender, location, bodyType, drinking, smoking, relationshipStatus };
            if (height) {
                updateData.height = height;
            }
            const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: { details: updateData } }, { new: true });

            if (updatedUser) {
                return res.status(200).json({ status: "success", message: "User details updated successfully.", user: updatedUser });
            } else {
                return res.status(404).json({ status: "failed", message: "Something went wrong!" });
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static updateShows = async (req, res) => {
        try {
            const { shows } = req.body;
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found!" });
            }
            let updatedShows = {};
            if (shows) {
                updatedShows.shows = shows;
            }
            const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: updatedShows }, { new: true });
            if (updatedUser) {
                return res.status(200).json({ status: "success", message: "User profile updated successfully.", user: updatedUser });
            } else {
                return res.status(404).json({ status: "failed", message: "Something went wrong!" });
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    //social conts

    static discover = async (req, res) => {
        try {
            const { minAge, maxAge, gender, bodyType, location, page = 1, size = 20 } = req.query;
            const currentUserId = req.user._id;
            const skip = (page - 1) * size;

            const currentUser = await userModel.findById(currentUserId).select("matches").lean();
            const matchedUserIds = currentUser?.matches || [];

            let filterConditions = {
                _id: { $ne: currentUserId, $nin: matchedUserIds },
                "details.age": { $exists: true, $ne: null },
                "details.height": { $exists: true, $ne: null },
                "details.bodyType": { $exists: true, $ne: "" },
                "interests": { $exists: true, $ne: "" }
            };

            if (minAge || maxAge) {
                filterConditions["details.age"] = {};
                if (minAge) filterConditions["details.age"].$gte = parseInt(minAge);
                if (maxAge) filterConditions["details.age"].$lte = parseInt(maxAge);
            }
            if (gender) filterConditions["details.gender"] = gender;
            if (bodyType) filterConditions["details.bodyType"] = bodyType;
            if (location) filterConditions["details.location"] = location;

            const totalUsers = await userModel.countDocuments(filterConditions);
            const people = await userModel.find(filterConditions).skip(skip).limit(parseInt(size));
            return res.status(200).json({ status: "success", people, page, size, totalPages: Math.ceil(totalUsers / size), totalResults: totalUsers });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static like = async (req, res) => {
        try {
            const { likedUserId } = req.params;
            const currentUserId = req.user._id;
            const currentUser = await userModel.findById(currentUserId);
            const likedUser = await userModel.findById(likedUserId);

            if (!currentUser || !likedUser) {
                return res.status(404).json({ status: "failed", message: "User not found!" });
            }
            if (likedUser.matches.includes(currentUserId)) {
                return res.status(400).json({ status: "failed", message: "This is already a match!" });
            }

            if (!currentUser.likes.includes(likedUserId) && !likedUser.likes.includes(currentUserId)) {
                likedUser.likes.push(currentUserId);
            } else if (currentUser.likes.includes(likedUserId)) {
                currentUser.likes = currentUser.likes.filter(id => id.toString() !== likedUserId.toString());
                if (!currentUser.matches.includes(likedUserId)) {
                    currentUser.matches.push(likedUserId);
                }
                if (!likedUser.matches.includes(currentUserId)) {
                    likedUser.matches.push(currentUserId);
                }

                // Start 10-minute timer to check for messages
                setTimeout(async () => {
                    try {
                        const updatedCurrentUser = await userModel.findById(currentUserId);
                        const messageExists = updatedCurrentUser.messages.some(
                            msg =>
                                msg.sender.toString() === currentUserId.toString() &&
                                msg.receiver.toString() === likedUserId.toString()
                        );

                        if (!messageExists) {
                            updatedCurrentUser.matches = updatedCurrentUser.matches.filter(
                                id => id.toString() !== likedUserId.toString()
                            );
                            const updatedLikedUser = await userModel.findById(likedUserId);
                            updatedLikedUser.matches = updatedLikedUser.matches.filter(
                                id => id.toString() !== currentUserId.toString()
                            );
                            await updatedCurrentUser.save();
                            await updatedLikedUser.save();
                        }
                    } catch (err) {
                        console.error("Error in timeout function:", err);
                    }
                }, 1 * 60 * 1000); // 10 minutes

            } else {
                return res.status(400).json({ status: "failed", message: "You have already liked the user!" });
            }

            await currentUser.save();
            await likedUser.save();
            const message = currentUser.matches.includes(likedUserId) ? "It's a match! Make sure to send a message within 10 minutes to keep the connection alive." : "Liked successfully!";
            return res.status(200).json({ status: "success", message });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static matchUsers = async (req, res) => {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found!" });
            }
            const matchesData = await userModel.find({ _id: { $in: user.matches } },
                {
                    firstName: 1,
                    lastName: 1,
                    interests: 1,
                    'details.age': 1,
                    'details.height': 1,
                    'details.bodyType': 1,
                }
            );
            return res.status(200).json({ status: "success", matchusers: matchesData });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static likeUsers = async (req, res) => {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ status: "failed", message: "User not found!" });
            }
            const likesData = await userModel.find({ _id: { $in: user.likes } },
                {
                    firstName: 1,
                    lastName: 1,
                    interests: 1,
                    'details.age': 1,
                    'details.height': 1,
                    'details.bodyType': 1,
                    likes: 1,
                }
            );
            return res.status(200).json({ status: "success", likeusers: likesData });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static sendMessages = async (req, res) => {
        try {
            const { senderId, receiverId, content } = req.body;
            if (!senderId || !receiverId || !content) {
                return res.status(400).json({ status: "failed", message: "All fields are required!" });
            }

            const message = { sender: senderId, receiver: receiverId, content, timestamp: new Date() };
            const sender = await userModel.findById(senderId);
            if (!sender) {
                return res.status(404).json({ status: "failed", message: "Sender not found!" });
            }

            // Filter messages between sender and receiver
            const messagesBetweenUsers = sender.messages.filter(
                (msg) => msg.receiver.toString() === receiverId || msg.sender.toString() === receiverId
            );

            // Check if the messages count exceeds the limit (10)
            if (messagesBetweenUsers.length >= 10) {
                // Find the oldest message and remove it
                const oldestMessageIndex = sender.messages.findIndex(
                    (msg) => msg.receiver.toString() === receiverId || msg.sender.toString() === receiverId
                );

                if (oldestMessageIndex !== -1) {
                    sender.messages.splice(oldestMessageIndex, 1);
                }
            }
            // Add the new message
            sender.messages.push(message);
            // Save the updated sender
            await sender.save();
            // Emit the new message using Socket.IO
            const io = req.app.get('socketio');
            const roomId = [senderId, receiverId].sort().join('_');
            io.to(roomId).emit('newMessage', { sender: { _id: senderId }, receiver: { _id: receiverId }, content, timestamp: message.timestamp });

            return res.status(200).json({ status: "success", message: "Message sent!" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }

    static getMessages = async (req, res) => {
        try {
            const { senderId, receiverId } = req.params;
            if (!senderId || !receiverId) {
                return res.status(400).json({ status: "failed", message: "All fields are required!" });
            }

            const senderMessages = await userModel.findById(senderId).select('messages').populate('messages.sender messages.receiver', 'firstName lastName email');
            const receiverMessages = await userModel.findById(receiverId).select('messages').populate('messages.sender messages.receiver', 'firstName lastName email');
            const receiver = await userModel.findById(receiverId).select('firstName lastName isVerified');

            if (!senderMessages || !receiverMessages) {
                return res.status(404).json({ status: "failed", message: "Sender or receiver not found!" });
            }

            const combinedMessages = [...senderMessages.messages, ...receiverMessages.messages];
            const filteredMessages = combinedMessages.filter(
                message =>
                    (message.sender._id.toString() === senderId && message.receiver._id.toString() === receiverId) ||
                    (message.sender._id.toString() === receiverId && message.receiver._id.toString() === senderId)
            );

            const uniqueMessages = Array.from(new Set(filteredMessages.map(msg => msg._id.toString()))).map(id => filteredMessages.find(msg => msg._id.toString() === id));
            uniqueMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            return res.status(200).json({ status: "success", chat: uniqueMessages, receiver: receiver });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later!" });
        }
    }
}

export default userCont;