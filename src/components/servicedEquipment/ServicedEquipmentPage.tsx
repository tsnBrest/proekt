import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, TriangleAlert, Wrench } from 'lucide-react';
import ServicedEquipmentFormModal from '@/components/servicedEquipment/ServicedEquipmentFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { deleteServicedEquipment, fetchServicedEquipment } from '@/lib/api/servicedEquipment';
import type { ServicedEquipment } from '@/types/directory';

type EditorState = { mode: 'create' } | { mode: 'edit'; equipment: ServicedEquipment } | null;

export default function ServicedEquipmentPage() {
  const [items, setItems] = useState<ServicedEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingDelete, setPendingDelete] = useState<ServicedEquipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchServicedEquipment());
    } catch {
      setLoadError('Не удалось загрузить справочник оборудования.');
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
        item.model.toLowerCase().includes(query) ||
        item.serial_number.toLowerCase().includes(query) ||
        item.software_version.toLowerCase().includes(query) ||
        (item.client?.name ?? '').toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteServicedEquipment(pendingDelete.id);
      setPendingDelete(null);
      await loadItems();
    } catch {
      setDeleteError('Не удалось удалить оборудование. Попробуйте еще раз.');
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
          <Wrench className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Оборудования пока нет. Добавьте первую запись.</p>
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
              <th className="px-5 py-3">Модель</th>
              <th className="px-5 py-3">Заводской номер</th>
              <th className="px-5 py-3">Версия ПО</th>
              <th className="px-5 py-3">Принадлежность</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4 font-medium text-slate-900">{item.model}</td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.serial_number || '—'}</td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.software_version || '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.client?.name ?? '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditor({ mode: 'edit', equipment: item })}
                      aria-label={`Редактировать ${item.model}`}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Удалить ${item.model}`}
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Обслуживаемое оборудование</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Загрузка...' : `Всего записей: ${items.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Добавить оборудование
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по модели, номеру, версии или клиенту"
          aria-label="Поиск оборудования"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {editor && (
        <ServicedEquipmentFormModal
          equipment={editor.mode === 'edit' ? editor.equipment : null}
          onClose={() => setEditor(null)}
          onSaved={loadItems}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить оборудование?"
          message={`Оборудование «${pendingDelete.model}» будет удалено без возможности восстановления.`}
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
