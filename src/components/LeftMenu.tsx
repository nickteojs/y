import { ArrowLeftOnRectangleIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import React from 'react'
import { usePathname } from 'next/navigation'

const LeftMenu = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (session && !pathname.includes('login') && !pathname.includes('register')) {
    return (
      <div className='hidden sm:flex grow justify-end'>
        <div className='max-w-[285.73px] flex flex-col justify-between border-r border-gray-700 grow h-screen'>
          <div className='flex flex-col'>
              <span className='font-black text-4xl mb-4 my-2 mx-auto lg:ml-1 lg:mr-0 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>
                <Link href="/" className='py-3 pl-4 pr-4 lg:pr-6'>Y</Link>
              </span>
              {/* Search */}
              {/* <div>
                <Link href="/search" className='flex items-center w-min mx-auto mb-2 lg:ml-2 lg:mr-0 py-2 px-3 cursor-pointer hover:rounded-3xl hover:bg-gray-900'>
                  <MagnifyingGlassIcon className='w-7 h-7 lg:mr-2'/>
                  <p className='hidden lg:flex'>Explore</p>
                </Link>
              </div> */}
              {/* Profile */}
              <div>
                <Link href={`/user/${session?.user?.name}`} className='flex items-center w-min mx-auto lg:ml-2 lg:mr-0 py-2 px-3 cursor-pointer hover:rounded-3xl hover:bg-gray-900'>
                    <UserIcon className='w-7 h-7 lg:mr-2'/>
                    <p className='hidden lg:flex'>Profile</p>
                </Link>
              </div>
          </div>
          <div className='mb-5' onClick={() => signOut()}>
              {/* Sign Out */}
              <div className='flex items-center w-max mx-auto lg:ml-2 lg:mr-0 py-2 px-3 cursor-pointer hover:rounded-3xl hover:bg-gray-900'>
                <ArrowLeftOnRectangleIcon className='w-7 h-7 lg:mr-2'/>
                <p className='hidden lg:flex'>Sign Out</p>
              </div>
          </div>
        </div>
      </div>
    )
  }
}

export default LeftMenu