/**
 * Rate Limiter para controlar a taxa de requisições
 * Garante que não ultrapassemos o limite de requisições por segundo
 */
export class RateLimiter {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private lastRequestTime = 0
  private requestsInCurrentSecond = 0
  private currentSecondStart = 0

  constructor(
    private maxRequestsPerSecond: number = 2,
    private minDelayBetweenRequests: number = 500 // 500ms = 2 req/s
  ) {}

  /**
   * Executa uma função respeitando o limite de taxa
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const currentSecond = Math.floor(now / 1000)

      // Reset contador se mudou de segundo
      if (currentSecond !== this.currentSecondStart) {
        this.currentSecondStart = currentSecond
        this.requestsInCurrentSecond = 0
      }

      // Se já atingimos o limite neste segundo, espera até o próximo
      if (this.requestsInCurrentSecond >= this.maxRequestsPerSecond) {
        const nextSecond = (this.currentSecondStart + 1) * 1000
        const waitTime = nextSecond - now
        await this.sleep(waitTime)
        continue
      }

      // Garante delay mínimo entre requisições
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        await this.sleep(this.minDelayBetweenRequests - timeSinceLastRequest)
      }

      // Executa a próxima requisição
      const fn = this.queue.shift()
      if (fn) {
        this.lastRequestTime = Date.now()
        this.requestsInCurrentSecond++
        await fn()
      }
    }

    this.processing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Retorna o número de requisições na fila
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Limpa a fila de requisições
   */
  clear(): void {
    this.queue = []
  }
}

// Singleton para uso global
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(maxRequestsPerSecond: number = 2): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(maxRequestsPerSecond)
  }
  return rateLimiterInstance
}
