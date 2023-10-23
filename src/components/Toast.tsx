"use client";

import { resetToast } from '@/app/redux/features/toast/toastSlice';
import { RootState } from '@/app/redux/store'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const Toast = () => {
    const dispatch = useDispatch();
    const result = useSelector((state: RootState) => state.toast.result)

    useEffect(() => {
        setTimeout(() => {
            dispatch(resetToast());
        }, 1000)
    }, [result])

    return (
        <div className={result ? 'text-center absolute z-20 bottom-36 sm:bottom-6 right-4' : 'hidden'}>
            <span className='rounded-full px-5 py-3 bg-gradient-to-r from-green-400 to-emerald-600 text-white'>{result}</span>
        </div>
    )
}

export default Toast