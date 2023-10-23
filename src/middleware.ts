export { default } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Redirect for login page
export async function middleware(req: NextRequest) {
    let reqUrl = req.nextUrl.pathname;
    let basePath = req.url
    const token = await getToken({ req });
    if (reqUrl === '/' && !token) {
        return NextResponse.redirect(new URL('/login', basePath));
    } 
    if (reqUrl.startsWith('/user') && !token) {
        return NextResponse.redirect(new URL('/login', basePath));
    }
    if (reqUrl.startsWith('/tweet') && !token) {
        return NextResponse.redirect(new URL('/login', basePath));
    }
    if (reqUrl.startsWith('/login') && token) {
        return NextResponse.redirect(new URL('/', basePath));
    }
}

// Middleware applies only to these matched routes
export const config = { 
    matcher: ["/", "/login", "/tweet/:path*", "/user/:path*"]
 };
 