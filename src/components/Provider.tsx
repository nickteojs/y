"use client";

import { SessionProvider } from "next-auth/react";
import { ReactElement } from "react";

type ChildrenType = {
    children: ReactElement
}

const Provider = ({ children }: ChildrenType) => {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}

export default Provider;