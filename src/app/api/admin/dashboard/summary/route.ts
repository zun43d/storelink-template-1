import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getStoreId } from '@/lib/store'

export async function GET() {
	const session = await getServerSession(authOptions)
	const storeId = getStoreId()

	if (!session || !session.user?.isAdmin || session.user?.storeId !== storeId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const totalRevenue = await prisma.order.aggregate({
			_sum: {
				totalAmount: true,
			},
			where: {
				paymentStatus: 'PAID',
				storeId: storeId,
			},
		})

		const totalOrders = await prisma.order.count({
			where: {
				storeId: storeId,
			},
		})

		const pendingFulfillmentOrders = await prisma.order.count({
			where: {
				fulfillmentStatus: 'PENDING',
				storeId: storeId,
			},
		})

		const pendingPaymentOrders = await prisma.order.count({
			where: {
				paymentStatus: 'PENDING',
				storeId: storeId,
			},
		})

		return NextResponse.json({
			totalRevenue: totalRevenue._sum.totalAmount || 0,
			totalOrders,
			pendingFulfillmentOrders,
			pendingPaymentOrders,
		})
	} catch (error) {
		console.error(`[ADMIN_DASHBOARD_SUMMARY_GET] for store ${storeId}:`, error)
		return NextResponse.json(
			{ message: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}
