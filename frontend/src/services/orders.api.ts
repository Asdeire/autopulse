import { http } from './http'
import type { CreateOrderInput, Order } from '../types/orders'

export async function createOrder(input: CreateOrderInput) {
  const res = await http.post<Order>('/orders', input)
  return res.data
}

export async function getMyOrders() {
  const res = await http.get<Order[]>('/orders/my')
  return res.data
}

