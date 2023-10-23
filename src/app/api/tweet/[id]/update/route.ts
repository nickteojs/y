import { FollowerModel } from "@/models/followers";
import { TimelineModel } from "@/models/timeline";
import { TweetModel } from "@/models/tweet";
import { UserModel } from "@/models/user";
import { RetweetDBObject } from "@/types/types";
import { connectToDB } from "@/utils/database"
import { ObjectId } from "mongodb";

// ============================================
// == SERVER SIDE RETWEET/LIKE HANDLING ==
// ============================================
export const POST = async (req: Request, { params }: {params: {id: string}}) => {
    const { id } = params;
    const { user, type, feature, location } = await req.json();
    let returnObject = {
        data: id,
        location: location,
        statusText: ''
    }
    try {
        await connectToDB();
        // Get current user performing the action
        const userDocument = await UserModel.findOne({username: user});
        if (type === true) {
            // Unretweet
            if (feature === 'retweet') {
                // Update original tweet
                await TweetModel.findOneAndUpdate({_id: id}, { $pull: { retweets: {_id: userDocument._id}}, $inc: { retweetCount: -1 }});
                // Get current user's timeline
                const userTimeline = await TimelineModel.findOne({_id: userDocument._id});
                // Get updated tweet in tweet collection
                const updatedTweet = await TweetModel.findOne({_id: id});
                // Check if it is a reply then update copy inside the replied tweet as well
                if (updatedTweet.isReply) {
                    const tweetBeingRepliedTo = await TweetModel.findOne({_id: updatedTweet.replyingTo});
                    await tweetBeingRepliedTo.updateOne({ $set: {
                        "replies.$[element].retweets": updatedTweet.retweets,
                        "replies.$[element].retweetCount": updatedTweet.retweets.length
                    }},
                    {arrayFilters: [
                        {"element._id": new ObjectId(id)}
                    ]})
                }
                // Check if it's retweet/normal tweet by seeing if you follow the original author
                const author = await UserModel.findOne({username: updatedTweet.author});
                let result = await FollowerModel.findOne({_f: author._id, _t: userDocument._id});
                // Normal Tweet
                if (result !== null) {
                    // Update retweet count and retweet state
                    const response = await userTimeline.updateOne({ $set: {
                        "tweets.$[element].retweets": updatedTweet.retweets,
                        "tweets.$[element].retweeted": false,
                        "tweets.$[element].retweetCount": updatedTweet.retweets.length
                    }},
                    {arrayFilters: [
                        // Need to instantiate a new object Id, Id used here is just a string instead of Object Id type. 
                        // findOne turns the string into objectid type hence no need for new keyword
                        {"element._id": new ObjectId(id)}
                    ]})
                    return new Response(JSON.stringify(returnObject), {status: 200, statusText: 'unretweeted tweet'})
                } else {
                    // Retweet
                    // Check if any following still has it retweeted
                    let mutual = false;
                    const myFollowing = await FollowerModel.find({_t: userDocument._id});
                    updatedTweet.retweets.forEach((rt: RetweetDBObject) => {
                        myFollowing.forEach(following => {
                            if (rt._id.toString() === following._f.toString()) {
                                mutual = true;
                                return;
                            }
                        })
                    })
                    if (mutual) {
                        // Update retweet count and retweet state
                        const response = await userTimeline.updateOne({ $set: {
                            "tweets.$[element].retweets": updatedTweet.retweets,
                            "tweets.$[element].retweeted": false,
                            "tweets.$[element].retweetCount": updatedTweet.retweets.length
                        }},
                        {arrayFilters: [
                            {"element._id": new ObjectId(id)}
                        ]})
                        return new Response(JSON.stringify(returnObject), {status: 200, statusText: 'unretweeted retweet'})
                    } else {
                        let response = await userTimeline.updateOne({$pull: {tweets: {_id: updatedTweet._id}}})
                        return new Response(JSON.stringify(returnObject), {status: 200, statusText: 'unretweeted retweet and removing from tl'})
    
                    }
                }

            } else if (feature === 'like') {
                // Update original tweet
                await TweetModel.findOneAndUpdate({_id: id}, { $pull: { likes: {_id: userDocument._id}}, $inc: { likeCount: -1 }});
                // Update retweet count and retweet state
                const userTimeline = await TimelineModel.findOne({_id: userDocument._id});
                // Get updated tweet in tweet collection
                const updatedTweet = await TweetModel.findOne({_id: id});
                await userTimeline.updateOne({ $set: {
                    "tweets.$[element].likes": updatedTweet.likes,
                    "tweets.$[element].liked": false,
                    "tweets.$[element].likeCount": updatedTweet.likes.length
                }},
                {arrayFilters: [
                    {"element._id": new ObjectId(id)}
                ]})
                 // Check if it is a reply then update copy inside the replied tweet as well
                if (updatedTweet.isReply) {
                    const tweetBeingRepliedTo = await TweetModel.findOne({_id: updatedTweet.replyingTo});
                    await tweetBeingRepliedTo.updateOne({ $set: {
                        "replies.$[element].likes": updatedTweet.likes,
                        "replies.$[element].likeCount": updatedTweet.likes.length
                    }},
                    {arrayFilters: [
                        {"element._id": new ObjectId(id)}
                    ]})
                }
                returnObject.statusText = 'unliked';
                return new Response(JSON.stringify(returnObject), {status: 200})
            }
        } else if (type === false) {
            // Updates original tweet
            let updateData = {
                _id: userDocument._id,
                username: userDocument.username
            } 
            // Update depending on feature
            if (feature === 'retweet') {
                // Update original tweet with new retweeet and retweetcount
                await TweetModel.findOneAndUpdate({_id: id}, { $push: { retweets: updateData}, $inc: { retweetCount: 1 }});
            } else if (feature === 'like') {
                // Update original tweet with new like and likecount
                await TweetModel.findOneAndUpdate({_id: id}, { $push: { likes: updateData}, $inc: { likeCount: 1 }});
            }
            // Refetch updated tweet after updating
            const updatedTweet = await TweetModel.findOne({_id: id});
            // Check if it is a reply then update copy inside the replied tweet as well
            if (updatedTweet.isReply) {
                const tweetBeingRepliedTo = await TweetModel.findOne({_id: updatedTweet.replyingTo});
                if (feature === 'retweet') {
                    await tweetBeingRepliedTo.updateOne({ $set: {
                        "replies.$[element].retweets": updatedTweet.retweets,
                        "replies.$[element].retweetCount": updatedTweet.retweets.length
                    }},
                    {arrayFilters: [
                        {"element._id": new ObjectId(id)}
                    ]})
                } else if (feature === 'like') {
                    await tweetBeingRepliedTo.updateOne({ $set: {
                        "replies.$[element].likes": updatedTweet.likes,
                        "replies.$[element].likeCount": updatedTweet.likes.length
                    }},
                    {arrayFilters: [
                        {"element._id": new ObjectId(id)}
                    ]})
                }
            }
            // Update current user's version of the tweet
            const result = await TimelineModel.findOne({_id: userDocument._id});
            if (feature === 'retweet') {
                const tweetAuthor = await UserModel.findOne({username: updatedTweet.author});
                const isFollowing = await FollowerModel.findOne({_f: tweetAuthor._id, _t: userDocument._id});
                if (isFollowing === null) {
                    await result.updateOne({$push: {
                        tweets: updatedTweet
                    }})
                }
                await result.updateOne({ $set: {
                    "tweets.$[element].retweets": updatedTweet.retweets,
                    "tweets.$[element].retweeted": true,
                    "tweets.$[element].retweetCount": updatedTweet.retweets.length
                }},
                {arrayFilters: [
                    // Need to instantiate a new object Id, Id used here is just a string instead of Object Id type. 
                    // findOne turns the string into objectid type hence no need for new keyword
                    {"element._id": new ObjectId(id)}
                ]})
            } else if (feature === 'like') {
                await result.updateOne({ $set: {
                    "tweets.$[element].likes": updatedTweet.likes,
                    "tweets.$[element].liked": true,
                    "tweets.$[element].likeCount": updatedTweet.likes.length
                }},
                {arrayFilters: [
                    {"element._id": new ObjectId(id)}
                ]})
            }
            returnObject.statusText = feature === 'retweet' ? 'retweeted' : 'liked';
            return new Response(JSON.stringify(returnObject), {status: 200})
        }
    } catch (e) {
        return new Response(JSON.stringify(e), {status: 500})
    }
}


