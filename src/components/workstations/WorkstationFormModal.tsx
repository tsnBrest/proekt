import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import TokenPicker from '@/components/workstations/TokenPicker';
import ClientFormModal from '@/components/clients/ClientFormModal';
import { createWorkstation, updateWorkstation } from '@/lib/api/workstations';
import { fetchClients } from '@/lib/api/clients';
import { fetchCloudCashRegistersByClient } from '@/lib/api/cloudCashRegisters';
import { fetchTokens } from '@/lib/api/tokens';
import type { Client, CloudCashRegister, Token, Workstation, WorkstationInput } from '@/types/directory';

type FormErrors = Partial<Record<keyof WorkstationInput, string>>;

interface WorkstationFormModalProps {
  workstation: Workstation | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function WorkstationFormModal({ workstation, onClose, onSaved }: WorkstationFormModalProps) {
  const [values, setValues] = useState<WorkstationInput>(() => ({
    token_number: workstation?.token_number ?? '',
    model: workstation?.model ?? '',
    software_version: workstation?.software_version ?? '',
    client_id: workstation?.client_id ?? '',
    installation_address: workstation?.installation_address ?? '',
    is_cloud: workstation?.is_cloud ?? false,
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [cloudRegisters, setCloudRegisters] = useState<CloudCashRegister[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [selectedCloudId, setSelectedCloudId] = useState('');
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError('');
    try {
      setClients(await fetchClients());
    } catch {
      setClientsError('Не удалось загрузить список клиентов.');
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    setTokensLoading(true);
    fetchTokens()
      .then(setAllTokens)
      .catch(() => setAllTokens([]))
      .finally(() => setTokensLoading(false));
  }, []);

  useEffect(() => {
    setSelectedCloudId('');
    if (!values.client_id) {
      setCloudRegisters([]);
      return;
    }
    setCloudLoading(true);
    fetchCloudCashRegistersByClient(values.client_id)
      .then(setCloudRegisters)
      .catch(() => setCloudRegisters([]))
      .finally(() => setCloudLoading(false));
  }, [values.client_id]);

  const updateField = (key: keyof WorkstationInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: WorkstationInput = {
      token_number: values.token_number.trim(),
      model: values.model.trim(),
      software_version: values.software_version.trim(),
      client_id: values.client_id || null,
      installation_address: values.installation_address.trim(),
      is_cloud: values.is_cloud,
    };

    const nextErrors: FormErrors = {};
    if (!payload.model) nextErrors.model = 'Укажите модель ПК';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (workstation) {
        await updateWorkstation(workstation.id, payload);
      } else {
        await createWorkstation(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить ПК. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  const assignedTokenNumbers = useMemo(
    () => (workstation ? [workstation.token_number] : []),
    [workstation],
  );

  return (
    <Modal
      title={workstation ? 'Редактирование ПК' : 'Новый ПК'}
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
            form="workstation-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="workstation-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2">
        <FormField label="№ токена" htmlFor="workstation-token" hint="Выбирается из справочника токенов">
          <button
            id="workstation-token"
            type="button"
            onClick={() => setTokenPickerOpen(true)}
            className={`${inputClassName} text-left ${values.token_number ? 'text-slate-900' : 'text-slate-400'}`}
          >
            {values.token_number || 'Выбрать токен из справочника'}
          </button>
        </FormField>

        <FormField
          label="Модель ПК"
          htmlFor="workstation-model"
          error={errors.model}
          hint={
            values.is_cloud
              ? !values.client_id
                ? 'Сначала выберите клиента'
                : cloudLoading
                  ? 'Загрузка облачных касс...'
                  : cloudRegisters.length === 0
                    ? 'У клиента нет облачных касс'
                    : 'Выбор из облачных касс клиента'
              : 'Введите модель вручную'
          }
        >
          {values.is_cloud ? (
            <select
              id="workstation-model"
              className={inputClassName}
              value={selectedCloudId}
              onChange={(event) => {
                const selected = cloudRegisters.find((r) => r.id === event.target.value);
                setSelectedCloudId(event.target.value);
                if (selected) {
                  updateField('model', selected.pc_model || '');
                  updateField('software_version', selected.pc_software_version || '');
                  updateField('installation_address', selected.pc_installation_address || '');
                }
              }}
              disabled={cloudLoading || !values.client_id}
            >
              <option value="">{cloudLoading ? 'Загрузка...' : 'Выберите модель'}</option>
              {cloudRegisters.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.pc_model}{reg.pc_installation_address ? ` — ${reg.pc_installation_address}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="workstation-model"
              className={inputClassName}
              value={values.model}
              onChange={(event) => updateField('model', event.target.value)}
              placeholder="Например, ASUS ET-7102"
            />
          )}
        </FormField>

        <FormField label="Облачная касса" htmlFor="workstation-is-cloud" className="sm:col-span-2">
          <label className="flex items-center gap-3">
            <input
              id="workstation-is-cloud"
              type="checkbox"
              checked={values.is_cloud}
              onChange={(event) => {
                setSelectedCloudId('');
                setValues((prev) => ({ ...prev, is_cloud: event.target.checked, model: '', software_version: '', installation_address: '' }));
                setErrors((prev) => ({ ...prev, model: undefined }));
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            />
            <span className="text-sm text-slate-700">Выбрать модель ПК из облачных касс клиента</span>
          </label>
        </FormField>

        <FormField label="Версия ПК" htmlFor="workstation-software" hint="Подставляется из справочника моделей">
          <input
            id="workstation-software"
            className={inputClassName}
            value={values.software_version}
            onChange={(event) => updateField('software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField
          label="Принадлежность (клиент)"
          htmlFor="workstation-client"
          hint={clientsLoading ? 'Загрузка клиентов...' : hasClients ? undefined : 'Сначала добавьте клиента'}
          className="sm:col-span-2"
        >
          <div className="flex items-stretch gap-2">
            <ClientPicker
              id="workstation-client"
              clients={clients}
              value={values.client_id || null}
              onChange={(clientId) => updateField('client_id', clientId)}
              disabled={clientsLoading}
            />
            <button
              type="button"
              onClick={() => setClientFormOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>
          {clientsError && (
            <p className="mt-2 text-sm text-red-600">
              {clientsError}{' '}
              <button type="button" onClick={loadClients} className="font-medium underline">
                Повторить
              </button>
            </p>
          )}
        </FormField>

        <FormField label="Адрес установки" htmlFor="workstation-address" className="sm:col-span-2">
          <input
            id="workstation-address"
            className={inputClassName}
            value={values.installation_address}
            onChange={(event) => updateField('installation_address', event.target.value)}
            placeholder="Например, г. Минск, ул. Примерная, 1"
          />
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>

      {tokenPickerOpen && (
        <TokenPicker
          assignedTokenNumbers={assignedTokenNumbers}
          currentTokenNumber={values.token_number}
          clientId={values.client_id || null}
          onClose={() => setTokenPickerOpen(false)}
          onSelect={(tokenNumber) => {
            updateField('token_number', tokenNumber);
            const token = allTokens.find((t) => t.number === tokenNumber);
            if (token) {
              updateField('installation_address', token.pc_installation_address || '');
            }
          }}
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
