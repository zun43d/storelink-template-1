'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Order, OrderItem, Product } from '@prisma/client' // Assuming OrderItem and Product might be part of a detailed view later
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Extend Order type to potentially include relations if needed, though API might not send them for list view
interface ExtendedOrder extends Order {
	orderItems?: (OrderItem & { product: Product })[] // Example for detailed view, not used directly in list
	// Add other relations if your API sends them, e.g., user for customerEmail if not directly on Order
}

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState<ExtendedOrder[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()
	const { data: session, status } = useSession()

	useEffect(() => {
		if (status === 'loading') return
		if (!session || !session.user.isAdmin) {
			toast.error('Access Denied. You are not authorized to view this page.')
			router.push('/auth/signin') // or redirect to a general access denied page
			return
		}

		const fetchOrders = async () => {
			setIsLoading(true)
			try {
				const response = await fetch('/api/admin/orders')
				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.message || 'Failed to fetch orders.')
				}
				const data = await response.json()
				setOrders(data.data)
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: 'An unexpected error occurred.'
				)
			} finally {
				setIsLoading(false)
			}
		}

		fetchOrders()
	}, [session, status, router])

	if (status === 'loading' || isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-16 w-16 animate-spin" />
				<p className="ml-4 text-lg">Loading orders...</p>
			</div>
		)
	}

	if (!session || !session.user.isAdmin) {
		// This case should ideally be handled by the useEffect redirect,
		// but as a fallback or if redirect hasn't happened yet:
		return (
			<div className="flex justify-center items-center min-h-screen">
				<p className="text-xl text-red-500">Access Denied.</p>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Order Management</h1>
				<Link href="/admin/dashboard" passHref>
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
					</Button>
				</Link>
			</div>

			{orders.length === 0 && !isLoading ? (
				<div className="text-center py-10">
					<p className="text-xl text-gray-500">No orders found.</p>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order ID</TableHead>
							<TableHead>Customer Email</TableHead>
							<TableHead>Total</TableHead>
							<TableHead>Payment Status</TableHead>
							<TableHead>Fulfillment Status</TableHead>
							<TableHead>Order Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.length > 0 &&
							orders.map((order) => (
								<TableRow key={order.id}>
									<TableCell className="font-medium">
										{order.orderNumber}
									</TableCell>
									<TableCell>{order.customerEmail}</TableCell>
									<TableCell>
										{new Intl.NumberFormat('en-US', {
											style: 'currency',
											currency: 'USD',
										}).format(order.totalAmount)}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												order.paymentStatus === 'PAID'
													? 'default'
													: order.paymentStatus === 'PENDING'
													? 'secondary'
													: 'destructive'
											}
											className={`${
												order.paymentStatus === 'PAID'
													? 'bg-green-500'
													: order.paymentStatus === 'PENDING'
													? 'bg-yellow-500'
													: 'bg-red-500'
											} text-white`}
										>
											{order.paymentStatus}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												order.fulfillmentStatus === 'DELIVERED' ||
												order.fulfillmentStatus === 'SHIPPED'
													? 'default'
													: 'secondary'
											}
										>
											{order.fulfillmentStatus}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(order.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<Link href={`/admin/orders/${order.id}`} passHref>
											<Button variant="outline" size="sm">
												<Eye className="mr-2 h-4 w-4" /> View Details
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
