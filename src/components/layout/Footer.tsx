import Link from 'next/link'
import { Facebook, Instagram, Youtube } from 'lucide-react' // Using lucide-react icons

export default function Footer() {
	const currentYear = new Date().getFullYear()
	// Placeholder data - in a real app, this might come from a CMS or config
	const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store'
	const storeDescription = 'Your one-stop shop for amazing products.'
	const contact = {
		address: '123 Main Street, Anytown, USA',
		email: 'support@example.com',
		phone: '+1 (555) 123-4567',
	}
	const socials = [
		{ name: 'Facebook', url: 'https://facebook.com', icon: Facebook },
		{ name: 'Instagram', url: 'https://instagram.com', icon: Instagram },
		{ name: 'Youtube', url: 'https://youtube.com', icon: Youtube },
	]

	const footerNav = {
		company: [
			{ label: 'About Us', href: '/about' },
			{ label: 'Contact Us', href: '/contact' }, // Assuming /contact will be created
			{ label: 'Careers', href: '/careers' },
		],
		legal: [
			{ label: 'Privacy Policy', href: '/privacy' },
			{ label: 'Terms of Service', href: '/terms' },
			{ label: 'Refund Policy', href: '/refunds' },
		],
		account: [
			{ label: 'My Account', href: '/account' }, // Link to user account/profile page
			{ label: 'Order History', href: '/account/orders' },
			{ label: 'Wishlist', href: '/wishlist' }, // If wishlist functionality exists
		],
	}

	return (
		<footer className="bg-gray-800 text-gray-300 pt-16 pb-8 mt-auto">
			<div className="container mx-auto px-4 md:px-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
					{/* Store Info & Socials */}
					<div className="md:col-span-2 lg:col-span-1">
						<h3 className="text-xl font-semibold text-white mb-4">
							{storeName}
						</h3>
						<p className="text-sm mb-4 leading-relaxed">{storeDescription}</p>
						<div className="flex space-x-4">
							{socials.map((social) => (
								<Link
									key={social.name}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-white transition-colors"
								>
									<social.icon className="h-6 w-6" />
									<span className="sr-only">{social.name}</span>
								</Link>
							))}
						</div>
					</div>

					{/* Navigation Links Columns */}
					<div>
						<h4 className="text-md font-semibold text-white mb-4">Company</h4>
						<ul className="space-y-2">
							{footerNav.company.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm hover:text-white hover:underline transition-colors"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="text-md font-semibold text-white mb-4">Legal</h4>
						<ul className="space-y-2">
							{footerNav.legal.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm hover:text-white hover:underline transition-colors"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="text-md font-semibold text-white mb-4">Account</h4>
						<ul className="space-y-2">
							{footerNav.account.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm hover:text-white hover:underline transition-colors"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Contact Info - can be part of the first column or separate */}
				<div className="border-t border-gray-700 pt-8 text-center md:text-left">
					<div className="mb-4 md:flex md:justify-between md:items-center">
						<div className="text-sm">
							<p className="mb-1">{contact.address}</p>
							<p className="mb-1">
								Email:{' '}
								<a
									href={`mailto:${contact.email}`}
									className="hover:text-white hover:underline"
								>
									{contact.email}
								</a>
							</p>
							<p>
								Phone:{' '}
								<a
									href={`tel:${contact.phone}`}
									className="hover:text-white hover:underline"
								>
									{contact.phone}
								</a>
							</p>
						</div>
						<div className="mt-4 md:mt-0 text-sm">
							&copy; {currentYear} {storeName}. All rights reserved.
						</div>
					</div>
					<div className="text-xs text-gray-500 text-center mt-4">
						<p>Powered by Next.js & Shadcn/UI. Designed by YourTeam.</p>
					</div>
				</div>
			</div>
		</footer>
	)
}
