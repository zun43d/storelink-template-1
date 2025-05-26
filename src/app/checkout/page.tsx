'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { useCart, CartItem } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const addressSchema = z.object({
	street: z.string().min(1, 'Street is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	zipCode: z.string().min(1, 'Zip code is required'),
	country: z.string().min(1, 'Country is required'),
})

const checkoutFormSchema = z
	.object({
		customerEmail: z.string().email('Invalid email address'),
		shippingAddress: addressSchema,
		billingSameAsShipping: z.boolean().default(true).optional(),
		billingAddress: addressSchema.optional(),
		paymentMethod: z.enum(['cod', 'bkash'], {
			required_error: 'You need to select a payment method.',
		}),
		transactionId: z.string().optional(), // Added for bKash
	})
	.refine(
		(data) => {
			if (!data.billingSameAsShipping && !data.billingAddress) {
				return false
			}
			return true
		},
		{
			message: 'Billing address is required if different from shipping address',
			path: ['billingAddress'],
		}
	)
	.refine(
		(data) => {
			if (
				data.paymentMethod === 'bkash' &&
				(!data.transactionId || data.transactionId.trim() === '')
			) {
				return false
			}
			return true
		},
		{
			message: 'Transaction ID is required for bKash payment',
			path: ['transactionId'],
		}
	)

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

// Define a type for the order payload
interface OrderPayload {
	customerEmail: string
	items: Array<{
		productId: string
		quantity: number
		price: number
	}>
	totalAmount: number
	shippingAddress: z.infer<typeof addressSchema>
	billingAddress?: z.infer<typeof addressSchema>
	paymentMethod: 'cod' | 'bkash'
	transactionId?: string
}

