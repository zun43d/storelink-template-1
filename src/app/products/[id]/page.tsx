'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Product } from '@/components/products/ProductCard'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import { getClientStoreId } from '@/lib/store' // Import getClientStoreId

async function fetchProduct(
	id: string,
	storeId: string
): Promise<Product | null> {
	const res = await fetch(`/api/products/${id}?storeId=${storeId}`) // Pass storeId to the API
	if (res.status === 404) {
		return null
	}
	if (!res.ok) {
		throw new Error('Failed to fetch product')
	}
	return res.json()
}

export default function ProductDetailPage() {
	const params = useParams()
	const productId = params?.id as string

	const { addItem } = useCart() // Get addItem from useCart
	const [product, setProduct] = useState<Product | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [quantity, setQuantity] = useState(1)

	useEffect(() => {
		if (productId) {
			setLoading(true)
			const storeId = getClientStoreId() // Get storeId
			if (!storeId) {
				setError('Store ID is not configured. Please contact support.')
				setLoading(false)
				return
			}
			fetchProduct(productId, storeId) // Pass storeId to fetchProduct
				.then(setProduct)
				.catch((err) => {
					if (err instanceof Error) {
						setError(err.message)
					} else {
						setError('An unknown error occurred')
					}
				})
				.finally(() => setLoading(false))
		}
	}, [productId])

	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = parseInt(e.target.value, 10)
		if (isNaN(value)) value = 1

		if (product) {
			if (value < 1) {
				value = 1
			} else if (value > product.stockLevel) {
				value = product.stockLevel
			}
		}
		setQuantity(value)
	}

	const incrementQuantity = () => {
		if (product && quantity < product.stockLevel) {
			setQuantity(quantity + 1)
		}
	}

	const decrementQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1)
		}
	}

	const handleAddToCart = () => {
		if (product && product.stockLevel > 0 && quantity > 0) {
			if (quantity > product.stockLevel) {
				toast.error(`Only ${product.stockLevel} items in stock.`)
				setQuantity(product.stockLevel) // Adjust quantity to max available
				return
			}
			addItem(product, quantity)
			toast.success(`${quantity} ${product.name}(s) added to cart!`)
		} else if (product && product.stockLevel === 0) {
			toast.error('This product is out of stock.')
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto p-4 text-center">
				Loading product details...
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

	if (!product) {
		return (
			<div className="container mx-auto p-4 text-center">
				<h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
				<p className="mb-4">
					The product you are looking for does not exist or is no longer
					available.
				</p>
				<Link href="/products" passHref>
					<Button variant="outline">Back to Products</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4 md:p-8">
			<div className="mb-6">
				<Link href="/products" passHref>
					<Button variant="outline">&larr; Back to Products</Button>
				</Link>
			</div>
			<div className="grid md:grid-cols-2 gap-8 lg:gap-12">
				<div className="aspect-square relative bg-muted rounded-lg overflow-hidden border">
					{product.imageUrls?.length ? (
						<Image
							src={product.imageUrls[0]}
							alt={product.name}
							fill
							className="object-contain p-4"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-muted-foreground">
							No Image Available
						</div>
					)}
				</div>

				<div>
					<h1 className="text-3xl lg:text-4xl font-bold mb-3">
						{product.name}
					</h1>
					<p className="text-sm text-muted-foreground mb-3">
						SKU: {product.sku}
					</p>

					<Separator className="my-4" />

					{product.description && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold mb-2">Description</h2>
							<p className="text-muted-foreground whitespace-pre-wrap">
								{product.description}
							</p>
						</div>
					)}

					<Separator className="my-4" />

					<div className="mb-6">
						<p className="text-3xl font-bold text-primary mb-2">
							${product.price.toFixed(2)}
						</p>
						<p
							className={`text-sm font-medium ${
								product.stockLevel > 0 ? 'text-green-600' : 'text-red-600'
							}`}
						>
							{product.stockLevel > 0
								? `${product.stockLevel} in stock`
								: 'Out of stock'}
						</p>
					</div>

					{product.stockLevel > 0 && (
						<div className="mb-6">
							<Label htmlFor="quantity" className="text-base mb-2 block">
								Quantity
							</Label>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={decrementQuantity}
									disabled={quantity <= 1}
								>
									-
								</Button>
								<Input
									id="quantity"
									type="number"
									value={quantity}
									onChange={handleQuantityChange}
									onBlur={() => {
										if (quantity < 1) setQuantity(1)
									}}
									min="1"
									max={product.stockLevel}
									className="w-20 text-center"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={incrementQuantity}
									disabled={quantity >= product.stockLevel}
								>
									+
								</Button>
							</div>
						</div>
					)}

					<Button
						size="lg"
						className="w-full md:w-auto mt-4"
						disabled={product.stockLevel === 0}
						onClick={handleAddToCart} // Updated to call handleAddToCart
					>
						{product.stockLevel > 0 ? 'Add to Cart' : 'Out of Stock'}
					</Button>
				</div>
			</div>
		</div>
	)
}
