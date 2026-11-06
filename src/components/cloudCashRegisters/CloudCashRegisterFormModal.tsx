import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText, Plus, Search, Users, DollarSign, Cloud } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import ContractFormModal from '@/components/contracts/ContractFormModal';
import ClientFormModal from '@/components/clients/ClientFormModal';
import PcEquipmentFormModal from '@/components/pcEquipment/PcEquipmentFormModal';
import { fetchPcEquipment } from '@/lib/api/pcEquipment';
import { createCloudCashRegister, updateCloudCashRegister } from '@/lib/api/cloudCashRegisters';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import { fetchTradeObjectTypes } from '@/lib/api/tradeObjectTypes';
import { fetchPriceList } from '@/lib/api/priceList';
import { fetchContracts } from '@/lib/api/contracts';
import { fetchClients } from '@/lib/api/clients';
import { fetchStatusesByCategory } from '@/lib/api/statuses';
import type {
  Client,
  Contract,
  CloudCashRegister,
  CloudCashRegisterInput,
  EquipmentModel,
  PcEquipment,
  PriceListItem,
  Status,
  TradeObjectType,
} from '@/types/directory';

interface CloudCashRegisterFormModalProps {
  cashRegister: CloudCashRegister | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  client_id: string | null;
  client_name: string;
  pc_model: string;
  pc_software_version: string;
  equipment_serial_number: string;
  equipment_name: string;
  equipment_status: string;
  pc_installation_address: string;
  working_hours: string;
  gln: string;
  to_type: string;
  contract_number: string;
  register_status: string;
  itp_price: string;
}

