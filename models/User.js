import mongoose from "mongoose";

// Prompt Answer Schema
const promptAnswerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId
    },
    answer: {
        type: String,
        trim: true
    }
});

// Message schema
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

// Link schema
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
    }
});

// Shows schema
const showsSchema = new mongoose.Schema({
    original_name: {
        type: String,
        trim: true
    },
    poster_url: {
        type: String,
        trim: true
    }
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
    interests: {
        type: String,
        required: true,
        trim: true,
    },
    shows: [showsSchema],
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
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    links: linkSchema,
    messages: [messageSchema],
    voicePromptAnswers: [promptAnswerSchema],
    textPromptAnswers: [promptAnswerSchema]
});

//Composite index on email and role
userSchema.index({ email: 1 }, { unique: true });

//Model
const userModel = mongoose.model("user", userSchema);
export { userModel };