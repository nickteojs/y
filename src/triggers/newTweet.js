exports = async function(changeEvent) {
    // Access the _id of the affected document:
    const docId = changeEvent.documentKey._id;
    const serviceName = "Cluster0";
    const database = "next-ts-twitter";
    const userCollection = context.services.get(serviceName).db(database).collection("users");
    const followersCollection = context.services.get(serviceName).db(database).collection("followers");
    const timelineCollection = context.services.get(serviceName).db(database).collection("timelines");
    const eventObject = changeEvent.fullDocument;
    try {
        // Get author document
        const { author, isReply } = eventObject;
        // Reply logic is not handled here since we would have to re-query to find the tweet that was replied to.
        if (!isReply) {
            // Retrieve author's _id
            const authorDocument = await userCollection.findOne({"username": author});
            const authorFollowers = await followersCollection.find({_f: authorDocument._id}).toArray();
            authorFollowers.forEach(async follower => {
                await timelineCollection.findOneAndUpdate({_id: follower._t }, { $push: {tweets: eventObject}});
            })
        }
    } catch(err) {
      console.log("error performing mongodb write: ", err.message);
    }
};