'use client'

import { useEffect, useState } from 'react'
import { ProductCard, type Product } from '@/components/products/ProductCard'
import { getClientStoreId } from '@/lib/store' // Import getClientStoreId
import { useSearchParams } from 'next/navigation' // To read URL query params

// Updated to accept a filter string
async function fetchProducts(filter?: string | null): Promise<Product[]> {
	const storeId = getClientStoreId() // Get storeId for API call
	let apiUrl = `/api/products?storeId=${storeId}` // Add storeId to API call

	if (filter) {
		apiUrl += `&${filter}=true` // Append filter if present (e.g., featured=true)
	}

	const res = await fetch(apiUrl)
	if (!res.ok) {
		const errorData = await res
			.json()
			.catch(() => ({ message: 'Failed to fetch products' }))
		throw new Error(errorData.message || 'Failed to fetch products')
	}
	return res.json()
}

export default function ProductListPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const searchParams = useSearchParams() // Hook to get search params

	useEffect(() => {
		// Read filter from URL (e.g., ?filter=featured)
		const filterQuery = searchParams.get('filter')

		async function loadProducts() {
			setLoading(true)
			setError(null)
			try {
				const data = await fetchProducts(filterQuery) // Pass filter to fetchProducts
				setProducts(data)
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message)
				} else {
					setError('An unknown error occurred')
				}
			} finally {
				setLoading(false)
			}
		}
		loadProducts()
	}, [searchParams]) // Re-run effect if searchParams change

	if (loading) {
		return (
			<div className="container mx-auto p-4 text-center">
				Loading products...
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto p-4 text-center text-red-500">
				Error: {error}
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-3xl font-bold mb-8 text-center">
				{searchParams.get('filter')
					? `${searchParams
							.get('filter')
							?.charAt(0)
							.toUpperCase()}${searchParams.get('filter')?.slice(1)} Products`
					: 'Our Products'}
			</h1>
			{products.length === 0 ? (
				<p className="text-center text-muted-foreground">No products found.</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			)}
		</div>
	)
}
