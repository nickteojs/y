import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TweetType } from "@/types/types";
import { ObjectId } from "mongodb";

interface TweetsState {
    tweets: TweetType[],
    indivTweet: TweetType | null,
    loading: boolean,
    tweetActionResult: string,
    fetchLoad: boolean,
}

const initialState: TweetsState = {
    tweets: [],
    indivTweet: null,
    loading: false,
    tweetActionResult: '',
    fetchLoad: false,
}

interface replyDataProps {
    tweetContent: {
        content: string,
        author: string,
        authorImage: string,
        date: string,
        dateNum: number,
        isReply: Boolean,
        replyingTo: ObjectId,
    },
    tweetBeingRepliedTo?: string
}

interface deleteProps {
    tweetId: ObjectId,
    isReply?: Boolean,
    replyingTo?: ObjectId,
    uid: string
}

interface RetweetProps {
    id: ObjectId,
    type: boolean,
    username: string,
    feature: string,
    location: string
}

interface RetweetReturnData {
    data: string,
    statusText: string,
    location: string
}

interface CreateTweetProps {
    content: string,
    author: string,
    authorImage: string,
    date: string,
    dateNum: number
}

export const fetchIndivTweet = createAsyncThunk(
    'tweets/fetchIndivTweet', async (id: string | string[]) => {
        const response = await fetch(`https://y-nicktjs.vercel.app/api/tweet/${id}/get`)
        const data = await response.json();
        return data;
    }
)

export const fetchTweets = createAsyncThunk(
    'tweets/fetchTweets', async () => {
        const response = await fetch(`https://y-nicktjs.vercel.app/api/tweets/get`);
        const data = await response.json();
        return data;
    }
)

export const fetchUserTweets = createAsyncThunk(
    'tweets/fetchUserTweets', async (user: string | string[]) => {
        const response = await fetch(`https://y-nicktjs.vercel.app/api/tweets/${user}/get`);
        const data = await response.json();
        return data;
    }
)

