import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  FileText,
  FileUp,
  FileOutput,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FormField, { inputClassName } from '@/components/ui/FormField';
import ClientPicker from '@/components/ui/ClientPicker';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  fetchDocumentTemplates,
  uploadTemplateFile,
  createTemplate,
  deleteTemplate,
  downloadTemplateFile,
} from '@/lib/api/documentTemplates';
import { fetchClients } from '@/lib/api/clients';
import { buildTemplateData, generateDocumentFromTemplate } from '@/lib/generateDocument';
import type { Client, DocumentTemplate } from '@/types/directory';

export default function DocumentTemplatesPage() {
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<DocumentTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await fetchDocumentTemplates());
    } catch {
      setLoadError('Не удалось загрузить список шаблонов.');
    } finally {
      setLoading(false);
    }
  }, []);

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
    loadItems();
    loadClients();
  }, [loadItems, loadClients]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteTemplate(pendingDelete.id, pendingDelete.file_path);
      setPendingDelete(null);
      await loadItems();
    } catch {
      setDeleteError('Не удалось удалить шаблон. Попробуйте еще раз.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerate = async (clientId: string) => {
    if (!generateTarget) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setBusy(true);
    setActionError('');
    try {
      const buffer = await downloadTemplateFile(generateTarget.file_path);
      const data = buildTemplateData(client);
      const blob = generateDocumentFromTemplate(buffer, data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generateTarget.name.replace(/\.(docx?)$/i, '')}_${client.name}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setGenerateTarget(null);
    } catch {
      setActionError('Не удалось сгенерировать документ. Проверьте, что файл .docx является корректным шаблоном.');
    } finally {
      setBusy(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className="py-16 text-center text-sm text-slate-500">Загрузка...</p>;
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-red-600" />
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={loadItems}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
          >
            Повторить
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <FileText className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Шаблонов пока нет. Загрузите первый файл .docx</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Название</th>
              <th className="px-5 py-3">Описание</th>
              <th className="px-5 py-3">Дата загрузки</th>
              <th className="px-5 py-3 text-right">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-5 py-4 text-slate-700">{item.description || '—'}</td>
                <td className="px-5 py-4 tabular-nums text-slate-500">
                  {new Date(item.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGenerateTarget(item);
                        setActionError('');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      <FileOutput className="h-4 w-4" />
                      Генерация
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Удалить ${item.name}`}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Шаблоны документов</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Загрузка...' : `Всего шаблонов: ${items.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <FileUp className="h-4 w-4" />
          Загрузить шаблон
        </button>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm text-blue-800">
          <strong>Как использовать:</strong> Создайте документ Word (.docx) с плейсхолдерами вида {'{name}'}, {'{unp}'}, {'{director_name}'}, {'{legal_address}'} и т.д. При генерации они автоматически заменятся данными выбранного клиента.
        </p>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      )}

      {renderContent()}

      {uploadOpen && (
        <UploadTemplateModal
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            setUploadOpen(false);
            loadItems();
          }}
        />
      )}

      {generateTarget && (
        <GenerateDocumentModal
          template={generateTarget}
          clients={clients}
          clientsLoading={clientsLoading}
          busy={busy}
          error={actionError}
          onClose={() => {
            setGenerateTarget(null);
            setActionError('');
          }}
          onGenerate={handleGenerate}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить шаблон?"
          message={`Шаблон «${pendingDelete.name}» будет удален без возможности восстановления.`}
          confirmLabel="Удалить"
          busy={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError('');
          }}
        />
      )}
    </section>
  );
}

interface UploadTemplateModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function UploadTemplateModal({ onClose, onSaved }: UploadTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState('');
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Укажите название шаблона');
      return;
    }
    if (!file) {
      setFileError('Выберите файл .docx');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setFileError('Файл должен быть в формате .docx');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const filePath = await uploadTemplateFile(file);
      await createTemplate({
        name: trimmedName,
        file_path: filePath,
        description: description.trim(),
      });
      onSaved();
    } catch {
      setSubmitError('Не удалось загрузить шаблон. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Загрузка шаблона документа"
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
            form="upload-template-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Загрузка...' : 'Загрузить'}
          </button>
        </>
      }
    >
      <form id="upload-template-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Название" htmlFor="template-name" error={nameError}>
          <input
            id="template-name"
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Договор на обслуживание"
            autoFocus
          />
        </FormField>
        <FormField label="Описание" htmlFor="template-description" hint="Необязательно">
          <input
            id="template-description"
            className={inputClassName}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Краткое описание шаблона"
          />
        </FormField>
        <FormField label="Файл .docx" htmlFor="template-file" error={fileError} hint="Документ Word с плейсхолдерами вида {name}, {unp} и т.д.">
          <input
            id="template-file"
            type="file"
            accept=".docx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </FormField>
        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}

interface GenerateDocumentModalProps {
  template: DocumentTemplate;
  clients: Client[];
  clientsLoading: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onGenerate: (clientId: string) => void;
}

function GenerateDocumentModal({
  template,
  clients,
  clientsLoading,
  busy,
  error,
  onClose,
  onGenerate,
}: GenerateDocumentModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientIdError, setClientIdError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!clientId) {
      setClientIdError('Выберите клиента');
      return;
    }
    onGenerate(clientId);
  };

  return (
    <Modal
      title={`Генерация: ${template.name}`}
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
            form="generate-doc-form"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </>
      }
    >
      <form id="generate-doc-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Клиент"
          htmlFor="gen-client"
          error={clientIdError}
          hint={clientsLoading ? 'Загрузка клиентов...' : undefined}
        >
          <ClientPicker
            id="gen-client"
            clients={clients}
            value={clientId || null}
            onChange={(id) => {
              setClientId(id);
              setClientIdError('');
            }}
            disabled={clientsLoading}
          />
        </FormField>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Доступные плейсхолдеры:</p>
          <p className="mt-1">{'{name} {unp} {legal_address} {postal_address} {bank_account} {bank_name} {bank_address} {bank_bik} {phone} {email} {director_name} {director_name_genitive} {director_basis} {registration_certificate} {registered_by} {registered_at} {current_date}'}</p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </form>
    </Modal>
  );
}
