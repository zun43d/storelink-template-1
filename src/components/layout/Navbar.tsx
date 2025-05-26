import Link from 'next/link'
import { getStoreId, getStoreDetailsById } from '@/lib/store'
import CartIcon from './CartIcon'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

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
		<nav className="bg-background text-foreground border-b sticky top-0 z-50">
			<div className="container max-w-7xl mx-auto px-4">
				{/* Top Row: Logo, Search, Cart */}
				<div className="flex items-center justify-between h-20">
					<Link
						href="/"
						className="text-2xl font-bold text-primary hover:text-primary/90"
					>
						{storeName}
					</Link>

					<div className="relative flex-1 max-w-xl mx-4">
						<Input
							type="search"
							placeholder="Searching for..."
							className="pl-10 pr-4 py-2 h-10 w-full rounded-lg border focus:ring-primary focus:border-primary"
						/>
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-5 w-5 text-muted-foreground" />
						</div>
					</div>

					<div className="flex items-center space-x-4">
						<CartIcon />
						{/* Future: Auth buttons / User profile */}
					</div>
				</div>

				{/* Bottom Row: Navigation Links */}
				<div className="flex justify-center items-center h-12 space-x-6">
					<Link href="/" className="hover:text-primary transition-colors">
						Home
					</Link>
					<Link
						href="/products"
						className="hover:text-primary transition-colors"
					>
						All Products
					</Link>
					<Link
						href="/products?filter=on-sale" // Example link for "On Sale"
						className="hover:text-primary transition-colors"
					>
						On Sale
					</Link>
					<Link
						href="/contact" // Placeholder for contact page
						className="hover:text-primary transition-colors"
					>
						Contact Us
					</Link>
				</div>
			</div>
		</nav>
	)
}
