import axios from 'axios'
import { API_BASE_URL } from '../constants/api'
import { STORAGE_KEYS } from '../constants/storage'
import type { AuthState } from '../types/auth'
import { storageGetJson } from '../utils/storage'

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const auth = storageGetJson<AuthState>(STORAGE_KEYS.auth)
  const token = auth?.token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

