import { TimelineModel } from "@/models/timeline";
import { TweetModel } from "@/models/tweet";
import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database";

export const POST = async (req: Request) => {
    try {
        const tweet = await req.json();
        await connectToDB();
        // Add new document to tweet collection
        const newTweet = await TweetModel.create(tweet);
        // Add tweet's object ID to user's tweets array
        const user = await UserModel.findOne({username: newTweet.author})
        await user.updateOne({ $push: { tweets: newTweet._id }});
        // Add to your own timeline, adding to follower's is handled on the edge using a trigger
        await TimelineModel.findOne({_id: user._id}).updateOne({ $push: {tweets: newTweet}});
        return new Response(JSON.stringify(newTweet), {status: 200, statusText: 'Success'})
    } catch(e) {
        return new Response(JSON.stringify(e), {status: 500})
    }
}