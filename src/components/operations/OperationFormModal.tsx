import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createOperation, updateOperation } from '@/lib/api/cashRegisterOperations';
import { fetchCashRegisters } from '@/lib/api/cashRegisters';
import type {
  CashRegister,
  CashRegisterOperation,
  CashRegisterOperationInput,
  CashRegisterOperationType,
} from '@/types/directory';

interface OperationFormModalProps {
  operationType: CashRegisterOperationType;
  operation: CashRegisterOperation | null;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_LABELS: Record<CashRegisterOperationType, string> = {
  registration: 'Регистрация кассы',
  deregistration: 'Снятие кассы',
  address_change: 'Изменение адреса',
  repair: 'Ремонт',
};

const TYPE_TITLES: Record<CashRegisterOperationType, string> = {
  registration: 'Новая регистрация кассы',
  deregistration: 'Снятие кассы с учета',
  address_change: 'Изменение адреса кассы',
  repair: 'Ремонт кассы',
};

export default function OperationFormModal({ operationType, operation, onClose, onSaved }: OperationFormModalProps) {
  const [values, setValues] = useState<CashRegisterOperationInput>(() => ({
    equipment_id: operation?.equipment_id ?? '',
    operation_type: operationType,
    operation_date: operation?.operation_date ?? new Date().toISOString().slice(0, 10),
    address: operation?.address ?? '',
    notes: operation?.notes ?? '',
  }));
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof CashRegisterOperationInput, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCashRegisters()
      .then(setCashRegisters)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: keyof CashRegisterOperationInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const needsAddress = operationType === 'registration' || operationType === 'address_change';
  const needsNotes = operationType === 'repair' || operationType === 'deregistration';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: CashRegisterOperationInput = {
      equipment_id: values.equipment_id,
      operation_type: operationType,
      operation_date: values.operation_date,
      address: values.address.trim(),
      notes: values.notes.trim(),
    };

    const nextErrors: Partial<Record<keyof CashRegisterOperationInput, string>> = {};
    if (!payload.equipment_id) nextErrors.equipment_id = 'Выберите кассу';
    if (!payload.operation_date) nextErrors.operation_date = 'Укажите дату';
    if (needsAddress && !payload.address) nextErrors.address = 'Укажите адрес';
    if (needsNotes && !payload.notes) nextErrors.notes = 'Укажите описание';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (operation) {
        await updateOperation(operation.id, payload);
      } else {
        await createOperation(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить запись. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={operation ? `Редактирование: ${TYPE_LABELS[operationType]}` : TYPE_TITLES[operationType]}
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
            form="operation-form"
            disabled={saving || loading || cashRegisters.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="operation-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2">
        <FormField
          label="Касса"
          htmlFor="operation-equipment"
          error={errors.equipment_id}
          hint={loading ? 'Загрузка касс...' : cashRegisters.length === 0 ? 'Сначала добавьте кассу в справочник' : undefined}
          className="sm:col-span-2"
        >
          <select
            id="operation-equipment"
            className={inputClassName}
            value={values.equipment_id}
            disabled={loading || cashRegisters.length === 0}
            onChange={(event) => updateField('equipment_id', event.target.value)}
          >
            <option value="">Выберите кассу</option>
            {cashRegisters.map((cr) => (
              <option key={cr.id} value={cr.id}>
                {cr.model} — {cr.serial_number}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Дата" htmlFor="operation-date" error={errors.operation_date}>
          <input
            id="operation-date"
            type="date"
            className={inputClassName}
            value={values.operation_date}
            onChange={(event) => updateField('operation_date', event.target.value)}
          />
        </FormField>

        {needsAddress && (
          <FormField label="Адрес" htmlFor="operation-address" error={errors.address} className="sm:col-span-2">
            <input
              id="operation-address"
              className={inputClassName}
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder="Например, г. Минск, ул. Примерная, 1"
            />
          </FormField>
        )}

        {(needsNotes || operationType === 'address_change') && (
          <FormField
            label={operationType === 'repair' ? 'Описание ремонта' : operationType === 'deregistration' ? 'Причина снятия' : 'Примечание'}
            htmlFor="operation-notes"
            error={errors.notes}
            className="sm:col-span-2"
          >
            <textarea
              id="operation-notes"
              rows={3}
              className={inputClassName}
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder={operationType === 'repair' ? 'Опишите выполненные работы' : 'Дополнительные сведения'}
            />
          </FormField>
        )}

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
