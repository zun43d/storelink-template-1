'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { getClientStoreId } from '@/lib/store' // Import getClientStoreId

// import { OrderItem, Product } from '@prisma/client'
// import { Order } from '@prisma/client'

interface OrderItem {
	id: string
	quantity: number
	product: {
		id: string
		name: string
		imageUrl?: string | null
	}
	price: number
}

interface Order {
	id: string
	customerEmail: string
	totalAmount: number
	fulfillmentStatus: string
	createdAt: Date
	shippingAddress: {
		city: string
		country: string
		state: string
		street: string
		zipCode: string
	}
	billingAddress: {
		city: string
		country: string
		state: string
		street: string
		zipCode: string
	}
	paymentMethod: string
	orderItems: OrderItem[]
}

export default function OrderConfirmationPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id: orderId } = React.use(params)
	const router = useRouter()
	const [order, setOrder] = useState<Order | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (orderId) {
			const fetchOrder = async () => {
				setLoading(true)
				const storeId = getClientStoreId() // Get storeId
				if (!storeId) {
					toast.error('Store ID is not configured. Cannot fetch order details.')
					setLoading(false)
					return
				}
				try {
					const response = await fetch(
						`/api/orders/${orderId}?storeId=${storeId}` // Pass storeId to the API
					)
					if (!response.ok) {
						const errorData = await response.json()
						throw new Error(
							errorData.message || 'Failed to fetch order details'
						)
					}
					const data = await response.json()
					setOrder(data)
				} catch (error: unknown) {
					console.error('Error fetching order:', error)
					if (error instanceof Error) {
						toast.error(error.message || 'Could not load order details.')
					} else {
						toast.error('Could not load order details.')
					}
				}
				setLoading(false)
			}
			fetchOrder()
		}
	}, [orderId, router])

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<p className="text-xl">Loading order details...</p>
			</div>
		)
	}

	if (!order) {
		return (
			<div className="text-center py-10">
				<p className="text-xl text-red-600">Order not found.</p>
				<Button onClick={() => router.push('/')} className="mt-4">
					Go to Homepage
				</Button>
			</div>
		)
	}

	const formatDate = (dateString: Date) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return (
		<div className="container mx-auto py-8 px-4 md:px-0 max-w-3xl">
			<Card>
				<CardHeader className="bg-green-500 text-green-50 rounded-t-lg">
					<CardTitle className="text-2xl md:text-3xl text-center">
						Thank You For Your Order!
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6 space-y-6">
					<p className="text-lg text-center">
						Your order{' '}
						<span className="font-semibold">#{order.id.substring(0, 8)}</span>{' '}
						has been placed successfully.
					</p>
					<p className="text-center text-gray-600">
						Order Date: {formatDate(order.createdAt)}
					</p>

					<Separator />

					<div>
						<h3 className="text-xl font-semibold mb-3">Order Summary</h3>
						{order.orderItems.map((item) => (
							<div
								key={item.id}
								className="flex justify-between items-center py-2 border-b last:border-b-0"
							>
								<div>
									<p className="font-medium">{item.product.name}</p>
									<p className="text-sm text-gray-500">
										Quantity: {item.quantity}
									</p>
								</div>
								<p className="font-medium">
									${(item.quantity * item.price).toFixed(2)}
								</p>
							</div>
						))}
						<div className="flex justify-between font-bold text-xl pt-3 mt-2 border-t">
							<span>Total Amount</span>
							<span>${order.totalAmount.toFixed(2)}</span>
						</div>
					</div>

					<Separator />

					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="text-xl font-semibold mb-2">Shipping Address</h3>
							<p>{order.shippingAddress.street}</p>
							<p>
								{order.shippingAddress.city}, {order.shippingAddress.state}{' '}
								{order.shippingAddress.zipCode}
							</p>
							<p>{order.shippingAddress.country}</p>
						</div>
						<div>
							<h3 className="text-xl font-semibold mb-2">Billing Address</h3>
							<p>{order.billingAddress.street}</p>
							<p>
								{order.billingAddress.city}, {order.billingAddress.state}{' '}
								{order.billingAddress.zipCode}
							</p>
							<p>{order.billingAddress.country}</p>
						</div>
					</div>

					<Separator />

					<div>
						<h3 className="text-xl font-semibold mb-2">Payment Information</h3>
						<p>
							Payment Method:{' '}
							<span className="font-medium">
								{order.paymentMethod.toUpperCase()}
							</span>
						</p>
						<p>
							Status:{' '}
							<span className="font-medium text-green-600">
								{order.fulfillmentStatus}
							</span>
						</p>
					</div>

					<p className="text-sm text-gray-600 text-center">
						You will receive an email confirmation shortly at{' '}
						<span className="font-semibold">{order.customerEmail}</span>. (Note:
						Email sending is not implemented in this demo).
					</p>
				</CardContent>
				<CardFooter className="flex justify-center p-6">
					<Button
						onClick={() => router.push('/products')}
						className="w-full md:w-auto"
					>
						Continue Shopping
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
