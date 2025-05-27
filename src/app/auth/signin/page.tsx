'use client'

import { Suspense, useState, FormEvent } from 'react'
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

function SignInPageContent() {
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
		<div className="flex items-center justify-center min-h-svh bg-muted/50 p-4">
			<Card className="w-full max-w-md shadow-xl">
				<CardHeader className="text-center space-y-1">
					<CardTitle className="text-3xl font-bold text-primary">
						Admin Sign In
					</CardTitle>
					<CardDescription className="text-muted-foreground">
						Enter your credentials to access the admin panel.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{formError && (
							<div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md">
								<p>{formError}</p>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email" className="text-sm font-medium">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="admin@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className="bg-background"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password" className="text-sm font-medium">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								className="bg-background"
							/>
						</div>
						<Button
							type="submit"
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									{/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}{' '}
									{/* Assuming Loader2 is available or add it */}
									Signing In...
								</>
							) : (
								'Sign In'
							)}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="text-center text-xs text-muted-foreground">
					<p>
						This panel is for authorized personnel only. Ensure you have
						permission before proceeding.
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}

export default function SignInPage() {
	return (
		<Suspense>
			<SignInPageContent />
		</Suspense>
	)
}
