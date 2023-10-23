"use client";

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import React, { useEffect } from 'react'
import Image from 'next/image';
import { ArrowRightCircleIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/redux/store';
import { fetchRecommendedUsers } from '@/app/redux/features/user/userSlice';
import { usePathname } from 'next/navigation';

const RightMenu = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const otherUsers = useSelector((state: RootState) => state.user.recommendedUsers);

  useEffect(() => {
    if (!otherUsers && session) {
      dispatch(fetchRecommendedUsers())
    }
  }, [session])
  
  if (session && !pathname.includes('/login') && !pathname.includes('register')) {
    return (
      <div className='hidden md:flex grow'>
        <div className='max-w-[395px] p-4 border-l border-gray-700 hidden md:inline-block grow h-screen'>
          {/* Search Bar */}
          {/* <div className='flex rounded-3xl bg-gray-800 items-center'>
            <MagnifyingGlassIcon className='w-4 h-4 text-slate-400 ml-3'/>
            <input type="text" placeholder='Search' className='bg-transparent focus:outline-none rounded-e-3xl p-2'/>
          </div> */}
          {/* Who to follow */}
          <div className='bg-gray-800 rounded-2xl flex flex-col'>
            <p className='text-xl font-bold m-4'>Who to follow</p>
            {otherUsers && otherUsers.length > 0 && otherUsers.map(user => {
              return (
                <div key={user._id} className='flex justify-between ml-2 mr-3 mb-2'>
                  <div className='flex items-center'>
                    {/* Profile Photo */}
                    {user.image ?
                      <Image src={user.image} alt="Profile Photo" width={36} height={36} className="m-2 rounded-full h-fit"/> :
                      <div className='m-2 border-2 border-gray-600 rounded-full w-[36px] h-[36px] bg-gray-800 flex justify-center items-center'>
                          <span className='font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
                      </div>
                    }
                    {/* Username */}
                    <div>
                      <p className='font-bold text-sm'>{user.username}</p>
                      <p className='text-gray-400 text-sm'>@{user.username}</p>
                    </div>
                  </div>
                  {/* Follow */}
                  <Link href={`/user/${user.username}`} className='flex items-center'>
                    <ArrowRightCircleIcon className='w-6 h-8' />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default RightMenu