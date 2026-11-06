import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createStatus, updateStatus } from '@/lib/api/statuses';
import type { Status, StatusCategory, StatusInput } from '@/types/directory';

interface StatusFormModalProps {
  status: Status | null;
  defaultCategory: StatusCategory;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORY_LABELS: Record<StatusCategory, string> = {
  cash_register: 'Статус кассы',
  token: 'Статус токена',
};

export default function StatusFormModal({ status, defaultCategory, onClose, onSaved }: StatusFormModalProps) {
  const [name, setName] = useState(status?.name ?? '');
  const [category, setCategory] = useState<StatusCategory>(status?.category ?? defaultCategory);
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Укажите статус');
      return;
    }
    setNameError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input: StatusInput = { name: trimmed, category };
      if (status) {
        await updateStatus(status.id, input);
      } else {
        await createStatus(input);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить статус. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={status ? 'Редактирование статуса' : 'Новый статус'}
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
            form="status-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="status-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Категория" htmlFor="status-category">
          <select
            id="status-category"
            className={inputClassName}
            value={category}
            onChange={(event) => setCategory(event.target.value as StatusCategory)}
          >
            {(Object.keys(CATEGORY_LABELS) as StatusCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Статус" htmlFor="status-name" error={nameError}>
          <input
            id="status-name"
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, зарегистрирован"
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
