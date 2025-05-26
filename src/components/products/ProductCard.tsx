'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'

export interface Product {
	id: string
	sku: string
	name: string
	description?: string | null
	price: number
	stockLevel: number
	imageUrls?: string[] | null
	status: string
	categoryId?: string | null
	createdAt: Date // Changed from string to Date for consistency with Prisma
	updatedAt: Date // Changed from string to Date for consistency with Prisma
}

interface ProductCardProps {
	product: Product
}

export function ProductCard({ product }: ProductCardProps) {
	const { addItem } = useCart()

	const handleAddToCart = () => {
		if (product.stockLevel > 0) {
			addItem(product, 1)
			toast.success(`Added ${product.name} to cart!`)
		} else {
			toast.error('This product is out of stock.')
		}
	}

	return (
		<Card className="w-full max-w-sm flex flex-col">
			<CardHeader className="flex-grow">
				<Link href={`/products/${product.id}`}>
					<div className="aspect-square relative bg-muted rounded-md overflow-hidden border">
						{product.imageUrls?.length ? (
							<Image
								src={product.imageUrls[0]}
								alt={product.name}
								fill
								className="object-contain p-2" // Changed to object-contain and added padding
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-muted-foreground">
								No Image
							</div>
						)}
					</div>
				</Link>
				<CardTitle className="pt-4 text-lg">{product.name}</CardTitle>{' '}
				{/* Adjusted font size */}
				{product.description && (
					<CardDescription className="text-sm h-10 overflow-hidden text-ellipsis">
						{product.description}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="flex-grow-0">
				<p className="text-xl font-semibold mb-1">
					${product.price.toFixed(2)}
				</p>
				<p
					className={`text-xs font-medium ${
						product.stockLevel > 0 ? 'text-green-600' : 'text-red-600'
					}`}
				>
					{product.stockLevel > 0
						? `${product.stockLevel} in stock`
						: 'Out of stock'}
				</p>
			</CardContent>
			<CardFooter className="flex justify-between items-center pt-4 mt-auto">
				<Link href={`/products/${product.id}`} passHref>
					<Button variant="outline" size="sm">
						View Details
					</Button>
				</Link>
				<Button
					size="sm"
					disabled={product.stockLevel === 0}
					onClick={handleAddToCart}
				>
					Add to Cart
				</Button>
			</CardFooter>
		</Card>
	)
}
