import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, TriangleAlert, Cloud } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { inputClassName } from '@/components/ui/FormField';
import { fetchTokensByClient, fetchUnassignedTokens } from '@/lib/api/tokens';
import { fetchCloudCashRegistersByClient } from '@/lib/api/cloudCashRegisters';
import type { CloudCashRegister, Token, TokenOperatorType } from '@/types/directory';

interface TokenPickerProps {
  assignedTokenNumbers: string[];
  currentTokenNumber: string;
  onClose: () => void;
  onSelect: (
    tokenNumber: string,
    operatorType: TokenOperatorType,
    cloudRegister?: CloudCashRegister,
  ) => void;
  clientId?: string | null;
  cloudRegisters?: CloudCashRegister[];
}

type ListItem =
  | { kind: 'token'; id: string; number: string; operatorType: TokenOperatorType; subtitle: string }
  | { kind: 'cloud'; id: string; number: string; pcModel: string; address: string; register: CloudCashRegister };

export default function TokenPicker({
  assignedTokenNumbers,
  currentTokenNumber,
  onClose,
  onSelect,
  clientId = null,
  cloudRegisters: externalCloudRegisters,
}: TokenPickerProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [internalCloudRegisters, setInternalCloudRegisters] = useState<CloudCashRegister[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const cloudRegisters = externalCloudRegisters ?? internalCloudRegisters;

  const assigned = useMemo(() => {
    const set = new Set(assignedTokenNumbers.map((n) => n.trim()).filter(Boolean));
    if (currentTokenNumber.trim()) {
      set.delete(currentTokenNumber.trim());
    }
    return set;
  }, [assignedTokenNumbers, currentTokenNumber]);

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tokenList, cloudList] = await Promise.all([
        clientId
          ? fetchTokensByClient(clientId, assignedTokenNumbers)
          : fetchUnassignedTokens('ikassa', assignedTokenNumbers),
        externalCloudRegisters
          ? Promise.resolve([] as CloudCashRegister[])
          : clientId
            ? fetchCloudCashRegistersByClient(clientId)
            : Promise.resolve([] as CloudCashRegister[]),
      ]);
      setTokens(tokenList.filter((t) => t.status !== 'снят с регистрации'));
      if (!externalCloudRegisters) setInternalCloudRegisters(cloudList);
    } catch {
      setLoadError('Не удалось загрузить список.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [clientId]);

  const items: ListItem[] = useMemo(() => {
    const tokenItems: ListItem[] = tokens.map((t) => ({
      kind: 'token' as const,
      id: t.id,
      number: t.number,
      operatorType: t.operator_type,
      subtitle: t.pc_installation_address || t.pc_model || '',
    }));
    const cloudItems: ListItem[] = cloudRegisters.map((r) => ({
      kind: 'cloud' as const,
      id: r.id,
      number: r.pc_model || 'DUSIC',
      pcModel: r.pc_model,
      address: r.pc_installation_address,
      register: r,
    }));
    return [...tokenItems, ...cloudItems];
  }, [tokens, cloudRegisters]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      if (item.kind === 'token') {
        return item.number.toLowerCase().includes(query) || item.subtitle.toLowerCase().includes(query);
      }
      return item.pcModel.toLowerCase().includes(query) || item.address.toLowerCase().includes(query);
    });
  }, [items, search]);

  return (
    <Modal title={clientId ? 'Токен или DUSIC' : 'Выбор токена или DUSIC'} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по номеру или модели"
            aria-label="Поиск"
            className={`${inputClassName} pl-10`}
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Загрузка...</p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <TriangleAlert className="h-6 w-6 text-red-600" />
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={loadAll}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
            >
              Повторить
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0
              ? clientId
                ? 'Нет доступных токенов или облачных касс у этого клиента.'
                : 'Нет доступных токенов. Добавьте токен в справочник.'
              : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {filteredItems.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.kind === 'token') {
                      onSelect(item.number, item.operatorType);
                    } else {
                      onSelect(item.number, 'ikassa', item.register);
                    }
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50"
                >
                  {item.kind === 'cloud' && <Cloud className="h-4 w-4 shrink-0 text-blue-500" />}
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="tabular-nums font-medium text-slate-900">{item.number}</span>
                    {item.kind === 'token' && item.subtitle && (
                      <span className="text-xs text-slate-500">{item.subtitle}</span>
                    )}
                    {item.kind === 'cloud' && item.address && (
                      <span className="text-xs text-slate-500">{item.address}</span>
                    )}
                  </span>
                  {item.kind === 'cloud' && (
                    <span className="shrink-0 text-xs font-medium text-blue-600">DUSIC</span>
                  )}
                  {item.kind === 'token' && assigned.has(item.number) && (
                    <span className="shrink-0 text-xs text-slate-400">(текущий)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
