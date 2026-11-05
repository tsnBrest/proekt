import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import ClientFormModal from '@/components/clients/ClientFormModal';
import { createServicedEquipment, updateServicedEquipment } from '@/lib/api/servicedEquipment';
import { fetchClients } from '@/lib/api/clients';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import type { Client, EquipmentModel, ServicedEquipment, ServicedEquipmentInput } from '@/types/directory';

type FormErrors = Partial<Record<keyof ServicedEquipmentInput, string>>;

interface ServicedEquipmentFormModalProps {
  equipment: ServicedEquipment | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ServicedEquipmentFormModal({
  equipment,
  onClose,
  onSaved,
}: ServicedEquipmentFormModalProps) {
  const [values, setValues] = useState<ServicedEquipmentInput & { installation_location: string }>(() => ({
    model: equipment?.model ?? '',
    serial_number: equipment?.serial_number ?? '',
    software_version: equipment?.software_version ?? '',
    client_id: equipment?.client_id ?? '',
    installation_location: (equipment as (ServicedEquipment & { installation_location?: string }) | null)?.installation_location ?? '',
  }));
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);

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

  const updateField = (key: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      model: values.model.trim(),
      serial_number: values.serial_number.trim(),
      software_version: values.software_version.trim(),
      client_id: values.client_id || null,
      installation_location: values.installation_location.trim(),
    };

    const nextErrors: FormErrors = {};
    if (!payload.model) nextErrors.model = 'Укажите модель оборудования';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (equipment) {
        await updateServicedEquipment(equipment.id, payload);
      } else {
        await createServicedEquipment(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить оборудование. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Modal
      title={equipment ? 'Редактирование оборудования' : 'Новое оборудование'}
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
            form="serviced-equipment-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="serviced-equipment-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2"
      >
        <FormField
          label="Модель"
          htmlFor="se-model"
          error={errors.model}
          hint={modelsLoading ? 'Загрузка моделей...' : 'Выбор из справочника моделей'}
        >
          <ModelPicker
            id="se-model"
            models={models}
            value={values.model}
            onModelChange={(model) => updateField('model', model)}
            onSoftwareVersionChange={(version) => updateField('software_version', version)}
            disabled={modelsLoading}
          />
        </FormField>

        <FormField label="Заводской номер" htmlFor="se-serial">
          <input
            id="se-serial"
            className={inputClassName}
            value={values.serial_number}
            onChange={(event) => updateField('serial_number', event.target.value)}
            placeholder="Серийный номер"
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="se-software" hint="Подставляется из справочника моделей">
          <input
            id="se-software"
            className={inputClassName}
            value={values.software_version}
            onChange={(event) => updateField('software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField label="Место установки оборудования" htmlFor="se-installation-location">
          <input
            id="se-installation-location"
            className={inputClassName}
            value={values.installation_location}
            onChange={(event) => updateField('installation_location', event.target.value)}
            placeholder="Адрес или описание места установки"
          />
        </FormField>

        <FormField
          label="Принадлежность (клиент)"
          htmlFor="se-client"
          hint={clientsLoading ? 'Загрузка клиентов...' : hasClients ? undefined : 'Сначала добавьте клиента'}
          className="sm:col-span-2"
        >
          <div className="flex items-stretch gap-2">
            <ClientPicker
              id="se-client"
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
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>

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
