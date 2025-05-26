import Link from 'next/link'
import { getStoreId, getStoreDetailsById } from '@/lib/store'
import CartIcon from './CartIcon'

export default async function Navbar() {
	const storeId = getStoreId()
	let storeName = 'E-Commerce' // Default name

	if (storeId) {
		const storeDetails = await getStoreDetailsById(storeId)
		if (storeDetails && storeDetails.name) {
			storeName = storeDetails.name
		}
	}

	return (
		<nav className="bg-gray-800 text-white p-4 sticky top-0 z-50">
			<div className="container mx-auto flex justify-between items-center">
				<Link href="/" className="text-xl font-bold">
					{storeName}
				</Link>
				<div className="space-x-4 flex items-center">
					<Link href="/" className="hover:text-gray-300">
						Home
					</Link>
					<Link href="/products" className="hover:text-gray-300">
						Products
					</Link>
					<CartIcon />
				</div>
			</div>
		</nav>
	)
}
