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
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const productFormSchema = z.object({
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
})

// Removed imageUrl from ProductFormValues as it's handled by imageFile state
type ProductFormValues = Omit<z.infer<typeof productFormSchema>, 'imageUrl'>

const defaultValues: ProductFormValues = {
	sku: '',
	name: '',
	description: '',
	price: 0,
	stockLevel: 0,
	isActive: true,
	isFeatured: false, // Added default for isFeatured
}

export default function AdminNewProductPage() {
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [imageFile, setImageFile] = useState<File | null>(null) // State for the image file
	const [previewUrl, setPreviewUrl] = useState<string | null>(null) // State for image preview URL

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: defaultValues, // Use the defined defaultValues object
	})

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

				// More robust check for the imageUrl
				if (
					uploadResult &&
					typeof uploadResult.imageUrl === 'string' &&
					uploadResult.imageUrl.trim() !== ''
				) {
					uploadedImageUrl = uploadResult.imageUrl
				} else {
					console.error(
						'Image upload response did not contain a valid imageUrl:',
						uploadResult
					)
					throw new Error(
						'Image uploaded but failed to retrieve a valid image URL. Product creation aborted.'
					)
				}
			}

			const finalPayload = {
				...data,
				stockLevel: data.stockLevel ?? 0,
				isActive: data.isActive ?? true,
				isFeatured: data.isFeatured ?? false, // Added isFeatured to payload
				imageUrls: uploadedImageUrl ? [uploadedImageUrl] : [],
			}

			const response = await fetch('/api/admin/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(finalPayload),
			})

			if (!response.ok) {
				const errorData = await response.json()
				let errorMessage = 'Failed to create product. Please try again.'
				if (
					errorData.errors &&
					Array.isArray(errorData.errors) &&
					errorData.errors.length > 0
				) {
					errorMessage = errorData.errors
						.map((err: { message: string }) => err.message)
						.join('; ')
				} else if (errorData.message) {
					errorMessage = errorData.message
				}
				throw new Error(errorMessage)
			}

			toast.success('Product created successfully!')
			router.push('/admin/products')
			router.refresh()
		} catch (error) {
			// Changed from error: any to error
			if (error instanceof Error) {
				toast.error(error.message)
			} else {
				toast.error('An unexpected error occurred.')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const file = event.target.files[0]
			setImageFile(file)
			setPreviewUrl(URL.createObjectURL(file))
		} else {
			setImageFile(null)
			setPreviewUrl(null)
		}
	}

	return (
		<div className="container mx-auto py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Add New Product</h1>
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
									<FormLabel>SKU (Stock Keeping Unit)</FormLabel>
									<FormControl>
										<Input placeholder="PRODUCT-SKU-001" {...field} />
									</FormControl>
									<FormDescription>
										A unique identifier for this product.
									</FormDescription>
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
								onChange={handleImageChange}
							/>
						</FormControl>
						{previewUrl && (
							<div className="mt-4 relative w-full max-w-xs h-48">
								<Image
									src={previewUrl}
									alt="Product image preview"
									layout="fill"
									objectFit="contain"
									className="rounded-md border"
								/>
							</div>
						)}
						<FormDescription>Upload an image for the product.</FormDescription>
						<FormMessage />
					</FormItem>

					{/* TODO: Category Select Field */}
					{/* <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          /> */}

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
										checked={field.value}
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
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Add Product
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
