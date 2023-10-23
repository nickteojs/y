import { TweetModel } from "@/models/tweet";
import { connectToDB } from "@/utils/database";

// RETURNS INDIVIDUAL TWEET 
export const GET = async (req: Request, { params }: {params: {id: string}}) => {
    const { id } = params;
    try {
        await connectToDB();
        const tweet = await TweetModel.findOne({_id: id});
        return new Response(JSON.stringify(tweet), {status: 200, statusText: 'retrieved-tweet'})
    } catch (e) {
        return new Response(JSON.stringify(e), {status: 500});
    }
}