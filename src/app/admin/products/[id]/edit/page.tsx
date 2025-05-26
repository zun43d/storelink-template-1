'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image' // Ensure Image is imported
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react' // Ensure useEffect is imported

const productFormSchema = z.object({
	id: z.string(), // Keep id for existing products
	sku: z.string().min(1, 'SKU is required'),
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
	price: z.coerce.number().positive('Price must be a positive number'),
	stockLevel: z.coerce
		.number()
		.int()
		.nonnegative('Stock level must be a non-negative integer')
		.optional(),
	isActive: z.boolean().optional(),
	isFeatured: z.boolean().optional(), // Added isFeatured
	// imageFile is not part of the schema for submission, handled separately
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function AdminEditProductPage() {
	const router = useRouter()
	const params = useParams()
	const productId = params.id as string

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null) // This will be used for preview
	const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: {
			isActive: true,
			isFeatured: false, // Default for isFeatured
		},
	})

	useEffect(() => {
		if (productId) {
			const fetchProduct = async () => {
				setIsLoading(true)
				try {
					const response = await fetch(`/api/admin/products/${productId}`)
					if (!response.ok) {
						throw new Error('Failed to fetch product details')
					}
					const productData = await response.json()
					form.reset({
						...productData,
						price: productData.price,
						stockLevel: productData.stockLevel,
						isActive: productData.isActive,
						isFeatured: productData.isFeatured ?? false,
					})
					if (productData.imageUrls && productData.imageUrls.length > 0) {
						setExistingImageUrls(productData.imageUrls)
						setPreviewUrl(productData.imageUrls[0]) // Use setPreviewUrl here
					}
				} catch (error) {
					console.error(error)
					toast.error(
						error instanceof Error
							? error.message
							: 'Could not load product data.'
					)
					router.push('/admin/products')
				} finally {
					setIsLoading(false)
				}
			}
			fetchProduct()
		}
	}, [productId, form, router])

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const file = event.target.files[0]
			setImageFile(file)
			setPreviewUrl(URL.createObjectURL(file))
		} else {
			setImageFile(null)
			// If clearing the file input, revert to the first existing image or null
			setPreviewUrl(existingImageUrls.length > 0 ? existingImageUrls[0] : null)
		}
	}

	const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
		setIsSubmitting(true)
		let uploadedImageUrl: string | undefined = undefined

		try {
			if (imageFile) {
				const formData = new FormData()
				formData.append('file', imageFile)
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				})
				if (!uploadResponse.ok) {
					const errorData = await uploadResponse.json()
					throw new Error(errorData.message || 'Failed to upload image.')
				}
				const uploadResult = await uploadResponse.json()
				uploadedImageUrl = uploadResult.url
			}

			const finalPayload = {
				...data,
				stockLevel: data.stockLevel ?? 0,
				isActive: data.isActive ?? true,
				isFeatured: data.isFeatured ?? false, // Add isFeatured to payload
				imageUrls: uploadedImageUrl ? [uploadedImageUrl] : existingImageUrls,
			}

			const response = await fetch(`/api/admin/products/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(finalPayload),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to update product.')
			}

			toast.success('Product updated successfully!')
			router.push('/admin/products')
			router.refresh() // Refresh the products list page
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'An unexpected error occurred during update.'
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading && !form.formState.isDirty) {
		// Adjusted loading state condition
		return (
			<div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
				<Loader2 className="h-16 w-16 animate-spin text-primary" />
				<p className="mt-4 text-lg text-muted-foreground">
					Loading product details...
				</p>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Edit Product</h1>
				<Link href="/admin/products" passHref>
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
					</Button>
				</Link>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
						<FormField
							control={form.control}
							name="sku"
							render={({ field }) => (
								<FormItem>
									<FormLabel>SKU</FormLabel>
									<FormControl>
										<Input placeholder="PRODUCT-SKU-001" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., Wireless Bluetooth Headphones"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Detailed description of the product..."
										className="resize-none"
										{...field}
										rows={5}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
						<FormField
							control={form.control}
							name="price"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Price</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											placeholder="0.00"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="stockLevel"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Stock Level</FormLabel>
									<FormControl>
										<Input type="number" step="1" placeholder="0" {...field} />
									</FormControl>
									<FormDescription>
										How many units are currently in stock.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormItem>
						<FormLabel>Product Image</FormLabel>
						<FormControl>
							<Input
								type="file"
								accept="image/*"
								onChange={handleImageChange} // Corrected: Use defined handler
							/>
						</FormControl>
						{previewUrl && ( // Corrected: Use previewUrl state
							<div className="mt-4 relative w-full max-w-xs h-48">
								<Image
									src={previewUrl} // Corrected: Use previewUrl state
									alt="Product image preview"
									layout="fill"
									objectFit="contain"
									className="rounded-md border"
								/>
							</div>
						)}
						<FormDescription>
							Upload a new image to replace the existing one, or leave empty to
							keep the current image.
						</FormDescription>
						<FormMessage />
					</FormItem>

					{/* TODO: Category Select Field */}

					<FormField
						control={form.control}
						name="isActive"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Active</FormLabel>
									<FormDescription>
										Is this product currently available for sale?
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="isFeatured"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
								<FormControl>
									<Checkbox
										// Ensure field.value is boolean. If it can be undefined, provide a fallback.
										checked={!!field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Featured</FormLabel>
									<FormDescription>
										Should this product be displayed on the homepage as a
										featured product?
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push('/admin/products')}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || isLoading}>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save Changes
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
