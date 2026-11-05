import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import { createToken, updateToken, DUPLICATE_ERROR_CODE } from '@/lib/api/tokens';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import type { EquipmentModel, Token, TokenInput, TokenOperatorType } from '@/types/directory';

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

type ExtendedValues = {
  number: string;
  pc_model: string;
  pc_software_version: string;
  equipment_model: string;
  equipment_serial_number: string;
  installation_name: string;
  pc_installation_address: string;
  working_hours: string;
  gln: string;
  to_type: string;
  to_name: string;
};

export default function TokenFormModal({ operatorType, token, onClose, onSaved }: TokenFormModalProps) {
  const [values, setValues] = useState<ExtendedValues>(() => ({
    number: token?.number ?? '',
    pc_model: token?.pc_model ?? '',
    pc_software_version: token?.pc_software_version ?? '',
    equipment_model: token?.equipment_model ?? '',
    equipment_serial_number: token?.equipment_serial_number ?? '',
    installation_name: token?.installation_name ?? '',
    pc_installation_address: token?.pc_installation_address ?? '',
    working_hours: token?.working_hours ?? '',
    gln: token?.gln ?? '',
    to_type: token?.to_type ?? '',
    to_name: token?.to_name ?? '',
  }));
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [numberError, setNumberError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEquipmentModels()
      .then(setModels)
      .catch(() => undefined)
      .finally(() => setModelsLoading(false));
  }, []);

  const updateField = useCallback(<K extends keyof ExtendedValues>(key: K, value: ExtendedValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = values.number.trim();
    if (!trimmed) {
      setNumberError('Укажите номер токена');
      return;
    }
    setNumberError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input: TokenInput = {
        number: trimmed,
        operator_type: operatorType,
        client_id: token?.client_id ?? null,
        pc_model: values.pc_model,
        pc_software_version: values.pc_software_version,
        equipment_model: values.equipment_model,
        equipment_serial_number: values.equipment_serial_number,
        installation_name: values.installation_name,
        pc_installation_address: values.pc_installation_address,
        working_hours: values.working_hours,
        gln: values.gln,
        to_type: values.to_type,
        to_name: values.to_name,
      };
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

  const isIkassa = operatorType === 'ikassa';
  const maxWidth = isIkassa ? 'max-w-4xl' : 'max-w-4xl';

  return (
    <Modal
      maxWidth={maxWidth}
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
      <form
        id="token-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2"
      >
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
            value={values.number}
            onChange={(event) => updateField('number', event.target.value)}
            placeholder="Например, 000123"
            autoFocus
          />
        </FormField>

        <FormField
          label="Модель ПК"
          htmlFor="token-pc-model"
          hint={modelsLoading ? 'Загрузка моделей...' : 'Выбор из справочника моделей'}
        >
          <ModelPicker
            id="token-pc-model"
            models={models}
            value={values.pc_model}
            onModelChange={(model) => updateField('pc_model', model)}
            onSoftwareVersionChange={(version) => updateField('pc_software_version', version)}
            disabled={modelsLoading}
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor="token-pc-version" hint="Подставляется из справочника моделей">
          <input
            id="token-pc-version"
            className={inputClassName}
            value={values.pc_software_version}
            onChange={(event) => updateField('pc_software_version', event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        <FormField label="Модель оборудования" htmlFor="token-equipment-model">
          <input
            id="token-equipment-model"
            className={inputClassName}
            value={values.equipment_model}
            onChange={(event) => updateField('equipment_model', event.target.value)}
            placeholder="Модель оборудования"
          />
        </FormField>

        <FormField label="Заводской номер оборудования" htmlFor="token-equipment-serial">
          <input
            id="token-equipment-serial"
            className={inputClassName}
            value={values.equipment_serial_number}
            onChange={(event) => updateField('equipment_serial_number', event.target.value)}
            placeholder="Серийный номер"
          />
        </FormField>

        <FormField label="Вид ТО" htmlFor="token-to-type">
          <input
            id="token-to-type"
            className={inputClassName}
            value={values.to_type}
            onChange={(event) => updateField('to_type', event.target.value)}
            placeholder="Вид технического обслуживания"
          />
        </FormField>

        <FormField label="Наименование ТО" htmlFor="token-to-name">
          <input
            id="token-to-name"
            className={inputClassName}
            value={values.to_name}
            onChange={(event) => updateField('to_name', event.target.value)}
            placeholder="Наименование технического обслуживания"
          />
        </FormField>

        <FormField label="Наименование места установки" htmlFor="token-installation-name">
          <input
            id="token-installation-name"
            className={inputClassName}
            value={values.installation_name}
            onChange={(event) => updateField('installation_name', event.target.value)}
            placeholder="Наименование места установки"
          />
        </FormField>

        <FormField label="Место установки ПК" htmlFor="token-pc-installation-address">
          <input
            id="token-pc-installation-address"
            className={inputClassName}
            value={values.pc_installation_address}
            onChange={(event) => updateField('pc_installation_address', event.target.value)}
            placeholder="Адрес места установки ПК"
          />
        </FormField>

        <FormField label="Режим работы" htmlFor="token-working-hours" hint="Формат: ЧЧ:ММ — ЧЧ:ММ">
          <input
            id="token-working-hours"
            className={inputClassName}
            value={values.working_hours}
            onChange={(event) => updateField('working_hours', event.target.value)}
            placeholder="08:00 — 22:00"
          />
        </FormField>

        <FormField label="GLN" htmlFor="token-gln">
          <input
            id="token-gln"
            className={inputClassName}
            value={values.gln}
            onChange={(event) => updateField('gln', event.target.value)}
            placeholder="GLN код"
          />
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
