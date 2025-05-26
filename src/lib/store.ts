import { prisma } from '@/lib/prisma'
import type { Store } from '@prisma/client'

export const getStoreId = (): string => {
	const storeId = process.env.NEXT_PUBLIC_STORE_ID // Changed to NEXT_PUBLIC_STORE_ID
	if (!storeId) {
		// During build time, this might be undefined, so we can return a default or throw.
		// For client-side, it should always be available.
		// If running server-side (e.g. API routes), it should also be available.
		console.warn(
			'NEXT_PUBLIC_STORE_ID environment variable is not set. Falling back to a default or erroring.'
		)
		// Depending on the strategy, you might throw an error or return a default store ID
		// For now, let\'s throw an error to make it explicit during development.
		throw new Error('NEXT_PUBLIC_STORE_ID environment variable is not set.')
	}
	return storeId
}

// Function to get storeId on the client side
export const getClientStoreId = (): string => {
	const storeId = process.env.NEXT_PUBLIC_STORE_ID
	if (!storeId) {
		console.error('Client-side: NEXT_PUBLIC_STORE_ID is not available.')
		// Fallback or error handling for client-side where env var might not be directly accessible
		// This scenario should ideally be avoided by ensuring NEXT_PUBLIC_STORE_ID is correctly exposed.
		// For critical failures, you might redirect to an error page or show a message.
		return 'default-store-id' // Or throw new Error("Client Store ID not found");
	}
	return storeId
}

export async function getStoreDetailsById(
	storeId: string
): Promise<Store | null> {
	if (!storeId) {
		console.warn('getStoreDetailsById called without a storeId.')
		return null
	}
	try {
		const storeDetails = await prisma.store.findUnique({
			where: { id: storeId },
		})
		return storeDetails
	} catch (error) {
		console.error(`Error fetching store details for ID ${storeId}:`, error)
		return null
	}
}
