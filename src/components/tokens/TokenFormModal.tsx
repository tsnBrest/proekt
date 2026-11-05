import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createToken, updateToken, DUPLICATE_ERROR_CODE } from '@/lib/api/tokens';
import type { Token, TokenInput, TokenOperatorType } from '@/types/directory';

interface TokenFormModalProps {
  operatorType: TokenOperatorType;
  token: Token | null;
  onClose: () => void;
  onSaved: () => void;
}

const OPERATOR_LABEL: Record<TokenOperatorType, string> = {
  ikassa: 'iKassa',
  cpi: 'ЦПИ',
};

export default function TokenFormModal({ operatorType, token, onClose, onSaved }: TokenFormModalProps) {
  const [number, setNumber] = useState(token?.number ?? '');
  const [numberError, setNumberError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = number.trim();
    if (!trimmed) {
      setNumberError('Укажите номер токена');
      return;
    }
    setNumberError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input: TokenInput = { number: trimmed, operator_type: operatorType, client_id: token?.client_id ?? null };
      if (token) {
        await updateToken(token.id, input);
      } else {
        await createToken(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(
        code === DUPLICATE_ERROR_CODE
          ? 'Токен с таким номером уже есть в справочнике'
          : 'Не удалось сохранить токен. Попробуйте еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={token ? `Редактирование токена ${OPERATOR_LABEL[operatorType]}` : `Новый токен ${OPERATOR_LABEL[operatorType]}`}
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
            form="token-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="token-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Оператор" htmlFor="token-operator">
          <input
            id="token-operator"
            className={`${inputClassName} bg-slate-100`}
            value={OPERATOR_LABEL[operatorType]}
            disabled
          />
        </FormField>
        <FormField label="Номер токена" htmlFor="token-number" error={numberError}>
          <input
            id="token-number"
            className={inputClassName}
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="Например, 000123"
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
