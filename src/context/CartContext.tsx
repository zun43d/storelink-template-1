'use client'

import React, {
	createContext,
	useContext,
	useEffect,
	useReducer,
	ReactNode,
} from 'react'
import type { Product } from '@/components/products/ProductCard' // Assuming Product type is exported here
import { getClientStoreId } from '@/lib/store' // Import getClientStoreId

export interface CartItem extends Product {
	quantity: number
}

interface CartState {
	items: CartItem[]
}

type CartAction =
	| { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
	| {
			type: 'UPDATE_QUANTITY'
			payload: { productId: string; quantity: number }
	  }
	| { type: 'REMOVE_ITEM'; payload: { productId: string } }
	| { type: 'CLEAR_CART' }
	| { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType extends CartState {
	addItem: (product: Product, quantity: number) => void
	updateItemQuantity: (productId: string, quantity: number) => void
	removeItem: (productId: string) => void
	clearCart: () => void
	getItemCount: () => number
	getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const getLocalStorageKey = () => {
	const storeId = getClientStoreId()
	return `shoppingCart_${storeId || 'default'}` // Fallback to 'default' if storeId is somehow unavailable
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
	switch (action.type) {
		case 'LOAD_CART':
			return { ...state, items: action.payload }
		case 'ADD_ITEM': {
			const { product, quantity } = action.payload
			const existingItemIndex = state.items.findIndex(
				(item) => item.id === product.id
			)
			if (existingItemIndex > -1) {
				const updatedItems = state.items.map((item, index) =>
					index === existingItemIndex
						? {
								...item,
								quantity: Math.min(
									item.quantity + quantity,
									product.stockLevel
								),
						  }
						: item
				)
				return { ...state, items: updatedItems }
			}
			return {
				...state,
				items: [
					...state.items,
					{ ...product, quantity: Math.min(quantity, product.stockLevel) },
				],
			}
		}
		case 'UPDATE_QUANTITY': {
			const { productId, quantity } = action.payload
			return {
				...state,
				items: state.items
					.map((item) =>
						item.id === productId
							? {
									...item,
									quantity: Math.max(0, Math.min(quantity, item.stockLevel)),
							  }
							: item
					)
					.filter((item) => item.quantity > 0), // Remove item if quantity becomes 0 or less
			}
		}
		case 'REMOVE_ITEM': {
			return {
				...state,
				items: state.items.filter(
					(item) => item.id !== action.payload.productId
				),
			}
		}
		case 'CLEAR_CART':
			return { ...state, items: [] }
		default:
			return state
	}
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(cartReducer, { items: [] })

	useEffect(() => {
		try {
			const localStorageKey = getLocalStorageKey()
			const storedCart = localStorage.getItem(localStorageKey)
			if (storedCart) {
				dispatch({ type: 'LOAD_CART', payload: JSON.parse(storedCart) })
			}
		} catch (error) {
			console.error('Failed to load cart from localStorage', error)
			// Optionally clear corrupted cart data
			// const localStorageKey = getLocalStorageKey();
			// localStorage.removeItem(localStorageKey);
		}
	}, []) // Empty dependency array means this runs once on mount

	useEffect(() => {
		try {
			const localStorageKey = getLocalStorageKey()
			localStorage.setItem(localStorageKey, JSON.stringify(state.items))
		} catch (error) {
			console.error('Failed to save cart to localStorage', error)
		}
	}, [state.items])

	const addItem = (product: Product, quantity: number) => {
		dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
	}

	const updateItemQuantity = (productId: string, quantity: number) => {
		dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
	}

	const removeItem = (productId: string) => {
		dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
	}

	const clearCart = () => {
		dispatch({ type: 'CLEAR_CART' })
	}

	const getItemCount = () => {
		return state.items.reduce((count, item) => count + item.quantity, 0)
	}

	const getCartTotal = () => {
		return state.items.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		)
	}

	return (
		<CartContext.Provider
			value={{
				items: state.items,
				addItem,
				updateItemQuantity,
				removeItem,
				clearCart,
				getItemCount,
				getCartTotal,
			}}
		>
			{children}
		</CartContext.Provider>
	)
}

export const useCart = () => {
	const context = useContext(CartContext)
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider')
	}
	return context
}
