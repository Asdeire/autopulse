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
  isCompatible: boolean | null
}

export type ProductsQuery = {
  categoryId?: number
  brand?: string
  search?: string
  sortBy?: 'price_asc' | 'price_desc'
  vehicleSpecId?: number
  usePrimaryVehicle?: boolean
  onlyCompatible?: boolean
  page?: number
  pageSize?: number
}

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginatedProducts = {
  items: Product[]
  meta: PaginationMeta
}

