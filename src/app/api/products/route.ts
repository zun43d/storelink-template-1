import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStoreId } from '@/lib/store'

export async function GET(request: NextRequest) {
	const storeId = getStoreId()
	const { searchParams } = new URL(request.url)
	const featured = searchParams.get('featured')
	const newArrivals = searchParams.get('newArrivals')
	const bestSellers = searchParams.get('bestSellers') // Placeholder for best-seller logic

	try {
		let products
		if (featured === 'true') {
			products = await prisma.product.findMany({
				where: { storeId, isActive: true, isFeatured: true },
				orderBy: { createdAt: 'desc' }, // Or any other logic for featured
			})
		} else if (newArrivals === 'true') {
			products = await prisma.product.findMany({
				where: { storeId, isActive: true },
				orderBy: { createdAt: 'desc' },
				take: 10, // Example: Get latest 10 products
			})
		} else if (bestSellers === 'true') {
			// Best-seller logic: Fetches products ordered by the number of times they appear in orderItems.
			// This is store-aware due to the top-level 'storeId' filter in the 'where' clause.
			products = await prisma.product.findMany({
				where: { storeId, isActive: true },
				orderBy: { orderItems: { _count: 'desc' } }, // Order by number of times product appears in orderItems
				take: 10, // Example: Get top 10 best sellers
			})
		} else {
			products = await prisma.product.findMany({
				where: { storeId, isActive: true },
				orderBy: { createdAt: 'desc' },
			})
		}
		return NextResponse.json(products)
	} catch (error) {
		console.error('Error fetching products:', error)
		return NextResponse.json(
			{ message: 'Error fetching products', error: (error as Error).message },
			{ status: 500 }
		)
	}
}
