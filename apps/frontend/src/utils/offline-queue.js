class OfflineQueue {
    constructor() {
        Object.defineProperty(this, "queue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "STORAGE_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'greencycle_offline_queue'
        });
        Object.defineProperty(this, "MAX_RETRIES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "processing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.loadQueue();
    }
    loadQueue() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Ошибка загрузки очереди offline запросов:', error);
        }
    }
    saveQueue() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        }
        catch (error) {
            console.error('Ошибка сохранения очереди offline запросов:', error);
        }
    }
    add(request) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const queuedRequest = {
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
    async processQueue() {
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
                }
                catch (error) {
                    // Если запрос не удался, добавляем обратно в очередь
                    if (request.retries < this.MAX_RETRIES) {
                        request.retries++;
                        this.queue.push(request);
                    }
                    else {
                        console.error(`Запрос ${request.id} не удалось выполнить после ${this.MAX_RETRIES} попыток`);
                    }
                }
            }
            this.saveQueue();
        }
        finally {
            this.processing = false;
        }
    }
    async processRequest(request) {
        const { API_BASE_URL } = await import('../config/api');
        const token = localStorage.getItem('accessToken');
        const headers = {
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
    clear() {
        this.queue = [];
        this.saveQueue();
    }
    getQueue() {
        return [...this.queue];
    }
    remove(id) {
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
