import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret })

	const { pathname } = req.nextUrl

	// If user is logged in and trying to access signin or signup, redirect to dashboard
	if (token && pathname === '/auth/signin') {
		const url = req.nextUrl.clone()
		url.pathname = '/admin/dashboard'
		return NextResponse.redirect(url)
	}

	if (!token && pathname.startsWith('/admin')) {
		const url = req.nextUrl.clone()
		url.pathname = '/auth/signin'
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}