export default function CloudCashRegisterFormModal({
  cashRegister,
  onClose,
  onSaved,
}: CloudCashRegisterFormModalProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    client_id: cashRegister?.client_id ?? null,
    client_name: '',
    pc_model: cashRegister?.pc_model ?? '',
    pc_software_version: cashRegister?.pc_software_version ?? '',
    equipment_serial_number: cashRegister?.equipment_serial_number ?? '',
    equipment_name: cashRegister?.equipment_name ?? '',
    equipment_status: cashRegister?.equipment_status ?? '',
    pc_installation_address: cashRegister?.pc_installation_address ?? '',
    working_hours: cashRegister?.working_hours ?? '',
    gln: cashRegister?.gln ?? '',
    to_type: cashRegister?.to_type ?? '',
    contract_number: cashRegister?.contract_number ?? '',
    register_status: cashRegister?.register_status ?? '',
    itp_price: cashRegister ? String(cashRegister.itp_price ?? 0) : '0',
  }));
  const [allModels, setAllModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [tradeObjectTypes, setTradeObjectTypes] = useState<TradeObjectType[]>([]);
  const [tradeObjectTypesLoading, setTradeObjectTypesLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const [contractsOpen, setContractsOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [pcEquipmentOpen, setPcEquipmentOpen] = useState(false);
  const [pcEquipmentFormOpen, setPcEquipmentFormOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [cashRegisterStatuses, setCashRegisterStatuses] = useState<Status[]>([]);

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
    fetchStatusesByCategory('cash_register')
      .then(setCashRegisterStatuses)
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

  const models = useMemo(
    () => allModels.filter((m) => m.model.toLowerCase().includes('dusik')),
    [allModels],
  );

  const updateField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      const input: CloudCashRegisterInput = {
        client_id: values.client_id,
        pc_model: values.pc_model.trim(),
        pc_software_version: values.pc_software_version.trim(),
        equipment_model: '',
        equipment_serial_number: values.equipment_serial_number.trim(),
        equipment_name: values.equipment_name.trim(),
        equipment_status: values.equipment_status,
        installation_name: '',
        pc_installation_address: values.pc_installation_address.trim(),
        working_hours: values.working_hours.trim(),
        gln: values.gln.trim(),
        to_type: values.to_type,
        to_name: '',
        contract_number: values.contract_number.trim(),
        register_status: values.register_status,
        itp_price: parseFloat(values.itp_price) || 0,
      };
      if (cashRegister) {
        await updateCloudCashRegister(cashRegister.id, input);
      } else {
        await createCloudCashRegister(input);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить облачную кассу. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      maxWidth="max-w-5xl"
      title={cashRegister ? 'Редактирование облачной кассы' : 'Новая облачная касса'}
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
            form="cloud-cash-register-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="cloud-cash-register-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-3"
      >
        <FormField label="Оператор" htmlFor="ccr-operator">
          <input
            id="ccr-operator"
            className={`${inputClassName} bg-slate-100`}
            value="iKassa"
            disabled
          />
        </FormField>

        <FormField label="Принадлежность" htmlFor="ccr-client">
          <div className="flex items-stretch gap-2">
            <input
              id="ccr-client"
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

        <FormField label="Статус кассы" htmlFor="ccr-register-status">
          <select
            id="ccr-register-status"
            className={inputClassName}
            value={values.register_status}
            onChange={(event) => updateField('register_status', event.target.value)}
          >
            <option value="">Выберите статус</option>
            {cashRegisterStatuses.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Оборудование" htmlFor="ccr-equipment-name" className="sm:col-span-2">
          <div className="flex items-stretch gap-2">
            <textarea
              id="ccr-equipment-name"
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

        <FormField label="Заводской номер оборудования" htmlFor="ccr-equipment-serial">
          <input
            id="ccr-equipment-serial"
            className={inputClassName}
            value={values.equipment_serial_number}
            onChange={(event) => updateField('equipment_serial_number', event.target.value)}
            placeholder="Заводской номер"
          />
        </FormField>

        <FormField label="Статус оборудования" htmlFor="ccr-equipment-status">
          <select
            id="ccr-equipment-status"
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
          htmlFor="ccr-pc-model"
          hint={modelsLoading ? 'Загрузка моделей...' : 'Только модели Dusik'}
        >
          <ModelPicker
            id="ccr-pc-model"
            models={models}
            value={values.pc_model}
            onModelChange={(model) => updateField('pc_model', model)}
            onSoftwareVersionChange={(version) => updateField('pc_software_version', version)}
            disabled={modelsLoading}
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="ccr-pc-version" hint="Подставляется из справочника моделей">
          <input
            id="ccr-pc-version"
            className={inputClassName}
            value={values.pc_software_version}
            onChange={(event) => updateField('pc_software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField
          label="Вид торгового объекта"
          htmlFor="ccr-trade-object-type"
          hint={tradeObjectTypesLoading ? 'Загрузка справочника...' : 'Выбор из справочника типов'}
        >
          <select
            id="ccr-trade-object-type"
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

        <FormField label="Адрес установки ПК" htmlFor="ccr-pc-installation-address">
          <input
            id="ccr-pc-installation-address"
            className={inputClassName}
            value={values.pc_installation_address}
            onChange={(event) => updateField('pc_installation_address', event.target.value)}
            placeholder="Адрес установки ПК"
          />
        </FormField>

        <FormField label="Режим работы" htmlFor="ccr-working-hours" hint="Формат: ЧЧ:ММ — ЧЧ:ММ">
          <input
            id="ccr-working-hours"
            className={inputClassName}
            value={values.working_hours}
            onChange={(event) => updateField('working_hours', event.target.value)}
            placeholder="08:00 — 22:00"
          />
        </FormField>

        <FormField label="GLN" htmlFor="ccr-gln">
          <input
            id="ccr-gln"
            className={inputClassName}
            value={values.gln}
            onChange={(event) => updateField('gln', event.target.value)}
            placeholder="GLN код"
          />
        </FormField>

        <FormField label="№ договора с ЦТО «Анъюск»" htmlFor="ccr-contract-number">
          <div className="flex items-stretch gap-2">
            <input
              id="ccr-contract-number"
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

        <FormField label="Стоимость ИТП" htmlFor="ccr-itp-price">
          <div className="flex items-stretch gap-2">
            <input
              id="ccr-itp-price"
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
