import { apiClient } from '../config/api';
export const shipmentsService = {
    async getAll() {
        const response = await apiClient.get('/shipments');
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/shipments/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/shipments', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/shipments/${id}`, dto);
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/shipments/${id}`);
    },
    async bulkDelete(ids) {
        const response = await apiClient.post('/shipments/bulk/delete', { ids });
        return response.data.data;
    },
    async uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/shipments/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return {
            url: response.data.data.url,
            name: response.data.data.name ?? file.name,
            persisted: false,
        };
    },
    async deleteDocument(url) {
        await apiClient.delete('/shipments/documents', {
            data: { url },
        });
    },
};
