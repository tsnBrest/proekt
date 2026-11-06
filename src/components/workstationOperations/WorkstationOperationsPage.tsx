import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import WorkstationOperationFormModal from '@/components/workstationOperations/WorkstationOperationFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { deleteWorkstationOperation, fetchWorkstationOperations } from '@/lib/api/workstationOperations';
import type { WorkstationOperation, WorkstationOperationType } from '@/types/directory';

type EditorState = { mode: 'create' } | { mode: 'edit'; operation: WorkstationOperation } | null;

interface WorkstationOperationsPageProps {
  operationType: WorkstationOperationType;
  title: string;
  emptyIcon: LucideIcon;
}

const ADD_LABEL: Record<WorkstationOperationType, string> = {
  registration: 'Регистрация ПК',
  deregistration: 'Снятие ПК',
  address_change: 'Изменение адреса',
  other: 'Документ',
};

export default function WorkstationOperationsPage({
  operationType,
  title,
  emptyIcon: EmptyIcon,
}: WorkstationOperationsPageProps) {
  const [items, setItems] = useState<WorkstationOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [viewer, setViewer] = useState<WorkstationOperation | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkstationOperation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchWorkstationOperations(operationType));
    } catch {
      setLoadError('Не удалось загрузить записи.');
    } finally {
      setLoading(false);
    }
  }, [operationType]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        (item.client?.name ?? '').toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query) ||
        item.token_number.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query) ||
        item.pc_model.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteWorkstationOperation(pendingDelete.id);
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
          <EmptyIcon className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Записей пока нет. Добавьте первую.</p>
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
              <th className="px-5 py-3">Дата</th>
              <th className="px-5 py-3">Клиент</th>
              <th className="px-5 py-3">Модель ПК</th>
              <th className="px-5 py-3">Тип</th>
              <th className="px-5 py-3">Токен</th>
              <th className="px-5 py-3">Адрес</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-900">
                  {new Date(item.operation_date).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-4 text-slate-700">{item.client?.name ?? '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.pc_model || '—'}</td>
                <td className="px-5 py-4 text-slate-700">
                  {item.is_cloud ? 'Облачная' : item.token_number ? 'Токен' : '—'}
                </td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.token_number || '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.address || '—'}</td>
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
                      onClick={() => setEditor({ mode: 'edit', operation: item })}
                      aria-label="Редактировать"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
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
          {ADD_LABEL[operationType]}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по клиенту, токену, модели или адресу"
          aria-label="Поиск"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {editor && (
        <WorkstationOperationFormModal
          operationType={operationType}
          operation={editor.mode === 'edit' ? editor.operation : null}
          onClose={() => setEditor(null)}
          onSaved={loadItems}
        />
      )}

      {viewer && (
        <OperationViewModal operation={viewer} onClose={() => setViewer(null)} />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить запись?"
          message={`Запись от ${new Date(pendingDelete.operation_date).toLocaleDateString('ru-RU')} будет удалена без возможности восстановления.`}
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

interface OperationViewModalProps {
  operation: WorkstationOperation;
  onClose: () => void;
}

function OperationViewModal({ operation, onClose }: OperationViewModalProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Дата', value: new Date(operation.operation_date).toLocaleDateString('ru-RU') },
    { label: 'Клиент', value: operation.client?.name ?? '—' },
    { label: 'Модель ПК', value: operation.pc_model || '—' },
    { label: 'Версия ПО', value: operation.pc_software_version || '—' },
    { label: 'Тип регистрации', value: operation.is_cloud ? 'Облачная' : operation.token_number ? 'Токен' : '—' },
    { label: 'Токен', value: operation.token_number || '—' },
    { label: 'Адрес', value: operation.address || '—' },
    { label: 'Примечание', value: operation.notes || '—' },
  ];

  return (
    <Modal
      maxWidth="max-w-2xl"
      title="Просмотр записи"
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
