import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true]
    },
    author: {
        type: String,
        required: [true]
    },
    authorImage: {
        type: String
    },
    date: {
        type: String,
        required: [true]
    },
    dateNum: {
        type: Number
    },
    image: {
        type: String
    },
    likes: {
        type: Array
    },
    likeCount: {
        type: Number,
        default: 0
    },
    retweets: {
        type: Array,
        default: []
    },
    retweetCount: {
        type: Number,
        default: 0
    },
    replies: {
        type: Array,
        default: []
    },
    replyCount: {
        type: Number,
        default: 0
    },
    retweeted: {
        type: Boolean
    },
    liked: {
        type: Boolean
    },
    isRt: {
        type: Boolean
    },
    isReply: {
        type: Boolean
    },
    replyingTo: {
        type: ObjectId
    },
    rootTweet: {
        type: ObjectId
    }
})

// Use model if it already exists, if not create a new model
export const TweetModel = mongoose.models.Tweet || mongoose.model("Tweet", tweetSchema);