import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText, Plus, Search, Users, Database, Monitor, DollarSign } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import ContractFormModal from '@/components/contracts/ContractFormModal';
import ClientFormModal from '@/components/clients/ClientFormModal';
import PcEquipmentFormModal from '@/components/pcEquipment/PcEquipmentFormModal';
import { fetchTokenBatchesByOperator, deleteTokenBatchByNumber } from '@/lib/api/tokenBatches';
import { fetchPcEquipment } from '@/lib/api/pcEquipment';
import { createToken, updateToken, DUPLICATE_ERROR_CODE } from '@/lib/api/tokens';
import { fetchStatusesByCategory } from '@/lib/api/statuses';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import { fetchTradeObjectTypes } from '@/lib/api/tradeObjectTypes';
import { fetchPriceList } from '@/lib/api/priceList';
import { fetchContracts } from '@/lib/api/contracts';
import { fetchClients } from '@/lib/api/clients';
import type {
  Client,
  Contract,
  EquipmentModel,
  PcEquipment,
  PriceListItem,
  Status,
  Token,
  TokenBatch,
  TokenInput,
  TokenOperatorType,
  TradeObjectType,
} from '@/types/directory';

interface TokenFormModalProps {
  operatorType: TokenOperatorType;
  token: Token | null;
  onClose: () => void;
  onSaved: () => void;
}

const OPERATOR_LABEL: Record<TokenOperatorType, string> = {
  ikassa: 'iKassa',
  cpi: 'ЦПИ',
};

type ExtendedValues = {
  number: string;
  client_id: string | null;
  client_name: string;
  pc_model: string;
  pc_software_version: string;
  equipment_model: string;
  equipment_serial_number: string;
  equipment_name: string;
  equipment_status: string;
  installation_name: string;
  pc_installation_address: string;
  working_hours: string;
  gln: string;
  to_type: string;
  to_name: string;
  contract_number: string;
  status: string;
  itp_price: string;
};

