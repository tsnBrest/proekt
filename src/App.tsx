import { useState } from 'react';
import {
  Building2,
  ClipboardList,
  FileStack,
  FileText,
  Monitor,
  Receipt,
  Wrench,
} from 'lucide-react';
import ClientsPage from '@/components/clients/ClientsPage';
import BanksPage from '@/components/banks/BanksPage';
import CashRegistersPage from '@/components/cashRegisters/CashRegistersPage';
import EquipmentModelsPage from '@/components/equipmentModels/EquipmentModelsPage';
import OperationsPage from '@/components/operations/OperationsPage';
import ServicedEquipmentPage from '@/components/servicedEquipment/ServicedEquipmentPage';
import TaximetersPage from '@/components/taximeters/TaximetersPage';
import TokensPage from '@/components/tokens/TokensPage';
import WorkstationOperationsPage from '@/components/workstationOperations/WorkstationOperationsPage';
import ContractsPage from '@/components/contracts/ContractsPage';
import DocumentTemplatesPage from '@/components/documentTemplates/DocumentTemplatesPage';
import type { LucideIcon } from 'lucide-react';
import type { CashRegisterOperationType, WorkstationOperationType } from '@/types/directory';


type TopTab = 'equipment' | 'reports' | 'directories';
type EquipmentSubtab = 'workstations' | 'taximeters' | 'cashRegisters';
type WorkstationSubtab = WorkstationOperationType;
type CashRegisterSubtab = 'list' | CashRegisterOperationType;
type DirectorySubtab =
  | 'clients'
  | 'banks'
  | 'cashRegisters'
  | 'servicedEquipment'
  | 'models'
  | 'contracts'
  | 'templates'
  | 'tokensIkassa'
  | 'tokensCpi';

interface Subtab {
  id: string;
  label: string;
}

const TOP_TABS: { id: TopTab; label: string; icon: LucideIcon }[] = [
  { id: 'equipment', label: 'Оборудование', icon: Monitor },
  { id: 'reports', label: 'Отчеты', icon: FileText },
  { id: 'directories', label: 'Справочники', icon: ClipboardList },
];

const EQUIPMENT_SUBTABS: Subtab[] = [
  { id: 'workstations', label: 'ПК' },
  { id: 'taximeters', label: 'Таксометры' },
  { id: 'cashRegisters', label: 'Кассы' },
];

const DIRECTORY_SUBTABS: Subtab[] = [
  { id: 'clients', label: 'Справочник клиентов' },
  { id: 'banks', label: 'Банки' },
  { id: 'cashRegisters', label: 'Справочник касс' },
  { id: 'servicedEquipment', label: 'Обслуживаемое оборудование' },
  { id: 'models', label: 'Модели' },
  { id: 'contracts', label: 'Справочник договоров' },
  { id: 'templates', label: 'Шаблоны документов' },
  { id: 'tokensIkassa', label: 'Токены iKassa' },
  { id: 'tokensCpi', label: 'Токены ЦПИ' },
];

const CASH_REGISTER_SUBTABS: Subtab[] = [
  { id: 'list', label: 'Список касс' },
  { id: 'registration', label: 'Регистрация кассы' },
  { id: 'deregistration', label: 'Снятие кассы' },
  { id: 'address_change', label: 'Изменение адреса' },
  { id: 'repair', label: 'Ремонт' },
];

const WORKSTATION_SUBTABS: Subtab[] = [
  { id: 'registration', label: 'Регистрация ПК' },
  { id: 'deregistration', label: 'Снятие ПК' },
  { id: 'address_change', label: 'Изменение адреса ПК' },
  { id: 'other', label: 'Другие документы' },
];

const WS_OPERATION_CONFIG: Record<
  WorkstationOperationType,
  { title: string; icon: LucideIcon }
> = {
  registration: { title: 'Регистрация ПК', icon: Monitor },
  deregistration: { title: 'Снятие ПК', icon: Monitor },
  address_change: { title: 'Изменение адреса ПК', icon: Monitor },
  other: { title: 'Другие документы', icon: FileStack },
};

const OPERATION_CONFIG: Record<
  CashRegisterOperationType,
  { title: string; subtitle: string; icon: LucideIcon }
