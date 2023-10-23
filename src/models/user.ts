import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true],
        required: [true]
    },
    email: {
        type: String,
        unique: [true],
        required: [true]
    },
    image: {
        type: String,
    },
    header_image: {
        type: String
    },
    bio: {
        type: String
    },
    // Optional password, used for credential provider
    password: {
        type: String
    },
    tweets: {
        type: Array,
        required: [true]
    },
    likes: {
        type: Array
    },
    replies: {
        type: Array
    }
})

// Use model if it already exists, if not create a new model
export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);