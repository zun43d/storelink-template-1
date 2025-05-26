import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getStoreId } from '@/lib/store' // Added

// Define the schema for order creation
const createOrderSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.string(), // Changed from productSku to productId
				quantity: z.number().min(1),
				price: z.number(), // Price at the time of order
			})
		)
		.min(1),
	totalAmount: z.number(),
	shippingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		zipCode: z.string(),
		country: z.string(),
	}),
	// Billing address can be optional or same as shipping
	billingAddress: z
		.object({
			street: z.string(),
			city: z.string(),
			state: z.string(),
			zipCode: z.string(),
			country: z.string(),
		})
		.optional(),
	paymentMethod: z.string(), // Will be 'bkash' or 'cod'
	transactionId: z.string().optional(), // Added for bKash
})

export async function POST(req: NextRequest) {
	try {
		const storeId = getStoreId() // Added
		const body = await req.json()
		const validation = createOrderSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ errors: validation.error.errors },
				{ status: 400 }
			)
		}

		const {
			items,
			totalAmount,
			shippingAddress,
			billingAddress,
			paymentMethod,
			transactionId, // This will map to paymentTransactionId in the database
		} = validation.data

		// Basic validation for bKash transaction ID
		if (paymentMethod === 'bkash' && !transactionId) {
			return NextResponse.json(
				{ message: 'Transaction ID is required for bKash payments' },
				{ status: 400 }
			)
		}

		// Use a Prisma transaction to ensure atomicity of order creation and stock updates
		const order = await prisma.$transaction(async (tx) => {
			// 1. Create the order
			const newOrder = await tx.order.create({
				data: {
					storeId,
					orderNumber: `ORD-${Date.now()}-${Math.random()
						.toString(36)
						.substring(2, 7)
						.toUpperCase()}`,
					totalAmount,
					paymentStatus: 'PENDING',
					paymentMethod,
					paymentTransactionId:
						paymentMethod === 'bkash' ? transactionId : null,
					fulfillmentStatus: 'PENDING',
					shippingAddress: shippingAddress, // Prisma expects Json type
					billingAddress: billingAddress || shippingAddress, // Prisma expects Json type
					orderItems: {
						// Corrected: Use orderItems
						create: items.map((item) => ({
							quantity: item.quantity,
							price: item.price, // Use price from item, was unitPrice
							product: {
								connect: { id: item.productId }, // Connect to existing product
							},
						})),
					},
				},
				include: {
					orderItems: true, // Corrected: Use orderItems
				},
			})

			// 2. Update stock levels for each product in the order
			for (const item of items) {
				const product = await tx.product.findUnique({
					where: { id: item.productId, storeId }, // Changed to find by id and storeId
				})

				if (!product) {
					throw new Error(
						`Product with ID ${item.productId} not found in this store.`
					)
				}

				if (product.stockLevel < item.quantity) {
					throw new Error(
						`Insufficient stock for product ${product.name} (ID: ${item.productId}). Available: ${product.stockLevel}, Requested: ${item.quantity}`
					)
				}

				await tx.product.update({
					where: { id: item.productId, storeId }, // Changed to update by id and storeId
					data: {
						stockLevel: {
							decrement: item.quantity,
						},
					},
				})
			}

			return newOrder
		})

		// TODO: Implement email notification to the customer

		return NextResponse.json(order, { status: 201 })
	} catch (error) {
		console.error('Error creating order:', error)
		// Check if the error is a known Prisma error or our custom stock error
		if (
			error instanceof Error &&
			(error.message.includes('Insufficient stock') ||
				error.message.includes('not found'))
		) {
			return NextResponse.json(
				{ message: error.message },
				{ status: 409 } // Conflict status for stock issues
			)
		}
		return NextResponse.json(
			{ message: 'Failed to create order' },
			{ status: 500 }
		)
	}
}
