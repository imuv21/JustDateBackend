import mongoose from "mongoose";

//Notification schema
const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    }
});

//Message schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

//Link schema
const linkSchema = new mongoose.Schema({
    imdb: {
        url: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false, 
        },
    },
    insta: {
        url: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    twitter: {
        url: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    spotify: {
        url: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
});

//User schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    confirmPassword: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Number,
        default: 0,
    },
    otp: {
        type: String,
        trim: true,
    },
    otpExpiry: {
        type: Date,
    },
    matches: {
        type: Array,
        default: [],
    },
    voicePromptAnswers: {
        type: Array,
        default: [],
    },
    textPromptAnswers: {
        type: Array,
        default: [],
    },
    interests: {
        type: String,
        trim: true,
    },
    links: [linkSchema],
    notifications: [notificationSchema],
    messages: [messageSchema],
});

//Composite index on email and role
userSchema.index({ email: 1 }, { unique: true });

//Model
const userModel = mongoose.model("user", userSchema);
export { userModel };