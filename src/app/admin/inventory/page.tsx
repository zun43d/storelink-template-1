'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product } from '@prisma/client'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PlusCircle, Edit3, Search, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const LOW_STOCK_THRESHOLD = 10

export default function InventoryManagementPage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [products, setProducts] = useState<Product[]>([])
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (status === 'loading') return
		if (!session || !session.user.isAdmin) {
			router.push('/auth/signin')
		}
	}, [session, status, router])

	useEffect(() => {
		const fetchProducts = async () => {
			if (session && session.user.isAdmin) {
				setLoading(true)
				try {
					const res = await fetch('/api/admin/products')
					if (res.ok) {
						const data = await res.json()
						setProducts(data)
						setFilteredProducts(data)
					} else {
						toast.error('Failed to fetch products.')
					}
				} catch (error) {
					toast.error('An error occurred while fetching products.')
					console.error(error)
				} finally {
					setLoading(false)
				}
			}
		}
		fetchProducts()
	}, [session])

	useEffect(() => {
		const lowercasedFilter = searchTerm.toLowerCase()
		const filtered = products.filter(
			(product) =>
				product.name.toLowerCase().includes(lowercasedFilter) ||
				(product.sku && product.sku.toLowerCase().includes(lowercasedFilter))
		)
		setFilteredProducts(filtered)
	}, [searchTerm, products])

	const handleStockUpdate = async (
		productId: string,
		newStockLevel: number
	) => {
		if (newStockLevel < 0) {
			toast.error('Stock level cannot be negative.')
			return
		}
		try {
			const res = await fetch(`/api/admin/products/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stockLevel: newStockLevel }),
			})
			if (res.ok) {
				toast.success('Stock level updated successfully!')
				setProducts((prevProducts) =>
					prevProducts.map((p) =>
						p.id === productId ? { ...p, stockLevel: newStockLevel } : p
					)
				)
			} else {
				const errorData = await res.json()
				toast.error(`Failed to update stock: ${errorData.message}`)
			}
		} catch (error) {
			toast.error('An error occurred while updating stock.')
			console.error(error)
		}
	}

	if (status === 'loading' || loading) {
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
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Inventory Management</h1>
				<Link href="/admin/products/new" passHref>
					<Button>
						<PlusCircle className="mr-2 h-4 w-4" /> Add New Product
					</Button>
				</Link>
			</div>

			<div className="mb-4">
				<div className="relative">
					<Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search by product name or SKU..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8 w-full md:w-1/3"
					/>
				</div>
			</div>

			{loading ? (
				<p>Loading inventory...</p>
			) : filteredProducts.length === 0 ? (
				<p>No products found matching your search criteria.</p>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Product Name</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead className="text-center">Current Stock</TableHead>
								<TableHead className="text-center">Adjust Stock</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProducts.map((product) => (
								<TableRow
									key={product.id}
									className={
										product.stockLevel < LOW_STOCK_THRESHOLD
											? 'bg-yellow-100 dark:bg-yellow-900/30'
											: ''
									}
								>
									<TableCell className="font-medium">
										{product.name}
										{product.stockLevel < LOW_STOCK_THRESHOLD && (
											<AlertTriangle className="inline-block ml-2 h-4 w-4 text-yellow-500" />
										)}
									</TableCell>
									<TableCell>{product.sku || 'N/A'}</TableCell>
									<TableCell className="text-center">
										{product.stockLevel}
									</TableCell>
									<TableCell className="text-center">
										<Input
											type="number"
											defaultValue={product.stockLevel}
											onBlur={(e) =>
												handleStockUpdate(
													product.id,
													parseInt(e.target.value, 10)
												)
											}
											className="max-w-xs mx-auto"
											min="0"
										/>
									</TableCell>
									<TableCell className="text-right">
										<Link href={`/admin/products/${product.id}/edit`} passHref>
											<Button variant="outline" size="sm">
												<Edit3 className="mr-2 h-4 w-4" /> Edit
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