export default function CheckoutPage() {
	const { items: cartItems, getCartTotal, clearCart, getItemCount } = useCart()
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<CheckoutFormValues>({
		resolver: zodResolver(checkoutFormSchema),
		defaultValues: {
			customerEmail: '',
			shippingAddress: {
				street: '',
				city: '',
				state: '',
				zipCode: '',
				country: '',
			},
			billingSameAsShipping: true,
			billingAddress: undefined,
			paymentMethod: 'cod',
			transactionId: '',
		},
	})

	const billingSameAsShipping = form.watch('billingSameAsShipping')
	const paymentMethod = form.watch('paymentMethod')

	useEffect(() => {
		if (getItemCount() === 0 && !isSubmitting) {
			// Prevent redirect during submission
			toast.error(
				'Your cart is empty. Add items before proceeding to checkout.'
			)
			router.push('/cart')
		}
	}, [getItemCount, router, isSubmitting])

	async function onSubmit(data: CheckoutFormValues) {
		setIsSubmitting(true)
		toast.loading('Placing your order...')

		const orderPayload: OrderPayload = {
			customerEmail: data.customerEmail,
			items: cartItems.map((item: CartItem) => ({
				productId: item.id,
				productSku: item.sku,
				quantity: item.quantity,
				price: item.price,
			})),
			totalAmount: getCartTotal(),
			shippingAddress: data.shippingAddress,
			billingAddress: data.billingSameAsShipping
				? data.shippingAddress
				: (data.billingAddress as OrderPayload['billingAddress']),
			paymentMethod: data.paymentMethod,
			transactionId: data?.transactionId || undefined,
		}

		if (data.paymentMethod === 'bkash') {
			orderPayload.transactionId = data.transactionId
		}

		try {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(orderPayload),
			})

			const result = await response.json()

			if (!response.ok) {
				toast.dismiss()
				toast.error(
					result.message || 'Failed to place order. Please try again.'
				)
				console.error('Order submission error:', result)
				setIsSubmitting(false)
				return
			}

			toast.dismiss()
			toast.success('Order placed successfully!')
			clearCart()
			router.push(`/order-confirmation/${result.id}`)
		} catch (error) {
			toast.dismiss()
			toast.error('An unexpected error occurred. Please try again.')
			console.error('Checkout error:', error)
			setIsSubmitting(false) // Ensure isSubmitting is reset on error
		}
		// setIsSubmitting(false); // Already handled in try/catch/finally logic if needed
	}

	if (getItemCount() === 0 && !isSubmitting) {
		return (
			<div className="text-center py-10">
				<p className="text-xl">Your cart is empty.</p>
				<Button onClick={() => router.push('/products')} className="mt-4">
					Continue Shopping
				</Button>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-4 md:px-0 max-w-2xl">
			<h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<FormField
						control={form.control}
						name="customerEmail"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Address</FormLabel>
								<FormControl>
									<Input placeholder="you@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<h2 className="text-xl font-semibold">Shipping Address</h2>
					<FormField
						control={form.control}
						name="shippingAddress.street"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Street</FormLabel>
								<FormControl>
									<Input placeholder="123 Main St" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="shippingAddress.city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>City</FormLabel>
								<FormControl>
									<Input placeholder="Anytown" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="shippingAddress.state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>State / Province</FormLabel>
								<FormControl>
									<Input placeholder="CA" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="shippingAddress.zipCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Zip / Postal Code</FormLabel>
								<FormControl>
									<Input placeholder="90210" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="shippingAddress.country"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country</FormLabel>
								<FormControl>
									<Input placeholder="USA" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="billingSameAsShipping"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>
										Billing address is the same as my shipping address
									</FormLabel>
								</div>
							</FormItem>
						)}
					/>

					{!billingSameAsShipping && (
						<>
							<h2 className="text-xl font-semibold">Billing Address</h2>
							<FormField
								control={form.control}
								name="billingAddress.street"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Street</FormLabel>
										<FormControl>
											<Input placeholder="123 Main St" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>City</FormLabel>
										<FormControl>
											<Input placeholder="Anytown" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.state"
								render={({ field }) => (
									<FormItem>
										<FormLabel>State / Province</FormLabel>
										<FormControl>
											<Input placeholder="CA" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.zipCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zip / Postal Code</FormLabel>
										<FormControl>
											<Input placeholder="90210" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input placeholder="USA" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					<FormField
						control={form.control}
						name="paymentMethod"
						render={({ field }) => (
							<FormItem className="space-y-3">
								<FormLabel>Payment Method</FormLabel>
								<FormControl>
									<RadioGroup
										onValueChange={field.onChange}
										defaultValue={field.value}
										className="flex flex-col space-y-1"
									>
										<FormItem className="flex items-center space-x-3 space-y-0">
											<FormControl>
												<RadioGroupItem value="cod" />
											</FormControl>
											<FormLabel className="font-normal">
												Cash on Delivery
											</FormLabel>
										</FormItem>
										<FormItem className="flex items-center space-x-3 space-y-0">
											<FormControl>
												<RadioGroupItem value="bkash" />
											</FormControl>
											<FormLabel className="font-normal">bKash</FormLabel>
										</FormItem>
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{paymentMethod === 'bkash' && (
						<FormField
							control={form.control}
							name="transactionId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>bKash Transaction ID</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter bKash Transaction ID"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					<div className="border-t pt-6">
						<h3 className="text-lg font-semibold">Order Summary</h3>
						<div className="space-y-2 mt-2">
							{cartItems.map((item: CartItem) => (
								<div key={item.id} className="flex justify-between">
									<span>
										{item.name} x {item.quantity}
									</span>
									<span>${(item.price * item.quantity).toFixed(2)}</span>
								</div>
							))}
							<div className="flex justify-between font-bold text-xl pt-2 border-t">
								<span>Total</span>
								<span>${getCartTotal().toFixed(2)}</span>
							</div>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting || getItemCount() === 0}
					>
						{isSubmitting ? 'Placing Order...' : 'Place Order'}
					</Button>
				</form>
			</Form>
		</div>
	)
}
