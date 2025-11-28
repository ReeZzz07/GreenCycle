import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Group,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Modal as MantineModal,
  Select,
  TextInput,
  NumberInput,
  Alert,
  FileInput,
  Loader,
  Image,
  Checkbox,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconX,
  IconFileDownload,
  IconEdit,
  IconTrash,
  IconFileText,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { shipmentsService } from '../services/shipments.service';
import { suppliersService } from '../services/suppliers.service';
import { usersService } from '../services/users.service';
import {
  CreateShipmentDto,
  UpdateShipmentDto,
  CreateBatchDto,
  CreateShipmentInvestmentDto,
  Shipment,
  ShipmentDocumentAttachment,
} from '../types/shipments';
import { CreateSupplierDto } from '../types/suppliers';
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
  const apiOrigin =
    apiBaseUrl.replace(/\/api(\/v\d+)?$/, '') ||
    apiBaseUrl ||
    `${window.location.protocol}//${window.location.host}`;

  const [opened, setOpened] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [supplierModalOpened, setSupplierModalOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
  const [initialBatchesSnapshot, setInitialBatchesSnapshot] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
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

  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'shipments-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();
  const tableRef = useTableCardLabels(viewMode, [shipments]);

  const form = useForm<CreateShipmentDto & { investments: CreateShipmentInvestmentDto[] }>({
    initialValues: {
      supplierId: 0,
      arrivalDate: new Date().toISOString().split('T')[0],
      documents: [] as ShipmentDocumentAttachment[],
      batches: [] as CreateBatchDto[],
      investments: [] as CreateShipmentInvestmentDto[],
    },
    validate: {
      supplierId: (value) => (value > 0 ? null : 'Выберите поставщика'),
      arrivalDate: (value) => (value ? null : 'Укажите дату прибытия'),
      batches: (value) => (value.length > 0 ? null : 'Добавьте хотя бы одну партию'),
    },
  });

  const supplierForm = useForm<CreateSupplierDto>({
    initialValues: {
      name: '',
      phone: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Укажите название поставщика'),
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (dto: CreateSupplierDto) => suppliersService.create(dto),
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
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать поставщика',
        color: 'red',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateShipmentDto) => shipmentsService.create(dto),
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
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать поставку',
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateShipmentDto }) =>
      shipmentsService.update(id, dto),
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
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось обновить поставку',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shipmentsService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Поставка удалена',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить поставку',
        color: 'red',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => shipmentsService.bulkDelete(ids),
    onSuccess: (result) => {
      if (result.failedCount === 0) {
        notifications.show({
          title: 'Успешно',
          message: `Удалено поставок: ${result.successCount}`,
          color: 'green',
        });
      } else {
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
    onError: (error: Error) => {
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

  const removeBatch = (index: number) => {
    form.removeListItem('batches', index);
  };

  const resolveDocumentUrl = (url: string) => {
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

  const getFileName = (attachment: ShipmentDocumentAttachment) => {
    if (attachment.name) {
      return attachment.name;
    }
    try {
      const cleaned = attachment.url.split('?')[0];
      return decodeURIComponent(cleaned.substring(cleaned.lastIndexOf('/') + 1));
    } catch {
      return attachment.url;
    }
  };

  const isImageDocument = (attachment: ShipmentDocumentAttachment) => {
    const url = attachment.url.split('?')[0];
    return /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(url);
  };

  const handleDocumentsUpload = async (files: File | File[] | null) => {
    const fileArray = files ? (Array.isArray(files) ? files : [files]) : [];
    if (fileArray.length === 0) {
      return;
    }
    setDocumentUploadLoading(true);
    try {
      const uploaded: ShipmentDocumentAttachment[] = [];
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
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка загрузки',
        message: error?.message || 'Не удалось загрузить документы',
        color: 'red',
      });
    } finally {
      setDocumentUploadLoading(false);
    }
  };

  const removeDocument = async (index: number) => {
    const documents = form.values.documents || [];
    const target = documents[index];
    if (!target) {
      return;
    }
    if (!target.persisted) {
      try {
        await shipmentsService.deleteDocument(target.url);
      } catch {
        // ignore cleanup errors
      }
    }
    const updated = [...documents];
    updated.splice(index, 1);
    form.setFieldValue('documents', updated);
  };

  const cleanupTemporaryDocuments = async (docs: ShipmentDocumentAttachment[]) => {
    const tempDocs = docs.filter((doc) => !doc.persisted);
    await Promise.all(
      tempDocs.map((doc) =>
        shipmentsService.deleteDocument(doc.url).catch(() => undefined),
      ),
    );
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

  const handleSubmit = (values: CreateShipmentDto) => {
    const batches: CreateBatchDto[] = values.batches.map((batch) => ({
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

    let batchesPayload: CreateBatchDto[] | undefined = undefined;

    if (editingShipment) {
      // При редактировании проверяем, изменились ли партии
      if (initialBatchesSnapshot) {
        const currentSnapshot = JSON.stringify(
          values.batches.map((batch) => ({
            plantType: batch.plantType,
            sizeCmMin: batch.sizeCmMin,
            sizeCmMax: batch.sizeCmMax,
            potType: batch.potType,
            quantity: batch.quantityInitial,
            pricePerUnit: Number(batch.purchasePricePerUnit), // Приводим к числу для корректного сравнения
          })),
        );
        // Если партии изменились, отправляем их
        if (currentSnapshot !== initialBatchesSnapshot) {
          console.log('Партии изменились, отправляем их');
          console.log('Исходный снимок:', initialBatchesSnapshot);
          console.log('Текущий снимок:', currentSnapshot);
          batchesPayload = batches;
        } else {
          console.log('Партии не изменились, не отправляем их');
        }
        // Если партии не изменились, batchesPayload остается undefined
      } else {
        console.log('Нет снимка партий, не отправляем их');
      }
      // Если нет снимка, значит партии не должны обновляться
      // batchesPayload остается undefined

      // Формируем DTO только с теми полями, которые нужно обновить
      const dto: UpdateShipmentDto = {};
      
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
    } else {
      const dto: CreateShipmentDto = {
        supplierId: values.supplierId,
        arrivalDate: values.arrivalDate,
        documents: documentsPayload,
        batches,
        investments: values.investments && values.investments.length > 0 ? values.investments : undefined,
      };
      createMutation.mutate(dto);
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    form.setValues({
      supplierId: shipment.supplierId,
      arrivalDate: new Date(shipment.arrivalDate).toISOString().split('T')[0],
      documents:
        shipment.documents?.map((doc) => ({
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
    const snapshot = JSON.stringify(
      shipment.batches.map((batch) => ({
        plantType: batch.plantType,
        sizeCmMin: batch.sizeCmMin,
        sizeCmMax: batch.sizeCmMax,
        potType: batch.potType,
        quantity: batch.quantityInitial,
        pricePerUnit: Number(batch.purchasePricePerUnit),
      })),
    );
    setInitialBatchesSnapshot(snapshot);
    setOpened(true);
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        'Вы уверены, что хотите удалить эту поставку? Это действие нельзя отменить. Убедитесь, что нет связанных продаж.',
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  const supplierOptions =
    suppliers?.map((supplier) => ({
      value: supplier.id.toString(),
      label: supplier.name,
    })) || [];

  const totalCost = form.values.batches.reduce((sum, batch) => {
    return sum + batch.quantityInitial * Number(batch.purchasePricePerUnit);
  }, 0);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Закупки
            </Title>
            <Text c="dimmed">Список поставок и партий</Text>
          </div>
          <Group>
            {isAdmin && selectedIds.size > 0 && (
              <Button
                color="red"
                variant="light"
                onClick={() => setBulkDeleteModalOpened(true)}
              >
                Удалить выбранные ({selectedIds.size})
              </Button>
            )}
            <Button leftSection={<IconPlus size={16} />} onClick={() => setOpened(true)}>
              Создать поставку
            </Button>
          </Group>
        </Group>

        <Group justify="flex-end">
          <DataViewToggle value={viewMode} onChange={setViewMode} />
        </Group>
        <Paper withBorder mt="sm">
          <Table
            ref={tableRef}
            className="gc-data-table"
            data-view={viewMode}
            striped
            highlightOnHover
          >
            <Table.Thead>
              <Table.Tr>
                {isAdmin && (
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={selectedIds.size > 0 && selectedIds.size === shipments?.length}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < (shipments?.length || 0)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          setSelectedIds(new Set(shipments?.map((s) => s.id) || []));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </Table.Th>
                )}
                <Table.Th>ID</Table.Th>
                <Table.Th>Поставщик</Table.Th>
                <Table.Th>Дата прибытия</Table.Th>
                <Table.Th>Количество партий</Table.Th>
                <Table.Th>Общая стоимость</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {shipments?.map((shipment) => (
                <Table.Tr key={shipment.id}>
                  {isAdmin && (
                    <Table.Td>
                      <Checkbox
                        checked={selectedIds.has(shipment.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedIds);
                          if (e.currentTarget.checked) {
                            newSelected.add(shipment.id);
                          } else {
                            newSelected.delete(shipment.id);
                          }
                          setSelectedIds(newSelected);
                        }}
                      />
                    </Table.Td>
                  )}
                  <Table.Td>#{shipment.id}</Table.Td>
                  <Table.Td>{shipment.supplier.name}</Table.Td>
                  <Table.Td>{formatDate(shipment.arrivalDate)}</Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light">
                      {shipment.batches.length} шт
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatCurrency(shipment.totalCost)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Просмотр">
                        <ActionIcon
                          variant="subtle"
                          color="greenCycle"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setViewModalOpened(true);
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Скачать накладную">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={async () => {
                            try {
                              await downloadPdf(
                                `/shipments/${shipment.id}/document`,
                                `shipment-${shipment.id}.pdf`,
                              );
                              notifications.show({
                                title: 'Успешно',
                                message: 'Накладная скачана',
                                color: 'green',
                              });
                            } catch (error) {
                              notifications.show({
                                title: 'Ошибка',
                                message: 'Не удалось скачать накладную',
                                color: 'red',
                              });
                            }
                          }}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {isAdmin && (
                        <>
                          <Tooltip label="Редактировать">
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => handleEdit(shipment)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(shipment.id)}
                              loading={deleteMutation.isPending}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <MantineModal
          opened={opened}
          onClose={() => {
            void closeShipmentModal(true);
          }}
          title={editingShipment ? 'Редактировать поставку' : 'Создать поставку'}
          centered
          size="xl"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Group align="flex-end" gap="xs">
                <Select
                  label="Поставщик"
                  required
                  data={supplierOptions}
                  searchable
                  placeholder="Выберите поставщика"
                  value={form.values.supplierId.toString()}
                  onChange={(value) =>
                    form.setFieldValue('supplierId', value ? parseInt(value) : 0)
                  }
                  error={form.errors.supplierId}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => setSupplierModalOpened(true)}
                  style={{ marginBottom: '4px' }}
                >
                  <IconPlus size={16} />
                </Button>
              </Group>
              <TextInput
                label="Дата прибытия"
                type="date"
                required
                {...form.getInputProps('arrivalDate')}
              />
              <Stack gap="xs">
                <FileInput
                  label="Загрузить документы"
                  placeholder="Выберите файлы"
                  accept=".pdf,.doc,.docx,image/*"
                  multiple
                  clearable
                  onChange={(value) => {
                    void handleDocumentsUpload(value);
                  }}
                  disabled={documentUploadLoading}
                  rightSection={
                    documentUploadLoading ? <Loader size="xs" color="greenCycle" /> : undefined
                  }
                />
                <Text size="xs" c="dimmed">
                  Поддерживаются файлы PDF, DOC, DOCX и изображения (фото/сканы). Можно выбрать
                  несколько файлов одновременно. После загрузки документы появятся в списке ниже.
                </Text>
                {(form.values.documents || []).length > 0 && (
                  <Group gap="sm">
                    {(form.values.documents || []).map((doc, index) => (
                      <Paper
                        key={`${doc.url}-${index}`}
                        withBorder
                        p="xs"
                        radius="md"
                        style={{ width: 140, position: 'relative' }}
                      >
                        <div style={{ position: 'relative', height: 100 }}>
                          {isImageDocument(doc) ? (
                            <Image
                              src={resolveDocumentUrl(doc.url)}
                              alt={getFileName(doc)}
                              height={100}
                              radius="sm"
                              fit="cover"
                            />
                          ) : (
                            <Group justify="center" align="center" h={100}>
                              <IconFileText size={32} color="var(--mantine-color-gray-6)" />
                            </Group>
                          )}
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            style={{ position: 'absolute', top: 4, right: 4 }}
                            onClick={() => {
                              void removeDocument(index);
                            }}
                            aria-label="Удалить документ"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </div>
                        <Text size="xs" mt="xs" lineClamp={2}>
                          {getFileName(doc)}
                        </Text>
                      </Paper>
                    ))}
                  </Group>
                )}
              </Stack>

              <Group justify="space-between" mt="md">
                <Text fw={500}>Партии</Text>
                <Button size="xs" onClick={addBatch}>
                  Добавить партию
                </Button>
              </Group>

              {form.values.batches.map((batch, index) => (
                <Paper key={index} withBorder p="md">
                  <Stack gap="sm">
                    <Group>
                      <TextInput
                        label="Тип растения"
                        required
                        {...form.getInputProps(`batches.${index}.plantType`)}
                        style={{ flex: 1 }}
                      />
                      <TextInput
                        label="Тип горшка"
                        required
                        {...form.getInputProps(`batches.${index}.potType`)}
                        style={{ flex: 1 }}
                      />
                    </Group>
                    <Group>
                      <NumberInput
                        label="Размер минимум (см)"
                        required
                        min={0}
                        {...form.getInputProps(`batches.${index}.sizeCmMin`)}
                        style={{ flex: 1 }}
                      />
                      <NumberInput
                        label="Размер максимум (см)"
                        required
                        min={0}
                        {...form.getInputProps(`batches.${index}.sizeCmMax`)}
                        style={{ flex: 1 }}
                      />
                    </Group>
                    <Group>
                      <NumberInput
                        label="Количество"
                        required
                        min={1}
                        {...form.getInputProps(`batches.${index}.quantityInitial`)}
                        style={{ flex: 1 }}
                      />
                      <NumberInput
                        label="Цена за единицу"
                        required
                        min={0}
                        decimalScale={2}
                        {...form.getInputProps(`batches.${index}.purchasePricePerUnit`)}
                        style={{ flex: 1 }}
                      />
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeBatch(index)}
                        mt="xl"
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Paper>
              ))}

              <Paper withBorder p="md" mt="md">
                <Group justify="space-between">
                  <Text fw={500}>Итого:</Text>
                  <Text fw={700} size="lg">
                    {formatCurrency(totalCost)}
                  </Text>
                </Group>
              </Paper>

              {superAdmins.length > 0 && (
                <>
                  <Divider label="Вложения партнеров" labelPosition="center" mt="md" />
                  <Group justify="space-between" mt="md">
                    <Text fw={500} size="sm" c="dimmed">
                      Укажите сумму вложений для каждого партнера
                    </Text>
                    <Button
                      size="xs"
                      onClick={() => {
                        form.insertListItem('investments', {
                          userId: 0,
                          amount: 0,
                        });
                      }}
                    >
                      Добавить вложение
                    </Button>
                  </Group>

                  {form.values.investments.map((investment, index) => {
                    const percentage =
                      totalCost > 0
                        ? ((investment.amount / totalCost) * 100).toFixed(2)
                        : '0.00';
                    const superAdminOptions = superAdmins.map((admin) => ({
                      value: admin.id.toString(),
                      label: admin.fullName,
                    }));

                    return (
                      <Paper key={index} withBorder p="md">
                        <Stack gap="sm">
                          <Group>
                            <Select
                              label="Партнер"
                              required
                              data={superAdminOptions}
                              searchable
                              placeholder="Выберите партнера"
                              value={investment.userId.toString()}
                              onChange={(value) =>
                                form.setFieldValue(
                                  `investments.${index}.userId`,
                                  value ? parseInt(value) : 0,
                                )
                              }
                              style={{ flex: 1 }}
                            />
                            <NumberInput
                              label="Сумма вложения"
                              required
                              min={0}
                              decimalScale={2}
                              value={investment.amount}
                              onChange={(value) => {
                                form.setFieldValue(
                                  `investments.${index}.amount`,
                                  typeof value === 'number' ? value : 0,
                                );
                              }}
                              style={{ flex: 1 }}
                            />
                            <div style={{ flex: 1, paddingTop: '24px' }}>
                              <Text size="sm" c="dimmed" mb="xs">
                                Доля от стоимости
                              </Text>
                              <Text fw={700} size="lg" c="greenCycle">
                                {percentage}%
                              </Text>
                            </div>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => form.removeListItem('investments', index)}
                              mt="xl"
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Group>
                        </Stack>
                      </Paper>
                    );
                  })}

                  {form.values.investments.length > 0 && (
                    <Paper withBorder p="md" mt="md">
                      <Group justify="space-between">
                        <Text fw={500}>Сумма вложений:</Text>
                        <Text
                          fw={700}
                          size="lg"
                          c={
                            form.values.investments.reduce(
                              (sum, inv) => sum + inv.amount,
                              0,
                            ) > totalCost
                              ? 'red'
                              : 'greenCycle'
                          }
                        >
                          {formatCurrency(
                            form.values.investments.reduce((sum, inv) => sum + inv.amount, 0),
                          )}
                        </Text>
                      </Group>
                      {form.values.investments.reduce((sum, inv) => sum + inv.amount, 0) >
                        totalCost && (
                        <Text size="xs" c="red" mt="xs">
                          Сумма вложений не может превышать общую стоимость поставки
                        </Text>
                      )}
                    </Paper>
                  )}
                </>
              )}

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    void closeShipmentModal(true);
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingShipment ? 'Сохранить изменения' : 'Создать поставку'}
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        {/* Модальное окно создания поставщика */}
        <MantineModal
          opened={supplierModalOpened}
          onClose={() => {
            setSupplierModalOpened(false);
            supplierForm.reset();
          }}
          title="Создать поставщика"
          centered
        >
          <form
            onSubmit={supplierForm.onSubmit((values) => {
              createSupplierMutation.mutate(values);
            })}
          >
            <Stack>
              <TextInput
                label="Название поставщика"
                required
                placeholder="Введите название"
                {...supplierForm.getInputProps('name')}
              />
              <TextInput
                label="Телефон"
                placeholder="+7 (999) 123-45-67"
                {...supplierForm.getInputProps('phone')}
              />
              <Alert
                variant="light"
                color="blue"
                title="Дополнительная информация"
                styles={{
                  root: {
                    backgroundColor: 'var(--mantine-color-blue-0)',
                  },
                }}
              >
                <Text size="sm">
                  Остальные данные поставщика (контактное лицо, адрес, данные юр. лица, банковские
                  реквизиты) можно добавить после создания в разделе{' '}
                  <Text component="span" fw={600}>
                    «Поставщики»
                  </Text>
                  .
                </Text>
              </Alert>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setSupplierModalOpened(false);
                    supplierForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createSupplierMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setSelectedShipment(null);
          }}
          title={`Поставка #${selectedShipment?.id}`}
          centered
          size="xl"
        >
          {selectedShipment && (
            <Stack gap="md">
              <Group>
                <Text fw={600}>Поставщик:</Text>
                <Text>{selectedShipment.supplier.name}</Text>
              </Group>
              <Group>
                <Text fw={600}>Дата прибытия:</Text>
                <Text>{formatDate(selectedShipment.arrivalDate)}</Text>
              </Group>
              <Group>
                <Text fw={600}>Общая стоимость:</Text>
                <Text>{formatCurrency(selectedShipment.totalCost)}</Text>
              </Group>
              {selectedShipment.documents?.length ? (
                <Stack gap="xs">
                  <Text fw={600}>Документы:</Text>
                  <Group gap="sm">
                    {selectedShipment.documents.map((doc, index) => (
                      <Paper
                        key={`${doc.url}-${index}`}
                        withBorder
                        p="xs"
                        radius="md"
                        style={{ width: 140 }}
                      >
                        <div style={{ height: 100 }}>
                          {isImageDocument(doc) ? (
                            <Image
                              src={resolveDocumentUrl(doc.url)}
                              alt={getFileName(doc)}
                              height={100}
                              radius="sm"
                              fit="cover"
                            />
                          ) : (
                            <Group justify="center" align="center" h={100}>
                              <IconFileText size={32} color="var(--mantine-color-gray-6)" />
                            </Group>
                          )}
                        </div>
                        <Text
                          size="xs"
                          mt="xs"
                          lineClamp={2}
                          component="a"
                          href={resolveDocumentUrl(doc.url)}
                          target="_blank"
                          c="blue"
                        >
                          {getFileName(doc)}
                        </Text>
                      </Paper>
                    ))}
                  </Group>
                </Stack>
              ) : null}
              <div>
                <Text fw={600} mb="xs">
                  Партии ({selectedShipment.batches.length}):
                </Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Тип растения</Table.Th>
                      <Table.Th>Размер (см)</Table.Th>
                      <Table.Th>Горшок</Table.Th>
                      <Table.Th>Количество</Table.Th>
                      <Table.Th>Цена за единицу</Table.Th>
                      <Table.Th>Сумма</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedShipment.batches.map((batch) => (
                      <Table.Tr key={batch.id}>
                        <Table.Td>{batch.plantType}</Table.Td>
                        <Table.Td>
                          {batch.sizeCmMin}–{batch.sizeCmMax}
                        </Table.Td>
                        <Table.Td>{batch.potType}</Table.Td>
                        <Table.Td>{batch.quantityInitial}</Table.Td>
                        <Table.Td>{formatCurrency(batch.purchasePricePerUnit)}</Table.Td>
                        <Table.Td>
                          {formatCurrency(
                            (Number(batch.purchasePricePerUnit) * batch.quantityInitial).toString(),
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>

              {selectedShipment.investments && selectedShipment.investments.length > 0 && (
                <div>
                  <Divider my="md" />
                  <Text fw={600} mb="sm">
                    Вложения партнеров ({selectedShipment.investments.length}):
                  </Text>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Вкладчик</Table.Th>
                        <Table.Th>Сумма вложения</Table.Th>
                        <Table.Th>Доля (%)</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedShipment.investments.map((investment) => (
                        <Table.Tr key={investment.id}>
                          <Table.Td>{investment.user.fullName}</Table.Td>
                          <Table.Td>{formatCurrency(investment.amount)}</Table.Td>
                          <Table.Td>{Number(investment.percentage).toFixed(2)}%</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </Stack>
          )}
        </MantineModal>

        {isAdmin && (
          <MantineModal
            opened={bulkDeleteModalOpened}
            onClose={() => setBulkDeleteModalOpened(false)}
            title="Подтверждение удаления"
            centered
          >
            <Stack>
              <Text>
                Вы уверены, что хотите удалить {selectedIds.size} поставк
                {selectedIds.size > 1 && selectedIds.size < 5
                  ? 'и'
                  : selectedIds.size >= 5
                    ? 'ок'
                    : 'у'}?
              </Text>
              <Text size="sm" c="dimmed">
                Это действие нельзя отменить. Поставки с активными продажами не будут удалены.
              </Text>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => setBulkDeleteModalOpened(false)}
                >
                  Отмена
                </Button>
                <Button
                  color="red"
                  loading={bulkDeleteMutation.isPending}
                  onClick={() => {
                    bulkDeleteMutation.mutate(Array.from(selectedIds));
                  }}
                >
                  Удалить
                </Button>
              </Group>
            </Stack>
          </MantineModal>
        )}
      </Stack>
    </Container>
  );
}