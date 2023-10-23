import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
    tweets: {
        type: Array,
        default: []
    },
    // Provided here as this should be the user's ObjectId
    _id: {
        type: ObjectId,
        required: [true]
    }
})

export const TimelineModel = mongoose.models.Timeline || mongoose.model("Timeline", timelineSchema);