import { TweetModel } from "@/models/tweet";
import { connectToDB } from "@/utils/database"
import { ObjectId } from "mongodb";
import { UserModel } from "@/models/user";

// =======================================================
// == SERVER SIDE TWEET DELETE HANDLING
// == TIMELINE UPDATE IS HANDLED USING EDGE FUNCTIONS
// == Removing top level tweets from TL is handled on edge 
// =======================================================

export const DELETE = async (req: Request) => {
    try {
        const { tweetId, uid, isReply, replyingTo } = await req.json();
        await connectToDB();
        // Find tweet to delete
        const tweetToDelete = await TweetModel.findOne({_id: tweetId});
        // Delete from Tweets Collection
        await tweetToDelete.deleteOne();
        // Remove from User document
        await UserModel.findOne({_id: uid}).updateOne({ $pull: { tweets: new ObjectId(tweetId)}});
        // Check if deleted tweet is a reply
        if (isReply) {
            // Pull deleted tweet from original tweet and decrease reply count
            await TweetModel.findOneAndUpdate(
                {_id: replyingTo},
                {
                    $pull: {replies: {_id: new ObjectId(tweetId)}},
                    $inc: {replyCount: -1}
                }
            )
        } 
        return new Response(JSON.stringify(tweetId), {status: 200, statusText: "delete-ok"})
    } catch (e) {
        return new Response(JSON.stringify(e), {status: 500})
    }
}