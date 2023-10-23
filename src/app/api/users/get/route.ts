import { FollowerModel } from "@/models/followers";
import { UserModel } from "@/models/user";
import { UserType } from "@/types/types";
import { connectToDB } from "@/utils/database"
import { getServerSession } from "next-auth";

export const GET = async () => {
    const session = await getServerSession();
    try {
        if (session) {
            await connectToDB();
            const userDoc = await UserModel.findOne({email: session.user?.email});
            const userFollowing = await FollowerModel.find({_t: userDoc._id});
            let recommendArray: UserType[] = [];
            let recommendCount = 0;
            if (userFollowing.length === 0) {
                const otherUsers = await UserModel.aggregate([
                    {$match: {email: {$ne: session?.user?.email}}},
                    {$project: {tweets: 0}},
                    {$limit: 3}
                ]);
                return new Response(JSON.stringify(otherUsers), {status: 200, statusText: 'fetched-other-users'})
            } else {
                const otherUsers = await UserModel.aggregate([
                    {$match: {email: {$ne: session?.user?.email}}},
                    {$project: {tweets: 0}}
                ]);
                // AND not already following
                userFollowing.forEach(following => {
                    otherUsers.forEach(user => {
                        if (following._f.toString() !== user._id.toString() && recommendCount < 3) {
                            recommendArray.push(user);
                            recommendCount++;
                        }
                    })
                })
                return new Response(JSON.stringify(recommendArray), {status: 200, statusText: 'fetched-other-users'})
            }
        }
    } catch (e) {
        return new Response(JSON.stringify(e), {status: 500})
    }
}