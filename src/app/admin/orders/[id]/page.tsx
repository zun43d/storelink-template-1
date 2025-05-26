'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { Order as PrismaOrder, OrderItem, Product } from '@prisma/client' // Correctly import enums
import { useSession } from 'next-auth/react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface Address {
	name?: string
	street?: string
	city?: string
	state?: string
	zip?: string
	country?: string
	[key: string]: string | undefined // Make index signature more specific
}

interface ExtendedOrderItem extends OrderItem {
	product: Product
}

interface ExtendedOrder
	extends Omit<PrismaOrder, 'shippingAddress' | 'billingAddress'> {
	orderItems: ExtendedOrderItem[]
	shippingAddress: Address | null
	billingAddress: Address | null
	updatedAt: Date
	paymentTransactionId: string | null // Add transactionId property
}

// Use the imported Prisma enums for options
const paymentStatusOptions = ['PAID', 'PENDING', 'FAILED', 'REFUNDED']
const fulfillmentStatusOptions = [
	'PENDING',
	'PROCESSING',
	'SHIPPED',
	'DELVIERED',
	'CANCELLED',
]

export default function AdminOrderDetailPage() {
	const params = useParams()
	const orderId = params.id as string
	const router = useRouter()
	const { data: session, status: sessionStatus } = useSession()

	const [order, setOrder] = useState<ExtendedOrder | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isUpdating, setIsUpdating] = useState(false)

	// Use PrismaOrder for status types
	const [editablePaymentStatus, setEditablePaymentStatus] = useState('')
	const [editableFulfillmentStatus, setEditableFulfillmentStatus] = useState('')

	useEffect(() => {
		if (sessionStatus === 'loading') return
		if (!session || !session.user.isAdmin) {
			toast.error('Access Denied.')
			router.push('/auth/signin')
			return
		}

		if (orderId) {
			const fetchOrderDetails = async () => {
				setIsLoading(true)
				try {
					const response = await fetch(`/api/admin/orders/${orderId}`)
					if (!response.ok) {
						const errorData = await response.json()
						throw new Error(
							errorData.message || 'Failed to fetch order details.'
						)
					}
					const data = (await response.json()) as ExtendedOrder
					setOrder(data)
					setEditablePaymentStatus(data.paymentStatus)
					setEditableFulfillmentStatus(data.fulfillmentStatus)
				} catch (error) {
					toast.error(
						error instanceof Error
							? error.message
							: 'An unexpected error occurred.'
					)
					router.push('/admin/orders')
				} finally {
					setIsLoading(false)
				}
			}
			fetchOrderDetails()
		}
	}, [orderId, router, session, sessionStatus])

	const handleStatusUpdate = async (type: 'payment' | 'fulfillment') => {
		if (!order) return
		setIsUpdating(true)
		try {
			const payload: Partial<PrismaOrder> = {}
			if (type === 'payment' && editablePaymentStatus) {
				payload.paymentStatus =
					editablePaymentStatus as PrismaOrder['paymentStatus']
			} else if (type === 'fulfillment' && editableFulfillmentStatus) {
				payload.fulfillmentStatus =
					editableFulfillmentStatus as PrismaOrder['fulfillmentStatus']
			}

			if (Object.keys(payload).length === 0) {
				toast.info('No status change selected.')
				setIsUpdating(false)
				return
			}

			const response = await fetch(`/api/admin/orders/${orderId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || `Failed to update ${type} status.`)
			}
			const updatedOrder: ExtendedOrder = await response.json()
			setOrder(updatedOrder)
			setEditablePaymentStatus(updatedOrder.paymentStatus)
			setEditableFulfillmentStatus(updatedOrder.fulfillmentStatus)
			toast.success(`Order ${type} status updated successfully!`)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'An unexpected error occurred.'
			)
		} finally {
			setIsUpdating(false)
		}
	}

	if (sessionStatus === 'loading' || isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-16 w-16 animate-spin" />
				<p className="ml-4 text-lg">Loading order details...</p>
			</div>
		)
	}

	if (!session || !session.user.isAdmin) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<p className="text-xl text-red-500">Access Denied.</p>
			</div>
		)
	}

	if (!order) {
		return (
			<div className="container mx-auto py-10 text-center">
				<p className="text-xl text-red-500">Order not found.</p>
				<Link href="/admin/orders" passHref>
					<Button variant="outline" className="mt-4">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
					</Button>
				</Link>
			</div>
		)
	}

	const shippingAddress: Address | null =
		order.shippingAddress as Address | null
	const billingAddress: Address | null = order.billingAddress as Address | null

	return (
		<div className="container mx-auto py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Order Details</h1>
				<Link href="/admin/orders" passHref>
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Order #{order.orderNumber}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold">Customer Information</h3>
								<p>Email: {order.customerEmail}</p>
							</div>
							<Separator />
							<div>
								<h3 className="font-semibold">Shipping Address</h3>
								{shippingAddress ? (
									<>
										<p>{shippingAddress.name || 'N/A'}</p>
										<p>{shippingAddress.street || 'N/A'}</p>
										<p>
											{shippingAddress.city || 'N/A'},{' '}
											{shippingAddress.state || 'N/A'}{' '}
											{shippingAddress.zip || 'N/A'}
										</p>
										<p>{shippingAddress.country || 'N/A'}</p>
									</>
								) : (
									<p>No shipping address provided.</p>
								)}
							</div>
							<Separator />
							<div>
								<h3 className="font-semibold">Billing Address</h3>
								{billingAddress ? (
									<>
										<p>{billingAddress.name || 'N/A'}</p>
										<p>{billingAddress.street || 'N/A'}</p>
										<p>
											{billingAddress.city || 'N/A'},{' '}
											{billingAddress.state || 'N/A'}{' '}
											{billingAddress.zip || 'N/A'}
										</p>
										<p>{billingAddress.country || 'N/A'}</p>
									</>
								) : (
									<p>No billing address provided.</p>
								)}
							</div>
							<Separator />
							<div>
								<h3 className="font-semibold">Payment Information</h3>
								<p>Method: {order.paymentMethod}</p>
								{order.paymentMethod === 'BKASH' && (
									<p>Transaction ID: {order.paymentTransactionId || 'N/A'}</p>
								)}
							</div>
							<Separator />
							<div>
								<h3 className="font-semibold">Order Items</h3>
								{order.orderItems.map((item) => (
									<div
										key={item.id}
										className="flex justify-between items-center py-2"
									>
										<div>
											<p className="font-medium">
												{item.product.name} (x{item.quantity})
											</p>
											<p className="text-sm text-gray-500">
												SKU: {item.product.sku || 'N/A'}
											</p>
										</div>
										<p>
											{new Intl.NumberFormat('en-US', {
												style: 'currency',
												currency: 'USD',
											}).format(Number(item.price) * item.quantity)}
										</p>
									</div>
								))}
							</div>
							<Separator />
							<div className="flex justify-end font-bold text-xl">
								<p>
									Total:{' '}
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD',
									}).format(Number(order.totalAmount))}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Update Status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div>
							<label
								htmlFor="paymentStatus"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Payment Status
							</label>
							<div className="flex items-center space-x-2">
								<Select
									defaultValue={editablePaymentStatus} // Ensure undefined for placeholder
									onValueChange={(value) => setEditablePaymentStatus(value)}
									disabled={isUpdating}
								>
									<SelectTrigger id="paymentStatus">
										<SelectValue placeholder="Select payment status" />
									</SelectTrigger>
									<SelectContent>
										{paymentStatusOptions.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									onClick={() => handleStatusUpdate('payment')}
									disabled={
										isUpdating ||
										editablePaymentStatus === order.paymentStatus ||
										!editablePaymentStatus
									}
									size="sm"
								>
									{isUpdating ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Edit className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
						<div>
							<label
								htmlFor="fulfillmentStatus"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Fulfillment Status
							</label>
							<div className="flex items-center space-x-2">
								<Select
									defaultValue={editableFulfillmentStatus || undefined} // Ensure undefined for placeholder
									onValueChange={(value) => setEditableFulfillmentStatus(value)}
									disabled={isUpdating}
								>
									<SelectTrigger id="fulfillmentStatus">
										<SelectValue placeholder="Select fulfillment status" />
									</SelectTrigger>
									<SelectContent>
										{fulfillmentStatusOptions.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									onClick={() => handleStatusUpdate('fulfillment')}
									disabled={
										isUpdating ||
										editableFulfillmentStatus === order.fulfillmentStatus ||
										!editableFulfillmentStatus
									}
									size="sm"
								>
									{isUpdating ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Edit className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col items-start text-sm text-gray-500">
						<p>Order Date: {new Date(order.createdAt).toLocaleString()}</p>
						<p>Last Updated: {new Date(order.updatedAt).toLocaleString()}</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}
