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
    const change = changeEvent.updateDescription.updatedFields;
    const changeKeys = Object.keys(change);
    const changeKey = changeKeys[1];
    const changeIdArray = change[changeKey];
    const newChange = {
        [changeKey]: changeEvent.updateDescription.updatedFields[changeKey]
    };
    // changeId length to determine if retweet or unretweet
    const changeId = changeIdArray[0];
    let elsBeforeUpdate;
    let elsAfterUpdate;
    // Determine type of change first
    let changeType;
    changeKeys.forEach(key => {
        if (key.startsWith('retweets')) {
            changeType = 'retweet';
            elsBeforeUpdate = changeEvent.fullDocumentBeforeChange.retweets.length;
            elsAfterUpdate = changeEvent.fullDocument.retweets.length
        } else if (key.startsWith('likes')) {
            changeType = 'like';
            elsBeforeUpdate = changeEvent.fullDocumentBeforeChange.likes.length;
            elsAfterUpdate = changeEvent.fullDocument.likes.length
        } else if (key.startsWith('replies')){
            changeType = 'reply';
            elsBeforeUpdate = changeEvent.fullDocumentBeforeChange.replies.length;
            elsAfterUpdate = changeEvent.fullDocument.replies.length
        }
    })
    console.log('Change type:' + changeType)
    try {
        if (elsBeforeUpdate < elsAfterUpdate) {
            // Original tweet that was updated
            const changedDocument = await tweetCollection.findOne({_id: docId});
            if (changeType === 'retweet') {
                console.log("Retweet");
                // Updates Existing Retweets
                const result = await timelineCollection.updateMany(
                    {"tweets._id": docId},
                    {$set: {
                        "tweets.$[element].retweets": changedDocument.retweets,
                        "tweets.$[element].retweetCount": changedDocument.retweets.length
                    }},
                    {arrayFilters: [
                        {"element._id": docId}
                    ]}
                )
                const tweetAuthor = await userCollection.findOne({username: changedDocument.author});
                // Write the retweet to retweeter's followers
                // On subsequent retweets, changeId is no longer an array, so we have to check for it here and read changeId accordingly
                let isRt = {
                    ...changedDocument,
                    isRt: true,
                }
                if (changeIdArray.length === 1) {
                    const retweeter = await userCollection.findOne({_id: changeId._id});
                    isRt.rtMutual = retweeter.username;
                    const retweeterFollowers = await followersCollection.find({_f: changeId._id}).toArray();
                    retweeterFollowers.forEach(async follower => {
                        // Make sure followers arent following the original author or is the original author
                        const isFollowing = await timelineCollection.findOne({_f: tweetAuthor._id, _t: follower._t})
                        if (isFollowing === null && tweetAuthor._id.toString() !== follower._t.toString()) {
                            await timelineCollection.findOneAndUpdate({_id: follower._t }, { $push: {tweets: isRt}});
                        }
                    })
                } else if (Object.values(newChange).length === 1) {
                    let id = Object.values(newChange)
                    const retweeter = await userCollection.findOne({_id: changeIdArray._id});
                    isRt.rtMutual = retweeter.username;
                    const retweeterFollowers = await followersCollection.find({_f: id[0]._id}).toArray();
                    retweeterFollowers.forEach(async follower => {
                        // Make sure followers arent following the original author or is the original author
                        const isFollowing = await timelineCollection.findOne({_f: tweetAuthor._id, _t: follower._t})
                        if (isFollowing === null && tweetAuthor._id.toString() !== follower._t.toString()) {
                            await timelineCollection.findOneAndUpdate({_id: follower._t }, { $push: {tweets: isRt}});
                        }
                    })
                }
            } else if (changeType === 'like') {
                console.log("Liking - Updating other like counts")
                // Updates existing tweets with new like
                await timelineCollection.updateMany(
                    {"tweets._id": docId},
                    {$set: {
                        "tweets.$[element].likes": changedDocument.likes,
                        "tweets.$[element].likeCount": changedDocument.likes.length
                    }},
                    {arrayFilters: [
                        {"element._id": docId}
                    ]}
                )
            } else if (changeType === 'reply') {
                console.log("Replying - Updating relevant timelines");
                console.log("Original Tweet Id:" + docId);
                // Original tweet that was updated
                const changedDocument = await tweetCollection.findOne({_id: docId});
                // Since order of keys change from initial to subsequent replies, re-declare change keys within this scope.
                let replyKeys = Object.keys(change);
                let replyArrIdx;
                replyKeys.forEach((key, index) => {
                    if (key.startsWith('replies')) {
                        replyArrIdx = index
                        return;
                    }
                })
                // 1ST ADDITIONS
                if (replyArrIdx === 0) {
                    // 1st addition will be an array
                    // It covers the 1st reply to a tweet or 1st nested reply
                    // Get followers of reply author
                    const replyArr = change[replyKeys[replyArrIdx]];
                    const replyAuthor = replyArr[0].author;
                    const authorDoc = await userCollection.findOne({username: replyAuthor});
                    const authorFollowers = await followersCollection.find({_f: authorDoc._id}).toArray();
                    const originalAuthorDoc = await userCollection.findOne({username: eventObject.author});
                    authorFollowers.forEach(async follower => {
                        if (follower._t.toString() === originalAuthorDoc._id.toString()) {
                            console.log("Replying to mutual")
                            await timelineCollection.updateMany(
                                {_id: follower._t}, 
                                {$set: {
                                    "tweets.$[element].replies": changedDocument.replies,
                                    "tweets.$[element].replyCount": changedDocument.replies.length
                                }},
                                {arrayFilters: [
                                    {"element._id": docId}
                                ]}
                            )
                        } else if (authorDoc.username === originalAuthorDoc.username || originalAuthorDoc._id.toString() === follower._t) {
                            // Check if the reply is to themselves or the follower
                            console.log("Replying to follower or own tweet")
                            await timelineCollection.updateMany(
                                {_id: follower._t}, 
                                {$set: {
                                    "tweets.$[element].replies": changedDocument.replies,
                                    "tweets.$[element].replyCount": changedDocument.replies.length
                                }},
                                {arrayFilters: [
                                    {"element._id": docId}
                                ]}
                            )
                        }
                    })
                // SUBSEQUENT ADDITIONS
                } else if (replyArrIdx > 0) {
                    // Subsequent will be just the object IF replying to the same tweet
                    const replyObj = change[replyKeys[replyArrIdx]];
                    const replyAuthor = replyObj.author;
                    const authorDoc = await userCollection.findOne({username: replyAuthor});
                    const authorFollowers = await followersCollection.find({_f: authorDoc._id}).toArray();
                    const originalAuthorDoc = await userCollection.findOne({username: eventObject.author});
                    const result = await timelineCollection.updateMany(
                        {"tweets._id": docId},
                        {$set: {
                            "tweets.$[element].replies": changedDocument.replies,
                            "tweets.$[element].replyCount": changedDocument.replies.length,
                        }},
                        {arrayFilters: [
                            {"element._id": docId}
                        ]}
                    )
                }
            }
        } else {
            // Original unretweet = empty array for updated field []
            const changedDocument = await tweetCollection.findOne({_id: docId});
            if (changeType === 'retweet') {
                console.log("Unretweet")
                // Update Existing retweets
                const result = await timelineCollection.updateMany(
                    {"tweets._id": docId},
                    {$set: {
                        "tweets.$[element].retweets": changedDocument.retweets,
                        "tweets.$[element].retweetCount": changedDocument.retweets.length
                    }},
                    {arrayFilters: [
                        {"element._id": docId}
                    ]}
                )
                // With Full Document + Document Premierage enabled, you will receive document modified BEFORE updates.
                const originialRetweets = changeEvent.fullDocumentBeforeChange.retweets;
                // Unretweet comes from the last element in the array. 
                const retweeter = originialRetweets[originialRetweets.length - 1];
                const retweeterFollowers = await followersCollection.find({_f: retweeter._id}).toArray();
                retweeterFollowers.forEach(async follower => {
                    // Unlesss followers are now following original author ****
                    await timelineCollection.findOneAndUpdate({_id: follower._t}, { $pull: {tweets: {_id: eventObject._id}}});
                })
            } else if (changeType === 'like') {
                console.log("Unliking - updated other tweets");
                const result = await timelineCollection.updateMany(
                    {"tweets._id": docId},
                    {$set: {
                        "tweets.$[element].likes": changedDocument.likes,
                        "tweets.$[element].likeCount": changedDocument.likes.length
                    }},
                    {arrayFilters: [
                        {"element._id": docId}
                    ]}
                )
            } else if (changeType === 'reply') {
                // Deleting of replies is handled by delete atlas function
                return;
            }
        }
    } catch(err) {
        console.log("error performing mongodb write: ", err.message);
    }
};