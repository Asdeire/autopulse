import axios from 'axios'

export type ApiErrorInfo = {
  message: string
  statusCode?: number
}

export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status

    const data = error.response?.data as unknown
    if (typeof data === 'object' && data !== null) {
      const maybeMessage = (data as { message?: unknown }).message
      if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
        return { message: maybeMessage, statusCode }
      }
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return { message: error.message, statusCode }
    }

    return { message: 'Request failed', statusCode }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return { message: error.message }
  }

  return { message: 'Something went wrong' }
}

