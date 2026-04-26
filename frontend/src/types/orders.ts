export type OrderItem = {
  productId: number
  quantity: number
  unitPrice: number
  product: {
    title: string
    brand: string
  }
}

export type Order = {
  id: number
  status: string
  totalPrice: number
  createdAt: string
  items: OrderItem[]
}

export type CreateOrderInput = {
  items: Array<{ productId: number; quantity: number }>
}

