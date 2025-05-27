import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { getStoreId } from '@/lib/store' // Import getStoreId
import { OrderPaymentStatus, OrderFulfillmentStatus } from '@prisma/client' // Import enums

// TODO: Implement authentication and authorization for admin routes
// Partially done: Added admin check

const orderUpdateSchema = z.object({
	paymentStatus: z.string().optional(), // Could be more specific with an enum: PENDING, PAID, FAILED, REFUNDED
	fulfillmentStatus: z.string().optional(), // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
	// Potentially add trackingNumber, notes, etc.
})

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	const {id} = await params
	// Ensure user is admin and the session storeId matches the current operating storeId
	const storeId = getStoreId()
	if (!session || !session.user?.isAdmin || session.user?.storeId !== storeId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const order = await prisma.order.findUnique({
			where: {
				id,
				storeId: storeId, // Filter by storeId
			},
			include: {
				orderItems: {
					include: {
						product: {
							// Include basic product info for each order item
							select: { name: true, sku: true, imageUrls: true },
						},
					},
				},
			},
		})

		if (!order) {
			return NextResponse.json({ message: 'Order not found' }, { status: 404 })
		}
		return NextResponse.json(order)
	} catch (error) {
		console.error(
			`Error fetching order ${id} for store ${storeId}:`,
			error
		)
		return NextResponse.json(
			{ message: 'Failed to fetch order' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	const {id} = await params
	const storeId = getStoreId()
	// Ensure user is admin and the session storeId matches the current operating storeId
	if (!session || !session.user?.isAdmin || session.user?.storeId !== storeId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await req.json()
		const validation = orderUpdateSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ errors: validation.error.errors },
				{ status: 400 }
			)
		}

		const { paymentStatus, fulfillmentStatus } = validation.data

		const existingOrder = await prisma.order.findUnique({
			where: {
				id,
				storeId: storeId, // Filter by storeId
			},
		})
		if (!existingOrder) {
			return NextResponse.json({ message: 'Order not found' }, { status: 404 })
		}

		// Add any specific logic before updating, e.g., preventing status regressions
		const dataToUpdate: {
			paymentStatus?: OrderPaymentStatus
			fulfillmentStatus?: OrderFulfillmentStatus
		} = {}

		if (paymentStatus) {
			dataToUpdate.paymentStatus = paymentStatus as OrderPaymentStatus
		}
		if (fulfillmentStatus) {
			dataToUpdate.fulfillmentStatus =
				fulfillmentStatus as OrderFulfillmentStatus
		}

		const updatedOrder = await prisma.order.update({
			where: {
				id,
				storeId: storeId, // Ensure update is store-specific
			},
			data: dataToUpdate,
			include: {
				// Return the updated order with items
				orderItems: {
					include: {
						product: { select: { name: true, sku: true } },
					},
				},
			},
		})

		// TODO: Potentially trigger email notifications on status changes

		return NextResponse.json(updatedOrder)
	} catch (error) {
		console.error(
			`Error updating order ${id} for store ${storeId}:`,
			error
		)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ errors: error.errors }, { status: 400 })
		}
		return NextResponse.json(
			{ message: 'Failed to update order' },
			{ status: 500 }
		)
	}
}

// Note: Deleting orders might be a complex operation due to financial records, etc.
// Often, orders are cancelled or archived rather than hard-deleted.
// For this example, a DELETE endpoint is omitted, but can be added if required.
