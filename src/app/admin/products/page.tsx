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
import { Badge } from '@/components/ui/badge' // Assuming you have a Badge component
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react' // Icons
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Image from 'next/image'

interface Product {
	id: string
	sku: string
	name: string
	price: number
	stockLevel: number
	isActive: boolean
	createdAt: string
	imageUrls: string[]
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchProducts = async () => {
		setIsLoading(true)
		setError(null)
		try {
			const response = await fetch('/api/admin/products')
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to fetch products')
			}
			const data = await response.json()
			setProducts(data)
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'Could not fetch products.'
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		// TODO: Add admin check here before fetching, or rely on API protection
		// For now, assuming API protection is sufficient for data fetching
		// but client-side redirect might be good for UX if not admin.
		// const { data: session, status } = useSession();
		// if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
		//   router.push('/auth/signin?callbackUrl=/admin/products');
		//   return;
		// }
		fetchProducts()
	}, [])

	const handleDeleteProduct = async (productId: string) => {
		try {
			const response = await fetch(`/api/admin/products/${productId}`, {
				method: 'DELETE',
			})
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to delete product')
			}
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'Could not delete product.'
			toast.error(errorMessage)
		}
	}

	const toggleProductStatus = async (product: Product) => {
		try {
			const response = await fetch(`/api/admin/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !product.isActive }),
			})
			if (!response.ok) {
				return await response.json()
			}
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'Could not update product status.'
			toast.error(errorMessage)
		}
		fetchProducts()
	}

	if (isLoading) return <p className="text-center py-10">Loading products...</p>
	if (error)
		return <p className="text-center py-10 text-red-500">Error: {error}</p>

	return (
		<div className="container mx-auto py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Product Management</h1>
				<Link href="/admin/products/new" passHref>
					<Button>
						<PlusCircle className="mr-2 h-4 w-4" /> Add New Product
					</Button>
				</Link>
			</div>

			{products.length === 0 ? (
				<p>
					No products found.{' '}
					<Link
						href="/admin/products/new"
						className="text-blue-500 hover:underline"
					>
						Add the first product
					</Link>
					.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>SKU</TableHead>
							<TableHead>Name</TableHead>
							<TableHead className="text-right">Price</TableHead>
							<TableHead className="text-right">Stock</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{products.map((product) => (
							<TableRow key={product.id}>
								<TableCell className="font-mono">{product.sku}</TableCell>
								<TableCell className="font-medium">
									<div className="flex items-center">
										{product.imageUrls && product.imageUrls.length > 0 && (
											<Image
												src={product.imageUrls[0]}
												alt={product.name}
												width={100}
												height={100}
												className="w-10 h-10 object-cover rounded-md mr-3"
												onError={(e) =>
													(e.currentTarget.style.display = 'none')
												} // Hide if image fails to load
											/>
										)}
										{product.name}
									</div>
								</TableCell>
								<TableCell className="text-right">
									${product.price.toFixed(2)}
								</TableCell>
								<TableCell className="text-right">
									{product.stockLevel}
								</TableCell>
								<TableCell className="text-center">
									<Badge variant={product.isActive ? 'default' : 'destructive'}>
										{product.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell className="text-center">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => toggleProductStatus(product)}
										title={product.isActive ? 'Deactivate' : 'Activate'}
									>
										{product.isActive ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
									<Link href={`/admin/products/${product.id}/edit`} passHref>
										<Button variant="ghost" size="icon" title="Edit">
											<Edit className="h-4 w-4" />
										</Button>
									</Link>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" title="Delete">
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently
													delete the product &quot;{product.name}&quot;.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleDeleteProduct(product.id)}
													className="bg-red-500 hover:bg-red-600"
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
