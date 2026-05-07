export type UserRole = 'USER' | 'ADMIN'

export type AuthState = {
  token: string | null
  userEmail: string | null
  role: UserRole | null
}

