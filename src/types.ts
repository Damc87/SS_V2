export type Project = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  net_m2?: number;
  gross_m2?: number;
  volume_m3?: number;
  created_at: string;
  updated_at?: string;
  is_archived?: boolean;
};

export type MainPhase = { id: string; name: string; order_no: number; budget_planned?: number; project_id?: string };
export type Phase = MainPhase;
export type Subphase = { id: string; main_phase_id: string; name: string; order_no: number; project_id?: string };
export type Contractor = {
  id: string;
  name: string;
  project_id?: string;
  subphase_ids: string[];
  created_at: string;
  updated_at?: string;
  is_archived?: boolean;
};

export type Cost = {
  id: string;
  project_id: string;
  phase_id: string;
  subphase_id: string;
  contractor_id: string;
  description: string;
  amount_gross: number;
  invoice_date: string;
  invoice_month: string;
  invoice_no?: string;
  pdf_attachment?: {
    file_name: string;
    stored_path: string;
    original_name: string;
  };
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CostInput = Omit<Cost, 'id' | 'created_at' | 'updated_at' | 'phase_id'> & { phase_id?: string };

export type CostListResult = {
  items: Cost[];
  total: number;
};

export type Document = {
  id: string;
  project_id: string;
  cost_id?: string;
  original_name: string;
  stored_name: string;
  stored_path: string;
  mime: string;
  size: number;
  created_at: string;
};

export type PhasesImportResult = {
  projectId: string;
  mainPhases: number;
  subphases: number;
  validRows: number;
};
