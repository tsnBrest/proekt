import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createPcEquipment, updatePcEquipment } from '@/lib/api/pcEquipment';
import type { PcEquipment, PcEquipmentInput, PcEquipmentStatus } from '@/types/directory';

type FormErrors = Partial<Record<keyof PcEquipmentInput, string>>;

const STATUS_OPTIONS: PcEquipmentStatus[] = [
  'аренда банка',
  'аренда ЦТО',
  'покупка в Анъюск',
  'собственность клиента',
];

interface PcEquipmentFormModalProps {
  item: PcEquipment | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PcEquipmentFormModal({ item, onClose, onSaved }: PcEquipmentFormModalProps) {
  const [values, setValues] = useState<PcEquipmentInput>(() => ({
    name: item?.name ?? '',
    serial_number: item?.serial_number ?? '',
    status: item?.status ?? 'аренда банка',
    supplier: item?.supplier ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setValues({
        name: item.name,
        serial_number: item.serial_number,
        status: item.status,
        supplier: item.supplier,
      });
    }
  }, [item]);

  const updateField = (key: keyof PcEquipmentInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: PcEquipmentInput = {
      name: values.name.trim(),
      serial_number: values.serial_number.trim(),
      status: values.status,
      supplier: values.supplier.trim(),
    };

    const nextErrors: FormErrors = {};
    if (!payload.name) nextErrors.name = 'Укажите наименование оборудования';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (item) {
        await updatePcEquipment(item.id, payload);
      } else {
        await createPcEquipment(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить оборудование. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={item ? 'Редактирование оборудования ПК' : 'Новое оборудование ПК'}
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
            form="pc-equipment-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="pc-equipment-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2"
      >
        <FormField label="Наименование оборудования" htmlFor="pc-eq-name" error={errors.name} className="sm:col-span-2">
          <textarea
            id="pc-eq-name"
            className={inputClassName}
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Например, Системный блок"
            rows={2}
            autoFocus
          />
        </FormField>

        <FormField label="Заводской номер" htmlFor="pc-eq-serial">
          <input
            id="pc-eq-serial"
            className={inputClassName}
            value={values.serial_number}
            onChange={(event) => updateField('serial_number', event.target.value)}
            placeholder="Заводской номер"
          />
        </FormField>

        <FormField label="Статус" htmlFor="pc-eq-status">
          <select
            id="pc-eq-status"
            className={inputClassName}
            value={values.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Поставщик" htmlFor="pc-eq-supplier">
          <input
            id="pc-eq-supplier"
            className={inputClassName}
            value={values.supplier}
            onChange={(event) => updateField('supplier', event.target.value)}
            placeholder="Поставщик"
          />
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
