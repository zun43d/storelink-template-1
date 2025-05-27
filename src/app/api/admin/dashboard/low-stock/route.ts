import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getStoreId } from '@/lib/store'

const LOW_STOCK_THRESHOLD = 10 // Define a threshold for low stock

export async function GET() {
	const session = await getServerSession(authOptions)
	const storeId = getStoreId()

	// Ensure user is admin and the session storeId matches the current operating storeId
	if (!session || !session.user?.isAdmin || session.user?.storeId !== storeId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const lowStockProducts = await prisma.product.findMany({
			where: {
				storeId: storeId, // Filter by storeId
				stockLevel: {
					lt: LOW_STOCK_THRESHOLD, // Products with stock level less than threshold
				},
				isActive: true, // Only consider active products
			},
			select: {
				id: true,
				name: true,
				sku: true,
				stockLevel: true,
				imageUrls: true, // Send first image for display
			},
			orderBy: {
				stockLevel: 'asc', // Show lowest stock first
			},
		})

		return NextResponse.json(
			lowStockProducts.map((p) => ({ ...p, imageUrl: p.imageUrls[0] }))
		)
	} catch (error) {
		console.error(
			`[ADMIN_DASHBOARD_LOW_STOCK_GET] for store ${storeId}:`,
			error
		)
		return NextResponse.json(
			{ message: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}
