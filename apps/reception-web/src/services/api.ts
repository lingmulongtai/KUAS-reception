import i18n from '@/i18n'

export interface ApiClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
}

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiClient {
  private readonly baseUrl: string
  private readonly defaultHeaders: Record<string, string>

  constructor({ baseUrl = DEFAULT_BASE_URL, headers = {} }: ApiClientOptions = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    }
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
  const errorBody = await response.json().catch(() => ({}))
  const message = errorBody?.error ?? i18n.t('messages.api.defaultError')
      throw new Error(message)
    }
    return (await response.json()) as T
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: this.defaultHeaders,
      credentials: 'include',
    })
    return this.parseResponse<T>(response)
  }

  async post<T, B = unknown>(path: string, body: B): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.defaultHeaders,
      credentials: 'include',
      body: JSON.stringify(body),
    })
    return this.parseResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
