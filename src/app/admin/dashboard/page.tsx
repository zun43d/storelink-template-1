'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
		<div className="container mx-auto p-4">
			<div className="flex items-center justify-between mb-5">
				<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
				<Button onClick={() => signOut()}>Sign Out</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${summary?.totalRevenue.toFixed(2) ?? '0.00'}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary?.totalOrders ?? 0}
						</div>
					</CardContent>
				</Card>
				<Card>
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
					</CardContent>
				</Card>
				<Card>
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
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Manage Store</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Link href="/admin/products" passHref>
							<Button variant="outline" className="w-full">
								Manage Products
							</Button>
						</Link>
						<Link href="/admin/orders" passHref>
							<Button variant="outline" className="w-full">
								Manage Orders
							</Button>
						</Link>
						<Link href="/admin/inventory" passHref>
							<Button variant="outline" className="w-full">
								<PackageSearch className="mr-2 h-4 w-4" /> Manage Inventory
							</Button>
						</Link>
						{/* Future: Link to Categories Management */}
						{/* <Link href="/admin/categories" passHref>
              <Button variant="outline" className="w-full">Manage Categories</Button>
            </Link> */}
						{/* Future: Link to Coupons Management */}
						{/* <Link href="/admin/coupons" passHref>
              <Button variant="outline" className="w-full">Manage Coupons</Button>
            </Link> */}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
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
													<Button variant="outline" size="sm">
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
	)
}
