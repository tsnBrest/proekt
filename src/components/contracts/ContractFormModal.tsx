import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ClientFormModal from '@/components/clients/ClientFormModal';
import { createContract, updateContract, suggestNextContractNumber } from '@/lib/api/contracts';
import { fetchClients } from '@/lib/api/clients';
import type { Client, Contract, ContractInput } from '@/types/directory';

type FormErrors = Partial<Record<keyof ContractInput, string>>;

interface ContractFormModalProps {
  contract: Contract | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContractFormModal({ contract, onClose, onSaved }: ContractFormModalProps) {
  const [values, setValues] = useState<ContractInput>(() => ({
    number: contract?.number ?? '',
    client_id: contract?.client_id ?? null,
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [numberHint, setNumberHint] = useState('');

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      setClients(await fetchClients());
    } catch {
      // ignore
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
    if (!contract) {
      suggestNextContractNumber()
        .then((num) => setNumberHint(num))
        .catch(() => undefined);
    }
  }, [loadClients, contract]);

  const updateField = (key: keyof ContractInput, value: string | null) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: ContractInput = {
      number: values.number.trim(),
      client_id: values.client_id || null,
    };

    const nextErrors: FormErrors = {};
    if (!payload.number) nextErrors.number = 'Укажите № договора';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (contract) {
        await updateContract(contract.id, payload);
      } else {
        await createContract(payload);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить договор. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Modal
      title={contract ? 'Редактирование договора' : 'Новый договор'}
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
            form="contract-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form
        id="contract-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-x-5 gap-y-5 pb-16 sm:grid-cols-2"
      >
        <FormField label="№ договора" htmlFor="contract-number" error={errors.number} hint={numberHint ? `Следующий по порядку: ${numberHint}` : undefined}>
          <input
            id="contract-number"
            className={inputClassName}
            value={values.number}
            onChange={(event) => updateField('number', event.target.value)}
            placeholder={numberHint || 'Например, 123/2024'}
            autoFocus
          />
        </FormField>

        <FormField
          label="Принадлежность (клиент)"
          htmlFor="contract-client"
          hint={clientsLoading ? 'Загрузка клиентов...' : hasClients ? undefined : 'Сначала добавьте клиента'}
        >
          <div className="flex items-stretch gap-2">
            <ClientPicker
              id="contract-client"
              clients={clients}
              value={values.client_id}
              onChange={(clientId) => updateField('client_id', clientId)}
              disabled={clientsLoading}
            />
            <button
              type="button"
              onClick={() => setClientFormOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
        )}
      </form>

      {clientFormOpen && (
        <ClientFormModal
          client={null}
          onClose={() => setClientFormOpen(false)}
          onSaved={() => {
            setClientFormOpen(false);
            loadClients();
          }}
        />
      )}
    </Modal>
  );
}
