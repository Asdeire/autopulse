export type CartItem = {
  productId: number
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

export type CartState = {
  items: CartItem[]
}

