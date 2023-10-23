exports = async function(changeEvent) {
    // Access the _id of the affected document:
    const docId = changeEvent.documentKey._id;
    const serviceName = "Cluster0";
    const database = "next-ts-twitter";
    const userCollection = context.services.get(serviceName).db(database).collection("users");
    const followersCollection = context.services.get(serviceName).db(database).collection("followers");
    const timelineCollection = context.services.get(serviceName).db(database).collection("timelines");
    const tweetCollection = context.services.get(serviceName).db(database).collection("tweets");
    const eventObject = changeEvent.fullDocument;
    try {
        // If new following 
            const { _f: followee, _t: follower } = eventObject;
            // A is following B
            // Get A's timeline
            // Get B's tweets
            const followeeObject = await userCollection.findOne({_id: followee});
            const followeeTweets = await tweetCollection.find({author: followeeObject.username}).toArray();
            const followerTimeline = await timelineCollection.findOne({_id: follower});
            let newTweets = [...followerTimeline.tweets, ...followeeTweets]
            await timelineCollection.findOneAndUpdate({_id: follower}, {tweets: newTweets});
            // Future consideration: Filter all tweets by author vs user -> tweets -> lookup tweet collection
    } catch(err) {
      console.log("error performing mongodb write: ", err.message);
    }
};
