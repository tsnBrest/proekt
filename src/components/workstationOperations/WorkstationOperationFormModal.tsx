import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FileText, KeyRound, Plus, TriangleAlert, Cloud } from 'lucide-react';
import ClientPicker from '@/components/ui/ClientPicker';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ModelPicker from '@/components/cashRegisters/ModelPicker';
import TokenFormModal from '@/components/tokens/TokenFormModal';
import CloudCashRegisterFormModal from '@/components/cloudCashRegisters/CloudCashRegisterFormModal';
import ClientFormModal from '@/components/clients/ClientFormModal';
import TokenPicker from '@/components/workstations/TokenPicker';
import { createWorkstationOperation, updateWorkstationOperation } from '@/lib/api/workstationOperations';
import { fetchClients } from '@/lib/api/clients';
import { fetchEquipmentModels } from '@/lib/api/equipmentModels';
import { fetchTokensByClient, updateTokenStatus, updateTokenAddress } from '@/lib/api/tokens';
import { fetchCashRegistersByClient, updateCashRegisterStatus } from '@/lib/api/cashRegisters';
import { fetchCloudCashRegistersByClient } from '@/lib/api/cloudCashRegisters';
import { createTokenHistoryEntry } from '@/lib/api/tokenHistory';
import type {
  CashRegister,
  Client,
  CloudCashRegister,
  EquipmentModel,
  Token,
  WorkstationOperation,
  WorkstationOperationInput,
  WorkstationOperationType,
} from '@/types/directory';

type FormErrors = Record<string, string>;

