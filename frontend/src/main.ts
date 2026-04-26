import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

useAuthStore(pinia).hydrateFromStorage()
useCartStore(pinia).hydrateFromStorage()

app.mount('#app')
