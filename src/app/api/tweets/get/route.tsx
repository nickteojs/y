import { TimelineModel } from "@/models/timeline";
import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
    // Session object not persisted on server side, use email instead
    const session = await getServerSession();
    try {
        // Fetch user's timeline
        await connectToDB();
        const user = await UserModel.findOne({email: session?.user?.email});
        // const userTimeline = await TimelineModel.findOne({_id: user._id});
        const response = await TimelineModel.aggregate([
            {$match: {_id: user._id}},
            {$project: 
                {
                    tweets: 1,
                    result:
                        {
                            $sortArray: { input: "$tweets", sortBy: { dateNum: -1 }}
                        }
                }
            }
            // {$sortArray: { input: "$tweets", sortBy: {dateNum: 1}}}
        ])
        return new Response(JSON.stringify(response[0].result), {status: 200, statusText: 'Retrieved tweets'});

    } catch(e) {    
        return new Response(undefined, {status: 500, statusText: 'Failed to retrieve tweets'});
    }
}