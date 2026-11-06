import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Tag, Trash2, TriangleAlert } from 'lucide-react';
import StatusFormModal from '@/components/statuses/StatusFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { deleteStatus, fetchAllStatuses } from '@/lib/api/statuses';
import type { Status, StatusCategory } from '@/types/directory';

type EditorState =
  | { mode: 'create'; defaultCategory: StatusCategory }
  | { mode: 'edit'; status: Status }
  | null;

const CATEGORY_LABELS: Record<StatusCategory, string> = {
  cash_register: 'Статусы касс',
  token: 'Статусы токенов',
};

export default function StatusesPage() {
  const [items, setItems] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingDelete, setPendingDelete] = useState<Status | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchAllStatuses());
    } catch {
      setLoadError('Не удалось загрузить справочник статусов.');
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
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [items, search]);

  const cashRegisterStatuses = visibleItems.filter((s) => s.category === 'cash_register');
  const tokenStatuses = visibleItems.filter((s) => s.category === 'token');

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteStatus(pendingDelete.id);
      setPendingDelete(null);
      await loadItems();
    } catch {
      setDeleteError('Не удалось удалить статус. Попробуйте еще раз.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
    setDeleteError('');
  };

  const renderSection = (category: StatusCategory, statuses: Status[]) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {CATEGORY_LABELS[category]}
        </h2>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create', defaultCategory: category })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </button>
      </div>
      {statuses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Статусов пока нет.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <tbody className="divide-y divide-slate-100">
              {statuses.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: 'edit', status: item })}
                        aria-label={`Редактировать ${item.name}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label={`Удалить ${item.name}`}
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
      )}
    </div>
  );

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
          <Tag className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Статусов пока нет. Добавьте первый статус.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderSection('cash_register', cashRegisterStatuses)}
        {renderSection('token', tokenStatuses)}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Справочник статусов
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Загрузка...' : `Всего статусов: ${items.length}`}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по статусу"
          aria-label="Поиск статусов"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {editor && (
        <StatusFormModal
          status={editor.mode === 'edit' ? editor.status : null}
          defaultCategory={editor.mode === 'create' ? editor.defaultCategory : 'cash_register'}
          onClose={() => setEditor(null)}
          onSaved={loadItems}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить статус?"
          message={`Статус «${pendingDelete.name}» будет удален без возможности восстановления.`}
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
