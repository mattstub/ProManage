import type { ProManageClient } from '../client'

export interface HealthResponse {
  status: 'ok'
  timestamp: string
}

export class HealthResource {
  constructor(private readonly client: ProManageClient) {}

  /** Ping the API. Useful for checking connectivity before login. */
  async check(): Promise<HealthResponse> {
    return this.client.request<HealthResponse>('/health', {
      skipAuthRetry: true,
    })
  }
}
