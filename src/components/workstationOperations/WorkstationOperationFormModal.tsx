import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import TokenFormModal from '@/components/tokens/TokenFormModal';
import ClientFormModal from '@/components/clients/ClientFormModal';
import TokenPicker from '@/components/workstations/TokenPicker';
import { createWorkstationOperation, updateWorkstationOperation } from '@/lib/api/workstationOperations';
import { fetchClients } from '@/lib/api/clients';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import type {
  Client,
  EquipmentModel,
  WorkstationOperation,
  WorkstationOperationInput,
  WorkstationOperationType,
} from '@/types/directory';

type FormErrors = Partial<Record<keyof WorkstationOperationInput, string>>;

interface WorkstationOperationFormModalProps {
  operationType: WorkstationOperationType;
  operation: WorkstationOperation | null;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_TITLES: Record<WorkstationOperationType, string> = {
  registration: 'Регистрация ПК',
  deregistration: 'Снятие ПК',
  address_change: 'Изменение адреса ПК',
  other: 'Другие документы',
};

export default function WorkstationOperationFormModal({
  operationType,
  operation,
  onClose,
  onSaved,
}: WorkstationOperationFormModalProps) {
  const [values, setValues] = useState<WorkstationOperationInput>(() => ({
    workstation_id: operation?.workstation_id ?? null,
    operation_type: operationType,
    operation_date: operation?.operation_date ?? new Date().toISOString().slice(0, 10),
    client_id: operation?.client_id ?? null,
    address: operation?.address ?? '',
    is_cloud: operation?.is_cloud ?? false,
    token_number: operation?.token_number ?? '',
    notes: operation?.notes ?? '',
    pc_model: operation?.pc_model ?? '',
    pc_software_version: operation?.pc_software_version ?? '',
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [tokenFormOpen, setTokenFormOpen] = useState<null | 'ikassa' | 'cpi'>(null);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      setClients(await fetchClients());
    } catch {
      // ignore
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipmentModels()
      .then(setModels)
      .catch(() => undefined)
      .finally(() => setModelsLoading(false));
    loadClients();
  }, [loadClients]);

  const updateField = (key: keyof WorkstationOperationInput, value: string | boolean | null) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const isRegistration = operationType === 'registration';
  const needsAddress = operationType === 'registration' || operationType === 'address_change';
  const needsNotes = operationType === 'deregistration' || operationType === 'other';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: WorkstationOperationInput = {
      workstation_id: null,
      operation_type: operationType,
      operation_date: values.operation_date,
      client_id: values.client_id || null,
      address: values.address.trim(),
      is_cloud: isRegistration ? values.is_cloud : false,
      token_number: isRegistration && !values.is_cloud ? values.token_number.trim() : '',
      notes: values.notes.trim(),
      pc_model: values.pc_model.trim(),
      pc_software_version: values.pc_software_version.trim(),
    };

    const nextErrors: FormErrors = {};
    if (!payload.operation_date) nextErrors.operation_date = 'Укажите дату';
    if (isRegistration && !payload.client_id) nextErrors.client_id = 'Выберите клиента';
    if (needsAddress && !payload.address) nextErrors.address = 'Укажите адрес';
    if (isRegistration && !payload.is_cloud && !payload.token_number)
      nextErrors.token_number = 'Выберите токен или отметьте «Облачная»';
    if (needsNotes && !payload.notes) nextErrors.notes = 'Укажите описание';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (operation) {
        await updateWorkstationOperation(operation.id, payload);
      } else {
        await createWorkstationOperation(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить запись. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Modal
      maxWidth="max-w-4xl"
      title={operation ? `Редактирование: ${TYPE_TITLES[operationType]}` : TYPE_TITLES[operationType]}
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
            form="ws-operation-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="ws-operation-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2"
      >
        <FormField label="Дата" htmlFor="ws-op-date" error={errors.operation_date}>
          <input
            id="ws-op-date"
            type="date"
            className={inputClassName}
            value={values.operation_date}
            onChange={(event) => updateField('operation_date', event.target.value)}
          />
        </FormField>

        {isRegistration && (
          <FormField label="Клиент" htmlFor="ws-op-client" error={errors.client_id} hint={clientsLoading ? 'Загрузка клиентов...' : undefined}>
            <div className="flex items-stretch gap-2">
              <ClientPicker
                id="ws-op-client"
                clients={clients}
                value={values.client_id}
                onChange={(clientId) => updateField('client_id', clientId)}
                disabled={clientsLoading}
              />
              <button
                type="button"
                onClick={() => setClientFormOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </button>
            </div>
          </FormField>
        )}

        {isRegistration && (
          <FormField
            label="Модель ПК"
            htmlFor="ws-op-pc-model"
            hint={modelsLoading ? 'Загрузка моделей...' : 'Выбор из справочника моделей'}
          >
            <ModelPicker
              id="ws-op-pc-model"
              models={models}
              value={values.pc_model}
              onModelChange={(model) => updateField('pc_model', model)}
              onSoftwareVersionChange={(version) => updateField('pc_software_version', version)}
              disabled={modelsLoading}
            />
          </FormField>
        )}

        {isRegistration && (
          <FormField label="Версия ПО" htmlFor="ws-op-pc-version" hint="Подставляется из справочника моделей">
            <input
              id="ws-op-pc-version"
              className={inputClassName}
              value={values.pc_software_version}
              onChange={(event) => updateField('pc_software_version', event.target.value)}
              placeholder="Например, 5.6.2"
            />
          </FormField>
        )}

        {isRegistration && (
          <FormField label="Тип регистрации" htmlFor="ws-op-cloud" className="sm:col-span-2">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  id="ws-op-cloud"
                  type="checkbox"
                  checked={values.is_cloud}
                  onChange={(event) => {
                    updateField('is_cloud', event.target.checked);
                    if (event.target.checked) updateField('token_number', '');
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                Облачная
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!values.is_cloud}
                  onChange={(event) => updateField('is_cloud', !event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                Токен
              </label>
            </div>
          </FormField>
        )}

        {isRegistration && !values.is_cloud && (
          <>
            <FormField
              label="Токен"
              htmlFor="ws-op-token"
              error={errors.token_number}
              hint="Токены выбранного клиента"
            >
              <button
                id="ws-op-token"
                type="button"
                onClick={() => values.client_id && setTokenPickerOpen(true)}
                disabled={!values.client_id}
                className={`${inputClassName} text-left ${values.token_number ? 'text-slate-900' : 'text-slate-400'} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {values.token_number || (values.client_id ? 'Выберите токен' : 'Сначала выберите клиента')}
              </button>
            </FormField>

            <FormField label="Новый токен" htmlFor="ws-op-new-token" hint="Создать токен и привязать к клиенту">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTokenFormOpen('ikassa')}
                  disabled={!values.client_id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  iKassa
                </button>
                <button
                  type="button"
                  onClick={() => setTokenFormOpen('cpi')}
                  disabled={!values.client_id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  ЦПИ
                </button>
              </div>
            </FormField>
          </>
        )}

        {needsAddress && (
          <FormField label="Адрес" htmlFor="ws-op-address" error={errors.address} className="sm:col-span-2">
            <input
              id="ws-op-address"
              className={inputClassName}
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder="Например, г. Минск, ул. Примерная, 1"
            />
          </FormField>
        )}

        {(needsNotes || operationType === 'address_change') && (
          <FormField
            label={operationType === 'deregistration' ? 'Причина снятия' : 'Примечание'}
            htmlFor="ws-op-notes"
            error={errors.notes}
            className="sm:col-span-2"
          >
            <textarea
              id="ws-op-notes"
              rows={3}
              className={inputClassName}
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Дополнительные сведения"
            />
          </FormField>
        )}

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>

      {tokenPickerOpen && values.client_id && (
        <TokenPicker
          assignedTokenNumbers={[]}
          currentTokenNumber={values.token_number}
          clientId={values.client_id}
          onClose={() => setTokenPickerOpen(false)}
          onSelect={(tokenNumber) => updateField('token_number', tokenNumber)}
        />
      )}

      {tokenFormOpen && values.client_id && (
        <TokenFormModal
          operatorType={tokenFormOpen}
          token={null}
          onClose={() => setTokenFormOpen(null)}
          onSaved={() => setTokenFormOpen(null)}
        />
      )}

      {clientFormOpen && (
        <ClientFormModal
          client={null}
          onClose={() => setClientFormOpen(false)}
          onSaved={() => {
            setClientFormOpen(false);
            loadClients();
          }}
        />
      )}
    </Modal>
  );
}
