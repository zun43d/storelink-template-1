import type { Config } from 'tailwindcss'

export default {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['var(--font-inter)', 'sans-serif'], // Primary sans-serif font
				mono: ['var(--font-geist-mono)', 'monospace'], // Monospace font
			},
			// We will add more theme customizations here later (colors, etc.)
		},
	},
	plugins: [],
} satisfies Config
