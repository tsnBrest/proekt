import { useCallback, useEffect, useState } from 'react';
import { Building2, Pencil, Plus, TriangleAlert } from 'lucide-react';
import BankFormModal from '@/components/banks/BankFormModal';
import { fetchBanks } from '@/lib/api/banks';
import type { Bank } from '@/types/directory';

type EditorState = { mode: 'create' } | { mode: 'edit'; bank: Bank } | null;

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);

  const loadBanks = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setBanks(await fetchBanks());
    } catch {
      setLoadError('Не удалось загрузить список банков.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Банки</h1>
          <p className="mt-1 text-sm text-slate-500">Перечень банков, из которого выбираются реквизиты клиентов.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Добавить банк
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Загрузка...</p>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-red-600" />
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={loadBanks}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
          >
            Повторить
          </button>
        </div>
      ) : banks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Building2 className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Банков пока нет. Добавьте первый банк.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {banks.map((bank) => (
            <li key={bank.id} className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{bank.name}</p>
                <p className={`mt-1 text-sm ${bank.address ? 'text-slate-600' : 'text-amber-700'}`}>
                  {bank.address || 'Адрес не указан'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditor({ mode: 'edit', bank })}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                aria-label={`Редактировать ${bank.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <BankFormModal
          bank={editor.mode === 'edit' ? editor.bank : null}
          onClose={() => setEditor(null)}
          onSaved={loadBanks}
        />
      )}
    </section>
  );
}
