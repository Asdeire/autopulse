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
    { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage, meta: { layout: 'main' } },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true

  const auth = storageGetJson<AuthState>(STORAGE_KEYS.auth)
  const token = auth?.token
  if (token) return true

  return {
    path: '/login',
    query: { redirect: to.fullPath },
  }
})