> = {
  registration: { title: 'Регистрация кассы', subtitle: 'Журнал регистраций касс', icon: Receipt },
  deregistration: { title: 'Снятие кассы', subtitle: 'Журнал снятий касс с учета', icon: Receipt },
  address_change: { title: 'Изменение адреса', subtitle: 'Журнал изменений адреса касс', icon: Receipt },
  repair: { title: 'Ремонт касс', subtitle: 'Журнал ремонтов касс', icon: Wrench },
};

function App() {
  const [topTab, setTopTab] = useState<TopTab>('equipment');
  const [equipmentSubtab, setEquipmentSubtab] = useState<EquipmentSubtab>('workstations');
  const [workstationSubtab, setWorkstationSubtab] = useState<WorkstationSubtab>('registration');
  const [cashRegisterSubtab, setCashRegisterSubtab] = useState<CashRegisterSubtab>('list');
  const [directorySubtab, setDirectorySubtab] = useState<DirectorySubtab>('clients');

  const renderCashRegisterContent = () => {
    if (cashRegisterSubtab === 'list') {
      return <CashRegistersPage />;
    }
    const config = OPERATION_CONFIG[cashRegisterSubtab];
    return (
      <OperationsPage
        operationType={cashRegisterSubtab}
        title={config.title}
        subtitle={config.subtitle}
        emptyIcon={config.icon}
      />
    );
  };

  const renderWorkstationContent = () => {
    const config = WS_OPERATION_CONFIG[workstationSubtab];
    return (
      <WorkstationOperationsPage
        operationType={workstationSubtab}
        title={config.title}
        emptyIcon={config.icon}
      />
    );
  };

  const renderEquipmentContent = () => {
    switch (equipmentSubtab) {
      case 'workstations':
        return renderWorkstationContent();
      case 'taximeters':
        return <TaximetersPage />;
      case 'cashRegisters':
        return renderCashRegisterContent();
    }
  };

  const renderDirectoryContent = () => {
    switch (directorySubtab) {
      case 'clients':
        return <ClientsPage />;
      case 'banks':
        return <BanksPage />;
      case 'cashRegisters':
        return <CashRegistersPage />;
      case 'servicedEquipment':
        return <ServicedEquipmentPage />;
      case 'models':
        return <EquipmentModelsPage />;
      case 'contracts':
        return <ContractsPage />;
      case 'templates':
        return <DocumentTemplatesPage />;
      case 'tokensIkassa':
        return <TokensPage operatorType="ikassa" />;
      case 'tokensCpi':
        return <TokensPage operatorType="cpi" />;
    }
  };

  const renderSubtabs = (subtabs: Subtab[], active: string, onSelect: (id: string) => void) => (
    <nav className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" aria-label="Подразделы">
      {subtabs.map((sub) => {
        const activeSub = active === sub.id;
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub.id)}
            aria-current={activeSub ? 'page' : undefined}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeSub ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sub.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">ЦТО ООО "Анъюск"</span>
          </div>
          <nav className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" aria-label="Разделы">
            {TOP_TABS.map(({ id, label, icon: Icon }) => {
              const active = topTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTopTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>
          {topTab === 'equipment' &&
            renderSubtabs(EQUIPMENT_SUBTABS, equipmentSubtab, (id) =>
              setEquipmentSubtab(id as EquipmentSubtab),
            )}
          {topTab === 'equipment' &&
            equipmentSubtab === 'workstations' &&
            renderSubtabs(WORKSTATION_SUBTABS, workstationSubtab, (id) =>
              setWorkstationSubtab(id as WorkstationSubtab),
            )}
          {topTab === 'equipment' &&
            equipmentSubtab === 'cashRegisters' &&
            renderSubtabs(CASH_REGISTER_SUBTABS, cashRegisterSubtab, (id) =>
              setCashRegisterSubtab(id as CashRegisterSubtab),
            )}
          {topTab === 'directories' &&
            renderSubtabs(DIRECTORY_SUBTABS, directorySubtab, (id) =>
              setDirectorySubtab(id as DirectorySubtab),
            )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {topTab === 'equipment' && renderEquipmentContent()}
        {topTab === 'directories' && renderDirectoryContent()}
        {topTab === 'reports' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">Раздел «Отчеты» находится в разработке.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
