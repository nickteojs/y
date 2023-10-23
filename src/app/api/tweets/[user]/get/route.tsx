import { connectToDB } from "@/utils/database"
import { UserModel } from "@/models/user";
import { TimelineModel } from "@/models/timeline";
import { TweetType } from "@/types/types";

// Fetches user's tweets for their profile. includes their own tweets and retweets
export const GET = async (req: Request, { params }: { params: {user: string}}) => {
    const { user } = params;
    try {
        await connectToDB();
        const userDoc = await UserModel.findOne({username: user});
        let tweetsToKeep: TweetType[] = [];
        const response = await TimelineModel.aggregate([
            {$match: {_id: userDoc._id}},
            {$project: 
                {
                    tweets: 1,
                    result:
                        {
                            $sortArray: { input: "$tweets", sortBy: { dateNum: -1 }}
                        }
                }
            }
            // {$project: {
            //     tweets: {
            //         $filter: {
            //             input: "$tweets",
            //             as: "tweetResult",
            //             // ne vs not
            //             cond: { 
            //                 // $eq: ["$$tweetResult.author", user],
            //                 $and: [
            //                     { $eq: ["$$tweetResult.author", user] },
            //                     { $and: [
            //                         { $ne: ["$$tweetResult.author", user]},
            //                         { $ne: ["$$tweetResult.retweeted", true]}
            //                     ]}
            //                 ]
            //             }
            //         }
            //     }
            // }},
        ])
        let result = response[0].result;
        result.forEach((tweet: TweetType) => {
            if (tweet.author === user) {
                tweetsToKeep.push(tweet);
            } else if (tweet.author !== user && tweet.retweeted) {
                tweetsToKeep.push(tweet);
            }
        })
        return new Response(JSON.stringify(tweetsToKeep), {status: 200, statusText: 'Retrieved user tweets'})
    } catch (e) {
        return new Response(undefined, {status: 500, statusText: 'Server error fetching user tweets'})
    }
}