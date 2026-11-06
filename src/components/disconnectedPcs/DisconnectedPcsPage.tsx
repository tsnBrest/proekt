import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Search, Trash2, TriangleAlert } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { deleteDisconnectedPc, fetchDisconnectedPcs, type DisconnectedPc } from '@/lib/api/disconnectedPcs';

export default function DisconnectedPcsPage() {
  const [items, setItems] = useState<DisconnectedPc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [viewer, setViewer] = useState<DisconnectedPc | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DisconnectedPc | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchDisconnectedPcs());
    } catch {
      setLoadError('Не удалось загрузить отключённые ПК.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.number.toLowerCase().includes(query) ||
        item.pc_model.toLowerCase().includes(query) ||
        (item.client?.name ?? '').toLowerCase().includes(query) ||
        item.pc_installation_address.toLowerCase().includes(query) ||
        item.disconnect_reason.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteDisconnectedPc(pendingDelete.id);
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

  const renderContent = () => {
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
          <p className="text-sm text-slate-500">Отключённых ПК пока нет.</p>
        </div>
      );
    }

    if (visibleItems.length === 0) {
      return <p className="py-16 text-center text-sm text-slate-500">Ничего не найдено по запросу «{search.trim()}».</p>;
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Дата отключения</th>
              <th className="px-5 py-3">Клиент</th>
              <th className="px-5 py-3">Тип</th>
              <th className="px-5 py-3">Номер</th>
              <th className="px-5 py-3">Модель ПК</th>
              <th className="px-5 py-3">Прежний статус</th>
              <th className="px-5 py-3">Причина</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-900">
                  {new Date(item.disconnect_date).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-4 text-slate-700">{item.client?.name ?? '—'}</td>
                <td className="px-5 py-4 text-slate-700">
                  {item.original_table === 'cloud_cash_registers' ? 'Облачная' : item.operator_type || 'Токен'}
                </td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.number || '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.pc_model || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{item.previous_status || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{item.disconnect_reason || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setViewer(item)}
                      aria-label="Просмотр"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Отключённые ПК</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? 'Загрузка списка' : `Всего записей: ${items.length}`}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по клиенту, номеру, модели или причине"
          aria-label="Поиск отключённых ПК"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {viewer && <DisconnectedPcViewModal pc={viewer} onClose={() => setViewer(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить запись?"
          message={`Запись отключённого ПК${pendingDelete.client?.name ? ` клиента «${pendingDelete.client.name}»` : ''} будет удалена без возможности восстановления.`}
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

interface DisconnectedPcViewModalProps {
  pc: DisconnectedPc;
  onClose: () => void;
}

function DisconnectedPcViewModal({ pc, onClose }: DisconnectedPcViewModalProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Дата отключения', value: new Date(pc.disconnect_date).toLocaleDateString('ru-RU') },
    { label: 'Клиент', value: pc.client?.name ?? '—' },
    { label: 'Источник', value: pc.original_table === 'cloud_cash_registers' ? 'Облачная касса' : 'Токен' },
    { label: 'Оператор', value: pc.operator_type || '—' },
    { label: 'Номер', value: pc.number || '—' },
    { label: 'Модель ПК', value: pc.pc_model || '—' },
    { label: 'Версия ПО', value: pc.pc_software_version || '—' },
    { label: 'Оборудование', value: pc.equipment_name || '—' },
    { label: 'Заводской номер', value: pc.equipment_serial_number || '—' },
    { label: 'Адрес установки', value: pc.pc_installation_address || '—' },
    { label: 'Режим работы', value: pc.working_hours || '—' },
    { label: 'GLN', value: pc.gln || '—' },
    { label: 'Вид торгового объекта', value: pc.to_type || '—' },
    { label: '№ договора', value: pc.contract_number || '—' },
    { label: 'Прежний статус', value: pc.previous_status || '—' },
    { label: 'Причина отключения', value: pc.disconnect_reason || '—' },
    { label: 'Стоимость ИТП', value: pc.itp_price ? pc.itp_price.toFixed(3) : '—' },
  ];

  return (
    <Modal
      maxWidth="max-w-2xl"
      title="Просмотр отключённого ПК"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Закрыть
        </button>
      }
    >
      <div className="flex flex-col gap-3 pb-16">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 border-b border-slate-100 pb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</span>
            <span className="text-sm text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
