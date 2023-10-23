"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type FormData = {
    username: string,
    email: string,
    password: string
}

const Register = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const signUpHandler = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      setLoading(true);
      setResult("");
      e.preventDefault();
      let formData: FormData = {
          username,
          email,
          password
      }
      const response = await fetch(`https://y-nicktjs.vercel.app/api/users/new`, {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      // Server OK
      if (response.status === 200) {
        // Creation Success
        if (response.statusText === 'created') {
          setResult('Account created! Logging you in..');
          // Log the user in
          const user = await response.json();
          const loggedIn = await signIn("credentials", {
            ...user,
            redirect: false
          });
          if (loggedIn?.ok === true) {
            setLoading(false);
            setTimeout(() => {
              router.replace('/');
            }, 1000)
          }
        } else if (response.statusText === 'both-in-use') {
          setLoading(false);
          // Creation failed - email in use
          setResult("Username and email already in use!");
        } else if (response.statusText === 'username-in-use') {
          setResult("Username is already in use!");
        } else if (response.statusText === 'email-in-use') {
          setResult("Email is already in use!");
        }
      } else if (response.status === 500) {
        setLoading(false);
        // Server not OK
        setResult("Failed to create an account, please try again.")
      }
    }

    // useEffect
    // Fetches array of users and gets emails ONLY ONCE
    // debounced onchange checks if it exists within the array of users
    // If exists, show error email already in use
    
    return (
      <div className='w-screen mt-32 bg-black flex justify-center items-center'>
          <div className='max-w-md rounded-xl bg-neutral-800 text-neutral-50 px-12 py-6 relative flex flex-col justify-center items-center'>
              <span className='font-black text-4xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
              <h1 className='text-xl font-bold mb-4'>Register for an account</h1>
              <form action="" onSubmit={signUpHandler} className='flex flex-col gap-4'>
                  <input required minLength={5} maxLength={12} type="text" id="username" placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} className='p-3 rounded-sm focus:outline-none bg-neutral-700'/>
                  <input required type="email" id="email" placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} className='p-3 rounded-sm focus:outline-none bg-neutral-700'/>
                  <input required minLength={5} maxLength={16} type="password" id="password" placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} className='p-3 rounded-sm focus:outline-none bg-neutral-700'/>
                  <div className="flex mb-2 gap-2">
                    <button onClick={() => router.back()} disabled={loading} type='button' className="mx-auto mt-2 pb-2 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl px-5 py-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed">
                      Back
                    </button>
                    <button type='submit' disabled={loading} className="mx-auto mt-2 pb-2 bg-gradient-to-r transition from-green-400 to-emerald-600 rounded-2xl px-5 py-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed">
                      {loading ? 'Registering' : 'Register'}
                    </button>
                  </div>
              </form>
              {result && <p className='text-sm text-green-500 font-bold mt-5'>{result}</p>}
          </div>
      </div>
    )
}

export default Register