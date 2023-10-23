### Y is a Twitter (X) Clone built using:
- Next.js (TypeScript)
- NextAuth (Email Credentials & Google OAuth)
- Redux Toolkit
- MongoDB
- Tailwind CSS

[Live Demo](https://y-nicktjs.vercel.app)

Data architecture is heavily referenced from the MongoDB Team's [Socialite](https://github.com/mongodb-labs/socialite/tree/master). The application uses the "fan out on write" approach when making changes that would be seen by many users, eg: posting a tweet and having it reflect in your followers' timelines.

Any changes that involve more than one user's timeline are handled by MongoDB Atlas' Triggers, which run on a serverless compute layer. 

#### This includes things like:
- Creating/deleting tweets
- Replying to tweets
- Retweeting
- Liking


## Getting Started

Install Dependencies:

```bash
npm install
```

Set up your .env/.env.local file with the following keys:
```
GOOGLE_ID=insert_key_here
GOOGLE_SECRET=insert_key_here
NEXTAUTH_SECRET=insert_key_here
MONGODB_URL=insert_key_here
```

Run the development server:
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
