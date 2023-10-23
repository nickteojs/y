"use client";

import { UserType } from '@/types/types';
import Image from 'next/image'
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpen } from '@/app/redux/features/modal/modalSlice';
import { editBio, resetToast } from '@/app/redux/features/user/userSlice';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '@/app/redux/store';
import { setToast } from '@/app/redux/features/toast/toastSlice';

interface ProfileCardProps {
  isOwner: boolean,
  user: UserType,
  actionText: string,
  stats: {
    followers: string, 
    following: string
  } | null,
  followUser: () => void,
  username: string | string[]
}

const ProfileCard = ({ isOwner, user, actionText, stats, followUser, username }: ProfileCardProps) => {
  const [editModal, setEditModal] = useState(false);
  const [bio, setBio] = useState(user.bio ? user.bio : 'Hello, I am new on Y!');
  const dispatch = useDispatch<AppDispatch>();
  const overlay = useSelector((state: RootState) => state.modal.open);
  const { loading, userActionResult } = useSelector((state: RootState) => state.user)

  const handleProfileButton = () => {
    setEditModal(prev => !prev);
    dispatch(setOpen());
  }

  const closeBioModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.bio) {
      setBio(user.bio);
    }
    setEditModal(prev => !prev);
    dispatch(setOpen());
  }

  const handleEditBio = (e: React.FormEvent) => {
    e.preventDefault();
    const bioProps = {
      username: username,
      newBio: bio
    }
    dispatch(editBio(bioProps));
  }

  const ProfileActionButton = () => {
    if (isOwner) {
      return <button onClick={handleProfileButton} className='rounded-3xl bg-slate-50 text-black font-bold px-5 py-2 h-min'>
        Edit Profile
      </button>
    } else {
      return <button className='rounded-3xl bg-slate-50 text-black font-bold px-5 py-2 h-min' onClick={followUser}>
        {actionText}
      </button>
    }
  }

  useEffect(() => {
    if (!overlay && editModal) {
      setEditModal(prev => !prev);
    }
  }, [overlay])

  useEffect(() => {
    if (userActionResult === 'Bio Edited!') {
      dispatch(setToast(userActionResult));
      dispatch(setOpen());
      setTimeout(() => {
        dispatch(resetToast());
      }, 1000)
    }
  }, [userActionResult])

  // const { username, image, header_image, bio } = user;
  return (
    <div className='mb-1 border-b border-gray-600 mt-[69px] sm:mt-0'>
      {/* Banner */}
      <div className='w-screen max-w-[598px] min-h-[120px] max-h-[140px] h-auto bg-gradient-to-r from-green-400 to-emerald-600'>
      </div>
      {/* Profile Photo, Follow/Edit Profile Button */}
      <div className='flex justify-between pt-3 px-3 relative'>
        {user?.image ? 
          <Image className='border-4 border-black rounded-full relative top-[-60px]' style={{objectFit: 'cover'}} src={user.image} width={135} height={135} alt="Profile Photo" /> :
          <div className='border-4 border-black rounded-full w-[135px] h-[135px] bg-gray-800 flex justify-center items-center relative top-[-60px]'>
            <span className='font-black text-6xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
          </div>
        }
        <ProfileActionButton />
      </div>
      {/* Profile Name, Username, bio, followers & following */}
      <div className='flex flex-col gap-2 mt-[-50px] px-5'>
        <div>
          <p className='font-bold'>{user.username}</p>
          <p className='text-gray-400'>@{user.username}</p>
        </div>
        <div>
          {user.bio ? 
            <p>{user.bio}</p> :
            <p>Hello, I am new on Y!</p>
          }
        </div>
        <div className='mb-5'>
          <span className='font-bold mr-3'>{stats?.following} <span className='font-normal text-gray-400'>Following</span></span>
          <span className='font-bold'>{stats?.followers} <span className='font-normal text-gray-400'>Followers</span></span>
        </div>
      </div>
      {/* Edit Profile Modal */}
      <div className={editModal ? 'z-20 w-full absolute left-0 top-20 text-center' : 'hidden'}>
          <form action="" onSubmit={handleEditBio} className='relative bg-slate-900 min-w-[300px] max-w-[350px] px-5 py-5 rounded-3xl mx-auto flex flex-col justify-center content-center'>
            <button className='absolute top-4 right-4' onClick={closeBioModal}>
              <XCircleIcon className='w-6 h-6' />
            </button>
            <label htmlFor="bioInput">Edit your bio</label>
            <textarea id="bioInput" required value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150} placeholder="Blockchain developer from California!"
            className="my-3 bg-transparent resize-none focus:outline-none h-auto"></textarea>
            <button type='submit' disabled={loading} className='disabled:opacity-75 disabled:cursor-not-allowed py-2 px-4 rounded-2xl mx-auto bg-slate-800'>
              {loading ? 'Saving..' : 'Save'}
            </button>
          </form>
      </div>
    </div>
  )
}

export default ProfileCard