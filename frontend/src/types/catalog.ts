export type Category = {
  id: number
  name: string
}

export type ProductCategory = {
  id: number
  name: string
}

export type Product = {
  id: number
  title: string
  description: string
  brand: string
  imageUrl: string | null
  price: number
  categoryId: number
  category: ProductCategory
}

export type ProductsQuery = {
  categoryId?: number
  brand?: string
  search?: string
  sortBy?: 'price_asc' | 'price_desc'
}