export const retweet = createAsyncThunk(
    'tweets/retweet', async ({ id, type, username, feature, location }: RetweetProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/tweet/${id}/update`, {
                method: 'POST',
                body: JSON.stringify({
                  user: username,
                  type: type,
                  feature: feature,
                  location: location
                })
            });
            const data = await response.json();
            // let returnData: RetweetReturnData = {
            //     data: data,
            //     statusText: response.statusText,
            //     location: location
            // }
            // return returnData;
            return data;
        }
        catch (e) {
            console.log(e)
        }
    }
)

export const reply = createAsyncThunk(
    'tweets/reply', async (replyData: replyDataProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/tweets/reply`, {
                method: 'POST',
                body: JSON.stringify(replyData)
            })
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const createTweet = createAsyncThunk(
    'tweets/createTweet', async (tweetContent: CreateTweetProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/tweets/new`, {
                method: 'POST',
                body: JSON.stringify(tweetContent)
            })
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const deleteTweet = createAsyncThunk(
    'tweets/deleteTweet', async (tweetInfo: deleteProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/tweets/delete`, {
                method: 'DELETE',
                body: JSON.stringify({
                    tweetId: tweetInfo.tweetId, 
                    uid: tweetInfo.uid, 
                    isReply: tweetInfo.isReply, 
                    replyingTo: tweetInfo.replyingTo
                })
            })
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const tweetSlice = createSlice({
    name: 'tweets',
    initialState,
    reducers: {
        resetToast: state => {
            state.tweetActionResult = ''
        }
    },
    extraReducers: (builder) => {
        // Fetching timeline tweets
        builder.addCase(fetchTweets.pending, state => {
            state.fetchLoad = true;
        })
        builder.addCase(fetchTweets.fulfilled, (state, action) => {
            state.fetchLoad = false;
            state.tweets = action.payload;
        })
        builder.addCase(fetchTweets.rejected, state => {
            state.fetchLoad = false;
            state.tweetActionResult = 'Failed to fetch tweets, please try again!'
        })
        // Fetching profile tweets
        builder.addCase(fetchUserTweets.pending, state => {
            state.fetchLoad = true;
            state.tweets = [];
        })
        builder.addCase(fetchUserTweets.fulfilled, (state, action) => {
            state.fetchLoad = false;
            state.tweets = action.payload;
        })
        // Fetching individual tweet
        builder.addCase(fetchIndivTweet.fulfilled, (state, action) => {
            state.tweets = [];
            state.indivTweet = action.payload;
        })
        // New Tweet
        builder.addCase(createTweet.pending, state => {
            state.loading = true;
        })
        builder.addCase(createTweet.fulfilled, (state, action) => {
            state.loading = false;
            state.tweetActionResult = 'Created!'
            state.tweets.unshift(action.payload);
        })
        builder.addCase(createTweet.rejected, state => {
            state.loading = false;
            state.tweetActionResult = 'Failed to create, please try again.'
        })
        // Reply
        builder.addCase(reply.pending, state => {
            state.loading = true;
        })
        builder.addCase(reply.fulfilled, (state, action) => {
            const { tweetBeingRepliedTo, reply } = action.payload;
            state.loading = false;
            state.tweetActionResult = 'Replied!'
            // Check if replying from timeline/profile or individual tweet
            if (state.tweets.length === 0) {
                // Individual Page
                if (state.indivTweet) {
                    state.indivTweet.replyCount++;
                    state.indivTweet.replies.push(reply);
                }
            } else {
                let tweetBeingRepliedToIndex = state.tweets.findIndex(tweet => tweet._id === tweetBeingRepliedTo);
                let repliedTweet = state.tweets[tweetBeingRepliedToIndex];
                repliedTweet.replyCount++;
            }
        })
        builder.addCase(reply.rejected, state => {
            state.loading = false;
            state.tweetActionResult = 'Failed to reply, please try again.'
        })
        // Delete
        builder.addCase(deleteTweet.pending, (state) => {
            state.loading = true;
        })
        builder.addCase(deleteTweet.fulfilled, (state, action) => {
            state.loading = false;
            state.tweetActionResult = 'Deleted!'
            // Check if replying from timeline or individual tweet
            if (state.tweets.length === 0) {
                // Individual Page
                if (state.indivTweet !== null) {
                    state.indivTweet.replyCount--;
                    const updatedLocalTweets = state.indivTweet.replies.filter(tweet => tweet._id !== action.payload);
                    state.indivTweet.replies = updatedLocalTweets;
                }
            } else {
                const updatedLocalTweets = state.tweets.filter(tweet => tweet._id !== action.payload);
                state.tweets = updatedLocalTweets;
            }
        })
        builder.addCase(deleteTweet.rejected, (state) => {
            state.loading = true;
            state.tweetActionResult = 'Failed to delete, please try again.'
        })
        builder.addCase(retweet.fulfilled, (state, action) => {
            console.log(action.payload);
            const { data, statusText, location } = action.payload;
            let indexOfTweet;
            let tweet;
            // Updating local state to show feedback in UI
            // Check whether it's individual or home page
            if (location === 'indiv' && state.indivTweet) {
                // Individual tweet
                if (state.indivTweet?._id === data) {
                    tweet = state.indivTweet;
                    // Liking main tweet
                    if (statusText === 'retweeted') {
                        tweet.retweeted = true;
                        tweet.retweetCount++;
                    } else if (statusText === 'liked') {
                        tweet.liked = true;
                        tweet.likeCount++;
                    } else if (statusText === 'unliked') {
                        tweet.liked = false;
                        tweet.likeCount--;
                    } else {
                        tweet.retweeted = false;
                        tweet.retweetCount--;
                    }
                } else {
                    // Liking a reply
                    indexOfTweet = state.indivTweet?.replies.findIndex(t => t._id === data);
                    tweet = state.indivTweet?.replies[indexOfTweet!];
                    if (statusText === 'retweeted') {
                        tweet.retweeted = true;
                        tweet.retweetCount++;
                    } else if (statusText === 'liked') {
                        tweet.liked = true;
                        tweet.likeCount++;
                    } else if (statusText === 'unliked') {
                        tweet.liked = false;
                        tweet.likeCount--;
                    } else {
                        tweet.retweeted = false;
                        tweet.retweetCount--;
                    }
                }
            } else if (location === 'home') {
                // Home Page
                indexOfTweet = state.tweets.findIndex(t => t._id === data);
                tweet = state.tweets[indexOfTweet];
                if (statusText === 'retweeted') {
                    tweet.retweeted = true;
                    tweet.retweetCount++;
                } else if (statusText === 'liked') {
                    tweet.liked = true;
                    tweet.likeCount++;
                } else if (statusText === 'unliked') {
                    tweet.liked = false;
                    tweet.likeCount--;
                } else {
                    tweet.retweeted = false;
                    tweet.retweetCount--;
                }
            }
        })
    }
})

export const { resetToast } =  tweetSlice.actions;
export default tweetSlice.reducer;
