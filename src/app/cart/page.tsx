'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart, CartItem } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
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
import { Trash2, Plus, Minus } from 'lucide-react' // Icons

export default function CartPage() {
	const {
		items,
		updateItemQuantity,
		removeItem,
		clearCart,
		getCartTotal,
		getItemCount,
	} = useCart()
	const [itemToRemove, setItemToRemove] = useState<string | null>(null)
	const [showClearCartDialog, setShowClearCartDialog] = useState(false)

	const handleQuantityChange = (item: CartItem, newQuantity: number) => {
		if (newQuantity < 1) {
			setItemToRemove(item.id) // Prompt for removal if quantity is less than 1
			return
		}
		if (newQuantity > item.stockLevel) {
			toast.error(`Only ${item.stockLevel} of ${item.name} in stock.`)
			updateItemQuantity(item.id, item.stockLevel)
			return
		}
		updateItemQuantity(item.id, newQuantity)
		toast.info(`Updated ${item.name} quantity to ${newQuantity}.`)
	}

	const confirmRemoveItem = () => {
		if (itemToRemove) {
			const item = items.find((i) => i.id === itemToRemove)
			removeItem(itemToRemove)
			toast.success(`Removed ${item?.name || 'item'} from cart.`)
			setItemToRemove(null)
		}
	}

	const confirmClearCart = () => {
		clearCart()
		toast.success('Cart cleared.')
		setShowClearCartDialog(false)
	}

	if (getItemCount() === 0) {
		return (
			<div className="container mx-auto p-4 md:p-8 text-center">
				<h1 className="text-3xl font-bold mb-6">Your Shopping Cart is Empty</h1>
				<p className="text-muted-foreground mb-8">
					Looks like you haven&apos;t added anything to your cart yet.
				</p>
				<Link href="/products" passHref>
					<Button size="lg">Continue Shopping</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4 md:p-8">
			<h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[100px] hidden md:table-cell">
									Image
								</TableHead>
								<TableHead>Product</TableHead>
								<TableHead className="text-right">Price</TableHead>
								<TableHead className="text-center w-[150px]">
									Quantity
								</TableHead>
								<TableHead className="text-right">Total</TableHead>
								<TableHead className="text-center w-[50px]">Remove</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="hidden md:table-cell">
										<Link href={`/products/${item.id}`}>
											<div className="w-20 h-20 relative bg-muted rounded overflow-hidden border">
												{item.imageUrls?.length ? (
													<Image
														src={item.imageUrls[0]}
														alt={item.name}
														fill
														className="object-contain p-1"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
														No Image
													</div>
												)}
											</div>
										</Link>
									</TableCell>
									<TableCell>
										<Link
											href={`/products/${item.id}`}
											className="hover:underline"
										>
											<p className="font-medium">{item.name}</p>
										</Link>
										<p className="text-xs text-muted-foreground">
											SKU: {item.sku}
										</p>
									</TableCell>
									<TableCell className="text-right">
										${item.price.toFixed(2)}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-center gap-1">
											<Button
												variant="outline"
												size="icon"
												className="h-8 w-8"
												onClick={() =>
													handleQuantityChange(item, item.quantity - 1)
												}
												disabled={
													item.quantity <= 1 && itemToRemove !== item.id
												} // Disable if quantity is 1, unless confirming removal
											>
												<Minus size={16} />
											</Button>
											<Input
												type="number"
												value={item.quantity}
												onChange={(e) =>
													handleQuantityChange(
														item,
														parseInt(e.target.value, 10) || 1
													)
												}
												onBlur={(e) => {
													const val = parseInt(e.target.value, 10)
													if (isNaN(val) || val < 1)
														handleQuantityChange(item, 1)
												}}
												min="1"
												max={item.stockLevel}
												className="w-14 h-8 text-center px-1"
											/>
											<Button
												variant="outline"
												size="icon"
												className="h-8 w-8"
												onClick={() =>
													handleQuantityChange(item, item.quantity + 1)
												}
												disabled={item.quantity >= item.stockLevel}
											>
												<Plus size={16} />
											</Button>
										</div>
									</TableCell>
									<TableCell className="text-right font-medium">
										${(item.price * item.quantity).toFixed(2)}
									</TableCell>
									<TableCell className="text-center">
										{/* Changed AlertDialogTrigger to a simple Button for remove item */}
										<Button
											variant="ghost"
											size="icon"
											className="text-red-500 hover:text-red-700"
											onClick={() => setItemToRemove(item.id)}
										>
											<Trash2 size={18} />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="mt-6 flex justify-between items-center">
						<Link href="/products" passHref>
							<Button variant="outline">&larr; Continue Shopping</Button>
						</Link>
						{/* Restructured Clear Cart AlertDialog */}
						<AlertDialog
							open={showClearCartDialog}
							onOpenChange={setShowClearCartDialog}
						>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									disabled={getItemCount() === 0}
									// onClick={() => setShowClearCartDialog(true)} // Removed: Trigger handles this
								>
									Clear Cart
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Clear Cart?</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to remove all items from your shopping
										cart?
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={confirmClearCart}
										className="bg-red-500 hover:bg-red-600"
									>
										Clear Cart
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>

				<div className="lg:col-span-1 bg-muted/30 p-6 rounded-lg border">
					<h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
					<div className="space-y-3 mb-6">
						<div className="flex justify-between">
							<span>Subtotal ({getItemCount()} items)</span>
							<span>${getCartTotal().toFixed(2)}</span>
						</div>
						{/* Placeholder for Shipping and Taxes */}
						<div className="flex justify-between text-muted-foreground">
							<span>Shipping</span>
							<span>TBD</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Taxes</span>
							<span>TBD</span>
						</div>
					</div>
					<div className="border-t pt-4">
						<div className="flex justify-between font-bold text-xl">
							<span>Grand Total</span>
							<span>${getCartTotal().toFixed(2)}</span>
						</div>
					</div>
					<Link href="/checkout" passHref>
						<Button
							size="lg"
							className="w-full mt-6"
							disabled={getItemCount() === 0}
						>
							Proceed to Checkout
						</Button>
					</Link>
				</div>
			</div>

			{/* Alert Dialog for Removing Item (this remains controlled by itemToRemove state) */}
			<AlertDialog
				open={!!itemToRemove}
				onOpenChange={(open) => !open && setItemToRemove(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Item?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove &quot;
							{items.find((i) => i.id === itemToRemove)?.name || 'this item'}
							&quot; from your cart?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setItemToRemove(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmRemoveItem}
							className="bg-red-500 hover:bg-red-600"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
