import { Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PcActivationFormModal from '@/components/workstationOperations/PcActivationFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fetchClients } from '@/lib/api/clients';
import {
  deletePcActivation,
  fetchPcActivations,
  type PcActivation,
} from '@/lib/api/pcActivations';
import { inputClassName } from '@/components/ui/FormField';
import type { Client } from '@/types/directory';

export default function PcActivationPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [items, setItems] = useState<PcActivation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PcActivation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchPcActivations());
    } catch {
      setLoadError('Не удалось загрузить историю активаций.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    fetchClients().then(setClients).catch(() => undefined);
  }, [loadItems]);

  const clientName = (id: string | null) =>
    clients.find((c) => c.id === id)?.name ?? items.find((i) => i.client_id === id)?.client?.name ?? '—';

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterClient) {
        const name = (item.client?.name ?? clientName(item.client_id) ?? '').toLowerCase();
        if (!name.includes(filterClient.trim().toLowerCase())) return false;
      }
      if (filterDate) {
        const itemDate = new Date(item.activation_date).toISOString().slice(0, 10);
        if (itemDate !== filterDate) return false;
      }
      return true;
    });
  }, [items, filterClient, filterDate]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePcActivation(pendingDelete.id);
      setPendingDelete(null);
      await loadItems();
    } catch {
      setDeleteError('Не удалось удалить запись. Попробуйте еще раз.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
    setDeleteError('');
  };

  const renderTable = () => {
    if (loading) {
      return <p className="py-16 text-center text-sm text-slate-500">Загрузка...</p>;
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-red-600" />
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={loadItems}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
          >
            Повторить
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">Записей активаций пока нет.</p>
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <p className="py-16 text-center text-sm text-slate-500">
          Ничего не найдено по заданным фильтрам.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Дата</th>
              <th className="px-5 py-3">Клиент</th>
              <th className="px-5 py-3">Тип</th>
              <th className="px-5 py-3">Номер</th>
              <th className="px-5 py-3">Прежний статус</th>
              <th className="px-5 py-3">Новый статус</th>
              <th className="px-5 py-3">Рег. номер СККО</th>
              <th className="px-5 py-3">Примечание</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-900">
                  {new Date(item.activation_date).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-4 text-slate-700">{item.client?.name ?? '—'}</td>
                <td className="px-5 py-4 text-slate-700">
                  {item.device_kind === 'cloud' ? 'Облачная' : 'Токен'}
                </td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.device_number || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{item.previous_status || '—'}</td>
                <td className="px-5 py-4 text-slate-700">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {item.new_status || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.reg_number_skko || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{item.notes || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label="Удалить"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Активация ПК</h1>
          <p className="mt-1 text-sm text-slate-500">
            Проведение активации ПК в системе СККО
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Активация ПК
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            История активаций
          </h2>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                placeholder="Фильтр по клиенту"
                className={`${inputClassName} pl-10`}
              />
            </div>
            <div className="sm:w-48">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={inputClassName}
              />
            </div>
            {(filterClient || filterDate) && (
              <button
                type="button"
                onClick={() => {
                  setFilterClient('');
                  setFilterDate('');
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Сбросить
              </button>
            )}
          </div>

          {!loading && !loadError && (
            <p className="mb-3 text-xs text-slate-500">
              Всего: {items.length}
              {(filterClient || filterDate) && ` · Отфильтровано: ${filteredItems.length}`}
            </p>
          )}

          {renderTable()}
        </div>
      </div>

      {formOpen && (
        <PcActivationFormModal
          onClose={() => setFormOpen(false)}
          onSaved={loadItems}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить запись?"
          message={`Активация от ${new Date(pendingDelete.activation_date).toLocaleDateString('ru-RU')} будет удалена без возможности восстановления.`}
          confirmLabel="Удалить"
          busy={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteDialog}
        />
      )}
    </section>
  );
}
