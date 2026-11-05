export interface Bank {
  id: string;
  name: string;
  address: string;
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
  director_name: string;
  director_name_genitive: string;
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
}

export type TokenInput = Omit<Token, 'id'>;

export interface EquipmentModel {
  id: string;
  model: string;
  software_version: string;
}

export type EquipmentModelInput = Omit<EquipmentModel, 'id'>;

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
  workstation_id: string;
  operation_type: WorkstationOperationType;
  operation_date: string;
  client_id: string | null;
  address: string;
  is_cloud: boolean;
  token_number: string;
  notes: string;
  workstation: { model: string; token_number: string } | null;
  client: { name: string } | null;
}

export type WorkstationOperationInput = Omit<WorkstationOperation, 'id' | 'workstation' | 'client'>;
