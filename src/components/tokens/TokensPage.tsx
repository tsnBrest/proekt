import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import TokenFormModal from '@/components/tokens/TokenFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { deleteToken, fetchTokens } from '@/lib/api/tokens';
import type { Token, TokenOperatorType } from '@/types/directory';

type EditorState = { mode: 'create' } | { mode: 'edit'; token: Token } | { mode: 'view'; token: Token } | null;

interface TokensPageProps {
  operatorType: TokenOperatorType;
}

const OPERATOR_LABEL: Record<TokenOperatorType, string> = {
  ikassa: 'iKassa',
  cpi: 'ЦПИ',
};

const STATUS_COLORS: Record<string, string> = {
  'присвоен': 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  'зарегистрирован': 'bg-green-100 text-green-800 ring-1 ring-green-200',
  'пауза': 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  'блокировка': 'bg-red-100 text-red-800 ring-1 ring-red-200',
  'снят с регистрации': 'bg-slate-200 text-slate-600 ring-1 ring-slate-300',
};

export default function TokensPage({ operatorType }: TokensPageProps) {
  const [items, setItems] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [viewer, setViewer] = useState<Token | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Token | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchTokens(operatorType));
    } catch {
      setLoadError('Не удалось загрузить справочник токенов.');
    } finally {
      setLoading(false);
    }
  }, [operatorType]);

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
        item.pc_software_version.toLowerCase().includes(query) ||
        item.equipment_model.toLowerCase().includes(query) ||
        item.equipment_serial_number.toLowerCase().includes(query) ||
        item.installation_name.toLowerCase().includes(query) ||
        item.pc_installation_address.toLowerCase().includes(query) ||
        item.working_hours.toLowerCase().includes(query) ||
        item.gln.toLowerCase().includes(query) ||
        item.to_type.toLowerCase().includes(query) ||
        item.contract_number.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteToken(pendingDelete.id);
      setPendingDelete(null);
      await loadItems();
    } catch {
      setDeleteError('Не удалось удалить токен. Попробуйте еще раз.');
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
          <KeyRound className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Токенов пока нет. Добавьте первый токен.</p>
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
              <th className="px-5 py-3">Номер токена</th>
              <th className="px-5 py-3">Статус</th>
              <th className="px-5 py-3">Модель ПК</th>
              <th className="px-5 py-3">Версия ПО</th>
              <th className="px-5 py-3">Адрес установки ПК</th>
              <th className="px-5 py-3">Режим работы</th>
              <th className="px-5 py-3">GLN</th>
              <th className="px-5 py-3">№ договора</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="tabular-nums font-medium text-slate-900">{item.number}</span>
                    {item.client?.name && (
                      <span className="text-xs text-slate-500">{item.client.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[item.status] ?? STATUS_COLORS['присвоен']}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">{item.pc_model || '—'}</td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.pc_software_version || '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.pc_installation_address || '—'}</td>
                <td className="px-5 py-4 text-slate-700">{item.working_hours || '—'}</td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.gln || '—'}</td>
                <td className="px-5 py-4 tabular-nums text-slate-700">{item.contract_number || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setViewer(item)}
                      aria-label={`Просмотр ${item.number}`}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditor({ mode: 'edit', token: item })}
                      aria-label={`Редактировать ${item.number}`}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Удалить ${item.number}`}
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Токены {OPERATOR_LABEL[operatorType]}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Загрузка списка токенов' : `Всего токенов: ${items.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Добавить токен
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по номеру, модели, адресу или GLN"
          aria-label="Поиск токенов"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {renderContent()}

      {editor && (
        <TokenFormModal
          operatorType={operatorType}
          token={editor.mode === 'edit' ? editor.token : null}
          onClose={() => setEditor(null)}
          onSaved={loadItems}
        />
      )}

      {viewer && (
        <TokenViewModal token={viewer} onClose={() => setViewer(null)} />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить токен?"
          message={`Токен «${pendingDelete.number}» будет удален из справочника без возможности восстановления.`}
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

interface TokenViewModalProps {
  token: Token;
  onClose: () => void;
}

function TokenViewModal({ token, onClose }: TokenViewModalProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Номер токена', value: token.number },
    { label: 'Принадлежность', value: token.client?.name ?? '—' },
    { label: 'Статус токена', value: token.status },
    { label: 'Модель ПК', value: token.pc_model || '—' },
    { label: 'Версия ПО', value: token.pc_software_version || '—' },
    { label: 'Оборудование', value: token.equipment_name || '—' },
    { label: 'Заводской номер', value: token.equipment_serial_number || '—' },
    { label: 'Статус оборудования', value: token.equipment_status || '—' },
    { label: 'Адрес установки ПК', value: token.pc_installation_address || '—' },
    { label: 'Режим работы', value: token.working_hours || '—' },
    { label: 'GLN', value: token.gln || '—' },
    { label: 'Вид торгового объекта', value: token.to_type || '—' },
    { label: '№ договора', value: token.contract_number || '—' },
  ];

  return (
    <Modal
      maxWidth="max-w-2xl"
      title={`Просмотр токена — ${token.number}`}
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
