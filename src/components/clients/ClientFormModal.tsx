import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createClient, updateClient } from '@/lib/api/clients';
import { fetchBanks } from '@/lib/api/banks';
import { toGenitiveFullName } from '@/lib/genitiveName';
import type { Bank, Client, ClientInput } from '@/types/directory';

type FormValues = ClientInput;
type FormErrors = Partial<Record<keyof FormValues, string>>;

interface ClientFormModalProps {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

const REQUIRED_FIELDS: { key: keyof FormValues; message: string }[] = [
  { key: 'name', message: 'Укажите наименование клиента' },
  { key: 'legal_address', message: 'Укажите юридический адрес' },
  { key: 'bank_account', message: 'Укажите расчетный счет' },
  { key: 'bank_id', message: 'Выберите банк из списка' },
  { key: 'director_name', message: 'Укажите ФИО директора' },
  { key: 'director_name_genitive', message: 'Укажите ФИО в родительном падеже' },
];

const emptyValues: FormValues = {
  name: '',
  unp: '',
  legal_address: '',
  postal_address: '',
  bank_account: '',
  bank_id: '',
  bank_address: '',
  director_name: '',
  director_name_genitive: '',
};

function valuesFromClient(client: Client | null): FormValues {
  if (!client) return emptyValues;
  return {
    name: client.name,
    unp: client.unp,
    legal_address: client.legal_address,
    postal_address: client.postal_address,
    bank_account: client.bank_account,
    bank_id: client.bank_id,
    bank_address: client.bank_address,
    director_name: client.director_name,
    director_name_genitive: client.director_name_genitive,
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const { key, message } of REQUIRED_FIELDS) {
    if (!values[key].trim()) errors[key] = message;
  }
  if (!errors.unp && !/^\d{9}$/.test(values.unp.trim())) {
    errors.unp = 'УНП состоит из 9 цифр';
  }
  return errors;
}

export default function ClientFormModal({ client, onClose, onSaved }: ClientFormModalProps) {
  const [values, setValues] = useState<FormValues>(() => valuesFromClient(client));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');

  const loadBanks = async () => {
    setBanksLoading(true);
    setBanksError('');
    try {
      setBanks(await fetchBanks());
    } catch {
      setBanksError('Не удалось загрузить список банков.');
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleDirectorChange = (value: string) => {
    setValues((prev) => {
      const genitiveIsAuto = prev.director_name_genitive === toGenitiveFullName(prev.director_name);
      return {
        ...prev,
        director_name: value,
        director_name_genitive: genitiveIsAuto ? toGenitiveFullName(value) : prev.director_name_genitive,
      };
    });
    setErrors((prev) => ({ ...prev, director_name: undefined, director_name_genitive: undefined }));
  };

  const handleBankChange = (bankId: string) => {
    const bank = banks.find((item) => item.id === bankId);
    setValues((prev) => ({
      ...prev,
      bank_id: bankId,
      bank_address: bank ? bank.address : '',
    }));
    setErrors((prev) => ({ ...prev, bank_id: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: FormValues = {
      name: values.name.trim(),
      unp: values.unp.trim(),
      legal_address: values.legal_address.trim(),
      postal_address: values.postal_address.trim(),
      bank_account: values.bank_account.trim(),
      bank_id: values.bank_id,
      bank_address: values.bank_address.trim(),
      director_name: values.director_name.trim(),
      director_name_genitive: values.director_name_genitive.trim(),
    };

    setSaving(true);
    setSubmitError('');
    try {
      if (client) {
        await updateClient(client.id, payload);
      } else {
        await createClient(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить клиента. Проверьте данные и попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const genitiveIsAuto = values.director_name_genitive === toGenitiveFullName(values.director_name);
  const noBanks = !banksLoading && !banksError && banks.length === 0;

  return (
    <Modal
      title={client ? 'Редактирование клиента' : 'Новый клиент'}
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
            form="client-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <FormField label="Наименование клиента" htmlFor="client-name" error={errors.name} className="sm:col-span-2">
          <input
            id="client-name"
            className={inputClassName}
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="ООО «Ромашка»"
            autoFocus
          />
        </FormField>

        <FormField label="УНП" htmlFor="client-unp" error={errors.unp} hint="9 цифр">
          <input
            id="client-unp"
            inputMode="numeric"
            maxLength={9}
            className={inputClassName}
            value={values.unp}
            onChange={(event) => updateField('unp', event.target.value.replace(/\D/g, ''))}
            placeholder="100000000"
          />
        </FormField>

        <FormField label="Расчетный счет" htmlFor="client-bank-account" error={errors.bank_account}>
          <input
            id="client-bank-account"
            className={inputClassName}
            value={values.bank_account}
            onChange={(event) => updateField('bank_account', event.target.value)}
            placeholder="BY00XXXX00000000000000000000"
          />
        </FormField>

        <FormField label="Юридический адрес" htmlFor="client-legal-address" error={errors.legal_address} className="sm:col-span-2">
          <textarea
            id="client-legal-address"
            rows={2}
            className={inputClassName}
            value={values.legal_address}
            onChange={(event) => updateField('legal_address', event.target.value)}
            placeholder="г. Минск, ул. Примерная, 1, каб. 10"
          />
        </FormField>

        <FormField label="Почтовый адрес" htmlFor="client-postal-address" className="sm:col-span-2" hint="Необязательно, если совпадает с юридическим">
          <textarea
            id="client-postal-address"
            rows={2}
            className={inputClassName}
            value={values.postal_address}
            onChange={(event) => updateField('postal_address', event.target.value)}
            placeholder="220000, г. Минск, а/я 15"
          />
        </FormField>

        <FormField
          label="Банк"
          htmlFor="client-bank"
          error={errors.bank_id}
          hint={banksError ? undefined : noBanks ? 'Список пуст. Добавьте банки на вкладке «Банки».' : undefined}
        >
          <div className="relative">
            <select
              id="client-bank"
              className={`${inputClassName} appearance-none pr-10`}
              value={values.bank_id}
              disabled={banksLoading || !!banksError}
              onChange={(event) => handleBankChange(event.target.value)}
            >
              <option value="">
                {banksLoading ? 'Загрузка банков...' : banksError ? 'Список недоступен' : 'Выберите банк'}
              </option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
          {banksError && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <TriangleAlert className="h-3.5 w-3.5" />
              {banksError}
              <button type="button" onClick={loadBanks} className="font-medium underline underline-offset-2">
                Повторить
              </button>
            </p>
          )}
        </FormField>

        <FormField label="Адрес банка" htmlFor="client-bank-address" hint="Подставляется из выбранного банка">
          <input
            id="client-bank-address"
            className={inputClassName}
            value={values.bank_address}
            onChange={(event) => updateField('bank_address', event.target.value)}
            placeholder="г. Минск, ул. Примерная, 1"
          />
        </FormField>

        <FormField label="Директор (ФИО)" htmlFor="client-director" error={errors.director_name} hint="Фамилия Имя Отчество">
          <input
            id="client-director"
            className={inputClassName}
            value={values.director_name}
            onChange={(event) => handleDirectorChange(event.target.value)}
            placeholder="Иванов Иван Иванович"
          />
        </FormField>

        <FormField
          label="ФИО директора в родительном падеже"
          htmlFor="client-director-genitive"
          error={errors.director_name_genitive}
          hint={
            <span className="flex items-center justify-between gap-2">
              <span>{genitiveIsAuto ? 'Заполняется автоматически' : 'Изменено вручную'}</span>
              {!genitiveIsAuto && (
                <button
                  type="button"
                  onClick={() => updateField('director_name_genitive', toGenitiveFullName(values.director_name))}
                  className="inline-flex items-center gap-1 font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                  <RefreshCw className="h-3 w-3" />
                  Пересчитать
                </button>
              )}
            </span>
          }
        >
          <input
            id="client-director-genitive"
            className={inputClassName}
            value={values.director_name_genitive}
            onChange={(event) => updateField('director_name_genitive', event.target.value)}
            placeholder="Иванова Ивана Ивановича"
          />
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
