import { defineStore } from 'pinia'
import type { CreateOrderInput, Order } from '../types/orders'
import * as ordersApi from '../services/orders.api'
import { getApiErrorInfo } from '../services/api-errors'

export type OrdersState = {
  myOrders: Order[]
  loading: boolean
  error: string | null
}

const defaultState: OrdersState = {
  myOrders: [],
  loading: false,
  error: null,
}

export const useOrdersStore = defineStore('orders', {
  state: (): OrdersState => ({ ...defaultState }),
  actions: {
    async createOrder(input: CreateOrderInput) {
      this.loading = true
      this.error = null
      try {
        return await ordersApi.createOrder(input)
      } catch (e) {
        this.error = getApiErrorInfo(e).message
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },
    async fetchMyOrders() {
      this.loading = true
      this.error = null
      try {
        this.myOrders = await ordersApi.getMyOrders()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    reset() {
      Object.assign(this, defaultState)
    },
  },
})

