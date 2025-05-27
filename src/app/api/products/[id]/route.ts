import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStoreId } from '@/lib/store'

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const storeId = getStoreId()
		const {id: productId} = await params
		const product = await prisma.product.findFirst({
			where: {
				id: productId,
				storeId,
				isActive: true,
			},
		})

		if (!product) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		}

		return NextResponse.json(product)
	} catch (error) {
		console.error('Error fetching product:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch product' },
			{ status: 500 }
		)
	}
}
