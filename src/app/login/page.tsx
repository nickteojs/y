"use client";

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

const Login = () => {
    const { data: session } = useSession();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const router = useRouter();

    const submitHandler = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        router.replace(`https://y-nicktjs.vercel.app/login?u=${username}`);
        setLoading(true);
        setResult("");
        e.preventDefault();
        const emailExists = await fetch(`https://y-nicktjs.vercel.app/api/users/${username}-email/get`);
        const data = await emailExists.json();
        if (data.length) {
            const isLoggedIn = await signIn("credentials", {username, password, redirect: false});
            if (isLoggedIn) {
                setLoading(false);
                if (isLoggedIn.error) {
                    setResult("Invalid credentials, please try again.");
                } else {
                    setResult("Logged in! Redirecting you...");
                    router.replace('/');
                }
            }
        } else {
            setLoading(false);
            setResult("Username does not exist.")
        }
    }

    return (
        <div className='w-screen mt-32 bg-black flex justify-center items-center'>
            <div className='max-w-md rounded-xl bg-neutral-800 text-neutral-50 p-4 relative flex flex-col justify-center items-center'>
                <span className='font-black text-4xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
                <h1 className='text-2xl font-bold'>Sign in to Y</h1>
                <button onClick={() => signIn("google")}>Sign in with Google</button>
                <div className='flex items-center'>
                    <div className='w-40 h-[1px] bg-neutral-500'></div>
                    <span className='m-2'>Or</span>
                    <div className='w-40 h-[1px] bg-neutral-500'></div>
                </div>
                <form action="" onSubmit={submitHandler} className='flex flex-col'>
                    <input type="text" required placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} className='my-2 p-3 rounded-sm focus:outline-none bg-neutral-700'/>
                    <input type="password" required placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} className='my-2 p-3 rounded-sm focus:outline-none bg-neutral-700'/>
                    <button type='submit' disabled={loading} className='mx-auto my-3 bg-gradient-to-r from-green-400 to-emerald-600 disabled:opacity-75 disabled:cursor-not-allowed" rounded-full px-5 py-2 text-sm'>
                        {loading ? 'Signing In' : "Sign In"}
                    </button>
                </form>
                {result && <p className='text-sm text-green-500 font-bold mt-5'>{result}</p>}
                <p className='text-sm text-neutral-500 text-left mt-5'>
                    Don&#39;t have an account?
                    <Link href="/register" className='text-green-400 cursor-pointer ml-2'>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login