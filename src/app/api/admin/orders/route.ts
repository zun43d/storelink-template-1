import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { getStoreId } from '@/lib/store'

export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions)
	const storeId = getStoreId()
	if (!storeId) {
		return NextResponse.json(
			{ message: 'Store ID is not configured' },
			{ status: 500 }
		)
	}

	if (!session || !session.user?.isAdmin || session.user.storeId !== storeId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { searchParams } = new URL(req.url)
		const page = parseInt(searchParams.get('page') || '1', 10)
		const limit = parseInt(searchParams.get('limit') || '10', 10)
		const paymentStatus = searchParams.get('paymentStatus')
		const fulfillmentStatus = searchParams.get('fulfillmentStatus')

		const skip = (page - 1) * limit

		const whereClause: Record<string, unknown> = { storeId }
		if (paymentStatus) whereClause.paymentStatus = paymentStatus
		if (fulfillmentStatus) whereClause.fulfillmentStatus = fulfillmentStatus

		const orders = await prisma.order.findMany({
			where: whereClause,
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
			include: {
				orderItems: {
					include: {
						product: {
							select: { name: true, sku: true },
						},
					},
				},
			},
		})

		const totalOrders = await prisma.order.count({ where: whereClause })

		return NextResponse.json({
			data: orders,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(totalOrders / limit),
				totalItems: totalOrders,
			},
		})
	} catch (error) {
		console.error(`Error fetching orders for store ${storeId}:`, error)
		return NextResponse.json(
			{ message: 'Failed to fetch orders' },
			{ status: 500 }
		)
	}
}
