import { Plus } from 'lucide-react';
import { useState } from 'react';
import PcActivationFormModal from '@/components/workstationOperations/PcActivationFormModal';

export default function PcActivationPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Активация ПК</h1>
          <p className="mt-1 text-sm text-slate-500">
            Проведение активации ПК в системе СККО
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Активация ПК
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">
          Нажмите «Активация ПК», чтобы провести активацию.
        </p>
      </div>

      {formOpen && (
        <PcActivationFormModal
          onClose={() => setFormOpen(false)}
          onSaved={() => undefined}
        />
      )}
    </section>
  );
}
