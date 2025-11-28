import { apiClient } from '../config/api';
export const clientsService = {
    async getAll(search) {
        const params = search ? { search } : {};
        const response = await apiClient.get('/clients', { params });
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/clients', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/clients/${id}`, dto);
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/clients/${id}`);
    },
    async bulkDelete(ids) {
        const response = await apiClient.post('/clients/bulk/delete', { ids });
        return response.data.data;
    },
    async importFromExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/clients/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },
};
