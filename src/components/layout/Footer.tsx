import Link from 'next/link'

export default function Footer() {
	return (
		<footer className="bg-gray-800 text-white p-4 mt-8">
			<div className="container mx-auto text-center">
				<p>
					&copy; {new Date().getFullYear()} E-Commerce. All rights reserved.
				</p>
				<div className="mt-2">
					<Link href="/about" className="hover:text-gray-300 mx-2">
						About Us
					</Link>
					<Link href="/contact" className="hover:text-gray-300 mx-2">
						Contact
					</Link>
					<Link href="/privacy" className="hover:text-gray-300 mx-2">
						Privacy Policy
					</Link>
				</div>
			</div>
		</footer>
	)
}
