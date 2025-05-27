import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { getStoreId } from '@/lib/store'

const productCreateSchema = z.object({
	sku: z.string().min(1, 'SKU is required'),
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
	price: z.number().positive('Price must be a positive number'),
	stockLevel: z
		.number()
		.int()
		.nonnegative('Stock level must be a non-negative integer')
		.default(0),
	imageUrls: z
		.array(z.string().url('Each image must be a valid URL'))
		.optional()
		.default([]),
	categoryId: z.string().optional(),
	isActive: z.boolean().default(true),
	isFeatured: z.boolean().default(false),
})

export async function GET() {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	try {
		const products = await prisma.product.findMany({
			where: { storeId },
			orderBy: { createdAt: 'desc' },
		})
		return NextResponse.json(products)
	} catch (error) {
		console.error('Error fetching products:', error)
		return NextResponse.json(
			{ message: 'Failed to fetch products' },
			{ status: 500 }
		)
	}
}

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	try {
		const body = await req.json()
		const validation = productCreateSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ errors: validation.error.errors },
				{ status: 400 }
			)
		}

		const {
			sku,
			name,
			description,
			price,
			stockLevel,
			imageUrls,
			categoryId,
			isActive,
			isFeatured,
		} = validation.data

		// Check if SKU already exists for this store
		const existingProduct = await prisma.product.findUnique({
			where: { storeId_sku: { storeId, sku } },
		})
		if (existingProduct) {
			return NextResponse.json(
				{ message: `Product with SKU ${sku} already exists for this store` },
				{ status: 409 }
			)
		}

		// Check if categoryId is valid and belongs to the store if provided
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

		const product = await prisma.product.create({
			data: {
				storeId,
				sku,
				name,
				description,
				price,
				stockLevel,
				imageUrls,
				categoryId: categoryId || null,
				isActive,
				isFeatured,
			},
		})

		return NextResponse.json(product, { status: 201 })
	} catch (error) {
		console.error('Error creating product:', error)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ errors: error.errors }, { status: 400 })
		}
		return NextResponse.json(
			{ message: 'Failed to create product' },
			{ status: 500 }
		)
	}
}
