export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function storageGetJson<T>(key: string): T | null {
  return safeJsonParse<T>(localStorage.getItem(key))
}

export function storageSetJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function storageRemove(key: string) {
  localStorage.removeItem(key)
}

