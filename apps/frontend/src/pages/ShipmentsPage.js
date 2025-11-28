import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, Badge, ActionIcon, Tooltip, Modal as MantineModal, Select, TextInput, NumberInput, Alert, FileInput, Loader, Image, Checkbox, Divider, } from '@mantine/core';
import { IconPlus, IconEye, IconX, IconFileDownload, IconEdit, IconTrash, IconFileText, } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { shipmentsService } from '../services/shipments.service';
import { suppliersService } from '../services/suppliers.service';
import { usersService } from '../services/users.service';
import { formatCurrency, formatDate } from '../utils/format';
import { downloadPdf } from '../utils/pdf';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
import { useAuthContext } from '../contexts/AuthContext';
export function ShipmentsPage() {
    const { user } = useAuthContext();
    const isAdmin = user?.role.name === 'admin' || user?.role.name === 'super_admin';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const apiOrigin = apiBaseUrl.replace(/\/api(\/v\d+)?$/, '') ||
        apiBaseUrl ||
        `${window.location.protocol}//${window.location.host}`;
    const [opened, setOpened] = useState(false);
    const [editingShipment, setEditingShipment] = useState(null);
    const [supplierModalOpened, setSupplierModalOpened] = useState(false);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
    const [initialBatchesSnapshot, setInitialBatchesSnapshot] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
    const { data: shipments, isLoading } = useQuery({
        queryKey: ['shipments'],
        queryFn: () => shipmentsService.getAll(),
    });
    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => suppliersService.getAll(),
    });
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersService.getAll(),
    });
    const superAdmins = users?.filter((u) => u.role.name === 'super_admin') || [];
    const [viewMode, setViewMode] = useLocalStorage({
        key: 'shipments-view-mode',
        defaultValue: 'table',
    });
    const queryClient = useQueryClient();
    const tableRef = useTableCardLabels(viewMode, [shipments]);
    const form = useForm({
        initialValues: {
            supplierId: 0,
            arrivalDate: new Date().toISOString().split('T')[0],
            documents: [],
            batches: [],
            investments: [],
        },
        validate: {
            supplierId: (value) => (value > 0 ? null : 'Выберите поставщика'),
            arrivalDate: (value) => (value ? null : 'Укажите дату прибытия'),
            batches: (value) => (value.length > 0 ? null : 'Добавьте хотя бы одну партию'),
        },
    });
    const supplierForm = useForm({
        initialValues: {
            name: '',
            phone: '',
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : 'Укажите название поставщика'),
        },
    });
    const createSupplierMutation = useMutation({
        mutationFn: (dto) => suppliersService.create(dto),
        onSuccess: (newSupplier) => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставщик создан',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setSupplierModalOpened(false);
            supplierForm.reset();
            // Автоматически выбираем только что созданного поставщика
            form.setFieldValue('supplierId', newSupplier.id);
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать поставщика',
                color: 'red',
            });
        },
    });
    const createMutation = useMutation({
        mutationFn: (dto) => shipmentsService.create(dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставка создана',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void closeShipmentModal(false);
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать поставку',
                color: 'red',
            });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }) => shipmentsService.update(id, dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставка обновлена',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void closeShipmentModal(false);
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось обновить поставку',
                color: 'red',
            });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => shipmentsService.delete(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставка удалена',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить поставку',
                color: 'red',
            });
        },
    });
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => shipmentsService.bulkDelete(ids),
        onSuccess: (result) => {
            if (result.failedCount === 0) {
                notifications.show({
                    title: 'Успешно',
                    message: `Удалено поставок: ${result.successCount}`,
                    color: 'green',
                });
            }
            else {
                notifications.show({
                    title: 'Частично успешно',
                    message: `Удалено: ${result.successCount}, ошибок: ${result.failedCount}`,
                    color: 'yellow',
                });
                // Показываем детали ошибок
                result.failed.forEach(({ id, error }) => {
                    notifications.show({
                        title: `Ошибка удаления поставки #${id}`,
                        message: error,
                        color: 'red',
                    });
                });
            }
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedIds(new Set());
            setBulkDeleteModalOpened(false);
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить поставки',
                color: 'red',
            });
        },
    });
    const addBatch = () => {
        form.insertListItem('batches', {
            plantType: '',
            sizeCmMin: 0,
            sizeCmMax: 0,
            potType: '',
            quantityInitial: 0,
            purchasePricePerUnit: 0,
        });
    };
    const removeBatch = (index) => {
        form.removeListItem('batches', index);
    };
    const resolveDocumentUrl = (url) => {
        if (!url) {
            return '#';
        }
        if (/^https?:\/\//i.test(url)) {
            return url;
        }
        const base = apiOrigin || `${window.location.protocol}//${window.location.host}`;
        const normalizedBase = base.replace(/\/$/, '');
        const normalizedPath = url.startsWith('/') ? url : `/${url}`;
        const fullUrl = `${normalizedBase}${normalizedPath}`;
        return encodeURI(fullUrl);
    };
    const getFileName = (attachment) => {
        if (attachment.name) {
            return attachment.name;
        }
        try {
            const cleaned = attachment.url.split('?')[0];
            return decodeURIComponent(cleaned.substring(cleaned.lastIndexOf('/') + 1));
        }
        catch {
            return attachment.url;
        }
    };
    const isImageDocument = (attachment) => {
        const url = attachment.url.split('?')[0];
        return /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(url);
    };
    const handleDocumentsUpload = async (files) => {
        const fileArray = files ? (Array.isArray(files) ? files : [files]) : [];
        if (fileArray.length === 0) {
            return;
        }
        setDocumentUploadLoading(true);
        try {
            const uploaded = [];
            for (const file of fileArray) {
                const attachment = await shipmentsService.uploadDocument(file);
                uploaded.push(attachment);
            }
            form.setFieldValue('documents', [...(form.values.documents || []), ...uploaded]);
            notifications.show({
                title: 'Файлы загружены',
                message: 'Документы добавлены к поставке',
                color: 'green',
            });
        }
        catch (error) {
            notifications.show({
                title: 'Ошибка загрузки',
                message: error?.message || 'Не удалось загрузить документы',
                color: 'red',
            });
        }
        finally {
            setDocumentUploadLoading(false);
        }
    };
    const removeDocument = async (index) => {
        const documents = form.values.documents || [];
        const target = documents[index];
        if (!target) {
            return;
        }
        if (!target.persisted) {
            try {
                await shipmentsService.deleteDocument(target.url);
            }
            catch {
                // ignore cleanup errors
            }
        }
        const updated = [...documents];
        updated.splice(index, 1);
        form.setFieldValue('documents', updated);
    };
    const cleanupTemporaryDocuments = async (docs) => {
        const tempDocs = docs.filter((doc) => !doc.persisted);
        await Promise.all(tempDocs.map((doc) => shipmentsService.deleteDocument(doc.url).catch(() => undefined)));
    };
    const closeShipmentModal = async (cleanup = true) => {
        const documents = form.values.documents || [];
        if (cleanup && documents.length > 0) {
            await cleanupTemporaryDocuments(documents);
        }
        setOpened(false);
        setEditingShipment(null);
        setInitialBatchesSnapshot(null);
        form.reset();
    };
    const handleSubmit = (values) => {
        const batches = values.batches.map((batch) => ({
            plantType: batch.plantType,
            sizeCmMin: batch.sizeCmMin,
            sizeCmMax: batch.sizeCmMax,
            potType: batch.potType,
            quantityInitial: batch.quantityInitial,
            purchasePricePerUnit: Number(batch.purchasePricePerUnit),
        }));
        const documentsPayload = values.documents?.map((doc) => ({
            url: doc.url,
            name: doc.name,
        }));
        let batchesPayload = undefined;
        if (editingShipment) {
            // При редактировании проверяем, изменились ли партии
            if (initialBatchesSnapshot) {
                const currentSnapshot = JSON.stringify(values.batches.map((batch) => ({
                    plantType: batch.plantType,
                    sizeCmMin: batch.sizeCmMin,
                    sizeCmMax: batch.sizeCmMax,
                    potType: batch.potType,
                    quantity: batch.quantityInitial,
                    pricePerUnit: Number(batch.purchasePricePerUnit), // Приводим к числу для корректного сравнения
                })));
                // Если партии изменились, отправляем их
                if (currentSnapshot !== initialBatchesSnapshot) {
                    console.log('Партии изменились, отправляем их');
                    console.log('Исходный снимок:', initialBatchesSnapshot);
                    console.log('Текущий снимок:', currentSnapshot);
                    batchesPayload = batches;
                }
                else {
                    console.log('Партии не изменились, не отправляем их');
                }
                // Если партии не изменились, batchesPayload остается undefined
            }
            else {
                console.log('Нет снимка партий, не отправляем их');
            }
            // Если нет снимка, значит партии не должны обновляться
            // batchesPayload остается undefined
            // Формируем DTO только с теми полями, которые нужно обновить
            const dto = {};
            // Добавляем поля только если они изменились или указаны
            if (values.supplierId !== editingShipment.supplierId) {
                dto.supplierId = values.supplierId;
            }
            if (values.arrivalDate !== new Date(editingShipment.arrivalDate).toISOString().split('T')[0]) {
                dto.arrivalDate = values.arrivalDate;
            }
            if (documentsPayload) {
                dto.documents = documentsPayload;
            }
            // Включаем batches только если они изменились
            if (batchesPayload !== undefined && batchesPayload.length > 0) {
                dto.batches = batchesPayload;
            }
            // Включаем investments только если они есть
            if (values.investments && values.investments.length > 0) {
                dto.investments = values.investments;
            }
            // Логируем для отладки
            console.log('Отправка DTO для обновления поставки:', {
                ...dto,
                batches: dto.batches ? `[${dto.batches.length} партий]` : 'не указано',
                investments: dto.investments ? `[${dto.investments.length} вложений]` : 'не указано',
            });
            updateMutation.mutate({ id: editingShipment.id, dto });
        }
        else {
            const dto = {
                supplierId: values.supplierId,
                arrivalDate: values.arrivalDate,
                documents: documentsPayload,
                batches,
                investments: values.investments && values.investments.length > 0 ? values.investments : undefined,
            };
            createMutation.mutate(dto);
        }
    };
    const handleEdit = (shipment) => {
        setEditingShipment(shipment);
        form.setValues({
            supplierId: shipment.supplierId,
            arrivalDate: new Date(shipment.arrivalDate).toISOString().split('T')[0],
            documents: shipment.documents?.map((doc) => ({
                ...doc,
                persisted: true,
            })) || [],
            batches: shipment.batches.map((batch) => ({
                plantType: batch.plantType,
                sizeCmMin: batch.sizeCmMin,
                sizeCmMax: batch.sizeCmMax,
                potType: batch.potType,
                quantityInitial: batch.quantityInitial,
                purchasePricePerUnit: parseFloat(batch.purchasePricePerUnit),
            })),
            investments: shipment.investments?.map((inv) => ({
                userId: inv.userId,
                amount: parseFloat(inv.amount),
            })) || [],
        });
        const snapshot = JSON.stringify(shipment.batches.map((batch) => ({
            plantType: batch.plantType,
            sizeCmMin: batch.sizeCmMin,
            sizeCmMax: batch.sizeCmMax,
            potType: batch.potType,
            quantity: batch.quantityInitial,
            pricePerUnit: Number(batch.purchasePricePerUnit),
        })));
        setInitialBatchesSnapshot(snapshot);
        setOpened(true);
    };
    const handleDelete = (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту поставку? Это действие нельзя отменить. Убедитесь, что нет связанных продаж.')) {
            deleteMutation.mutate(id);
        }
    };
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    const supplierOptions = suppliers?.map((supplier) => ({
        value: supplier.id.toString(),
        label: supplier.name,
    })) || [];
    const totalCost = form.values.batches.reduce((sum, batch) => {
        return sum + batch.quantityInitial * Number(batch.purchasePricePerUnit);
    }, 0);
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u0417\u0430\u043A\u0443\u043F\u043A\u0438" }), _jsx(Text, { c: "dimmed", children: "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0441\u0442\u0430\u0432\u043E\u043A \u0438 \u043F\u0430\u0440\u0442\u0438\u0439" })] }), _jsxs(Group, { children: [isAdmin && selectedIds.size > 0 && (_jsxs(Button, { color: "red", variant: "light", onClick: () => setBulkDeleteModalOpened(true), children: ["\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 (", selectedIds.size, ")"] })), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0443" })] })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [isAdmin && (_jsx(Table.Th, { style: { width: 40 }, children: _jsx(Checkbox, { checked: selectedIds.size > 0 && selectedIds.size === shipments?.length, indeterminate: selectedIds.size > 0 && selectedIds.size < (shipments?.length || 0), onChange: (e) => {
                                                    if (e.currentTarget.checked) {
                                                        setSelectedIds(new Set(shipments?.map((s) => s.id) || []));
                                                    }
                                                    else {
                                                        setSelectedIds(new Set());
                                                    }
                                                } }) })), _jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u043F\u0440\u0438\u0431\u044B\u0442\u0438\u044F" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u0430\u0440\u0442\u0438\u0439" }), _jsx(Table.Th, { children: "\u041E\u0431\u0449\u0430\u044F \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: shipments?.map((shipment) => (_jsxs(Table.Tr, { children: [isAdmin && (_jsx(Table.Td, { children: _jsx(Checkbox, { checked: selectedIds.has(shipment.id), onChange: (e) => {
                                                    const newSelected = new Set(selectedIds);
                                                    if (e.currentTarget.checked) {
                                                        newSelected.add(shipment.id);
                                                    }
                                                    else {
                                                        newSelected.delete(shipment.id);
                                                    }
                                                    setSelectedIds(newSelected);
                                                } }) })), _jsxs(Table.Td, { children: ["#", shipment.id] }), _jsx(Table.Td, { children: shipment.supplier.name }), _jsx(Table.Td, { children: formatDate(shipment.arrivalDate) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: "blue", variant: "light", children: [shipment.batches.length, " \u0448\u0442"] }) }), _jsx(Table.Td, { children: formatCurrency(shipment.totalCost) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                setSelectedShipment(shipment);
                                                                setViewModalOpened(true);
                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043D\u0430\u043A\u043B\u0430\u0434\u043D\u0443\u044E", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: async () => {
                                                                try {
                                                                    await downloadPdf(`/shipments/${shipment.id}/document`, `shipment-${shipment.id}.pdf`);
                                                                    notifications.show({
                                                                        title: 'Успешно',
                                                                        message: 'Накладная скачана',
                                                                        color: 'green',
                                                                    });
                                                                }
                                                                catch (error) {
                                                                    notifications.show({
                                                                        title: 'Ошибка',
                                                                        message: 'Не удалось скачать накладную',
                                                                        color: 'red',
                                                                    });
                                                                }
                                                            }, children: _jsx(IconFileDownload, { size: 16 }) }) }), isAdmin && (_jsxs(_Fragment, { children: [_jsx(Tooltip, { label: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "yellow", onClick: () => handleEdit(shipment), children: _jsx(IconEdit, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => handleDelete(shipment.id), loading: deleteMutation.isPending, children: _jsx(IconTrash, { size: 16 }) }) })] }))] }) })] }, shipment.id))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        void closeShipmentModal(true);
                    }, title: editingShipment ? 'Редактировать поставку' : 'Создать поставку', centered: true, size: "xl", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsxs(Group, { align: "flex-end", gap: "xs", children: [_jsx(Select, { label: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A", required: true, data: supplierOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430", value: form.values.supplierId.toString(), onChange: (value) => form.setFieldValue('supplierId', value ? parseInt(value) : 0), error: form.errors.supplierId, style: { flex: 1 } }), _jsx(Button, { variant: "light", size: "xs", onClick: () => setSupplierModalOpened(true), style: { marginBottom: '4px' }, children: _jsx(IconPlus, { size: 16 }) })] }), _jsx(TextInput, { label: "\u0414\u0430\u0442\u0430 \u043F\u0440\u0438\u0431\u044B\u0442\u0438\u044F", type: "date", required: true, ...form.getInputProps('arrivalDate') }), _jsxs(Stack, { gap: "xs", children: [_jsx(FileInput, { label: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B", placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043B\u044B", accept: ".pdf,.doc,.docx,image/*", multiple: true, clearable: true, onChange: (value) => {
                                                void handleDocumentsUpload(value);
                                            }, disabled: documentUploadLoading, rightSection: documentUploadLoading ? _jsx(Loader, { size: "xs", color: "greenCycle" }) : undefined }), _jsx(Text, { size: "xs", c: "dimmed", children: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0444\u0430\u0439\u043B\u044B PDF, DOC, DOCX \u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F (\u0444\u043E\u0442\u043E/\u0441\u043A\u0430\u043D\u044B). \u041C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0444\u0430\u0439\u043B\u043E\u0432 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E. \u041F\u043E\u0441\u043B\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0432 \u0441\u043F\u0438\u0441\u043A\u0435 \u043D\u0438\u0436\u0435." }), (form.values.documents || []).length > 0 && (_jsx(Group, { gap: "sm", children: (form.values.documents || []).map((doc, index) => (_jsxs(Paper, { withBorder: true, p: "xs", radius: "md", style: { width: 140, position: 'relative' }, children: [_jsxs("div", { style: { position: 'relative', height: 100 }, children: [isImageDocument(doc) ? (_jsx(Image, { src: resolveDocumentUrl(doc.url), alt: getFileName(doc), height: 100, radius: "sm", fit: "cover" })) : (_jsx(Group, { justify: "center", align: "center", h: 100, children: _jsx(IconFileText, { size: 32, color: "var(--mantine-color-gray-6)" }) })), _jsx(ActionIcon, { variant: "light", color: "red", size: "sm", style: { position: 'absolute', top: 4, right: 4 }, onClick: () => {
                                                                    void removeDocument(index);
                                                                }, "aria-label": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442", children: _jsx(IconTrash, { size: 14 }) })] }), _jsx(Text, { size: "xs", mt: "xs", lineClamp: 2, children: getFileName(doc) })] }, `${doc.url}-${index}`))) }))] }), _jsxs(Group, { justify: "space-between", mt: "md", children: [_jsx(Text, { fw: 500, children: "\u041F\u0430\u0440\u0442\u0438\u0438" }), _jsx(Button, { size: "xs", onClick: addBatch, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0430\u0440\u0442\u0438\u044E" })] }), form.values.batches.map((batch, index) => (_jsx(Paper, { withBorder: true, p: "md", children: _jsxs(Stack, { gap: "sm", children: [_jsxs(Group, { children: [_jsx(TextInput, { label: "\u0422\u0438\u043F \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F", required: true, ...form.getInputProps(`batches.${index}.plantType`), style: { flex: 1 } }), _jsx(TextInput, { label: "\u0422\u0438\u043F \u0433\u043E\u0440\u0448\u043A\u0430", required: true, ...form.getInputProps(`batches.${index}.potType`), style: { flex: 1 } })] }), _jsxs(Group, { children: [_jsx(NumberInput, { label: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043C\u0438\u043D\u0438\u043C\u0443\u043C (\u0441\u043C)", required: true, min: 0, ...form.getInputProps(`batches.${index}.sizeCmMin`), style: { flex: 1 } }), _jsx(NumberInput, { label: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C (\u0441\u043C)", required: true, min: 0, ...form.getInputProps(`batches.${index}.sizeCmMax`), style: { flex: 1 } })] }), _jsxs(Group, { children: [_jsx(NumberInput, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, min: 1, ...form.getInputProps(`batches.${index}.quantityInitial`), style: { flex: 1 } }), _jsx(NumberInput, { label: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443", required: true, min: 0, decimalScale: 2, ...form.getInputProps(`batches.${index}.purchasePricePerUnit`), style: { flex: 1 } }), _jsx(ActionIcon, { color: "red", variant: "subtle", onClick: () => removeBatch(index), mt: "xl", children: _jsx(IconX, { size: 16 }) })] })] }) }, index))), _jsx(Paper, { withBorder: true, p: "md", mt: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fw: 500, children: "\u0418\u0442\u043E\u0433\u043E:" }), _jsx(Text, { fw: 700, size: "lg", children: formatCurrency(totalCost) })] }) }), superAdmins.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Divider, { label: "\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u0430\u0440\u0442\u043D\u0435\u0440\u043E\u0432", labelPosition: "center", mt: "md" }), _jsxs(Group, { justify: "space-between", mt: "md", children: [_jsx(Text, { fw: 500, size: "sm", c: "dimmed", children: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0441\u0443\u043C\u043C\u0443 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439 \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043F\u0430\u0440\u0442\u043D\u0435\u0440\u0430" }), _jsx(Button, { size: "xs", onClick: () => {
                                                        form.insertListItem('investments', {
                                                            userId: 0,
                                                            amount: 0,
                                                        });
                                                    }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0435" })] }), form.values.investments.map((investment, index) => {
                                            const percentage = totalCost > 0
                                                ? ((investment.amount / totalCost) * 100).toFixed(2)
                                                : '0.00';
                                            const superAdminOptions = superAdmins.map((admin) => ({
                                                value: admin.id.toString(),
                                                label: admin.fullName,
                                            }));
                                            return (_jsx(Paper, { withBorder: true, p: "md", children: _jsx(Stack, { gap: "sm", children: _jsxs(Group, { children: [_jsx(Select, { label: "\u041F\u0430\u0440\u0442\u043D\u0435\u0440", required: true, data: superAdminOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u0440\u0442\u043D\u0435\u0440\u0430", value: investment.userId.toString(), onChange: (value) => form.setFieldValue(`investments.${index}.userId`, value ? parseInt(value) : 0), style: { flex: 1 } }), _jsx(NumberInput, { label: "\u0421\u0443\u043C\u043C\u0430 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F", required: true, min: 0, decimalScale: 2, value: investment.amount, onChange: (value) => {
                                                                    form.setFieldValue(`investments.${index}.amount`, typeof value === 'number' ? value : 0);
                                                                }, style: { flex: 1 } }), _jsxs("div", { style: { flex: 1, paddingTop: '24px' }, children: [_jsx(Text, { size: "sm", c: "dimmed", mb: "xs", children: "\u0414\u043E\u043B\u044F \u043E\u0442 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438" }), _jsxs(Text, { fw: 700, size: "lg", c: "greenCycle", children: [percentage, "%"] })] }), _jsx(ActionIcon, { color: "red", variant: "subtle", onClick: () => form.removeListItem('investments', index), mt: "xl", children: _jsx(IconX, { size: 16 }) })] }) }) }, index));
                                        }), form.values.investments.length > 0 && (_jsxs(Paper, { withBorder: true, p: "md", mt: "md", children: [_jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fw: 500, children: "\u0421\u0443\u043C\u043C\u0430 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439:" }), _jsx(Text, { fw: 700, size: "lg", c: form.values.investments.reduce((sum, inv) => sum + inv.amount, 0) > totalCost
                                                                ? 'red'
                                                                : 'greenCycle', children: formatCurrency(form.values.investments.reduce((sum, inv) => sum + inv.amount, 0)) })] }), form.values.investments.reduce((sum, inv) => sum + inv.amount, 0) >
                                                    totalCost && (_jsx(Text, { size: "xs", c: "red", mt: "xs", children: "\u0421\u0443\u043C\u043C\u0430 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C \u043E\u0431\u0449\u0443\u044E \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0438" }))] }))] })), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                void closeShipmentModal(true);
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending || updateMutation.isPending, children: editingShipment ? 'Сохранить изменения' : 'Создать поставку' })] })] }) }) }), _jsx(MantineModal, { opened: supplierModalOpened, onClose: () => {
                        setSupplierModalOpened(false);
                        supplierForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430", centered: true, children: _jsx("form", { onSubmit: supplierForm.onSubmit((values) => {
                            createSupplierMutation.mutate(values);
                        }), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430", required: true, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", ...supplierForm.getInputProps('name') }), _jsx(TextInput, { label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", placeholder: "+7 (999) 123-45-67", ...supplierForm.getInputProps('phone') }), _jsx(Alert, { variant: "light", color: "blue", title: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", styles: {
                                        root: {
                                            backgroundColor: 'var(--mantine-color-blue-0)',
                                        },
                                    }, children: _jsxs(Text, { size: "sm", children: ["\u041E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430 (\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0435 \u043B\u0438\u0446\u043E, \u0430\u0434\u0440\u0435\u0441, \u0434\u0430\u043D\u043D\u044B\u0435 \u044E\u0440. \u043B\u0438\u0446\u0430, \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B) \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432 \u0440\u0430\u0437\u0434\u0435\u043B\u0435", ' ', _jsx(Text, { component: "span", fw: 600, children: "\u00AB\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0438\u00BB" }), "."] }) }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setSupplierModalOpened(false);
                                                supplierForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createSupplierMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setSelectedShipment(null);
                    }, title: `Поставка #${selectedShipment?.id}`, centered: true, size: "xl", children: selectedShipment && (_jsxs(Stack, { gap: "md", children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A:" }), _jsx(Text, { children: selectedShipment.supplier.name })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0414\u0430\u0442\u0430 \u043F\u0440\u0438\u0431\u044B\u0442\u0438\u044F:" }), _jsx(Text, { children: formatDate(selectedShipment.arrivalDate) })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041E\u0431\u0449\u0430\u044F \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C:" }), _jsx(Text, { children: formatCurrency(selectedShipment.totalCost) })] }), selectedShipment.documents?.length ? (_jsxs(Stack, { gap: "xs", children: [_jsx(Text, { fw: 600, children: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B:" }), _jsx(Group, { gap: "sm", children: selectedShipment.documents.map((doc, index) => (_jsxs(Paper, { withBorder: true, p: "xs", radius: "md", style: { width: 140 }, children: [_jsx("div", { style: { height: 100 }, children: isImageDocument(doc) ? (_jsx(Image, { src: resolveDocumentUrl(doc.url), alt: getFileName(doc), height: 100, radius: "sm", fit: "cover" })) : (_jsx(Group, { justify: "center", align: "center", h: 100, children: _jsx(IconFileText, { size: 32, color: "var(--mantine-color-gray-6)" }) })) }), _jsx(Text, { size: "xs", mt: "xs", lineClamp: 2, component: "a", href: resolveDocumentUrl(doc.url), target: "_blank", c: "blue", children: getFileName(doc) })] }, `${doc.url}-${index}`))) })] })) : null, _jsxs("div", { children: [_jsxs(Text, { fw: 600, mb: "xs", children: ["\u041F\u0430\u0440\u0442\u0438\u0438 (", selectedShipment.batches.length, "):"] }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0422\u0438\u043F \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0420\u0430\u0437\u043C\u0435\u0440 (\u0441\u043C)" }), _jsx(Table.Th, { children: "\u0413\u043E\u0440\u0448\u043E\u043A" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" })] }) }), _jsx(Table.Tbody, { children: selectedShipment.batches.map((batch) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: batch.plantType }), _jsxs(Table.Td, { children: [batch.sizeCmMin, "\u2013", batch.sizeCmMax] }), _jsx(Table.Td, { children: batch.potType }), _jsx(Table.Td, { children: batch.quantityInitial }), _jsx(Table.Td, { children: formatCurrency(batch.purchasePricePerUnit) }), _jsx(Table.Td, { children: formatCurrency((Number(batch.purchasePricePerUnit) * batch.quantityInitial).toString()) })] }, batch.id))) })] })] }), selectedShipment.investments && selectedShipment.investments.length > 0 && (_jsxs("div", { children: [_jsx(Divider, { my: "md" }), _jsxs(Text, { fw: 600, mb: "sm", children: ["\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u0430\u0440\u0442\u043D\u0435\u0440\u043E\u0432 (", selectedShipment.investments.length, "):"] }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0412\u043A\u043B\u0430\u0434\u0447\u0438\u043A" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u043E\u043B\u044F (%)" })] }) }), _jsx(Table.Tbody, { children: selectedShipment.investments.map((investment) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: investment.user.fullName }), _jsx(Table.Td, { children: formatCurrency(investment.amount) }), _jsxs(Table.Td, { children: [Number(investment.percentage).toFixed(2), "%"] })] }, investment.id))) })] })] }))] })) }), isAdmin && (_jsx(MantineModal, { opened: bulkDeleteModalOpened, onClose: () => setBulkDeleteModalOpened(false), title: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F", centered: true, children: _jsxs(Stack, { children: [_jsxs(Text, { children: ["\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C ", selectedIds.size, " \u043F\u043E\u0441\u0442\u0430\u0432\u043A", selectedIds.size > 1 && selectedIds.size < 5
                                        ? 'и'
                                        : selectedIds.size >= 5
                                            ? 'ок'
                                            : 'у', "?"] }), _jsx(Text, { size: "sm", c: "dimmed", children: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C. \u041F\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u0441 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u0434\u0430\u0436\u0430\u043C\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B." }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => setBulkDeleteModalOpened(false), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { color: "red", loading: bulkDeleteMutation.isPending, onClick: () => {
                                            bulkDeleteMutation.mutate(Array.from(selectedIds));
                                        }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }) }))] }) }));
}
