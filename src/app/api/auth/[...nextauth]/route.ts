import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { getStoreId } from '@/lib/store' // Added import

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma), // This will need to be customized or reconsidered
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: {
					label: 'Email',
					type: 'email',
					placeholder: 'jsmith@example.com',
				},
				password: { label: 'Password', type: 'password' },
				// storeId: { label: "Store ID", type: "text" } // Potentially add to login form if not from env
			},
			async authorize(credentials) {
				const storeId = getStoreId() // Get storeId
				if (!storeId) {
					console.error('Store ID is not configured for authentication')
					return null
				}

				if (!credentials?.email || !credentials?.password) {
					console.log('Missing credentials')
					return null
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email, storeId: storeId }, // Added storeId to query
				})

				if (!user || !user.password) {
					// Assuming passwordHash is named password in your schema now
					console.log(
						`No user found with email ${credentials.email} for store ${storeId} or password not set.`
					)
					return null
				}

				const isValid = await bcrypt.compare(
					credentials.password,
					user.password // Assuming passwordHash is named password
				)

				if (!isValid) {
					console.log('Invalid password for user:', credentials.email)
					return null
				}

				console.log(
					'User authenticated successfully:',
					user.email,
					'for store:',
					storeId
				)

				// The user object returned here is what populates the `user` parameter in the `jwt` callback.
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					isAdmin: user.isAdmin, // Now included from the user model
					storeId: user.storeId, // Return storeId from DB user object
				}
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async jwt({ token, user }) {
			// The `user` parameter here is the object returned from the `authorize` function or from the adapter.
			if (user) {
				// token.isAdmin = user.isAdmin
				token.id = user.id
				token.storeId = user.storeId // Add storeId to JWT token
				token.isAdmin = user.isAdmin // isAdmin is now available on the user object
			}
			return token
		},
		async session({ session, token }) {
			// The `token` parameter here is the JWT token from the `jwt` callback.
			if (session.user) {
				// session.user.isAdmin = token.isAdmin as boolean | undefined
				session.user.id = token.id as string | undefined
				session.user.storeId = token.storeId as string | undefined // Add storeId to session user object
				session.user.isAdmin = token.isAdmin as boolean | undefined
			}
			return session
		},
	},
	pages: {
		signIn: '/auth/signin',
	},
	secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
