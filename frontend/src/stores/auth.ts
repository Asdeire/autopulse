import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '../constants/storage'
import type { AuthState } from '../types/auth'
import * as authApi from '../services/auth.api'
import { getApiErrorInfo } from '../services/api-errors'
import { storageGetJson, storageRemove, storageSetJson } from '../utils/storage'

const defaultState: AuthState = {
  token: null,
  userEmail: null,
  role: null,
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ ...defaultState }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    hydrateFromStorage() {
      const stored = storageGetJson<AuthState>(STORAGE_KEYS.auth)
      if (!stored) return
      this.token = stored.token ?? null
      this.userEmail = stored.userEmail ?? null
      this.role = stored.role ?? null
    },
    setAuth(payload: { token: string; userEmail?: string | null; role?: AuthState['role'] }) {
      this.token = payload.token
      this.userEmail = payload.userEmail ?? null
      this.role = payload.role ?? null
      storageSetJson(STORAGE_KEYS.auth, { token: this.token, userEmail: this.userEmail, role: this.role })
    },
    async login(input: { email: string; password: string }) {
      try {
        const res = await authApi.login(input)
        this.setAuth({ token: res.token, userEmail: res.user.email, role: res.user.role })
      } catch (e) {
        throw new Error(getApiErrorInfo(e).message)
      }
    },
    async register(input: { email: string; password: string }) {
      try {
        const res = await authApi.register(input)
        this.setAuth({ token: res.token, userEmail: res.user.email, role: res.user.role })
      } catch (e) {
        const apiError = getApiErrorInfo(e)
        if (apiError.statusCode === 409) {
          throw new Error('Користувач з такою електронною поштою вже існує')
        }
        throw new Error(apiError.message)
      }
    },
    logout() {
      Object.assign(this, defaultState)
      storageRemove(STORAGE_KEYS.auth)
    },
  },
})

