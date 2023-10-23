import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database"

export const POST = async (req: Request, { params }: { params: {id: string}}) => {
    const { id } = params;
    const newBio = await req.json();
    try {
        await connectToDB();
        const userDoc = await UserModel.findOne({username: id});
        await userDoc.updateOne({bio: newBio});
        return new Response(JSON.stringify('Edited-bio'), {status: 200, statusText: 'edited-bio'});
    } catch(e) {
        return new Response(JSON.stringify('Error editing bio.'), {status: 500});
    }
}