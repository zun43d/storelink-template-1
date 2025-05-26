import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
	interface Session {
		user: {
			id?: string
			isAdmin?: boolean
			storeId?: string
		} & DefaultSession['user']
	}

	interface User extends DefaultUser {
		isAdmin?: boolean
		storeId?: string
	}
}

declare module 'next-auth/jwt' {
	interface JWT extends DefaultJWT {
		isAdmin?: boolean
		id?: string
		storeId?: string
	}
}
