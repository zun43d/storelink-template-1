import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { getStoreId } from '@/lib/store'

const productUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	description: z.string().optional(),
	price: z.number().positive('Price must be a positive number').optional(),
	stockLevel: z
		.number()
		.int()
		.nonnegative('Stock level must be a non-negative integer')
		.optional(),
	imageUrls: z
		.array(z.string().url('Each image must be a valid URL'))
		.optional(),
	categoryId: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
	isFeatured: z.boolean().optional(),
})

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const {id} = await params

	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	try {
		const product = await prisma.product.findUnique({
			where: { id, storeId },
			include: { category: true },
		})

		if (!product) {
			return NextResponse.json(
				{ message: 'Product not found for this store' },
				{ status: 404 }
			)
		}
		return NextResponse.json(product)
	} catch (error) {
		console.error(
			`Error fetching product ${id} for store ${storeId}:`,
			error
		)
		return NextResponse.json(
			{ message: 'Failed to fetch product' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const {id} = await params

	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	try {
		const body = await req.json()
		const validation = productUpdateSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ errors: validation.error.errors },
				{ status: 400 }
			)
		}

		const {
			name,
			description,
			price,
			stockLevel,
			imageUrls,
			categoryId,
			isActive,
			isFeatured,
		} = validation.data

		const existingProduct = await prisma.product.findUnique({
			where: { id, storeId },
		})
		if (!existingProduct) {
			return NextResponse.json(
				{ message: 'Product not found for this store' },
				{ status: 404 }
			)
		}

		if (categoryId) {
			const category = await prisma.category.findUnique({
				where: { id: categoryId, storeId },
			})
			if (!category) {
				return NextResponse.json(
					{
						message: `Category with ID ${categoryId} not found for this store`,
					},
					{ status: 400 }
				)
			}
		}

		const updatedProduct = await prisma.product.update({
			where: { id, storeId },
			data: {
				name,
				description,
				price,
				stockLevel,
				imageUrls,
				categoryId: categoryId,
				isActive,
				isFeatured,
			},
		})

		return NextResponse.json(updatedProduct)
	} catch (error) {
		console.error(
			`Error updating product ${id} for store ${storeId}:`,
			error
		)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ errors: error.errors }, { status: 400 })
		}
		return NextResponse.json(
			{ message: 'Failed to update product' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const {id} = await params

	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	try {
		const existingProduct = await prisma.product.findUnique({
			where: { id: id, storeId },
		})
		if (!existingProduct) {
			return NextResponse.json(
				{ message: 'Product not found for this store' },
				{ status: 404 }
			)
		}

		const orderItemsCount = await prisma.orderItem.count({
			where: { productId: id },
		})

		if (orderItemsCount > 0) {
			return NextResponse.json(
				{
					message:
						'Cannot delete product with existing orders. Consider deactivating it instead.',
				},
				{ status: 409 }
			)
		}

		await prisma.product.delete({
			where: { id: id, storeId },
		})

		return NextResponse.json(
			{ message: 'Product deleted successfully' },
			{ status: 200 }
		)
	} catch (error) {
		console.error(
			`Error deleting product ${id} for store ${storeId}:`,
			error
		)
		return NextResponse.json(
			{ message: 'Failed to delete product' },
			{ status: 500 }
		)
	}
}
