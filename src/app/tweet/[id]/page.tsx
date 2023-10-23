"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TweetType } from '@/types/types';
import { useDispatch, useSelector } from 'react-redux';
import { useSession } from 'next-auth/react';
import { retweet as reduxRetweet, fetchIndivTweet, reply, deleteTweet, resetToast } from '@/app/redux/features/tweet/tweetSlice';
import { FormEvent } from 'react';
import { dateConstructor } from '@/utils/date';
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/20/solid";
import { ArrowPathRoundedSquareIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from '@heroicons/react/20/solid';
import { AppDispatch, RootState } from '@/app/redux/store';
import { setToast } from '@/app/redux/features/toast/toastSlice';
import { setOpen } from '@/app/redux/features/modal/modalSlice';
import { ObjectId } from 'mongodb';

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

const Tweet = () => {
    const { id } = useParams();
    const [replyContent, setReplyContent] = useState('');
    const [replyId, setReplyId] = useState<ObjectId | string>();
    const [deleteModal, setDeleteModal] = useState(false);
    const [tweetToDelete, setTweetToDelete] = useState<TweetToDeleteProps | null>(null);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session } = useSession();
    const overlay = useSelector((state: RootState) => state.modal.open);
    const tweet = useSelector((state: RootState) => state.tweets.indivTweet);
    const { loading, tweetActionResult } = useSelector((state: RootState) => state.tweets);

    // Session values are null asserted (!) as session loads before FCP
    
    const retweetLike = async ({id, author, type, feature, location}: RetweetLikeProps) => {
        let payload = {
          id: id,
          type: type,
          username: session?.user?.name!,
          feature: feature,
          location: location
        }
        if (author === session?.user?.name && feature === 'retweet') {
            return;
        } else {
            dispatch(reduxRetweet(payload));
        }
    }    

    const handleDelete = () => {
      if (tweetToDelete) {
        dispatch(deleteTweet(tweetToDelete))
      }
    }

    const handleReply = (id: ObjectId) => {
        setReplyContent('');
        setReplyId(id);
    }

    const toggleDeleteModal = (tweet: TweetType) => {
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
  
        // Nested replies
        // if (originalTweet.isReply) {
        //   tweetContent.rootTweet = originalTweet.replyingTo;
        // }
  
        let postData = {
          tweetContent: tweetContent,
          tweetBeingRepliedToId: originalId
        }
        dispatch(reply(postData));
    }

    const checkReplyLikeStatus = (tweet: TweetType, type: string): boolean => {
      // False = Not liked or retweeted yet
      // True = Liked/retweeted already
        if (type === 'like') {
          const result = tweet.likes?.some(like => like.username === session?.user?.name)
          if (tweet.liked && !result) {
            // Liked but not refreshed: return true - action has been taken.
            return true;
          } else if (tweet.liked === undefined && result) {
            // Liked and refreshed: action has been taken
            return true;
          } else if (tweet.liked === false && !result) {
            // Unliked but not refreshed:
            return false;
          } else if (tweet.liked === undefined && !result) {
            // Not liked: no action has been taken
            return false;
          }
        } else if (type === 'retweet') {
            const result = tweet.retweets.some(rt => rt.username === session?.user?.name)
            if (tweet.retweeted && !result) {
              // Retweeted but not refreshed: return true - action has been taken.
              return true;
            } else if (tweet.retweeted === undefined && result) {
              // Retweeted but refreshed: action has been taken
              return true;
            } else if (tweet.retweeted === false && !result) {
              // Unretweeted but not refreshed
              return false;
            } else if (tweet.retweeted === undefined && !result) {
              // Not retweeted: fresh
              return false;
            }
        }
        return false;
    }

    const renderReplyInput = (tweet: TweetType, tweetId: string) => {
        if (tweetId === replyId) {
          return (
            <div className='px-4 mt-2'>
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
                  <button type="submit" className="bg-green-500 w-auto text-xs px-4 -all py-2 font-bold rounded-3xl hover:bg-green-600 disabled:opacity-75 disabled:cursor-not-allowed" disabled={loading}>
                    {loading ? 'Loading' : 'Reply'}
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

    const renderTweetReplies = (replyArray: TweetType[]) => {
        const render = replyArray.map(reply => {
            let strStart = reply.date.indexOf('•');
            let strEnd = reply.date.indexOf(',');
            let newStr = reply.date.slice(strStart, strEnd);
            return (
                <div key={reply._id.toString()} className='flex flex-col border-b border-gray-700 px-4 py-3'>
                    <div className="flex justify-between">
                        <div className="flex">
                            {reply.authorImage ? 
                                <Image src={reply.authorImage} style={{objectFit: 'cover'}} width={40} height={40} alt="Profile Photo" className="m-2 rounded-full h-fit"/>:
                                <div className='m-2 border-4 border-black rounded-full w-[40px] h-[40px] bg-gray-800 flex justify-center items-center'>
                                    <span className='font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600'>Y</span>
                                </div>
                            }
                            <div className="flex flex-col mb-2">
                                <div className="flex gap-x-2">
                                    <p className="font-bold"><Link href={`/user/${reply.author}`}>{reply.author}</Link></p>
                                    <p className="text-gray-400">@{reply.author}</p>
                                    <p className="text-gray-400">{newStr}</p>
                                </div>
                                <p>{reply.content}</p>
                            </div>
                        </div>
                        {session?.user?.name === reply.author && <button onClick={() => toggleDeleteModal(reply)} className="self-start cursor-pointer"><TrashIcon className="text-red-700 w-4 h-4"/></button>}
                    </div>
                    <div className="flex gap-x-4 ml-14">
                        <p className='flex items-center gap-1 text-gray-400 cursor-pointer' onClick={() => retweetLike(generateRetweetLikeProps(reply, checkReplyLikeStatus(reply, 'retweet'), 'retweet', 'indiv'))}>
                          <span className={reply.retweeted || checkReplyLikeStatus(reply, 'retweet') ? 'text-green-500' : 'text-gray-400'}>
                            {reply.retweetCount ? reply.retweetCount : '0'}
                          </span> 
                          <ArrowPathRoundedSquareIcon className="w-4 h-4"/>
                        </p>
                        <p className='flex items-center gap-1 text-gray-400 cursor-pointer' onClick={() => retweetLike(generateRetweetLikeProps(reply, checkReplyLikeStatus(reply, 'like'), 'like', 'indiv'))}>
                          <span className='text-gray-400'>
                            {reply.likeCount ? reply.likeCount : '0'}
                          </span>
                          <HeartIcon className={reply.liked || checkReplyLikeStatus(reply, 'like') ? 'text-red-400 w-4 h-4' : 'text-gray-400 w-4 h-4'}/>
                        </p>
                    </div>
                </div>
            )
        })
        return render;
    }

    useEffect(() => {
      dispatch(fetchIndivTweet(id));
    }, [])

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
            setTweetToDelete(null);
            dispatch(setOpen());
        }
    }, [tweetActionResult])

    useEffect(() => {
        if (!overlay && deleteModal) {
          setDeleteModal(prev => !prev);
        }
      }, [overlay])

    if (!tweet) {
        return <div className='w-[598px] text-center'>
        <h1 className='mt-5'>Loading</h1>
      </div>
    }

    else {
        let strStart = tweet.date.indexOf('•');
        let strEnd = tweet.date.indexOf(',');
        let newStr = tweet.date.slice(strStart, strEnd);
        return (
            <div className='w-[598px] h-screen overflow-y-scroll relative'>
                <div className="text-center py-5 border-b border-gray-700 flex items-center">
                    <button className='ml-4' onClick={() => router.back()}>
                        <ArrowLeftIcon className='w-6 h-6 cursor-pointer'/>
                    </button>
                    <h1 className='font-bold text-xl mx-auto'>Viewing Tweet by {tweet.author}</h1>
                </div>
                <div key={tweet._id.toString()} className="flex flex-col border-b border-gray-700 px-4 py-3">
                    <div className="flex justify-between">
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
                                <p>{tweet.content}</p>
                            </div>
                        </div>
                        {session?.user?.name === tweet.author && <button onClick={() => toggleDeleteModal(tweet)} className="self-start cursor-pointer"><TrashIcon className="text-red-700 w-4 h-4"/></button>}
                    </div>
                    <div className="flex gap-x-4 ml-14">
                        {!tweet.isReply && <p className='flex items-center gap-1 text-gray-400 cursor-pointer' onClick={() => handleReply(tweet._id)}>
                          {tweet.replyCount ? tweet.replyCount : '0'} 
                          <ChatBubbleOvalLeftIcon className="w-4 h-4"/>
                        </p>}
                        <p className='flex items-center gap-1 text-gray-400 cursor-pointer' onClick={() => retweetLike(generateRetweetLikeProps(tweet, checkReplyLikeStatus(tweet, 'retweet'), 'retweet', 'indiv'))}>
                          <span className={tweet.retweeted || checkReplyLikeStatus(tweet, 'retweet') ? 'text-green-500' : 'text-gray-400'}>
                            {tweet.retweetCount ? tweet.retweetCount : '0'}
                          </span>
                          <ArrowPathRoundedSquareIcon className="w-4 h-4"/>
                        </p>
                        <p className='flex items-center gap-1 text-gray-400 cursor-pointer' onClick={() => retweetLike(generateRetweetLikeProps(tweet, checkReplyLikeStatus(tweet, 'like'), 'like', 'indiv'))}>
                          <span className={tweet.liked || checkReplyLikeStatus(tweet, 'like') ? 'text-red-400' : 'text-gray-400'}>
                            {tweet.likeCount ? tweet.likeCount : '0'}
                          </span>
                          <HeartIcon className="w-4 h-4"/>
                        </p>
                    </div>
                </div>
                {/* Render Reply Input */}
                {renderReplyInput(tweet, tweet._id.toString())}
                {tweet.replies.length > 0 && <div className='text-center border-b border-gray-700 py-2'>Replies</div>}
                {/* Render Replies */}
                {tweet.replies.length > 0 && renderTweetReplies(tweet.replies)}
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
                            <button onClick={() => toggleDeleteModal(tweet)} className='disabled:opacity-75 disabled:cursor-not-allowed py-2 px-4 rounded-2xl bg-red-400'>
                                <p>No</p>
                            </button>
                        </div>
                    </div>
                </div>}
            </div>
        )
    }
}

export default Tweet;