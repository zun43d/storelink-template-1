'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// import AdminLayout from '@/app/admin/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { AlertTriangle } from 'lucide-react'
import { PackageSearch } from 'lucide-react' // Or any other relevant icon

interface DashboardSummary {
	totalRevenue: number
	totalOrders: number
	pendingFulfillmentOrders: number
	pendingPaymentOrders: number
}

interface LowStockProduct {
	id: string
	name: string
	stockLevel: number
}

export default function AdminDashboard() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [summary, setSummary] = useState<DashboardSummary | null>(null)
	const [loadingSummary, setLoadingSummary] = useState(true)
	const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([])
	const [loadingLowStock, setLoadingLowStock] = useState(true)

	useEffect(() => {
		if (status === 'loading') return
		if (!session || !session.user.isAdmin) {
			router.push('/auth/signin')
		}
	}, [session, status, router])

	useEffect(() => {
		const fetchSummaryAndLowStock = async () => {
			if (session && session.user.isAdmin) {
				setLoadingSummary(true)
				setLoadingLowStock(true)
				try {
					const [summaryRes, lowStockRes] = await Promise.all([
						fetch('/api/admin/dashboard/summary'),
						fetch('/api/admin/dashboard/low-stock'),
					])

					if (summaryRes.ok) {
						const summaryData = await summaryRes.json()
						setSummary(summaryData)
					} else {
						console.error('Failed to fetch dashboard summary')
						setSummary(null)
					}

					if (lowStockRes.ok) {
						const lowStockData = await lowStockRes.json()
						setLowStockItems(lowStockData)
					} else {
						console.error('Failed to fetch low stock items')
						setLowStockItems([])
					}
				} catch (error) {
					console.error('Error fetching dashboard data:', error)
					setSummary(null)
					setLowStockItems([])
				} finally {
					setLoadingSummary(false)
					setLoadingLowStock(false)
				}
			}
		}

		if (session && session.user.isAdmin) {
			fetchSummaryAndLowStock()
		}
	}, [session])

	if (status === 'loading' || loadingSummary || loadingLowStock) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		)
	}

	if (!session || !session.user.isAdmin) {
		return null
	}

	return (
		// <AdminLayout title="Dashboard">
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Dashboard</h1>
				{/* Sign Out button is now in AdminLayout header */}
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card className="shadow-sm hover:shadow-md transition-shadow">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${summary?.totalRevenue.toFixed(2) ?? '0.00'}
						</div>
						<p className="text-xs text-muted-foreground pt-1">
							Total revenue generated
						</p>
					</CardContent>
				</Card>
				<Card className="shadow-sm hover:shadow-md transition-shadow">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary?.totalOrders ?? 0}
						</div>
						<p className="text-xs text-muted-foreground pt-1">
							Total orders received
						</p>
					</CardContent>
				</Card>
				<Card className="shadow-sm hover:shadow-md transition-shadow">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Fulfillment
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary?.pendingFulfillmentOrders ?? 0}
						</div>
						<p className="text-xs text-muted-foreground pt-1">
							Orders awaiting fulfillment
						</p>
					</CardContent>
				</Card>
				<Card className="shadow-sm hover:shadow-md transition-shadow">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Payment
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary?.pendingPaymentOrders ?? 0}
						</div>
						<p className="text-xs text-muted-foreground pt-1">
							Orders awaiting payment
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-1 shadow-sm hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle className="text-xl">Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Link href="/admin/products/new" passHref>
							<Button
								variant="outline"
								className="w-full justify-start text-left"
							>
								<PackageSearch className="mr-2 h-4 w-4" /> Add New Product
							</Button>
						</Link>
						<Link href="/admin/products" passHref>
							<Button
								variant="outline"
								className="w-full justify-start text-left"
							>
								<Package className="mr-2 h-4 w-4" /> Manage Products
							</Button>
						</Link>
						<Link href="/admin/orders" passHref>
							<Button
								variant="outline"
								className="w-full justify-start text-left"
							>
								<ShoppingCart className="mr-2 h-4 w-4" /> Manage Orders
							</Button>
						</Link>
						{/* Add more quick actions as needed */}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle className="text-xl flex items-center">
							<AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
							Low Stock Alerts (Under 10 units)
						</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingLowStock ? (
							<p>Loading low stock items...</p>
						) : lowStockItems.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead className="text-right">Stock</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lowStockItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell>{item.name}</TableCell>
											<TableCell className="text-right">
												{item.stockLevel}
											</TableCell>
											<TableCell className="text-right">
												<Link href={`/admin/products/${item.id}/edit`} passHref>
													<Button
														variant="link"
														size="sm"
														className="h-auto p-0 text-primary hover:underline"
													>
														Manage
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<p>No products are currently low on stock.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
		// </AdminLayout>
	)
}
