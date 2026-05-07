import { http } from './http'
import type { UserRole } from '../types/auth'

export type AuthResponse = {
  token: string
  user: {
    id: number
    email: string
    role: UserRole
  }
}

export async function register(input: { email: string; password: string }) {
  const res = await http.post<AuthResponse>('/auth/register', input)
  return res.data
}

export async function login(input: { email: string; password: string }) {
  const res = await http.post<AuthResponse>('/auth/login', input)
  return res.data
}

