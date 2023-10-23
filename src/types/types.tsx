import { ObjectId } from "mongodb"

// User Type
export interface UserType {
    _id?: string,
    username: string,
    email: string,
    image: string,
    header_image: string,
    bio: string,
    password: string,
    tweets: Array<TweetType>,
    followers: Array<UserType>,
    following: Array<UserType>,
    likes: Array<UserType>,
    replies: Array<UserType>
}

// Tweet Type
export interface TweetType {
    _id: ObjectId,
    content: string,
    author: string,
    authorImage: string,
    date: string,
    dateNum: number,
    image?: string,
    likes?: Array<UserType>,
    likeCount: number,
    retweets: Array<UserType>,
    retweetCount: number,
    replies: Array<TweetType>,
    replyCount: number,
    retweeted?: Boolean,
    liked?: Boolean,
    isRt?: Boolean,
    isReply?: Boolean,
    replyingTo?: ObjectId,
    rootTweet?: ObjectId
    rtMutual?: string
}

// Tweet Reply
export interface TweetReplyType extends TweetType {
    target: TweetType
}

// Retweet Object
export interface RetweetDBObject {
    _id: ObjectId,
    username: string
}