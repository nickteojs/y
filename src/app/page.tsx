"use client";

// General
import { FormEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dateConstructor } from "@/utils/date";
// Next
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
// Icons
import { ArrowLeftOnRectangleIcon, TrashIcon, UserIcon, HeartIcon } from "@heroicons/react/20/solid";
import { ArrowPathRoundedSquareIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";
// Types
import { TweetType } from "@/types/types";
import { ObjectId } from "mongodb";
// RTK
import { AppDispatch, RootState } from "./redux/store";
import { retweet as reduxRetweet, fetchTweets, deleteTweet, createTweet, reply, resetToast } from "./redux/features/tweet/tweetSlice";
import { setOpen } from "./redux/features/modal/modalSlice";
import { setToast } from "./redux/features/toast/toastSlice";

interface RetweetLikeProps {
  id: ObjectId,
  author: string,
  type: boolean,
  feature: string,
  location: string
}

interface TweetToDeleteProps {
  tweetId: ObjectId,
  isReply?: Boolean,
  replyingTo?: ObjectId,
  uid: string
}

export default function Home() {
    const { data: session, status } = useSession();
    const [tweetLoading, setTweetLoading] = useState(true);
    const [content, setContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [replyId, setReplyId] = useState<ObjectId | string>();
    const [deleteModal, setDeleteModal] = useState(false);
    const [tweetToDelete, setTweetToDelete] = useState<TweetToDeleteProps | null>(null);
    const overlay = useSelector((state: RootState) => state.modal.open);
    const tweets = useSelector((state: RootState) => state.tweets.tweets);
    const { loading, tweetActionResult, fetchLoad } = useSelector((state: RootState) => state.tweets);
    const dispatch = useDispatch<AppDispatch>();

    // Session values are null asserted (!) as session loads before FCP
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      let tweetContent = {
          content: content,
          author: session?.user?.name!,
          authorImage: session?.user?.image ? session.user.image : "",
          date: dateConstructor(),
          dateNum: Date.now()
      }
      dispatch(createTweet(tweetContent!));
    }

    const retweet = async ({id, author, type, feature, location}: RetweetLikeProps) => {
      let payload = {
        id: id,
        type: type,
        username: session?.user?.name!,
        feature: feature,
        location: location
      }
      if (author === session?.user?.name && feature === 'retweet') {
        return;
      // } else if (session!.user!.name) {
      } else {
        dispatch(reduxRetweet(payload));
      }
    }

    const handleReply = (id: ObjectId) => {
      setReplyContent('');
      setReplyId(id);
    }

    const handleDelete = () => {
      if (tweetToDelete) {
        dispatch(deleteTweet(tweetToDelete))
      }
    }

    const toggleDeleteModal = (e: React.MouseEvent<HTMLButtonElement>, tweet: TweetType) => {
      setTweetToDelete({
          tweetId: tweet._id,
          isReply: tweet.isReply,
          replyingTo: tweet.replyingTo,
          uid: session!.mongoId
      });  
      setDeleteModal(prev => !prev);
      dispatch(setOpen());
  }

    const submitReply = async (e: FormEvent<HTMLFormElement>, originalId: ObjectId, originalTweet: TweetType): Promise<void> => {
      e.preventDefault();
      let tweetContent = {
        content: replyContent,
        author: session?.user?.name!,
        authorImage: session?.user?.image ? session.user.image : "",
        date: dateConstructor(),
        dateNum: Date.now(),
        isReply: true,
        replyingTo: originalId,
      }

      // Nested Replies
      // if (originalTweet.isReply) {
      //   tweetContent.rootTweet = originalTweet.replyingTo;
      // }

      let postData = {
        tweetContent: tweetContent,
        tweetBeingRepliedToId: originalId
      }

      dispatch(reply(postData));
    }

    const renderReplyInput = (tweet: TweetType, tweetId: string) => {
      if (tweetId === replyId) {
        return (
          <div>
            <p className="underline ml-2 text-gray-400">Replying to {tweet.author}</p>
            <form action="" onSubmit={e => submitReply(e, tweet._id, tweet)} className="flex flex-col mt-2">
              <div className="flex">
                {session?.user?.image ? 
                  <Image src={session.user.image} alt="Profile Photo" width={40} height={40} className="m-2 rounded-full h-fit"/> :
                  <div className='m-2 border-4 border-black rounded-full w-[40px] h-[40px] bg-gray-800 flex justify-center items-center'>
                      <span className='font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
                  </div>
                }
                <textarea required value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={3} maxLength={280} placeholder="Type your reply here.."
                className="mt-3 grow bg-transparent resize-none focus:outline-none h-auto"></textarea>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">Characters Left: {280 - replyContent.length}</span>
                <button type="submit" disabled={loading} className="bg-green-500 disabled:opacity-75 disabled:cursor-not-allowed w-auto text-xs px-4 transition-all py-2 font-bold rounded-3xl hover:bg-green-600">
                  {replyContent && loading ? 'Replying..' : 'Reply'}
                </button>
              </div>
            </form>
          </div>
        )
      }
    }

    const generateRetweetLikeProps = (tweet: TweetType, type: boolean, feature: string, location: string): RetweetLikeProps => {
      let retweetLikeProps = {
        id: tweet._id,
        author: tweet.author,
        type: type,
        feature: feature,
        location: location
      }
      return retweetLikeProps
    }

    useEffect(() => {
      // If session is still loading
      if (status === 'loading') {
        setTweetLoading(true);
      } else {
        // Fetch user's timeline once session has been loaded
        dispatch(fetchTweets());
        setTweetLoading(false);
      }
    }, [status])

    // Close the reply modal after replying and reset states
    useEffect(() => {
      dispatch(setToast(tweetActionResult))
      setTimeout(() => {
        dispatch(resetToast());
      }, 1000)
      if (tweetActionResult === 'Replied!') {
          setReplyId('');
          setReplyContent('');
      } else if (tweetActionResult === 'Deleted!') {
          setTweetToDelete(null)
          dispatch(setOpen())
      } else if (tweetActionResult === 'Created!') {
          setContent('');
      }
    }, [tweetActionResult])

    useEffect(() => {
      if (!overlay && deleteModal) {
        setDeleteModal(prev => !prev);
      }
    }, [overlay])

    if (tweetLoading) return (
      <div className='w-screen mt-32 flex justify-center items-center'>
        <h1 className="mt-5">
          <span className='font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>
            Loading Y..
          </span>
        </h1>
      </div>
    )

    return (
      <div className="w-full max-w-[598px] h-screen overflow-y-scroll">
        <div className="w-full bg-black bg-opacity-80 flex justify-between fixed sm:relative sm:justify-center text-center px-2 sm:px-0 py-3 sm:py-5 border-b border-gray-500 sm:border-gray-700">
          <h1 className='font-bold text-xl hidden sm:block'>Home</h1>
          <span className='sm:hidden font-black text-4xl lg:ml-1 lg:mr-0 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>
            <Link href="/" className='py-3 pl-4 pr-4 lg:pr-6'>Y</Link>
          </span>
          <div className="flex items-center sm:hidden">
            <div>
              <Link href={`/user/${session?.user?.name}`} className='flex items-center w-min mx-auto lg:ml-2 lg:mr-0 py-2 px-3 cursor-pointer hover:rounded-3xl hover:bg-gray-900'>
                  <UserIcon className='w-7 h-7 lg:mr-2'/>
                  <p className='hidden lg:flex'>Profile</p>
              </Link>
            </div>
            <div onClick={() => signOut()}>
              {/* Sign Out */}
              <div className='flex items-center w-max mx-auto lg:ml-2 lg:mr-0 py-2 px-3 cursor-pointer hover:rounded-3xl hover:bg-gray-900'>
                <ArrowLeftOnRectangleIcon className='w-7 h-7 lg:mr-2'/>
                <p className='hidden lg:flex'>Sign Out</p>
              </div>
            </div>
          </div>
        </div>
        <form action="" onSubmit={handleSubmit} className="flex flex-col border-b border-gray-600 px-4 mt-[89px] sm:mt-4">
          <div className="flex">
            {session?.user?.image ? 
              <Image src={session.user.image} alt="Profile Photo" width={40} height={40} className="m-2 rounded-full h-fit"/> :
              <div className='m-2 border-4 border-black rounded-full w-[40px] h-[40px] bg-gray-800 flex justify-center items-center'>
                  <span className='font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
              </div>
            }
            <textarea required value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={280} placeholder="How's life going?"
            className="text-lg mt-3 grow bg-transparent resize-none focus:outline-none h-auto"></textarea>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="ml-2 text-gray-400">Characters Left: {280 - content.length}</span>
            <button type="submit" className="bg-green-500 w-auto text-sm px-4 transition-all py-2 font-bold rounded-3xl hover:bg-green-600 disabled:opacity-75 disabled:cursor-not-allowed" disabled={loading && !deleteModal && !replyContent}>
              {loading && !deleteModal && !replyContent ? 'Posting..' : 'Post'}
            </button>
          </div>
        </form>
        {fetchLoad ? <p className="text-center mt-5">Loading Tweets..</p> : 
        tweets.length === 0 ? <p className="text-center mt-5 mx-10">Post a tweet or start following people!</p> : 
        tweets.map(tweet => {
          let strStart = tweet.date.indexOf('•');
          let strEnd = tweet.date.indexOf(',');
          let newStr = tweet.date.slice(strStart, strEnd);
          let retweetMessage;
          if (tweet.retweets.length > 1) {
            retweetMessage = `Retweeted by ${tweet.rtMutual} and ${tweet.retweets.length - 1} others`
          } else if (tweet.retweets.length === 1) {
            retweetMessage = `Retweeted by ${tweet.retweets[0].username}`
          }
          return (
              <div key={tweet._id.toString()} className="flex flex-col border-b border-gray-700 px-4">
                  {tweet.replyingTo && <div className="font-bold text-gray-400 ml-[56px] mt-1">
                    <p>Replying to <Link href={`/tweet/${tweet.replyingTo}`}>a tweet</Link></p>  
                  </div>}
                  <div className="font-bold text-gray-400 ml-[56px] mt-2">{tweet.isRt && retweetMessage}</div>
                  <div className="flex justify-between mt-2">
                    <div className="flex">
                        {tweet.authorImage ?
                          <Image src={tweet.authorImage} style={{objectFit: 'cover'}} width={40} height={40} alt="Profile Photo" className="m-2 rounded-full h-fit"/>:
                          <div className='m-2 border-4 border-black rounded-full w-[40px] h-[40px] bg-gray-800 flex justify-center items-center'>
                              <span className='font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
                          </div>
                        }
                        <div className="flex flex-col mb-2">
                          <div className="flex gap-x-2">
                              <p className="font-bold"><Link href={`/user/${tweet.author}`}>{tweet.author}</Link></p>
                              <p className="text-gray-400">@{tweet.author}</p>
                              <p className="text-gray-400">{newStr}</p>
                          </div>
                          <p>
                            <Link href={`/tweet/${tweet._id}`}>
                              {tweet.content}
                            </Link>
                          </p>
                        </div>
                    </div>
                    {/* Delete Button */}
                    {session?.user?.name === tweet.author && <button onClick={e => toggleDeleteModal(e, tweet)} className="self-start cursor-pointer"><TrashIcon className="text-red-700 w-4 h-4"/></button>}
                  </div>
                  {/* Replies, Comments, Likes */}
                  <div className="flex gap-x-4 ml-14 mb-2">
                      {!tweet.isReply && 
                        <p onClick={() => handleReply(tweet._id)} className='flex items-center gap-1 cursor-pointer text-gray-400'>
                          {tweet.replyCount ? tweet.replyCount : '0'}
                          <ChatBubbleOvalLeftIcon className="w-4 h-4"/>
                        </p>
                      }
                      <p onClick={() => retweet(generateRetweetLikeProps(tweet, tweet.retweeted ? true : false, 'retweet', 'home'))} className='flex items-center gap-1 cursor-pointer text-gray-400'>
                        <span className={tweet.retweeted ? 'text-green-500' : 'text-gray-400'}>
                          {tweet.retweetCount ? tweet.retweetCount : '0'}
                        </span>
                        <ArrowPathRoundedSquareIcon className="w-4 h-4"/>
                      </p>
                      <p onClick={() => retweet(generateRetweetLikeProps(tweet, tweet.liked ? true : false, 'like', 'home'))} className='flex items-center gap-1 cursor-pointer text-gray-400'>
                        <span className='text-gray-400'>
                          {tweet.likeCount ? tweet.likeCount : '0'}
                        </span>
                        <HeartIcon className={tweet.liked ? 'text-red-400 w-4 h-4' : 'text-gray-400 w-4 h-4'}/>
                      </p>
                  </div>
                  {/* Render Reply Input */}
                  {renderReplyInput(tweet, tweet._id.toString())}
                  {/* Delete Modal */}
                  {deleteModal && 
                  <div className={deleteModal ? 'z-20 w-full fixed left-0 top-20 text-center' : 'hidden'}>
                      <div className='relative bg-slate-900 max-w-[275px] px-5 py-5 rounded-3xl mx-auto flex flex-col justify-center content-center'>
                          <p>Delete Tweet?</p>
                          <div className="flex my-4 justify-center gap-4">
                              <button disabled={loading} onClick={handleDelete}
                              className='disabled:opacity-75 disabled:cursor-not-allowed py-2 px-4 rounded-2xl bg-green-400'>
                                  <p>{loading ? 'Deleting..' : 'Yes'}</p>
                              </button>
                              <button onClick={e => toggleDeleteModal(e, tweet)} className='disabled:opacity-75 disabled:cursor-not-allowed py-2 px-4 rounded-2xl bg-red-400'>
                                  <p>No</p>
                              </button>
                          </div>
                      </div>
                  </div>}
              </div>
          )
        })}
      </div>
  )
}