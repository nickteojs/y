import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const followerSchema = new mongoose.Schema({
    _f: {
        type: ObjectId,
        required: [true]
    },
    _t: {
        type: ObjectId,
        required: [true]
    }
})

export const FollowerModel = mongoose.models.Follower || mongoose.model("Follower", followerSchema);