import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import { createEquipmentModel, updateEquipmentModel, DUPLICATE_ERROR_CODE } from '@/lib/api/equipmentModels';
import type { EquipmentModel } from '@/types/directory';

interface EquipmentModelFormModalProps {
  equipmentModel: EquipmentModel | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EquipmentModelFormModal({ equipmentModel, onClose, onSaved }: EquipmentModelFormModalProps) {
  const [model, setModel] = useState(equipmentModel?.model ?? '');
  const [softwareVersion, setSoftwareVersion] = useState(equipmentModel?.software_version ?? '');
  const [modelError, setModelError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedModel = model.trim();
    if (!trimmedModel) {
      setModelError('Укажите название модели');
      return;
    }
    setModelError('');
    setSubmitError('');
    setSaving(true);
    try {
      const input = { model: trimmedModel, software_version: softwareVersion.trim() };
      if (equipmentModel) {
        await updateEquipmentModel(equipmentModel.id, input);
      } else {
        await createEquipmentModel(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(
        code === DUPLICATE_ERROR_CODE
          ? 'Модель с таким названием уже есть в справочнике'
          : 'Не удалось сохранить модель. Попробуйте еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={equipmentModel ? 'Редактирование модели' : 'Новая модель'}
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
            form="equipment-model-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="equipment-model-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Модель" htmlFor="equipment-model-name" error={modelError}>
          <input
            id="equipment-model-name"
            className={inputClassName}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="Например, Атол 11Ф"
            autoFocus
          />
        </FormField>
        <FormField label="Версия ПО" htmlFor="equipment-model-software" hint="Необязательно">
          <input
            id="equipment-model-software"
            className={inputClassName}
            value={softwareVersion}
            onChange={(event) => setSoftwareVersion(event.target.value)}
            placeholder="Например, 5.6.2"
          />
        </FormField>
        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
