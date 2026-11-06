import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import {
  createTradeObjectType,
  updateTradeObjectType,
  DUPLICATE_ERROR_CODE,
} from '@/lib/api/tradeObjectTypes';
import type { TradeObjectType } from '@/types/directory';

interface TradeObjectTypeFormModalProps {
  tradeObjectType: TradeObjectType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TradeObjectTypeFormModal({
  tradeObjectType,
  onClose,
  onSaved,
}: TradeObjectTypeFormModalProps) {
  const [name, setName] = useState(tradeObjectType?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Укажите тип торгового объекта');
      return;
    }
    setNameError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input = { name: trimmed };
      if (tradeObjectType) {
        await updateTradeObjectType(tradeObjectType.id, input);
      } else {
        await createTradeObjectType(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(
        code === DUPLICATE_ERROR_CODE
          ? 'Такой тип торгового объекта уже существует'
          : 'Не удалось сохранить тип. Попробуйте еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={tradeObjectType ? 'Редактирование типа торгового объекта' : 'Новый тип торгового объекта'}
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
            form="trade-object-type-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="trade-object-type-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Тип торгового объекта" htmlFor="trade-object-type-name" error={nameError}>
          <input
            id="trade-object-type-name"
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Магазин"
            autoFocus
          />
        </FormField>
        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
