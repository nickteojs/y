import { UserModel } from "@/models/user";
import { FollowerModel } from "@/models/followers";
import { connectToDB } from "@/utils/database"
import { TimelineModel } from "@/models/timeline";
import { TweetType } from "@/types/types";
import { ObjectId } from "mongodb";

// ==========================================
// == SERVER SIDE FOLLOW/UNFOLLOW HANDLING ==
// ==========================================

interface RetweetObjectDB {
    _id: ObjectId,
    username: string
}

export const POST = async (req: Request, { params }: { params: {id: string}}) => {
    // ID = target user from params from dynamic URL/slug
    // sessionName = current user from post body
    const { id } = params;
    const { sessionName, type } = await req.json();
    try {
        await connectToDB();
        const currentUser = await UserModel.findOne({username: sessionName});
        const targetUser = await UserModel.findOne({username: id});
        if (type === 'Follow') {
            // Create new follow document
            await FollowerModel.create({_f: targetUser._id, _t: currentUser._id});
            // Get current user's timeline
            const currentUserTimeline = await TimelineModel.findOne({_id: currentUser._id});
            // Get target users's timeline tweets
            const { tweets } = await TimelineModel.findOne({_id: targetUser._id});
            // Get target user's personal tweets
            const personalTweets = tweets.filter((tweet: TweetType) => tweet.author === targetUser.username);
            // Push target user's personal tweets to current user's timeline
            personalTweets.forEach(async (personalTweet: TweetType) => {
                await currentUserTimeline.updateOne({$push: {tweets: personalTweet}})
            })
            // Get target user's retweets. Exclude retweets by people who current user is following.
            const allRetweets = tweets.filter((tweet: TweetType) => tweet.author !== targetUser.username && tweet.retweets.length > 0);
            allRetweets.forEach(async (retweet: TweetType) => {
                // Find the author of each retweet and check if current user follows them
                const author = await UserModel.findOne({username: retweet.author});
                const isFollowing = await FollowerModel.findOne({_f: author._id, _t: currentUser._id});
                // If current user is not following the author of the retweet and author of tweet is not current user, push to current user's timeline.
                if (isFollowing === null && author._id.toString() !== currentUser._id.toString()) {
                    await currentUserTimeline.updateOne({ $push: { tweets: retweet } })
                }
            })
            return new Response(JSON.stringify('Followed'), {status: 200, statusText: 'followed'});
        } else {
            // Unfollow
            await FollowerModel.findOneAndDelete({_f: targetUser._id, _t: currentUser._id});
            const followeeObject = await UserModel.findOne({_id: targetUser._id});
            const followerTimeline = await TimelineModel.findOne({_id: currentUser._id});
            const oldTweets = [...followerTimeline.tweets];
            // Remove all tweets that are written by followee except retweeted ones
            // let updatedTweets = oldTweets.filter(tweet => tweet.author !== followeeObject.username);
            // Types of tweets to remove:
            // Target's tweets
            // Target's tweets that have been retweeted by a mutual person
            // Target's retweets unless they have been retweeted by a mutual
            const myFollowing = await FollowerModel.find({_t: currentUser._id});
            let targetTweets: TweetType[] = []
            oldTweets.forEach(tweet => {
                if (tweet.author === followeeObject.username) {
                    if (tweet.retweets.length > 0) {
                        tweet.retweets.forEach((rt: RetweetObjectDB) => {
                            myFollowing.forEach(f => {
                                if (rt.toString() === f._f.toString()) {
                                    targetTweets.push(tweet);
                                }
                            })
                        })
                    }
                    // We dont want target's original tweets but we have to check if they are retweeted by people we follow
                } else {
                    targetTweets.push(tweet);
                }
            })
            // Remove target's retweets unless retweeted by mutual
            let finalTweets = targetTweets.filter(tweet => {
                // If the tweet only has 1 retweet and it is the target
                if (tweet.retweets.length === 1 && tweet.retweets[0].toString() === followeeObject._id.toString()) {
                    return false;
                } else {
                    // Or else it is just following tweets or their retweets
                    return true;
                }
            })
            // Further remove retweeted tweets
            // let tweetsToKeep = [];
            // updatedTweets.forEach(tweet => {
            //     // If empty retweets = own tweet or other following tweet
            //     if (tweet.retweets.length === 0 ) {
            //         tweetsToKeep.push(tweet)
            //     } else if (tweet.retweets.length > 0) {
            //         tweet.retweets.forEach(retweet => {
            //             // If not retweeted by the person you are unfollowing.
            //             if (retweet._id.toString() !== followeeObject._id.toString()) {
            //                 tweetsToKeep.push(tweet);
            //             }
            //         })
            //     }
            // })
            // let removedRetweets = updatedTweets.filter(tweet => !tweet.retweets.includes(followeeObject._id));
            const response = await followerTimeline.updateOne({tweets: finalTweets});
            return new Response(JSON.stringify('Unfollowed'), {status: 200, statusText: 'unfollowed'});
        }
    } catch(e) {
        return new Response("Failed to update user info", {
            status: 500
        })
    }
}