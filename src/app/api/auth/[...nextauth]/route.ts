import NextAuth, { AuthOptions } from "next-auth"; 
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDB } from "@/utils/database";
import { UserModel } from "@/models/user";

const bcrypt = require('bcrypt');
const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {
                  label: "Username",
                  type: "text"
                },
                email: {
                    label: "Email:",
                    type: "text"
                },
                password: {
                    label: "Password:",
                    type: "text"
                }
            },
            async authorize(credentials) {
                // Null asserted because of required input fields
                const { username, password } = credentials!;
                try {
                    // Authorize with database
                    await connectToDB();
                    // Find user from DB based on email credential
                    const user = await UserModel.findOne({username: username});
                    // If user exists
                    if (user) {
                        const match = await bcrypt.compare(password, user.password);
                        if (match) {
                            return user;
                        // Wrong password
                        } else { 
                            return null;
                        }
                    // If user does not exist
                    } else {
                        return null;
                    }
                } catch(e) {
                    console.log(e)
                }
            }
        })
    ],
    pages: {
        signIn: '/login'
    },
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            // Included as NextAuth throws an access denied error without returning anything
            // Returns an awaitable - whether a user is allowed to sign in
            // If credentials, return
            if (account?.type === 'credentials') {
                return true
            } else {
                try {
                    await connectToDB();
                    const userExists = await UserModel.findOne({
                        email: profile?.email
                    })
                    if (!userExists) {
                        const newUser = await UserModel.create({
                            username: profile?.name?.replace(" ", "").toLowerCase(),
                            email: profile?.email,
                            // TS Ignored because Google OAuth returns image as profile.picture instead of profile.image. 
                            // Next does not recognise this
                            // @ts-ignore
                            image: profile?.picture
                        })
                        const mongoId = newUser._id.toString();
                        // Create new timeline 
                        await fetch(`https://y-nicktjs.vercel.app/api/timeline/new`, {
                            method: 'POST',
                            body: JSON.stringify(mongoId)
                        })
                    }
                    return true
                } catch(e) {
                    return false
                }
            }
        },
        async session({ session }) {
            if (session.user) {
                const user = await UserModel.findOne({email: session.user.email});
                session.user.name = user.username;
                session.mongoId = user._id;
            }
            return session;
        }
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };