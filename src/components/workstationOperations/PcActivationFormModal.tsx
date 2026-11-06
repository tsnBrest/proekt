import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Cloud, KeyRound, Search, TriangleAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ClientPicker from '@/components/ui/ClientPicker';
import { fetchClients } from '@/lib/api/clients';
import { fetchTokensByClient } from '@/lib/api/tokens';
import { fetchCloudCashRegistersByClient } from '@/lib/api/cloudCashRegisters';
import { createPcActivation } from '@/lib/api/pcActivations';
import { updateTokenStatus } from '@/lib/api/tokens';
import { updateCloudCashRegisterStatus } from '@/lib/api/cloudCashRegisters';
import { fetchAllStatuses } from '@/lib/api/statuses';
import type { Client, CloudCashRegister, Status, Token } from '@/types/directory';

type DeviceItem =
  | { kind: 'token'; id: string; number: string; status: string; model: string; address: string }
  | { kind: 'cloud'; id: string; number: string; status: string; model: string; address: string };

interface PcActivationFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function PcActivationFormModal({ onClose, onSaved }: PcActivationFormModalProps) {
  const [operationDate, setOperationDate] = useState(new Date().toISOString().slice(0, 10));
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [cloudRegisters, setCloudRegisters] = useState<CloudCashRegister[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients().then(setClients).catch(() => undefined);
    fetchAllStatuses().then(setStatuses).catch(() => undefined);
  }, []);

  const loadClientData = useCallback(async () => {
    if (!clientId) {
      setTokens([]);
      setCloudRegisters([]);
      setSelectedDevice(null);
      return;
    }
    try {
      setTokens(await fetchTokensByClient(clientId, []));
    } catch {
      setTokens([]);
    }
    try {
      setCloudRegisters(await fetchCloudCashRegistersByClient(clientId));
    } catch {
      setCloudRegisters([]);
    }
    setSelectedDevice(null);
  }, [clientId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const devices: DeviceItem[] = useMemo(() => {
    const tokenDevices: DeviceItem[] = tokens.map((t) => ({
      kind: 'token',
      id: t.id,
      number: t.number,
      status: t.status,
      model: t.pc_model || '',
      address: t.pc_installation_address || '',
    }));
    const cloudDevices: DeviceItem[] = cloudRegisters.map((r) => ({
      kind: 'cloud',
      id: r.id,
      number: r.pc_model || 'DUSIC',
      status: r.register_status || '',
      model: r.pc_model || '',
      address: r.pc_installation_address || '',
    }));
    return [...tokenDevices, ...cloudDevices];
  }, [tokens, cloudRegisters]);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return devices;
    return devices.filter(
      (d) =>
        d.number.toLowerCase().includes(query) ||
        d.model.toLowerCase().includes(query) ||
        d.address.toLowerCase().includes(query),
    );
  }, [devices, search]);

  const statusOptions = useMemo(() => statuses.map((s) => s.name), [statuses]);

  const handleSelectDevice = (device: DeviceItem) => {
    setSelectedDevice(device);
    setNewStatus(device.status || '');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!operationDate) nextErrors.operation_date = 'Укажите дату';
    if (!clientId) nextErrors.client_id = 'Выберите клиента';
    if (!selectedDevice) nextErrors.device = 'Выберите ПК клиента';
    if (!newStatus) nextErrors.new_status = 'Выберите статус';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedDevice) return;

    const device = selectedDevice;
    setSaving(true);
    setSubmitError('');
    try {
      await createPcActivation({
        activation_date: operationDate,
        client_id: clientId,
        device_kind: device.kind,
        device_id: device.id,
        device_number: device.number,
        previous_status: device.status,
        new_status: newStatus,
        reg_number_skko: regNumber,
        notes,
      });
      if (device.kind === 'token') {
        await updateTokenStatus(device.id, newStatus);
      } else {
        await updateCloudCashRegisterStatus(device.id, newStatus);
      }
      onSaved();
      onClose();
    } catch {
      setSubmitError('Не удалось провести активацию. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Активация ПК"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          {submitError && <span className="text-sm text-red-600">{submitError}</span>}
          <button
            type="submit"
            form="pc-activation-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Провести активацию'}
          </button>
        </div>
      }
    >
      <form id="pc-activation-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pb-16">
        <FormField label="Дата" htmlFor="activation-date" error={errors.operation_date}>
          <input
            id="activation-date"
            type="date"
            className={inputClassName}
            value={operationDate}
            onChange={(e) => setOperationDate(e.target.value)}
          />
        </FormField>

        <FormField label="Клиент" htmlFor="activation-client" error={errors.client_id}>
          <ClientPicker
            id="activation-client"
            clients={clients}
            value={clientId}
            onChange={setClientId}
          />
        </FormField>

        {clientId && (
          <FormField
            label="ПК клиента"
            htmlFor="activation-device-search"
            error={errors.device}
            hint="Токены и облачные кассы, закреплённые за клиентом"
          >
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="activation-device-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по номеру, модели или адресу"
                className={`${inputClassName} pl-10`}
              />
            </div>
            {filteredDevices.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {devices.length === 0
                  ? 'Нет токенов или облачных касс у этого клиента.'
                  : 'Ничего не найдено.'}
              </p>
            ) : (
              <ul className="max-h-60 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
                {filteredDevices.map((device) => {
                  const isSelected = selectedDevice?.id === device.id;
                  return (
                    <li key={`${device.kind}-${device.id}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectDevice(device)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {device.kind === 'cloud' ? (
                          <Cloud className="h-4 w-4 shrink-0 text-blue-500" />
                        ) : (
                          <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <span className="flex flex-1 flex-col gap-0.5">
                          <span className="font-medium text-slate-900">{device.number}</span>
                          {device.model && (
                            <span className="text-xs text-slate-500">{device.model}</span>
                          )}
                          {device.address && (
                            <span className="text-xs text-slate-500">{device.address}</span>
                          )}
                        </span>
                        {device.status && (
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {device.status}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </FormField>
        )}

        {selectedDevice && (
          <FormField label="Текущий статус" htmlFor="activation-current-status">
            <input
              id="activation-current-status"
              className={`${inputClassName} bg-slate-50`}
              value={selectedDevice.status || '—'}
              readOnly
            />
          </FormField>
        )}

        {selectedDevice && (
          <FormField label="Новый статус" htmlFor="activation-new-status" error={errors.new_status}>
            <select
              id="activation-new-status"
              className={inputClassName}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Выберите статус</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Рег. номер в СККО" htmlFor="activation-reg-number">
          <input
            id="activation-reg-number"
            className={inputClassName}
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder="Регистрационный номер в СККО"
          />
        </FormField>

        <FormField label="Примечание" htmlFor="activation-notes">
          <textarea
            id="activation-notes"
            rows={3}
            className={inputClassName}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительные сведения"
          />
        </FormField>

        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}
      </form>
    </Modal>
  );
}
