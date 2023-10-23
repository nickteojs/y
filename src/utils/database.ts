import mongoose, { ConnectOptions } from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if (isConnected) {
        console.log("MongoDB is already connected");
    } else {
        try {
            await mongoose.connect(process.env.MONGODB_URL!, {
                dbName: 'next-ts-twitter',
                useNewUrlParser: true,
                useUnifiedTopology: true
            } as ConnectOptions);
            isConnected = true;
            console.log("Connected to DB: next-ts-twitter");
        } catch(e) {
            console.log(e);
        }
    }
}