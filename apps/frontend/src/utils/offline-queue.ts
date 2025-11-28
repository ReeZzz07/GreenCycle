interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = 'greencycle_offline_queue';
  private readonly MAX_RETRIES = 3;
  private processing = false;

  constructor() {
    this.loadQueue();
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored) as QueuedRequest[];
      }
    } catch (error) {
      console.error('Ошибка загрузки очереди offline запросов:', error);
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Ошибка сохранения очереди offline запросов:', error);
    }
  }

  add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedRequest);
    this.saveQueue();

    // Пытаемся обработать очередь, если есть соединение
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const requestsToProcess = [...this.queue];
      this.queue = [];

      for (const request of requestsToProcess) {
        try {
          await this.processRequest(request);
        } catch (error) {
          // Если запрос не удался, добавляем обратно в очередь
          if (request.retries < this.MAX_RETRIES) {
            request.retries++;
            this.queue.push(request);
          } else {
            console.error(
              `Запрос ${request.id} не удалось выполнить после ${this.MAX_RETRIES} попыток`,
            );
          }
        }
      }

      this.saveQueue();
    } finally {
      this.processing = false;
    }
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    const { API_BASE_URL } = await import('../config/api');
    const token = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...request.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${request.url}`, {
      method: request.method,
      headers,
      body: request.data ? JSON.stringify(request.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  remove(id: string): void {
    this.queue = this.queue.filter((req) => req.id !== id);
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();

// Обрабатываем очередь при восстановлении соединения
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.processQueue();
  });
}

