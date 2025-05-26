'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function SignInPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get('callbackUrl') || '/'
	const error = searchParams.get('error')

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [formError, setFormError] = useState<string | null>(
		error ? 'Authentication failed. Please check your credentials.' : null
	)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsLoading(true)
		setFormError(null)

		try {
			const result = await signIn('credentials', {
				redirect: false, // Handle redirect manually to show errors on this page
				email,
				password,
				callbackUrl: callbackUrl,
			})

			if (result?.error) {
				setFormError(
					result.error === 'CredentialsSignin'
						? 'Invalid email or password.'
						: 'An unexpected error occurred. Please try again.'
				)
				setIsLoading(false)
			} else if (result?.ok && result?.url) {
				// Successfully signed in
				router.push(result.url) // or router.push(callbackUrl) if result.url is not reliable
			} else {
				// Handle cases where result is undefined or url is missing but no error
				setIsLoading(false)
			}
		} catch (err) {
			console.error('Sign in error:', err)
			setFormError('An unexpected error occurred. Please try again.')
			setIsLoading(false)
		}
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
					<CardDescription>
						Enter your credentials to access the admin panel.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{formError && (
							<div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
								<p>{formError}</p>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="admin@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? 'Signing In...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="text-center text-sm">
					<p>This is for authorized personnel only.</p>
				</CardFooter>
			</Card>
		</div>
	)
}
