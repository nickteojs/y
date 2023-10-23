import { UserType } from "@/types/types"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

interface userState {
    loading: boolean,
    followLoad: boolean,
    userActionResult: string,
    user: {
        followers: string,
        following: string,
        isFollowing: boolean,
        users: UserType
    } | null,
    recommendedUsers: UserType[] | null
}

const initialState: userState = {
    loading: false,
    followLoad: false,
    userActionResult: '',
    user: null,
    recommendedUsers: null
}

interface bioProps {
    username: string | string[],
    newBio: string
}

interface fetchUserProps {
    username: string | string[],
    mongoId: string
}

interface followProps {
    sessionName: string,
    type: string,
    targetUser: string
}

export const fetchRecommendedUsers = createAsyncThunk(
    'user/fetchRecommendedUsers', async () => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/users/get`);
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const fetchUser = createAsyncThunk(
    'user/fetchUser', async ({username, mongoId}: fetchUserProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/users/${username}-${mongoId}/get`); 
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e)
        }
    }
)

export const editBio = createAsyncThunk(
    'user/editBio', async ({ username, newBio }: bioProps) => {
        try {
            const response = await fetch(`https://y-nicktjs.vercel.app/api/users/${username}/edit`, {
                method: 'POST',
                body: JSON.stringify(newBio)
            })
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const follow = createAsyncThunk(
    'user/follow', async (postData: followProps) => {
        try {
            let postInfo = {
                sessionName: postData.sessionName,
                type: postData.type
            }
            const response = await fetch(`https://y-nicktjs.vercel.app/api/users/${postData.targetUser}/post`, {
                method: 'POST',
                body: JSON.stringify(postInfo)
            })
            const data = await response.json();
            return data;
        } catch(e) {
            console.log(e);
        }
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        resetToast: state => {
            state.userActionResult = '';
        }
    },
    extraReducers(builder) {
        // Fetch Recommends
        builder.addCase(fetchRecommendedUsers.fulfilled, (state, action) => {
            state.recommendedUsers = action.payload;
        })
        builder.addCase(fetchRecommendedUsers.rejected, (state, action) => {
        })
        // Follow User
        builder.addCase(follow.pending, state => {
            state.followLoad = true;
        })
        builder.addCase(follow.fulfilled, (state, action) => {
            state.followLoad = false;
            state.userActionResult = action.payload
        })
        builder.addCase(follow.rejected, state => {
            state.followLoad = false;
            state.userActionResult = 'Error following. Please refresh and try again.'
        })
        // Fetch User
        builder.addCase(fetchUser.pending, state => {
            state.user = null;
            state.loading = true;
        })
        builder.addCase(fetchUser.fulfilled, (state, action) => {
            state.loading = false;
            if (action.payload === 'User does not exist') {
                state.userActionResult = action.payload;
                state.user = null;
            } else {
                state.user = action.payload;
            }
        })
        builder.addCase(fetchUser.rejected, state => {
            state.loading = false;
            state.userActionResult = 'There was an error fetching the user, please try again.'
        })
        // Edit Bio
        builder.addCase(editBio.pending, state => {
            state.loading = true;
        })
        builder.addCase(editBio.fulfilled, state => {
            state.loading = false;
            state.userActionResult = 'Bio Edited!'
        })
        builder.addCase(editBio.rejected, state => {
            state.loading = false;
            state.userActionResult = 'There was an error editing your bio, please try again.'
        })
    },
})

export const { resetToast } =  userSlice.actions;
export default userSlice.reducer;