'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	ClipboardList,
	LogOut,
	UserCircle,
	Store,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AdminLayoutProps {
	children: React.ReactNode
	title?: string // Optional title for the header
}

const navItems = [
	{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/admin/products', label: 'Products', icon: Package },
	{ href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
	{ href: '/admin/inventory', label: 'Inventory', icon: ClipboardList }, // Placeholder, adjust if needed
]

export default function AdminLayout({ children }: AdminLayoutProps) {
	const pathname = usePathname()
	const { data: session } = useSession()

	const getInitials = (name?: string | null) => {
		if (!name) return 'AD' // Admin Default
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
	}

	return (
		<div className="min-h-screen flex flex-col bg-muted/40">
			{/* Admin Header */}
			<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 shadow-sm">
				<div className="flex items-center gap-4">
					<Link
						href="/admin/dashboard"
						className="flex items-center gap-2 text-lg font-semibold text-primary"
					>
						<Store className="h-6 w-6" />
						<span>Store Admin</span>
					</Link>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-sm text-muted-foreground hidden md:inline">
						{session?.user?.email}
					</span>
					<Avatar className="h-9 w-9 hidden sm:flex">
						{session?.user?.image && (
							<AvatarImage
								src={session.user.image}
								alt={session.user.name ?? 'User'}
							/>
						)}
						<AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
					</Avatar>
					<Button
						variant="outline"
						size="sm"
						onClick={() => signOut({ callbackUrl: '/' })}
					>
						<LogOut className="mr-2 h-4 w-4" />
						Logout
					</Button>
				</div>
			</header>

			<div className="flex flex-1">
				{/* Sidebar */}
				<aside className="hidden w-64 flex-col border-r bg-background p-4 shadow-md md:flex">
					<nav className="flex flex-col gap-1">
						{navItems.map((item) => (
							<Link
								key={item.label}
								href={item.href}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary
                  ${
										pathname === item.href ||
										(pathname.startsWith(item.href) &&
											item.href !== '/admin/dashboard') // More specific active check
											? 'bg-primary/10 text-primary'
											: 'text-muted-foreground'
									}`}
							>
								<item.icon className="h-5 w-5" />
								{item.label}
							</Link>
						))}
					</nav>
					<Separator className="my-4" />
					{/* Add other sections like settings or profile if needed */}
					<div className="mt-auto">
						<Link
							href="/"
							target="_blank"
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
						>
							<UserCircle className="h-5 w-5" />
							View Storefront
						</Link>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 p-6 overflow-auto">
					{/* Optional: Page Title within content area */}
					{/* <h1 className="text-2xl font-semibold mb-6 text-foreground">{title}</h1> */}
					{children}
				</main>
			</div>
		</div>
	)
}
