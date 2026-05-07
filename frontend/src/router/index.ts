import { createRouter, createWebHistory } from 'vue-router'
import { STORAGE_KEYS } from '../constants/storage'
import type { AuthState } from '../types/auth'
import { storageGetJson } from '../utils/storage'

const HomePage = () => import('../pages/HomePage.vue')
const CatalogPage = () => import('../pages/CatalogPage.vue')
const ProductDetailsPage = () => import('../pages/ProductDetailsPage.vue')
const CartPage = () => import('../pages/CartPage.vue')
const CheckoutPage = () => import('../pages/CheckoutPage.vue')
const LoginPage = () => import('../pages/LoginPage.vue')
const RegisterPage = () => import('../pages/RegisterPage.vue')
const MyOrdersPage = () => import('../pages/MyOrdersPage.vue')
const ProfilePage = () => import('../pages/ProfilePage.vue')
const AdminProductsPage = () => import('../pages/AdminProductsPage.vue')
const AdminProductFormPage = () => import('../pages/AdminProductFormPage.vue')
const NotFoundPage = () => import('../pages/NotFoundPage.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { layout: 'main' } },
    { path: '/catalog', name: 'catalog', component: CatalogPage, meta: { layout: 'main' } },
    {
      path: '/products/:id',
      name: 'product',
      component: ProductDetailsPage,
      meta: { layout: 'main' },
    },
    { path: '/cart', name: 'cart', component: CartPage, meta: { layout: 'main' } },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutPage,
      meta: { layout: 'main', requiresAuth: true },
    },
    { path: '/login', name: 'login', component: LoginPage, meta: { layout: 'auth' } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { layout: 'auth' } },
    {
      path: '/orders',
      name: 'orders',
      component: MyOrdersPage,
      meta: { layout: 'main', requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { layout: 'main', requiresAuth: true },
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: AdminProductsPage,
      meta: { layout: 'main', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/products/new',
      name: 'admin-product-create',
      component: AdminProductFormPage,
      meta: { layout: 'main', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/products/:id/edit',
      name: 'admin-product-edit',
      component: AdminProductFormPage,
      meta: { layout: 'main', requiresAuth: true, requiresAdmin: true },
    },
    { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage, meta: { layout: 'main' } },
  ],
})

router.beforeEach((to) => {
  const needsAuth = Boolean(to.meta.requiresAuth || to.meta.requiresAdmin)
  if (!needsAuth) return true

  const auth = storageGetJson<AuthState>(STORAGE_KEYS.auth)
  const token = auth?.token

  if (!token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.requiresAdmin && auth?.role !== 'ADMIN') {
    return { path: '/' }
  }

  return true
})

