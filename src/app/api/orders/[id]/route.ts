import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStoreId } from '@/lib/store'

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const storeId = getStoreId()
		const { id: orderId } = await params

		if (!orderId) {
			return NextResponse.json(
				{ message: 'Order ID is required' },
				{ status: 400 }
			)
		}

		const order = await prisma.order.findFirst({
			where: { id: orderId, storeId }, // Ensure order belongs to the current store
			include: {
				orderItems: {
					include: {
						product: {
							select: {
								id: true,
								name: true,
								imageUrls: true,
							},
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
		console.error('Error fetching order:', error)
		return NextResponse.json(
			{ message: 'Failed to fetch order' },
			{ status: 500 }
		)
	}
}
