/**
 * Material Cost Component Interface
 */
export interface MaterialCostComponent {
  materialDescription: string;
  costPerSellingUnit: number;
}

/**
 * Costing Interface
 */
export interface Costing {
  firstCost: number;
  componentMaterialCosting: MaterialCostComponent[];
}

/**
 * Club Costing Interface
 */
export interface ClubCosting {
  retailPrice: number;
}

/**
 * Supplier Interface
 */
export interface Supplier {
  name: string;
}

/**
 * FOB Port Interface
 */
export interface FobPort {
  countryOfOrigin: string;
}

/**
 * Quote Data Interface
 */
export interface Quote {
  id: string;
  quoteName: string;
  itemName: string;
  itemDescription: string;
  quoteDate: string;
  committedFlag: boolean;
  supplier: Supplier;
  fobPort: FobPort;
  costing: Costing;
  clubCosting: ClubCosting;
}

/**
 * Editing State Interface
 */
export interface EditingState {
  rowId: string | null;
  field: string | null;
  originalValue: string | number | boolean | null;
  hasChanges: boolean;
  type?: 'save' | 'cancel' | 'edit';
}

/**
 * Table Action Types
 */
export type TableAction = 'save' | 'cancel' | 'edit';