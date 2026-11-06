export interface Bank {
  id: string;
  name: string;
  address: string;
  bik: string;
}

export interface Client {
  id: string;
  name: string;
  unp: string;
  legal_address: string;
  postal_address: string;
  bank_account: string;
  bank_id: string;
  bank_address: string;
  bank_bik: string;
  phone: string;
  email: string;
  director_name: string;
  director_name_genitive: string;
  director_basis: string;
  is_ip: boolean;
  registration_certificate: string;
  registered_by: string;
  registered_at: string | null;
  bank: { name: string } | null;
}

export type ClientInput = Omit<Client, 'id' | 'bank'>;

export type BankInput = Omit<Bank, 'id'>;

export interface CashRegister {
  id: string;
  model: string;
  serial_number: string;
  software_version: string;
  client_id: string | null;
  installation_address: string;
  client: { name: string } | null;
}

export type CashRegisterInput = Omit<CashRegister, 'id' | 'client'>;

export interface Workstation {
  id: string;
  token_number: string;
  model: string;
  software_version: string;
  client_id: string | null;
  installation_address: string;
  client: { name: string } | null;
}

export type WorkstationInput = Omit<Workstation, 'id' | 'client'>;

export interface Taximeter {
  id: string;
  number: string;
  model: string;
  software_version: string;
  client_id: string | null;
  car: string;
  client: { name: string } | null;
}

export type TaximeterInput = Omit<Taximeter, 'id' | 'client'>;

export type TokenOperatorType = 'ikassa' | 'cpi';

export interface Token {
  id: string;
  number: string;
  operator_type: TokenOperatorType;
  client_id: string | null;
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
  contract_number: string;
}

export type TokenInput = Omit<Token, 'id'>;

export type TokenBatchOperatorLabel = 'АЙЭМЛЭБ' | 'ЦПИ';

export interface TokenBatch {
  id: string;
  operator_label: TokenBatchOperatorLabel;
  start_number: string;
  end_number: string;
  created_at: string;
}

export type TokenBatchInput = Omit<TokenBatch, 'id' | 'created_at'>;

export interface TradeObjectType {
  id: string;
  name: string;
}

export type TradeObjectTypeInput = Omit<TradeObjectType, 'id'>;

export interface EquipmentModel {
  id: string;
  model: string;
  software_version: string;
}

export type EquipmentModelInput = Omit<EquipmentModel, 'id'>;

export interface ServicedEquipment {
  id: string;
  model: string;
  serial_number: string;
  software_version: string;
  client_id: string | null;
  client: { name: string } | null;
}

export type ServicedEquipmentInput = Omit<ServicedEquipment, 'id' | 'client'>;

export type CashRegisterOperationType = 'registration' | 'deregistration' | 'address_change' | 'repair';

export interface CashRegisterOperation {
  id: string;
  equipment_id: string;
  operation_type: CashRegisterOperationType;
  operation_date: string;
  address: string;
  notes: string;
  equipment: { model: string; serial_number: string } | null;
}

export type CashRegisterOperationInput = Omit<CashRegisterOperation, 'id' | 'equipment'>;

export type WorkstationOperationType = 'registration' | 'deregistration' | 'address_change' | 'other';

export interface WorkstationOperation {
  id: string;
  workstation_id: string | null;
  operation_type: WorkstationOperationType;
  operation_date: string;
  client_id: string | null;
  address: string;
  is_cloud: boolean;
  token_number: string;
  notes: string;
  pc_model: string;
  pc_software_version: string;
  workstation: { model: string; token_number: string } | null;
  client: { name: string } | null;
}

export type WorkstationOperationInput = Omit<WorkstationOperation, 'id' | 'workstation' | 'client'>;

export interface Contract {
  id: string;
  number: string;
  client_id: string | null;
  client: { name: string } | null;
}

export type ContractInput = Omit<Contract, 'id' | 'client'>;

export interface DocumentTemplate {
  id: string;
  name: string;
  file_path: string;
  description: string;
  created_at: string;
}

export type DocumentTemplateInput = Omit<DocumentTemplate, 'id' | 'created_at'>;
