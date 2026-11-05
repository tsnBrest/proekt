import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, TriangleAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { inputClassName } from '@/components/ui/FormField';
import { fetchTokensByClient, fetchUnassignedTokens } from '@/lib/api/tokens';
import type { Token, TokenOperatorType } from '@/types/directory';

interface TokenPickerProps {
  assignedTokenNumbers: string[];
  currentTokenNumber: string;
  onClose: () => void;
  onSelect: (tokenNumber: string, operatorType: TokenOperatorType) => void;
  clientId?: string | null;
}

type Step = 'operator' | 'tokens';

export default function TokenPicker({
  assignedTokenNumbers,
  currentTokenNumber,
  onClose,
  onSelect,
  clientId = null,
}: TokenPickerProps) {
  const clientMode = !!clientId;
  const [step, setStep] = useState<Step>(clientMode ? 'tokens' : 'operator');
  const [operatorType, setOperatorType] = useState<TokenOperatorType | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const assigned = useMemo(() => {
    const set = new Set(assignedTokenNumbers.map((n) => n.trim()).filter(Boolean));
    if (currentTokenNumber.trim()) {
      set.delete(currentTokenNumber.trim());
    }
    return set;
  }, [assignedTokenNumbers, currentTokenNumber]);

  const loadTokens = async (op: TokenOperatorType) => {
    setLoading(true);
    setLoadError('');
    try {
      const available = await fetchUnassignedTokens(op, assignedTokenNumbers);
      setTokens(available);
    } catch {
      setLoadError('Не удалось загрузить список токенов.');
    } finally {
      setLoading(false);
    }
  };

  const loadClientTokens = async () => {
    if (!clientId) return;
    setLoading(true);
    setLoadError('');
    try {
      const available = await fetchTokensByClient(clientId, assignedTokenNumbers);
      setTokens(available);
    } catch {
      setLoadError('Не удалось загрузить список токенов.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOperator = (op: TokenOperatorType) => {
    setOperatorType(op);
    setStep('tokens');
    loadTokens(op);
  };

  const filteredTokens = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tokens;
    return tokens.filter((t) => t.number.toLowerCase().includes(query));
  }, [tokens, search]);

  useEffect(() => {
    if (clientMode) {
      loadClientTokens();
    }
  }, [clientId]);

  const operatorButtons: { type: TokenOperatorType; label: string }[] = [
    { type: 'ikassa', label: 'iKassa' },
    { type: 'cpi', label: 'ЦПИ' },
  ];

  return (
    <Modal
      title={
        clientMode
          ? 'Токены клиента'
          : step === 'operator'
            ? 'Выбор оператора токена'
            : `Токены ${operatorType === 'ikassa' ? 'iKassa' : 'ЦПИ'}`
      }
      onClose={onClose}
    >
      {!clientMode && step === 'operator' ? (
        <div className="flex flex-col gap-4 pb-16">
          <p className="text-sm text-slate-600">Токен какого оператора хотите выбрать?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {operatorButtons.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectOperator(type)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-8 text-base font-medium text-slate-900 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-16">
          {!clientMode && (
            <button
              type="button"
              onClick={() => setStep('operator')}
              className="self-start text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              ← Назад к выбору оператора
            </button>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по номеру токена"
              aria-label="Поиск токенов"
              className={`${inputClassName} pl-10`}
            />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Загрузка доступных токенов...</p>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <TriangleAlert className="h-6 w-6 text-red-600" />
              <p className="text-sm text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={() => operatorType && loadTokens(operatorType)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
              >
                Повторить
              </button>
            </div>
          ) : filteredTokens.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {tokens.length === 0
                ? clientMode
                  ? 'Нет свободных токенов у этого клиента. Добавьте токен в справочник и привяжите к клиенту.'
                  : 'Нет свободных токенов этого оператора. Добавьте токен в справочник.'
                : 'Ничего не найдено.'}
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
              {filteredTokens.map((token) => (
                <li key={token.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(token.number, token.operator_type);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm tabular-nums text-slate-900 transition-colors hover:bg-blue-50"
                  >
                    {token.number}
                    {assigned.has(token.number) && (
                      <span className="text-xs text-slate-400">(текущий)</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
