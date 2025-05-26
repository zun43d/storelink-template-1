'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
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
	// discountPrice?: number | null; // Kept commented out as per instruction
	stockLevel: number
	imageUrls?: string[] | null
	status: string // Consider if this should be a more specific type e.g., 'Active' | 'Inactive'
	categoryId?: string | null
	createdAt: Date
	updatedAt: Date
	isFeatured?: boolean // Added to potentially show a "Featured" badge
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
		<Card className="w-full max-w-[297px] p-0 flex flex-col justify-between group border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative bg-background rounded-lg overflow-hidden">
			<CardHeader className="p-0 relative">
				<Link
					href={`/products/${product.id}`}
					className="block h-80 overflow-hidden"
				>
					{/* Removed badge for featured items as per example's simpler design */}
					<div className="w-full h-full bg-muted">
						{product.imageUrls?.length ? (
							<Image
								src={product.imageUrls[0]}
								alt={product.name}
								fill
								className="object-cover w-full h-full transition-transform duration-300"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100 dark:bg-gray-800">
								No Image
							</div>
						)}
					</div>
				</Link>
			</CardHeader>
			<CardContent className="px-4 py-0 flex-grow flex flex-col justify-between">
				<div>
					<Link href={`/products/${product.id}`} className="block">
						<CardTitle className="text-base font-semibold leading-snug line-clamp-2 hover:text-primary hover:underline transition-colors">
							{product.name}
						</CardTitle>
					</Link>
					{/* Description is not present in the example card, so it's kept commented out */}
					{/* {product.description && (
						<CardDescription className="text-xs text-muted-foreground h-8 overflow-hidden text-ellipsis line-clamp-2 mb-2">
							{product.description}
						</CardDescription>
					)} */}
				</div>
				<div className="">
					<p className="text-xl font-bold text-primary mb-1.5">
						৳{product.price.toFixed(2)}
					</p>
					<p
						className={`text-xs font-medium ${
							product.stockLevel > 0
								? 'text-green-600 dark:text-green-500'
								: 'text-red-600 dark:text-red-500'
						}`}
					>
						{product.stockLevel > 0
							? `${product.stockLevel} in stock`
							: 'Out of stock'}
					</p>
				</div>
			</CardContent>
			<CardFooter className="w-full p-4 pt-0 flex justify-between items-center gap-2">
				{/* The example card doesn't have a "View Details" button, it relies on clicking the image/title.
				    Keeping the "Add to Cart" button as it's a common e-commerce feature.
				    If a direct "Add to Cart" from the card is not desired, this button can be removed or changed.
				*/}
				<Button
					variant="outline"
					size="sm"
					className="w-1/2 hover:bg-primary hover:text-primary-foreground transition-colors"
					onClick={() => (window.location.href = `/products/${product.id}`)} // Simple navigation for now
				>
					View Details
				</Button>
				<Button
					size="sm"
					disabled={product.stockLevel === 0}
					onClick={handleAddToCart}
					className="w-1/2 bg-primary text-primary-foreground hover:bg-primary/90"
				>
					Add to Cart
				</Button>
			</CardFooter>
		</Card>
	)
}
