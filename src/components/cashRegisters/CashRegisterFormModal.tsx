import { useEffect, useState, type FormEvent } from 'react';
import ClientPicker from '@/components/ui/ClientPicker';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createCashRegister, updateCashRegister } from '@/lib/api/cashRegisters';
import { fetchClients } from '@/lib/api/clients';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import type { CashRegister, CashRegisterInput, Client, EquipmentModel } from '@/types/directory';

type FormErrors = Partial<Record<keyof CashRegisterInput, string>>;

interface CashRegisterFormModalProps {
  cashRegister: CashRegister | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CashRegisterFormModal({ cashRegister, onClose, onSaved }: CashRegisterFormModalProps) {
  const [values, setValues] = useState<CashRegisterInput>(() => ({
    model: cashRegister?.model ?? '',
    serial_number: cashRegister?.serial_number ?? '',
    software_version: cashRegister?.software_version ?? '',
    client_id: cashRegister?.client_id ?? '',
    installation_address: cashRegister?.installation_address ?? '',
  }));
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadModels = async () => {
    setModelsLoading(true);
    setModelsError('');
    try {
      setModels(await fetchEquipmentModels());
    } catch {
      setModelsError('Не удалось загрузить список моделей.');
    } finally {
      setModelsLoading(false);
    }
  };

  const loadClients = async () => {
    setClientsLoading(true);
    setClientsError('');
    try {
      setClients(await fetchClients());
    } catch {
      setClientsError('Не удалось загрузить список клиентов.');
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    loadClients();
  }, []);

  const updateField = (key: keyof CashRegisterInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: CashRegisterInput = {
      model: values.model.trim(),
      serial_number: values.serial_number.trim(),
      software_version: values.software_version.trim(),
      client_id: values.client_id,
      installation_address: values.installation_address.trim(),
    };

    const nextErrors: FormErrors = {};
    if (!payload.model) nextErrors.model = 'Укажите модель кассы';
    if (!payload.serial_number) nextErrors.serial_number = 'Укажите заводской номер';
    if (!payload.client_id) nextErrors.client_id = 'Выберите клиента';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (cashRegister) {
        await updateCashRegister(cashRegister.id, payload);
      } else {
        await createCashRegister(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить кассу. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Modal
      title={cashRegister ? 'Редактирование кассы' : 'Новая касса'}
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
            form="cash-register-form"
            disabled={saving || clientsLoading || !hasClients}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="cash-register-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-5 gap-y-8 pb-16 sm:grid-cols-2">
        <FormField
          label="Модель"
          htmlFor="cash-register-model"
          error={errors.model}
          hint={modelsLoading ? 'Загрузка моделей...' : undefined}
          className="sm:col-span-2"
        >
          <ModelPicker
            id="cash-register-model"
            models={models}
            value={values.model}
            onModelChange={(model) => updateField('model', model)}
            onSoftwareVersionChange={(version) => updateField('software_version', version)}
            disabled={modelsLoading}
          />
          {modelsError && (
            <p className="mt-2 text-sm text-red-600">
              {modelsError}{' '}
              <button type="button" onClick={loadModels} className="font-medium underline">
                Повторить
              </button>
            </p>
          )}
        </FormField>

        <FormField label="Заводской номер" htmlFor="cash-register-serial" error={errors.serial_number}>
          <input
            id="cash-register-serial"
            className={inputClassName}
            value={values.serial_number}
            onChange={(event) => updateField('serial_number', event.target.value)}
            placeholder="0000123456"
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="cash-register-software" hint="Подставляется из справочника моделей">
          <input
            id="cash-register-software"
            className={inputClassName}
            value={values.software_version}
            onChange={(event) => updateField('software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField
          label="Принадлежность (клиент)"
          htmlFor="cash-register-client"
          error={errors.client_id}
          hint={clientsLoading ? 'Загрузка клиентов...' : hasClients ? undefined : 'Сначала добавьте клиента в справочник'}
          className="sm:col-span-2"
        >
          <ClientPicker
            id="cash-register-client"
            clients={clients}
            value={values.client_id}
            onChange={(clientId) => updateField('client_id', clientId)}
            disabled={clientsLoading || !hasClients}
          />
          {clientsError && (
            <p className="mt-2 text-sm text-red-600">
              {clientsError}{' '}
              <button type="button" onClick={loadClients} className="font-medium underline">
                Повторить
              </button>
            </p>
          )}
        </FormField>

        <FormField label="Адрес установки" htmlFor="cash-register-address" className="sm:col-span-2">
          <input
            id="cash-register-address"
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
    </Modal>
  );
}
