import { setOpen } from '@/app/redux/features/modal/modalSlice';
import { RootState } from '@/app/redux/store';
import React from 'react'
import { useDispatch, useSelector } from "react-redux";


const Modal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.modal.open);

    if (isOpen) {
        return (
            <div onClick={() => dispatch(setOpen())} className='z-10 w-full h-screen absolute bg-slate-400 opacity-30'></div>
        )
    } else {
        return null;
    }
}

export default Modal