import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FormField, { inputClassName } from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { createTokenBatch, deleteTokenBatch, fetchTokenBatches } from '@/lib/api/tokenBatches';
import type { TokenBatch, TokenBatchOperatorLabel } from '@/types/directory';

const OPERATOR_LABELS: TokenBatchOperatorLabel[] = ['АЙЭМЛЭБ', 'ЦПИ'];

const OPERATOR_COLORS: Record<TokenBatchOperatorLabel, string> = {
  'АЙЭМЛЭБ': 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  'ЦПИ': 'bg-teal-100 text-teal-800 ring-1 ring-teal-200',
};

type AddFormState = {
  operatorLabel: TokenBatchOperatorLabel;
  startNumber: string;
  endNumber: string;
  arrivalDate: string;
};

export default function TokenBasesPage() {
  const [items, setItems] = useState<TokenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<TokenBatch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [addForm, setAddForm] = useState<AddFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchTokenBatches());
    } catch {
      setLoadError('Не удалось загрузить базу токенов.');
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
        item.start_number.toLowerCase().includes(query) ||
        item.end_number.toLowerCase().includes(query) ||
        item.operator_label.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteTokenBatch(pendingDelete.id);
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

  const openAddForm = (operatorLabel: TokenBatchOperatorLabel) => {
    setSubmitError('');
    const today = new Date().toISOString().slice(0, 10);
    setAddForm({ operatorLabel, startNumber: '', endNumber: '', arrivalDate: today });
  };

  const handleAddSubmit = async () => {
    if (!addForm) return;
    const start = addForm.startNumber.trim();
    const end = addForm.endNumber.trim();
    if (!start || !end) {
      setSubmitError('Укажите начальный и конечный номер');
      return;
    }
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    if (isNaN(startNum) || isNaN(endNum)) {
      setSubmitError('Номера должны быть числовыми');
      return;
    }
    if (startNum > endNum) {
      setSubmitError('Начальный номер не может быть больше конечного');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const count = endNum - startNum + 1;
      const rows = [];
      for (let n = startNum; n <= endNum; n++) {
        rows.push({
          operator_label: addForm.operatorLabel,
          start_number: String(n),
          end_number: String(n),
          arrival_date: addForm.arrivalDate,
        });
      }
      for (const row of rows) {
        await createTokenBatch(row);
      }
      setAddForm(null);
      await loadItems();
      void count;
    } catch {
      setSubmitError('Не удалось добавить записи. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
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
          <Database className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">База токенов пуста. Добавьте поступление через кнопки выше.</p>
        </div>
      );
    }

    if (visibleItems.length === 0) {
      return (
        <p className="py-16 text-center text-sm text-slate-500">
          Ничего не найдено по запросу «{search.trim()}».
        </p>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Поступление</th>
              <th className="px-5 py-3">Источник</th>
              <th className="px-5 py-3">Дата поступления</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4 tabular-nums font-medium text-slate-900">
                  {item.start_number === item.end_number
                    ? item.start_number
                    : `${item.start_number} — ${item.end_number}`}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${OPERATOR_COLORS[item.operator_label]}`}
                  >
                    {item.operator_label}
                  </span>
                </td>
                <td className="px-5 py-4 tabular-nums text-slate-700">
                  {item.arrival_date
                    ? new Date(item.arrival_date).toLocaleDateString('ru-RU')
                    : new Date(item.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Удалить ${item.start_number}`}
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Токены — база</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Загрузка...' : `Всего записей: ${items.length}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {OPERATOR_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => openAddForm(label)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${
                label === 'АЙЭМЛЭБ'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по номеру или источнику"
          aria-label="Поиск по базе токенов"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {addForm && (
        <Modal
          title={`Поступление токенов — ${addForm.operatorLabel}`}
          onClose={() => setAddForm(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setAddForm(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddSubmit}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Добавление...' : 'Добавить в базу'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-5 pb-16">
            <FormField label="Источник" htmlFor="batch-operator">
              <input
                id="batch-operator"
                className={`${inputClassName} bg-slate-100`}
                value={addForm.operatorLabel}
                disabled
              />
            </FormField>

            <FormField label="Дата поступления" htmlFor="batch-arrival-date">
              <input
                id="batch-arrival-date"
                type="date"
                className={inputClassName}
                value={addForm.arrivalDate}
                onChange={(event) =>
                  setAddForm((prev) => (prev ? { ...prev, arrivalDate: event.target.value } : prev))
                }
              />
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="Начальный номер" htmlFor="batch-start">
                <input
                  id="batch-start"
                  className={inputClassName}
                  value={addForm.startNumber}
                  onChange={(event) =>
                    setAddForm((prev) => (prev ? { ...prev, startNumber: event.target.value } : prev))
                  }
                  placeholder="Например, 000100"
                  autoFocus
                />
              </FormField>

              <FormField label="Конечный номер" htmlFor="batch-end">
                <input
                  id="batch-end"
                  className={inputClassName}
                  value={addForm.endNumber}
                  onChange={(event) =>
                    setAddForm((prev) => (prev ? { ...prev, endNumber: event.target.value } : prev))
                  }
                  placeholder="Например, 000150"
                />
              </FormField>
            </div>

            {addForm.startNumber && addForm.endNumber && !isNaN(parseInt(addForm.startNumber, 10)) && !isNaN(parseInt(addForm.endNumber, 10)) && parseInt(addForm.endNumber, 10) >= parseInt(addForm.startNumber, 10) && (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Будет добавлено записей: {parseInt(addForm.endNumber, 10) - parseInt(addForm.startNumber, 10) + 1}
              </p>
            )}

            {submitError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
            )}
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить запись?"
          message={`Запись «${pendingDelete.start_number === pendingDelete.end_number ? pendingDelete.start_number : `${pendingDelete.start_number} — ${pendingDelete.end_number}`}» будет удалена без возможности восстановления.`}
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
