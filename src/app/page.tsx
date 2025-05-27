'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product as PrismaProduct } from '@prisma/client'
import {
	ProductCard,
	Product as ProductCardType,
} from '@/components/products/ProductCard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { getClientStoreId } from '@/lib/store' // Import getClientStoreId

type DisplayProduct = PrismaProduct

async function fetchProducts(
	filter: 'featured' | 'newArrivals' | 'bestSellers' | 'all',
	limit: number = 8
) {
	const storeId = getClientStoreId() // Get storeId for API call
	let url = `/api/products?storeId=${storeId}` // Add storeId to API call
	const params = new URLSearchParams() // params will be appended to the url with storeId

	if (filter === 'featured') {
		params.append('featured', 'true')
	} else if (filter === 'newArrivals') {
		params.append('newArrivals', 'true')
	} else if (filter === 'bestSellers') {
		params.append('bestSellers', 'true')
	}
	// 'all' filter doesn't need a specific query param beyond storeId, which is already included

	params.append('limit', String(limit))

	const queryString = params.toString()
	if (queryString) {
		url += `&${queryString}` // Append other params after storeId
	}

	try {
		const response = await fetch(url)
		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ message: `Failed to fetch ${filter} products` }))
			throw new Error(errorData.message || `Failed to fetch ${filter} products`)
		}
		const data: DisplayProduct[] = await response.json()
		return data // Limit is handled by API now, but defensive slice was fine too
	} catch (error) {
		console.error(error)
		return []
	}
}

export default function HomePage() {
	const [featuredProducts, setFeaturedProducts] = useState<DisplayProduct[]>([])
	const [newArrivals, setNewArrivals] = useState<DisplayProduct[]>([])
	const [bestSellers, setBestSellers] = useState<DisplayProduct[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		async function loadHomepageProducts() {
			setIsLoading(true)
			try {
				const [featured, arrivals, sellers] = await Promise.all([
					fetchProducts('featured', 4),
					fetchProducts('newArrivals', 8),
					fetchProducts('bestSellers', 8),
				])
				setFeaturedProducts(featured)
				setNewArrivals(arrivals)
				setBestSellers(sellers)
			} catch (error) {
				console.error('Error loading homepage products:', error)
			} finally {
				setIsLoading(false)
			}
		}
		loadHomepageProducts()
	}, [])

	const mapProductToCardType = (
		productData: PrismaProduct
	): ProductCardType => {
		return {
			...productData,
			sku: productData.sku ?? '',
			imageUrls: productData.imageUrls ?? null,
			status: productData.isActive ? 'Active' : 'Inactive',
			// Ensure price and stockLevel are numbers, though Prisma Client usually handles this.
			// createdAt and updatedAt are Date objects from Prisma Client.
		}
	}

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
				<Loader2 className="h-16 w-16 animate-spin text-primary" />
				<p className="mt-4 text-lg text-muted-foreground">
					Loading awesome products...
				</p>
			</div>
		)
	}

	return (
		<div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
			{/* Featured Products Section */}
			{featuredProducts.length > 0 && (
				<section className="mb-12">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-3xl font-bold tracking-tight">
							Featured Products
						</h2>
						<Link href="/products?filter=featured" passHref>
							<Button variant="outline">View All Featured</Button>
						</Link>
					</div>
					<div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
						{featuredProducts.map((product) => (
							<ProductCard
								key={product.id}
								product={mapProductToCardType(product)}
							/>
						))}
					</div>
				</section>
			)}

			{featuredProducts.length > 0 && newArrivals.length > 0 && (
				<Separator className="my-12" />
			)}

			{/* New Arrivals Section */}
			{newArrivals.length > 0 && (
				<section className="mb-12">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-semibold tracking-tight">
							New Arrivals
						</h2>
						<Link href="/products?filter=newArrivals" passHref>
							<Button variant="outline" size="sm">
								View All New
							</Button>
						</Link>
					</div>
					<div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
						{newArrivals.map((product) => (
							<ProductCard
								key={product.id}
								product={mapProductToCardType(product)}
							/>
						))}
					</div>
				</section>
			)}

			{/* Best Sellers Section - Conditionally render if there are best sellers */}
			{bestSellers.length > 0 && (
				<section className="mb-12">
					{(newArrivals.length > 0 || featuredProducts.length > 0) && (
						<Separator className="my-12" />
					)}
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-semibold tracking-tight">
							Best Sellers
						</h2>
						<Link href="/products?filter=bestSellers" passHref>
							<Button variant="outline" size="sm">
								View All Best Sellers
							</Button>
						</Link>
					</div>
					<div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
						{bestSellers.map((product) => (
							<ProductCard
								key={product.id}
								product={mapProductToCardType(product)}
							/>
						))}
					</div>
				</section>
			)}

			{(featuredProducts.length > 0 ||
				newArrivals.length > 0 ||
				bestSellers.length > 0) && <Separator className="my-12" />}

			{/* All Products Link */}
			<section className="text-center">
				<h2 className="text-2xl font-semibold tracking-tight mb-6">
					Explore All Our Products
				</h2>
				<Link href="/products" passHref>
					{' '}
					{/* This link will show all products for the store */}
					<Button
						size="lg"
						className="bg-primary hover:bg-primary/90 text-primary-foreground"
					>
						Go to All Products
					</Button>
				</Link>
			</section>
		</div>
	)
}
