exports = async function(changeEvent) {
    // Access the _id of the affected document:
    const docId = changeEvent.documentKey._id;
    const serviceName = "Cluster0";
    const database = "next-ts-twitter";
    const timelineCollection = context.services.get(serviceName).db(database).collection("timelines");
    const tweetCollection = context.services.get(serviceName).db(database).collection("tweets");
    const documentBeforeChange = changeEvent.fullDocumentBeforeChange;
    try {
        // Check if the tweet to be deleted is a reply or a normal tweet
        if (documentBeforeChange.isReply) {
            console.log("Deleting Reply")
            // Fetch updated tweet that was replied to
            const originalTweet = await tweetCollection.findOne({_id: documentBeforeChange.replyingTo});
            // Find all timelines where the original tweet exists, then replace their replies & count with the updated version
            await timelineCollection.updateMany(
                {"tweets._id": originalTweet._id}, 
                {$set: {
                    "tweets.$[element].replies": originalTweet.replies,
                    "tweets.$[element].replyCount": originalTweet.replies.length
                }},
                {arrayFilters: [
                    {"element._id": originalTweet._id}
                ]}
            )
        } else {
            console.log("Deleting normal tweet")
            // Because full document does not exist on delete events, 
            // we have to query for the following tweets from the timeline coll.
            // toArray to get values from query or the trigger won't return anything.
            // this query returns all documents that contain matched tweets
            const tweets = await timelineCollection.find({tweets: {$elemMatch: {_id: docId}}}).toArray();
            // Find each document based on previous matched queries and pull out the tweets with document id.
            tweets.forEach(async tweet => {
                await timelineCollection.findOneAndUpdate({_id: tweet._id}, { $pull: {tweets: {_id: docId}}});
            })
        }
    } catch(err) {
        console.log("error performing mongodb write: ", err.message);
    }
};