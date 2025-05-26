'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function CartIcon() {
	const { getItemCount } = useCart()
	const itemCount = getItemCount()

	return (
		<Link href="/cart" className="flex items-center hover:text-gray-300">
			<ShoppingCart size={20} />
			<span className="ml-1">Cart</span>
			{itemCount > 0 && (
				<span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
					{itemCount}
				</span>
			)}
		</Link>
	)
}
