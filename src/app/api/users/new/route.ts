import { UserModel } from "@/models/user";
import { connectToDB } from "@/utils/database"
import { TimelineModel } from "@/models/timeline";

const bcrypt = require('bcrypt');
export const POST = async (req: Request, res: Response) => {
    try {
        await connectToDB();
        const { username, email, password } = await req.json();
        // Check if user exists by OAuth
        const userExists = await UserModel.find({$or: [
            {username: username}, 
            {email: email}
        ]});
        if (userExists.length) {
            let user = userExists[0];
            if (user.username === username && user.email === email) {
                return new Response(undefined, {status: 200, statusText: "both-in-use"})
            } else if (user.username === username) {
                return new Response(undefined, {status: 200, statusText: "username-in-use"})
            } else if (user.email === email) {
                return new Response(undefined, {status: 200, statusText: "email-in-use"})
            }
        } else {
            const hashed: string = await bcrypt.hash(password, 10);
            const newUser = await UserModel.create({
                username: username,
                email: email,
                password: hashed
            })
            // Create new timeline 
            await TimelineModel.create({_id: newUser._id});
            // Return original string password for bcrypt comparison for auto login after sign up.
            return new Response(JSON.stringify({username, email, password}), {status: 200, statusText: "created"});
        }
    } catch(e) {
        return new Response("Failed to create account", {
            status: 500
        });
    }
}