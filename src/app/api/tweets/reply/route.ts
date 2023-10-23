import { FollowerModel } from "@/models/followers";
import { TimelineModel } from "@/models/timeline";
import { TweetModel } from "@/models/tweet";
import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database";
import { ObjectId } from "mongodb";

// ==========================================================================
// SERVER SIDE REPLY HANDLING
// Check: If not following tweet author: add to your TL with reply indication
// EG: Replying to someone you follow's retweet or stranger's profile tweet
// ==========================================================================

export const POST = async (req: Request) => {
    try {
        const { tweetContent, tweetBeingRepliedToId } = await req.json();
        await connectToDB();
        // Add new document to tweet collection
        const newReply = await TweetModel.create(tweetContent);
        // Add tweet's object ID to user's tweets array
        const user = await UserModel.findOne({username: newReply.author})
        await user.updateOne({ $push: { tweets: newReply._id }});
        // Update Tweet being replied to's replies array and count
        const tweetBeingRepliedTo = await TweetModel.findOne({_id: new ObjectId(tweetBeingRepliedToId)});
        await tweetBeingRepliedTo.updateOne({ $push: {replies: newReply}, $inc: {replyCount: 1}})
        // Get author of tweet being replied to
        const tweetBeingRepliedToAuthor = await UserModel.findOne({username: tweetBeingRepliedTo.author});
        // Find the author's followers
        const isFollowing = await FollowerModel.findOne({_f: tweetBeingRepliedToAuthor._id, _t: user._id});
        // Get updated version of tweet being replied to
        const updatedTweet = await TweetModel.findOne({_id: tweetBeingRepliedTo._id});
        // Get current user's timeline
        const userTimeline = await TimelineModel.findOne({_id: user._id});
        // If not following the author & not replying to yourself, push to your TL
        if (isFollowing === null && tweetBeingRepliedToAuthor.username !== user.username) {
            // Check to see if the tweet exists in your TL to determine whether it's a mutual retweet
            const isInTL = await TimelineModel.aggregate([
                {$match: {_id: user._id}},
                {$match: {
                    "tweets._id": new ObjectId(tweetBeingRepliedToId)
                }}
            ])
            if (isInTL.length === 0) {
                await userTimeline.updateOne({$push: {tweets: updatedTweet}});
            } else {
                // If it's a mutual Retweet, update your version in the TL
                await userTimeline.updateOne({ $set: {
                    "tweets.$[element].replies": updatedTweet.replies,
                    "tweets.$[element].replyCount": updatedTweet.replies.length
                }},
                {arrayFilters: [
                    {"element._id": tweetBeingRepliedTo._id}
                ]})
            }
        } else {
            // Update TL version of the tweet
            await userTimeline.updateOne({ $set: {
                "tweets.$[element].replies": updatedTweet.replies,
                "tweets.$[element].replyCount": updatedTweet.replies.length
            }},
            {arrayFilters: [
                {"element._id": tweetBeingRepliedTo._id}
            ]})
        }
        let returnObject = {
            tweetBeingRepliedTo: tweetBeingRepliedTo._id,
            reply: newReply
        }
        return new Response(JSON.stringify(returnObject), {status: 200, statusText: 'Success'})
    } catch(e) {
        return new Response(JSON.stringify('Error replying'), {status: 500})
    }
}