export default function TokenFormModal({ operatorType, token, onClose, onSaved }: TokenFormModalProps) {
  const [values, setValues] = useState<ExtendedValues>(() => ({
    number: token?.number ?? '',
    client_id: token?.client_id ?? null,
    client_name: '',
    pc_model: token?.pc_model ?? '',
    pc_software_version: token?.pc_software_version ?? '',
    equipment_model: token?.equipment_model ?? '',
    equipment_serial_number: token?.equipment_serial_number ?? '',
    equipment_name: token?.equipment_name ?? '',
    equipment_status: token?.equipment_status ?? '',
    installation_name: token?.installation_name ?? '',
    pc_installation_address: token?.pc_installation_address ?? '',
    working_hours: token?.working_hours ?? '',
    gln: token?.gln ?? '',
    to_type: token?.to_type ?? '',
    to_name: token?.to_name ?? '',
    contract_number: token?.contract_number ?? '',
    status: token?.status ?? 'присвоен',
    itp_price: token ? String(token.itp_price ?? 0) : '0',
  }));
  const [allModels, setAllModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [tradeObjectTypes, setTradeObjectTypes] = useState<TradeObjectType[]>([]);
  const [tradeObjectTypesLoading, setTradeObjectTypesLoading] = useState(true);
  const [numberError, setNumberError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const [contractsOpen, setContractsOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [tokenBaseOpen, setTokenBaseOpen] = useState(false);
  const [pcEquipmentOpen, setPcEquipmentOpen] = useState(false);
  const [pcEquipmentFormOpen, setPcEquipmentFormOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [tokenStatuses, setTokenStatuses] = useState<Status[]>([]);

  useEffect(() => {
    fetchEquipmentModels()
      .then(setAllModels)
      .catch(() => undefined)
      .finally(() => setModelsLoading(false));
    fetchTradeObjectTypes()
      .then(setTradeObjectTypes)
      .catch(() => undefined)
      .finally(() => setTradeObjectTypesLoading(false));
    fetchPriceList()
      .then(setPriceList)
      .catch(() => undefined);
    fetchStatusesByCategory('token')
      .then(setTokenStatuses)
      .catch(() => undefined);
    if (values.client_id) {
      fetchClients()
        .then((clients) => {
          const found = clients.find((c) => c.id === values.client_id);
          if (found) setValues((prev) => ({ ...prev, client_name: found.name }));
        })
        .catch(() => undefined);
    }
  }, []);

  const isCpi = operatorType === 'cpi';

  const models = useMemo(
    () => allModels.filter((m) => m.model.toLowerCase().includes('dusik')),
    [allModels],
  );

  const updateField = useCallback(<K extends keyof ExtendedValues>(key: K, value: ExtendedValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = values.number.trim();
    if (!trimmed) {
      setNumberError('Укажите номер токена');
      return;
    }
    setNumberError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input: TokenInput = {
        number: trimmed,
        operator_type: operatorType,
        client_id: values.client_id,
        pc_model: values.pc_model,
        pc_software_version: values.pc_software_version,
        equipment_model: '',
        equipment_serial_number: values.equipment_serial_number,
        equipment_name: values.equipment_name,
        equipment_status: values.equipment_status,
        installation_name: '',
        pc_installation_address: values.pc_installation_address,
        working_hours: values.working_hours,
        gln: values.gln,
        to_type: values.to_type,
        to_name: '',
        contract_number: values.contract_number,
        status: values.status as TokenInput['status'],
        itp_price: parseFloat(values.itp_price) || 0,
      };
      if (token) {
        await updateToken(token.id, input);
      } else {
        await createToken(input);
        const batchNumber = values.number.replace(/^AVQ/i, '').trim();
        if (batchNumber) {
          const batchLabel = isCpi ? 'ЦПИ' : 'АЙЭМЛЭБ';
          try {
            await deleteTokenBatchByNumber(batchLabel, batchNumber);
          } catch {
            // non-critical
          }
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(
        code === DUPLICATE_ERROR_CODE
          ? 'Токен с таким номером уже есть в справочнике'
          : 'Не удалось сохранить токен. Попробуйте еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      maxWidth="max-w-5xl"
      title={token ? `Редактирование токена ${OPERATOR_LABEL[operatorType]}` : `Новый токен ${OPERATOR_LABEL[operatorType]}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="token-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="token-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-3"
      >
        <FormField label="Оператор" htmlFor="token-operator">
          <input
            id="token-operator"
            className={`${inputClassName} bg-slate-100`}
            value={OPERATOR_LABEL[operatorType]}
            disabled
          />
        </FormField>

        <FormField label="Номер токена" htmlFor="token-number" error={numberError}>
          <div className="flex items-stretch gap-2">
            <input
              id="token-number"
              className={inputClassName}
              value={values.number}
              onChange={(event) => updateField('number', event.target.value)}
              placeholder="Например, AVQ000123"
              autoFocus
            />
            {isCpi ? (
              <button
                type="button"
                onClick={() => setTokenBaseOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <Database className="h-4 w-4" />
                Токен ЦПИ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTokenBaseOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
              >
                <Database className="h-4 w-4" />
                Токен iKassa
              </button>
            )}
          </div>
        </FormField>

        <FormField label="Принадлежность" htmlFor="token-client">
          <div className="flex items-stretch gap-2">
            <input
              id="token-client"
              className={`${inputClassName} ${values.client_name ? 'text-slate-900' : 'text-slate-400'}`}
              value={values.client_name}
              readOnly
              placeholder="Выберите клиента"
            />
            <button
              type="button"
              onClick={() => setClientsOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Клиент
            </button>
          </div>
        </FormField>

        <FormField label="Статус токена" htmlFor="token-status">
          <select
            id="token-status"
            className={inputClassName}
            value={values.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            {tokenStatuses.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Оборудование" htmlFor="token-equipment-name" className="sm:col-span-2">
          <div className="flex items-stretch gap-2">
            <textarea
              id="token-equipment-name"
              className={inputClassName}
              value={values.equipment_name}
              onChange={(event) => updateField('equipment_name', event.target.value)}
              placeholder="Наименование оборудования"
              rows={2}
            />
            <button
              type="button"
              onClick={() => setPcEquipmentOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Выбрать
            </button>
            <button
              type="button"
              onClick={() => setPcEquipmentFormOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Оборудование
            </button>
          </div>
        </FormField>

        <FormField label="Заводской номер оборудования" htmlFor="token-equipment-serial-cpi">
          <input
            id="token-equipment-serial-cpi"
            className={inputClassName}
            value={values.equipment_serial_number}
            onChange={(event) => updateField('equipment_serial_number', event.target.value)}
            placeholder="Заводской номер"
          />
        </FormField>

        <FormField label="Статус оборудования" htmlFor="token-equipment-status">
          <select
            id="token-equipment-status"
            className={inputClassName}
            value={values.equipment_status}
            onChange={(event) => updateField('equipment_status', event.target.value)}
          >
            <option value="">Выберите статус</option>
            <option value="аренда банка">Аренда банка</option>
            <option value="аренда ЦТО">Аренда ЦТО</option>
            <option value="покупка в Анъюск">Покупка в Анъюск</option>
            <option value="собственность клиента">Собственность клиента</option>
          </select>
        </FormField>

        <FormField
          label="Модель ПК"
          htmlFor="token-pc-model"
          hint={modelsLoading ? 'Загрузка моделей...' : 'Только модели Dusik'}
        >
          <ModelPicker
            id="token-pc-model"
            models={models}
            value={values.pc_model}
            onModelChange={(model) => updateField('pc_model', model)}
            onSoftwareVersionChange={(version) => updateField('pc_software_version', version)}
            disabled={modelsLoading}
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="token-pc-version" hint="Подставляется из справочника моделей">
          <input
            id="token-pc-version"
            className={inputClassName}
            value={values.pc_software_version}
            onChange={(event) => updateField('pc_software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField
          label="Вид торгового объекта"
          htmlFor="token-trade-object-type"
          hint={tradeObjectTypesLoading ? 'Загрузка справочника...' : 'Выбор из справочника типов'}
        >
          <select
            id="token-trade-object-type"
            className={inputClassName}
            value={values.to_type}
            onChange={(event) => updateField('to_type', event.target.value)}
            disabled={tradeObjectTypesLoading}
          >
            <option value="">
              {tradeObjectTypesLoading ? 'Загрузка...' : 'Выберите тип'}
            </option>
            {tradeObjectTypes.map((tot) => (
              <option key={tot.id} value={tot.name}>
                {tot.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Адрес установки ПК" htmlFor="token-pc-installation-address">
          <input
            id="token-pc-installation-address"
            className={inputClassName}
            value={values.pc_installation_address}
            onChange={(event) => updateField('pc_installation_address', event.target.value)}
            placeholder="Адрес установки ПК"
          />
        </FormField>

        <FormField label="Режим работы" htmlFor="token-working-hours" hint="Формат: ЧЧ:ММ — ЧЧ:ММ">
          <input
            id="token-working-hours"
            className={inputClassName}
            value={values.working_hours}
            onChange={(event) => updateField('working_hours', event.target.value)}
            placeholder="08:00 — 22:00"
          />
        </FormField>

        <FormField label="GLN" htmlFor="token-gln">
          <input
            id="token-gln"
            className={inputClassName}
            value={values.gln}
            onChange={(event) => updateField('gln', event.target.value)}
            placeholder="GLN код"
          />
        </FormField>

        <FormField label="№ договора с ЦТО «Анъюск»" htmlFor="token-contract-number">
          <div className="flex items-stretch gap-2">
            <input
              id="token-contract-number"
              className={inputClassName}
              value={values.contract_number}
              onChange={(event) => updateField('contract_number', event.target.value)}
              placeholder="Номер договора"
            />
            <button
              type="button"
              onClick={() => setContractsOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              Договор
            </button>
          </div>
        </FormField>

        <FormField label="Стоимость ИТП" htmlFor="token-itp-price">
          <div className="flex items-stretch gap-2">
            <input
              id="token-itp-price"
              type="number"
              step="0.001"
              min="0"
              className={inputClassName}
              value={values.itp_price}
              onChange={(event) => updateField('itp_price', event.target.value)}
              placeholder="0.000"
            />
            <button
              type="button"
              onClick={() => setPriceListOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <DollarSign className="h-4 w-4" />
              Выбрать
            </button>
          </div>
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>

      {contractsOpen && (
        <ContractPickerModal
          currentContractNumber={values.contract_number}
          onClose={() => setContractsOpen(false)}
          onSelect={(contractNumber) => {
            updateField('contract_number', contractNumber);
            setContractsOpen(false);
          }}
        />
      )}

      {clientsOpen && (
        <ClientPickerModal
          currentClientId={values.client_id}
          onClose={() => setClientsOpen(false)}
          onSelect={(clientId, clientName) => {
            setValues((prev) => ({ ...prev, client_id: clientId, client_name: clientName }));
            setClientsOpen(false);
          }}
        />
      )}

      {tokenBaseOpen && (
        <TokenBasePickerModal
          operatorLabel={isCpi ? 'ЦПИ' : 'АЙЭМЛЭБ'}
          onClose={() => setTokenBaseOpen(false)}
          onSelect={(tokenNumber) => {
            updateField('number', tokenNumber);
            setTokenBaseOpen(false);
          }}
        />
      )}

      {pcEquipmentOpen && (
        <PcEquipmentPickerModal
          onClose={() => setPcEquipmentOpen(false)}
          onSelect={(name, serialNumber, status) => {
            updateField('equipment_name', name);
            updateField('equipment_serial_number', serialNumber);
            updateField('equipment_status', status);
            setPcEquipmentOpen(false);
          }}
        />
      )}

      {priceListOpen && (
        <PriceListPickerModal
          filter="Dusik ИТП"
          items={priceList}
          onClose={() => setPriceListOpen(false)}
          onSelect={(price) => {
            updateField('itp_price', String(price));
            setPriceListOpen(false);
          }}
        />
      )}

      {clientFormOpen && (
        <ClientFormModal
          client={null}
          onClose={() => setClientFormOpen(false)}
          onSaved={(created) => {
            setClientFormOpen(false);
            if (created) {
              setValues((prev) => ({ ...prev, client_id: created.id, client_name: created.name }));
            }
          }}
        />
      )}

      {pcEquipmentFormOpen && (
        <PcEquipmentFormModal
          item={null}
          onClose={() => setPcEquipmentFormOpen(false)}
          onSaved={() => setPcEquipmentFormOpen(false)}
        />
      )}
    </Modal>
  );
}

interface ContractPickerModalProps {
  currentContractNumber: string;
  onClose: () => void;
  onSelect: (contractNumber: string) => void;
}

function ContractPickerModal({ currentContractNumber, onClose, onSelect }: ContractPickerModalProps) {
  const [items, setItems] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(currentContractNumber);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const loadContracts = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchContracts()
      .then(setItems)
      .catch(() => setLoadError('Не удалось загрузить договоры.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.number.toLowerCase().includes(query) ||
        (item.client?.name ?? '').toLowerCase().includes(query),
    );
  }, [items, search]);

  return (
    <Modal
      maxWidth="max-w-3xl"
      title="Выбор договора"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Добавить договор
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => selectedNumber && onSelect(selectedNumber)}
            disabled={!selectedNumber}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Выбрать
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по номеру или клиенту"
            aria-label="Поиск договоров"
            className={`${inputClassName} pl-10`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Загрузка...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0 ? 'Договоров пока нет.' : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {visibleItems.map((item) => {
              const isSelected = item.number === selectedNumber;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedNumber(item.number)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className={`tabular-nums font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {item.number}
                      </span>
                      <span className="text-xs text-slate-500">{item.client?.name ?? '—'}</span>
                    </span>
                    {isSelected && <span className="text-xs font-medium text-blue-600">Выбран</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addFormOpen && (
        <ContractFormModal
          contract={null}
          onClose={() => setAddFormOpen(false)}
          onSaved={() => {
            setAddFormOpen(false);
            loadContracts();
          }}
        />
      )}
    </Modal>
  );
}

interface ClientPickerModalProps {
  currentClientId: string | null;
  onClose: () => void;
  onSelect: (clientId: string, clientName: string) => void;
}

function ClientPickerModal({ currentClientId, onClose, onSelect }: ClientPickerModalProps) {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(currentClientId);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const loadClients = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchClients()
      .then(setItems)
      .catch(() => setLoadError('Не удалось загрузить клиентов.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.unp.includes(query),
    );
  }, [items, search]);

  const selectedClient = items.find((c) => c.id === selectedId);

  return (
    <Modal
      maxWidth="max-w-3xl"
      title="Выбор клиента"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Добавить клиента
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => selectedClient && onSelect(selectedClient.id, selectedClient.name)}
            disabled={!selectedId}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Выбрать
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию или УНП"
            aria-label="Поиск клиентов"
            className={`${inputClassName} pl-10`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Загрузка...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0 ? 'Клиентов пока нет.' : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {visibleItems.map((client) => {
              const isSelected = client.id === selectedId;
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(client.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {client.name}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">УНП: {client.unp}</span>
                    </span>
                    {isSelected && <span className="text-xs font-medium text-blue-600">Выбран</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addFormOpen && (
        <ClientFormModal
          client={null}
          onClose={() => setAddFormOpen(false)}
          onSaved={(created) => {
            setAddFormOpen(false);
            if (created) {
              onSelect(created.id, created.name);
            } else {
              loadClients();
            }
          }}
        />
      )}
    </Modal>
  );
}

interface TokenBasePickerModalProps {
  operatorLabel: string;
  onClose: () => void;
  onSelect: (tokenNumber: string) => void;
}

function TokenBasePickerModal({ operatorLabel, onClose, onSelect }: TokenBasePickerModalProps) {
  const [items, setItems] = useState<TokenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<TokenBatch | null>(null);

  useEffect(() => {
    fetchTokenBatchesByOperator(operatorLabel as 'ЦПИ' | 'АЙЭМЛЭБ')
      .then(setItems)
      .catch(() => setLoadError('Не удалось загрузить базу токенов.'))
      .finally(() => setLoading(false));
  }, [operatorLabel]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.start_number.toLowerCase().includes(query) ||
        item.end_number.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleSelect = (batch: TokenBatch) => {
    onSelect(`AVQ${batch.start_number}`);
  };

  return (
    <Modal
      maxWidth="max-w-3xl"
      title={`Токены база — ${operatorLabel}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => selectedBatch && handleSelect(selectedBatch)}
            disabled={!selectedBatch}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Выбрать
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по номеру токена"
            aria-label="Поиск по базе токенов"
            className={`${inputClassName} pl-10`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Загрузка...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0 ? `Токенов ${operatorLabel} в базе нет.` : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {visibleItems.map((batch) => {
              const isSelected = selectedBatch?.id === batch.id;
              return (
                <li key={batch.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(batch)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className={`tabular-nums font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        AVQ{batch.start_number}
                      </span>
                      {batch.arrival_date && (
                        <span className="text-xs text-slate-500">
                          {new Date(batch.arrival_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </span>
                    {isSelected && <span className="text-xs font-medium text-blue-600">Выбран</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

interface PcEquipmentPickerModalProps {
  onClose: () => void;
  onSelect: (name: string, serialNumber: string, status: string) => void;
}

function PcEquipmentPickerModal({ onClose, onSelect }: PcEquipmentPickerModalProps) {
  const [items, setItems] = useState<PcEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<PcEquipment | null>(null);

  const loadItems = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchPcEquipment()
      .then(setItems)
      .catch(() => setLoadError('Не удалось загрузить справочник оборудования ПК.'))
      .finally(() => setLoading(false));
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
        item.serial_number.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query),
    );
  }, [items, search]);

  return (
    <Modal
      maxWidth="max-w-3xl"
      title="Справочник оборудования ПК"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => selectedItem && onSelect(selectedItem.name, selectedItem.serial_number, selectedItem.status)}
            disabled={!selectedItem}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Выбрать
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по наименованию, номеру, статусу"
            aria-label="Поиск оборудования ПК"
            className={`${inputClassName} pl-10`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Загрузка...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0 ? 'Оборудования ПК пока нет.' : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {visibleItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{item.name || '—'}</span>
                      <span className="text-xs tabular-nums text-slate-500">
                        {item.serial_number || '—'} · {item.status}
                      </span>
                    </span>
                    {isSelected && <span className="text-xs font-medium text-blue-600">Выбран</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

interface PriceListPickerModalProps {
  filter: string;
  items: PriceListItem[];
  onClose: () => void;
  onSelect: (price: number) => void;
}

function PriceListPickerModal({ filter, items, onClose, onSelect }: PriceListPickerModalProps) {
  const [search, setSearch] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!item.work_name.toLowerCase().includes(filter.toLowerCase())) return false;
      if (!query) return true;
      return item.work_name.toLowerCase().includes(query);
    });
  }, [items, filter, search]);

  return (
    <Modal
      maxWidth="max-w-3xl"
      title={`Выбор стоимости ИТП — ${filter}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => selectedPrice !== null && onSelect(selectedPrice)}
            disabled={selectedPrice === null}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Выбрать
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по наименованию работы"
            aria-label="Поиск прейскуранта"
            className={`${inputClassName} pl-10`}
          />
        </div>

        {filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {items.length === 0 ? 'Прейскурант пуст.' : 'Ничего не найдено.'}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
            {filteredItems.map((item) => {
              const isSelected = selectedPrice === item.price;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPrice(item.price)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{item.work_name}</span>
                      <span className="text-xs tabular-nums text-slate-500">
                        {item.price.toFixed(3)} · коэф. {item.coefficient.toFixed(3)}
                      </span>
                    </span>
                    {isSelected && <span className="text-xs font-medium text-blue-600">Выбран</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
