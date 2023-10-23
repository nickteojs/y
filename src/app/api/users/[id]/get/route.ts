import { FollowerModel } from "@/models/followers";
import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database";

export const GET = async (req: Request, { params }: { params: {id: string}}) => {
    const { id } = params;
    const [targetId, currentId] = id.split('-');
    try {
        await connectToDB();
        // This is also used to validate login, hence .find is used vs .findOne
        const users = await UserModel.find({ username: targetId })
        // No user exists
        if (users.length === 0) {
            return new Response(JSON.stringify("User does not exist"), {status: 200});
        }
        // Query to see if current user is following target user
        if (!id.includes('email')) {
            const followerCount = await FollowerModel.find({ _f: users[0]._id });
            const followingCount = await FollowerModel.find({ _t: users[0].id });
            const isFollowing = await FollowerModel.find({ _f: users[0]._id, _t: currentId });
            return new Response(JSON.stringify({ 
                users: users[0], 
                isFollowing: Boolean(isFollowing.length),
                followers: followerCount.length,
                following: followingCount.length
            }), {status: 200});
        } else {
            return new Response(JSON.stringify(users), {status: 200})
        }
    } catch(e) {
        return new Response("Failed to fetch users", {
            status: 500
        })
    }
}