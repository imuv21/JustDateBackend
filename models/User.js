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
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
}, { _id: false });

// Detail schema
const detailSchema = new mongoose.Schema({
    age: {
        type: Number,
        min: 18,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
    },
    height: {
        type: Number,
        min: 20,
    },
    location: {
        type: String,
        trim: true,
    },
    bodyType: {
        type: String,
        enum: ['Skinny', 'Average', 'Curvy', 'Healthy'],
    },
    drinking: {
        type: String,
        enum: ['Yes', 'No'],
    },
    smoking: {
        type: String,
        enum: ['Yes', 'No'],
    },
    relationshipStatus: {
        type: String,
        enum: ['Single', 'Separated', 'Widowed'],
    }
}, { _id: false });

// Shows schema
const showSchema = new mongoose.Schema({
    original_name: {
        type: String,
        required: true,
        trim: true
    },
    poster_url: {
        type: String,
        required: true,
        trim: true,
        unique: true,
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
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    interests: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Number,
        default: 0,
    },
    otp: {
        type: Number,
        trim: true,
    },
    otpExpiry: {
        type: Date,
    },
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    links: linkSchema,
    details: detailSchema,
    messages: [messageSchema],
    voicePromptAnswers: [promptAnswerSchema],
    textPromptAnswers: [promptAnswerSchema],
});

//Model
const userModel = mongoose.model("User", userSchema);
const showModel = mongoose.model("Show", showSchema);

export { userModel, showModel };