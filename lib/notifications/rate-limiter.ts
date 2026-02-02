/**
 * Rate Limiter para controlar a taxa de requisições
 * Estratégia: Envia 2 requisições em paralelo, espera 1 segundo, repete
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(
    private maxRequestsPerSecond: number = 2,
    private delayBetweenBatches: number = 1000, // 1 segundo entre lotes
  ) {}

  /**
   * Executa uma função respeitando o limite de taxa
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Pega até 2 requisições para processar em paralelo
      const batch: Array<() => Promise<any>> = [];
      for (
        let i = 0;
        i < this.maxRequestsPerSecond && this.queue.length > 0;
        i++
      ) {
        const fn = this.queue.shift();
        if (fn) batch.push(fn);
      }

      // Executa todas as requisições do lote em paralelo
      if (batch.length > 0) {
        await Promise.all(batch.map((fn) => fn()));

        // Aguarda 1 segundo SEMPRE após completar um lote
        // Isso garante que respeita o limite de 2 req/s mesmo com requisições em paralelo
        if (this.queue.length > 0) {
          await this.sleep(this.delayBetweenBatches);
        }
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna o número de requisições na fila
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Limpa a fila de requisições
   */
  clear(): void {
    this.queue = [];
  }
}

// Singleton para uso global
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(maxRequestsPerSecond: number = 2): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(maxRequestsPerSecond);
  }
  return rateLimiterInstance;
}
