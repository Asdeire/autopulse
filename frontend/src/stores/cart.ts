import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '../constants/storage'
import { storageGetJson, storageRemove, storageSetJson } from '../utils/storage'
import type { CartItem, CartState } from '../types/cart'

function createDefaultState(): CartState {
  return {
    items: [],
  }
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => createDefaultState(),
  getters: {
    itemsCount: (state) => state.items.reduce((acc, item) => acc + item.quantity, 0),
    totalAmount: (state) => state.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  },
  actions: {
    hydrateFromStorage() {
      const stored = storageGetJson<CartState>(STORAGE_KEYS.cart)
      if (!stored?.items?.length) return
      this.items = stored.items
    },
    persist() {
      storageSetJson(STORAGE_KEYS.cart, { items: this.items })
    },
    addToCart(input: Omit<CartItem, 'quantity'>, quantity = 1) {
      const qty = Math.max(1, Math.floor(quantity))
      const existing = this.items.find((x) => x.productId === input.productId)
      if (existing) {
        existing.quantity += qty
      } else {
        this.items.push({ ...input, quantity: qty })
      }
      this.persist()
    },
    removeFromCart(productId: number) {
      this.items = this.items.filter((x) => x.productId !== productId)
      this.persist()
    },
    changeQty(productId: number, quantity: number) {
      const item = this.items.find((x) => x.productId === productId)
      if (!item) return
      const qty = Math.floor(quantity)
      if (qty <= 0) {
        this.removeFromCart(productId)
        return
      }
      item.quantity = qty
      this.persist()
    },
    clearCart() {
      Object.assign(this, createDefaultState())
      storageRemove(STORAGE_KEYS.cart)
    },
  },
})

