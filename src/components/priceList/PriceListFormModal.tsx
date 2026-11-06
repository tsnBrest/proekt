import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createPriceListItem, updatePriceListItem } from '@/lib/api/priceList';
import type { PriceListItem } from '@/types/directory';

interface PriceListFormModalProps {
  item: PriceListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PriceListFormModal({ item, onClose, onSaved }: PriceListFormModalProps) {
  const [workName, setWorkName] = useState(item?.work_name ?? '');
  const [price, setPrice] = useState(String(item?.price ?? '0'));
  const [coefficient, setCoefficient] = useState(
    item ? item.coefficient.toFixed(3) : '1.000',
  );
  const [workNameError, setWorkNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = workName.trim();
    if (!trimmed) {
      setWorkNameError('Укажите наименование работы');
      return;
    }
    setWorkNameError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input = {
        work_name: trimmed,
        price: parseFloat(price) || 0,
        coefficient: parseFloat(coefficient) || 1,
      };
      if (item) {
        await updatePriceListItem(item.id, input);
      } else {
        await createPriceListItem(input);
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
      title={item ? 'Редактирование работы' : 'Новая работа'}
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
            form="price-list-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="price-list-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Наименование работы" htmlFor="price-work-name" error={workNameError}>
          <input
            id="price-work-name"
            className={inputClassName}
            value={workName}
            onChange={(event) => setWorkName(event.target.value)}
            placeholder="Например, Регистрация ПК iKassa ИТП"
            autoFocus
          />
        </FormField>
        <FormField label="Стоимость работ" htmlFor="price-work-price">
          <input
            id="price-work-price"
            type="number"
            step="0.001"
            min="0"
            className={inputClassName}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.000"
          />
        </FormField>
        <FormField label="Коэффициент" htmlFor="price-work-coefficient" hint="По умолчанию 1.000">
          <input
            id="price-work-coefficient"
            type="number"
            step="0.001"
            min="0"
            className={inputClassName}
            value={coefficient}
            onChange={(event) => setCoefficient(event.target.value)}
          />
        </FormField>
        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
