import { defineStore } from 'pinia'
import type { Category, Product, ProductsQuery } from '../types/catalog'
import * as catalogApi from '../services/catalog.api'
import { getApiErrorInfo } from '../services/api-errors'

export type CatalogState = {
  products: Product[]
  categories: Category[]
  filters: ProductsQuery
  loading: boolean
  error: string | null
}

const defaultState: CatalogState = {
  products: [],
  categories: [],
  filters: {},
  loading: false,
  error: null,
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({ ...defaultState }),
  actions: {
    setFilters(partial: ProductsQuery) {
      this.filters = { ...this.filters, ...partial }
    },
    async fetchCategories() {
      this.loading = true
      this.error = null
      try {
        this.categories = await catalogApi.getCategories()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async fetchProducts(query?: ProductsQuery) {
      this.loading = true
      this.error = null
      try {
        this.products = await catalogApi.getProducts(query ?? this.filters)
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async fetchProductById(id: number) {
      this.loading = true
      this.error = null
      try {
        return await catalogApi.getProductById(id)
      } catch (e) {
        this.error = getApiErrorInfo(e).message
        return null
      } finally {
        this.loading = false
      }
    },
    reset() {
      Object.assign(this, defaultState)
    },
  },
})