interface WorkstationOperationFormModalProps {
  operationType: WorkstationOperationType;
  operation: WorkstationOperation | null;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_TITLES: Record<WorkstationOperationType, string> = {
  registration: 'Регистрация ПК',
  deregistration: 'Снятие ПК',
  address_change: 'Изменение адреса ПК',
  other: 'Другие документы',
};

interface PcSlot {
  pc_model: string;
  pc_software_version: string;
  is_cloud: boolean;
  token_number: string;
  address: string;
  cashRegisterId: string;
  selectedToken: Token | null;
}

const emptySlot: PcSlot = {
  pc_model: '',
  pc_software_version: '',
  is_cloud: false,
  token_number: '',
  address: '',
  cashRegisterId: '',
  selectedToken: null,
};

export default function WorkstationOperationFormModal({
  operationType,
  operation,
  onClose,
  onSaved,
}: WorkstationOperationFormModalProps) {
  const [operationDate, setOperationDate] = useState(
    operation?.operation_date ?? new Date().toISOString().slice(0, 10),
  );
  const [clientId, setClientId] = useState<string | null>(operation?.client_id ?? null);
  const [notes, setNotes] = useState(operation?.notes ?? '');
  const [slot1, setSlot1] = useState<PcSlot>({
    pc_model: operation?.pc_model ?? '',
    pc_software_version: operation?.pc_software_version ?? '',
    is_cloud: operation?.is_cloud ?? false,
    token_number: operation?.token_number ?? '',
    address: operation?.address ?? '',
    cashRegisterId: '',
    selectedToken: null,
  });
  const [slot2, setSlot2] = useState<PcSlot>({ ...emptySlot });
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [allModels, setAllModels] = useState<EquipmentModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [clientTokens, setClientTokens] = useState<Token[]>([]);
  const [clientCashRegisters, setClientCashRegisters] = useState<CashRegister[]>([]);
  const [clientCloudRegisters, setClientCloudRegisters] = useState<CloudCashRegister[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tokenPickerSlot, setTokenPickerSlot] = useState<1 | 2 | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [tokenFormOpen, setTokenFormOpen] = useState<null | 'ikassa' | 'cpi'>(null);
  const [cloudCashRegisterFormOpen, setCloudCashRegisterFormOpen] = useState(false);

  const isRegistration = operationType === 'registration';
  const needsAddress = operationType === 'registration' || operationType === 'address_change';
  const needsNotes = operationType === 'deregistration' || operationType === 'other';

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
    fetchEquipmentModels()
      .then(setAllModels)
      .catch(() => undefined)
      .finally(() => setModelsLoading(false));
    loadClients();
  }, [loadClients]);

  const loadClientData = useCallback(async () => {
    if (!clientId) {
      setClientTokens([]);
      setClientCashRegisters([]);
      setClientCloudRegisters([]);
      return;
    }
    try {
      const tokens = await fetchTokensByClient(clientId, []);
      setClientTokens(tokens);
    } catch {
      setClientTokens([]);
    }
    try {
      const registers = await fetchCashRegistersByClient(clientId);
      setClientCashRegisters(registers);
    } catch {
      setClientCashRegisters([]);
    }
    try {
      const cloud = await fetchCloudCashRegistersByClient(clientId);
      setClientCloudRegisters(cloud);
    } catch {
      setClientCloudRegisters([]);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const models = allModels;

  const updateSlot = (slot: 1 | 2, patch: Partial<PcSlot>) => {
    if (slot === 1) setSlot1((prev) => ({ ...prev, ...patch }));
    else setSlot2((prev) => ({ ...prev, ...patch }));
  };

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setSlot1((prev) => ({ ...prev, selectedToken: null, token_number: '', cashRegisterId: '' }));
    setSlot2((prev) => ({ ...prev, selectedToken: null, token_number: '', cashRegisterId: '' }));
  };

  const getSelectedCloudRegister = (slot: PcSlot) =>
    clientCloudRegisters.find((r) => (r.pc_model || 'DUSIC') === slot.token_number);

  const isSlotTokenBlocked = (slot: PcSlot) =>
    isRegistration &&
    !slot.is_cloud &&
    slot.selectedToken !== null &&
    (slot.selectedToken.status === 'зарегистрирован' ||
      slot.selectedToken.status === 'блокировка' ||
      slot.selectedToken.status === 'снят с регистрации');

  const isSlotCashRegisterBlocked = (slot: PcSlot) => {
    const reg = getSelectedCloudRegister(slot);
    return (
      isRegistration &&
      slot.is_cloud &&
      reg !== undefined &&
      (reg.register_status === 'зарегистрирована облачная' ||
        reg.register_status === 'зарегистрирована токен')
    );
  };

  const isSlot2Empty = (slot: PcSlot) =>
    !slot.pc_model.trim() &&
    !slot.pc_software_version.trim() &&
    !slot.token_number.trim() &&
    !slot.address.trim();

  const buildPayload = (slot: PcSlot): WorkstationOperationInput => ({
    workstation_id: null,
    operation_type: operationType,
    operation_date: operationDate,
    client_id: clientId || null,
    address: slot.address.trim(),
    is_cloud: isRegistration ? slot.is_cloud : false,
    token_number: isRegistration && !slot.is_cloud ? slot.token_number.trim() : '',
    notes: notes.trim(),
    pc_model: slot.pc_model.trim(),
    pc_software_version: slot.pc_software_version.trim(),
  });

  const recordTokenSideEffects = async (slot: PcSlot) => {
    if (isRegistration && slot.selectedToken) {
      await updateTokenStatus(slot.selectedToken.id, 'зарегистрирован');
      await createTokenHistoryEntry({
        token_id: slot.selectedToken.id,
        action: 'регистрация',
        action_date: operationDate,
        details: slot.is_cloud ? 'Облачная регистрация' : 'Регистрация токена',
        address: slot.address.trim(),
      });
    }
    if (operationType === 'deregistration' && slot.selectedToken) {
      await updateTokenStatus(slot.selectedToken.id, 'снят с регистрации');
      await createTokenHistoryEntry({
        token_id: slot.selectedToken.id,
        action: 'снятие',
        action_date: operationDate,
        details: notes.trim(),
        address: '',
      });
    }
    if (operationType === 'address_change' && slot.selectedToken) {
      await updateTokenAddress(slot.selectedToken.id, slot.address.trim());
      await createTokenHistoryEntry({
        token_id: slot.selectedToken.id,
        action: 'изменение адреса',
        action_date: operationDate,
        details: notes.trim(),
        address: slot.address.trim(),
      });
    }
    if (isRegistration && slot.is_cloud) {
      const reg = getSelectedCloudRegister(slot);
      if (reg) await updateCashRegisterStatus(reg.id, 'зарегистрирована облачная');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSlotTokenBlocked(slot1) || isSlotTokenBlocked(slot2)) {
      setSubmitError('Невозможно произвести регистрацию — токен уже зарегистрирован');
      return;
    }
    if (isSlotCashRegisterBlocked(slot1) || isSlotCashRegisterBlocked(slot2)) {
      setSubmitError('Невозможно произвести регистрацию — касса уже зарегистрирована');
      return;
    }

    const nextErrors: FormErrors = {};
    if (!operationDate) nextErrors.operation_date = 'Укажите дату';
    if (isRegistration && !clientId) nextErrors.client_id = 'Выберите клиента';
    if (needsAddress && !slot1.address.trim()) nextErrors['slot1_address'] = 'Укажите адрес';
    if (isRegistration && !slot1.token_number.trim())
      nextErrors['slot1_token'] = 'Выберите токен или DUSIC';
    if (needsNotes && !notes.trim()) nextErrors.notes = 'Укажите описание';

    const hasSlot2 = isRegistration && !isSlot2Empty(slot2);
    if (hasSlot2 && isRegistration && !slot2.token_number.trim())
      nextErrors['slot2_token'] = 'Выберите токен или DUSIC';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      if (operation) {
        await updateWorkstationOperation(operation.id, buildPayload(slot1));
        await recordTokenSideEffects(slot1);
      } else {
        await createWorkstationOperation(buildPayload(slot1));
        await recordTokenSideEffects(slot1);

        if (hasSlot2) {
          await createWorkstationOperation(buildPayload(slot2));
          await recordTokenSideEffects(slot2);
        }
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось сохранить запись. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const generateWordDocument = () => {
    const clientName = clients.find((c) => c.id === clientId)?.name ?? '';
    const buildSlotRows = (label: string, slot: PcSlot): [string, string][] => [
      [`${label} — Модель ПК`, slot.pc_model],
      [`${label} — Версия ПО`, slot.pc_software_version],
      [`${label} — Тип регистрации`, slot.is_cloud ? 'Облачная' : 'Токен'],
      [`${label} — Токен`, slot.token_number],
      [`${label} — Адрес`, slot.address],
    ];
    const rows: [string, string][] = [
      ['Дата', operationDate],
      ['Клиент', clientName],
      ...buildSlotRows('ПК 1', slot1),
      ...(isRegistration && !isSlot2Empty(slot2) ? buildSlotRows('ПК 2', slot2) : []),
      ['Примечание', notes],
    ];

    const tableRows = rows
      .map(
        ([label, value]) => `
        <tr>
          <td style="border:1px solid #999;padding:6px 12px;background:#f2f2f2;font-weight:bold;width:35%;">${label}</td>
          <td style="border:1px solid #999;padding:6px 12px;">${value || '—'}</td>
        </tr>`,
      )
      .join('');

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${TYPE_TITLES[operationType]}</title></head>
<body>
<h2 style="text-align:center;">${TYPE_TITLES[operationType]}</h2>
<table style="border-collapse:collapse;width:100%;font-family:Calibri,sans-serif;font-size:14px;">
${tableRows}
</table>
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${TYPE_TITLES[operationType]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSlot = (slotNum: 1 | 2, slot: PcSlot, optional: boolean) => {
    const setSlot = (patch: Partial<PcSlot>) => updateSlot(slotNum, patch);
    const tokenBlocked = isSlotTokenBlocked(slot);
    const cashBlocked = isSlotCashRegisterBlocked(slot);
    const prefix = `slot${slotNum}`;

    return (
      <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            ПК {slotNum}
            {optional && <span className="ml-2 text-xs font-normal text-slate-400">необязательно</span>}
          </h3>
        </div>

        <FormField label="Модель ПК" htmlFor={`${prefix}-model`} hint={modelsLoading ? 'Загрузка...' : undefined}>
          <ModelPicker
            id={`${prefix}-model`}
            models={models}
            value={slot.pc_model}
            onModelChange={(model) => setSlot({ pc_model: model })}
            onSoftwareVersionChange={(version) => setSlot({ pc_software_version: version })}
            disabled={modelsLoading}
          />
        </FormField>

        <FormField label="Версия ПО" htmlFor={`${prefix}-version`} hint="Подставляется из справочника">
          <input
            id={`${prefix}-version`}
            className={inputClassName}
            value={slot.pc_software_version}
            onChange={(event) => setSlot({ pc_software_version: event.target.value })}
            placeholder="Например, 5.6.2"
          />
        </FormField>

        {isRegistration && (
          <FormField
            label="Токен или DUSIC"
            htmlFor={`${prefix}-token`}
            error={errors[`${prefix}_token`]}
            hint={clientId ? 'Токены и облачные кассы выбранного клиента' : undefined}
          >
            <button
              id={`${prefix}-token`}
              type="button"
              onClick={() => clientId && setTokenPickerSlot(slotNum)}
              disabled={!clientId}
              className={`${inputClassName} text-left ${slot.token_number ? 'text-slate-900' : 'text-slate-400'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {slot.token_number || (clientId ? 'Выберите токен или DUSIC' : 'Сначала выберите клиента')}
            </button>
          </FormField>
        )}

        {isRegistration && slotNum === 1 && (
          <FormField label="Новый токен / облачная касса" htmlFor="ws-op-new-token" hint="Создать и привязать к клиенту">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTokenFormOpen('ikassa')}
                disabled={!clientId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                iKassa
              </button>
              <button
                type="button"
                onClick={() => setTokenFormOpen('cpi')}
                disabled={!clientId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                ЦПИ
              </button>
              <button
                type="button"
                onClick={() => setCloudCashRegisterFormOpen(true)}
                disabled={!clientId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Cloud className="h-4 w-4" />
                DusicCloud
              </button>
            </div>
          </FormField>
        )}

        {needsAddress && (
          <FormField label="Адрес" htmlFor={`${prefix}-address`} error={errors[`${prefix}_address`]}>
            <input
              id={`${prefix}-address`}
              className={inputClassName}
              value={slot.address}
              onChange={(event) => setSlot({ address: event.target.value })}
              placeholder="г. Минск, ул. Примерная, 1"
            />
          </FormField>
        )}

        {tokenBlocked && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            Токен уже зарегистрирован
          </div>
        )}
        {cashBlocked && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            Касса уже зарегистрирована
          </div>
        )}
      </div>
    );
  };

  const showDualSlots = isRegistration && !operation;

  return (
    <Modal
      maxWidth="max-w-6xl"
      title={operation ? `Редактирование: ${TYPE_TITLES[operationType]}` : TYPE_TITLES[operationType]}
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
            form="ws-operation-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={generateWordDocument}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <FileText className="h-4 w-4" />
            Печать документов
          </button>
        </>
      }
    >
      <form id="ws-operation-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pb-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Дата" htmlFor="ws-op-date" error={errors.operation_date}>
            <input
              id="ws-op-date"
              type="date"
              className={inputClassName}
              value={operationDate}
              onChange={(event) => setOperationDate(event.target.value)}
            />
          </FormField>

          {(isRegistration || operationType === 'deregistration' || operationType === 'address_change') && (
            <FormField
              label="Клиент"
              htmlFor="ws-op-client"
              error={errors.client_id}
              hint={clientsLoading ? 'Загрузка клиентов...' : undefined}
            >
              <div className="flex items-stretch gap-2">
                <ClientPicker
                  id="ws-op-client"
                  clients={clients}
                  value={clientId}
                  onChange={handleClientChange}
                  disabled={clientsLoading}
                />
                <button
                  type="button"
                  onClick={() => setClientFormOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </button>
              </div>
            </FormField>
          )}
        </div>

        {showDualSlots ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {renderSlot(1, slot1, false)}
            {renderSlot(2, slot2, true)}
          </div>
        ) : (
          renderSlot(1, slot1, false)
        )}

        {(needsNotes || needsAddress) && (
          <FormField
            label={operationType === 'deregistration' ? 'Причина снятия' : 'Примечание'}
            htmlFor="ws-op-notes"
            error={errors.notes}
          >
            <textarea
              id="ws-op-notes"
              rows={3}
              className={inputClassName}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Дополнительные сведения"
            />
          </FormField>
        )}

        {(operationType === 'deregistration' || operationType === 'address_change') && (
          <FormField
            label="Токен"
            htmlFor="ws-op-token-action"
            error={errors.slot1_token}
            hint="Токены выбранного клиента"
          >
            <button
              id="ws-op-token-action"
              type="button"
              onClick={() => clientId && setTokenPickerSlot(1)}
              disabled={!clientId}
              className={`${inputClassName} text-left ${slot1.token_number ? 'text-slate-900' : 'text-slate-400'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {slot1.token_number || (clientId ? 'Выберите токен' : 'Сначала выберите клиента')}
            </button>
          </FormField>
        )}

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>

      {tokenPickerSlot && clientId && (
        <TokenPicker
          assignedTokenNumbers={[]}
          currentTokenNumber={tokenPickerSlot === 1 ? slot1.token_number : slot2.token_number}
          clientId={clientId}
          cloudRegisters={clientCloudRegisters}
          onClose={() => setTokenPickerSlot(null)}
          onSelect={(tokenNumber, operatorType, cloudRegister) => {
            if (cloudRegister) {
              const patch: Partial<PcSlot> = {
                token_number: cloudRegister.pc_model || 'DUSIC',
                is_cloud: true,
                selectedToken: null,
                pc_model: cloudRegister.pc_model || '',
                pc_software_version: cloudRegister.pc_software_version || '',
                address: cloudRegister.pc_installation_address || '',
              };
              updateSlot(tokenPickerSlot, patch);
            } else {
              const token = clientTokens.find((t) => t.number === tokenNumber);
              const patch: Partial<PcSlot> = {
                token_number: tokenNumber,
                is_cloud: false,
                cashRegisterId: '',
              };
              if (token) {
                patch.selectedToken = token;
                patch.pc_model = token.pc_model || '';
                patch.pc_software_version = token.pc_software_version || '';
                patch.address = token.pc_installation_address || '';
              }
              updateSlot(tokenPickerSlot, patch);
            }
            setTokenPickerSlot(null);
          }}
        />
      )}

      {tokenFormOpen && clientId && (
        <TokenFormModal
          operatorType={tokenFormOpen}
          token={null}
          onClose={() => setTokenFormOpen(null)}
          onSaved={() => {
            setTokenFormOpen(null);
            loadClientData();
          }}
        />
      )}

      {cloudCashRegisterFormOpen && (
        <CloudCashRegisterFormModal
          cashRegister={null}
          onClose={() => setCloudCashRegisterFormOpen(false)}
          onSaved={() => {
            setCloudCashRegisterFormOpen(false);
            loadClientData();
          }}
        />
      )}

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
