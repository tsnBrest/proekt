import { useEffect, useState, type FormEvent } from 'react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createTaximeter, updateTaximeter } from '@/lib/api/taximeters';
import { fetchClients } from '@/lib/api/clients';
import type { Client, Taximeter, TaximeterInput } from '@/types/directory';

type FormErrors = Partial<Record<keyof TaximeterInput, string>>;

interface TaximeterFormModalProps {
  taximeter: Taximeter | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaximeterFormModal({ taximeter, onClose, onSaved }: TaximeterFormModalProps) {
  const [values, setValues] = useState<TaximeterInput>(() => ({
    number: taximeter?.number ?? '',
    model: taximeter?.model ?? '',
    software_version: taximeter?.software_version ?? '',
    client_id: taximeter?.client_id ?? '',
    car: taximeter?.car ?? '',
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

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
    loadClients();
  }, []);

  const updateField = (key: keyof TaximeterInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: TaximeterInput = {
      number: values.number.trim(),
      model: values.model.trim(),
      software_version: values.software_version.trim(),
      client_id: values.client_id || null,
      car: values.car.trim(),
    };

    const nextErrors: FormErrors = {};
    if (!payload.model) nextErrors.model = 'Укажите модель таксометра';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (taximeter) {
        await updateTaximeter(taximeter.id, payload);
      } else {
        await createTaximeter(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить таксометр. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Modal
      title={taximeter ? 'Редактирование таксометра' : 'Новый таксометр'}
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
            form="taximeter-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="taximeter-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2">
        <FormField label="Номер таксометра" htmlFor="taximeter-number">
          <input
            id="taximeter-number"
            className={inputClassName}
            value={values.number}
            onChange={(event) => updateField('number', event.target.value)}
            placeholder="Например, 000123"
            autoFocus
          />
        </FormField>

        <FormField label="Модель таксометра" htmlFor="taximeter-model" error={errors.model}>
          <input
            id="taximeter-model"
            className={inputClassName}
            value={values.model}
            onChange={(event) => updateField('model', event.target.value)}
            placeholder="Например, ШТРИХ-Т5"
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="taximeter-software" hint="Необязательно">
          <input
            id="taximeter-software"
            className={inputClassName}
            value={values.software_version}
            onChange={(event) => updateField('software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField label="Автомобиль" htmlFor="taximeter-car">
          <input
            id="taximeter-car"
            className={inputClassName}
            value={values.car}
            onChange={(event) => updateField('car', event.target.value)}
            placeholder="Например, Audi A6 1234 AB-7"
          />
        </FormField>

        <FormField
          label="Принадлежность (клиент)"
          htmlFor="taximeter-client"
          hint={clientsLoading ? 'Загрузка клиентов...' : hasClients ? 'Необязательно' : 'Сначала добавьте клиента в справочник'}
          className="sm:col-span-2"
        >
          <ClientPicker
            id="taximeter-client"
            clients={clients}
            value={values.client_id || null}
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

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
