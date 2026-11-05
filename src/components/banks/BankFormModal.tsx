import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createBank, updateBank, DUPLICATE_ERROR_CODE } from '@/lib/api/banks';
import type { Bank } from '@/types/directory';

interface BankFormModalProps {
  bank: Bank | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function BankFormModal({ bank, onClose, onSaved }: BankFormModalProps) {
  const [name, setName] = useState(bank?.name ?? '');
  const [bik, setBik] = useState(bank?.bik ?? '');
  const [address, setAddress] = useState(bank?.address ?? '');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Укажите название банка');
      return;
    }
    setNameError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input = { name: trimmedName, bik: bik.trim(), address: address.trim() };
      if (bank) {
        await updateBank(bank.id, input);
      } else {
        await createBank(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(
        code === DUPLICATE_ERROR_CODE
          ? 'Банк с таким названием уже есть в списке'
          : 'Не удалось сохранить банк. Попробуйте еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={bank ? 'Редактирование банка' : 'Новый банк'}
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
            form="bank-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="bank-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Название банка" htmlFor="bank-name" error={nameError}>
          <input
            id="bank-name"
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ОАО «Название банка»"
            autoFocus
          />
        </FormField>
        <FormField label="БИК" htmlFor="bank-bik">
          <input
            id="bank-bik"
            className={inputClassName}
            value={bik}
            onChange={(event) => setBik(event.target.value)}
            placeholder="AKBBBY2X"
          />
        </FormField>
        <FormField label="Адрес банка" htmlFor="bank-address">
          <textarea
            id="bank-address"
            rows={3}
            className={inputClassName}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="г. Минск, ул. Примерная, 1"
          />
        </FormField>
        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
