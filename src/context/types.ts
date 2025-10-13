import type { Quote, EditingState } from '../types/quote';

/**
 * Pagination interface
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Application State Interface
 */
export interface AppState {
  quotes: Quote[];
  pagination: PaginationState;
  editing: EditingState;
  // snapshot of quotes as originally loaded (used to detect dirty rows)
  originalQuotes: Record<string, Quote>;
  // map of rowId -> array of changed field paths
  changedFields: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Action Type Definitions
 */
export type AppAction =
  | { type: 'SET_QUOTES'; payload: { quotes: Quote[]; pagination: PaginationState } }
  | { type: 'APPEND_QUOTES'; payload: Quote[] }
  | { type: 'UPDATE_QUOTE'; payload: { id: string; field: string; value: string | number | boolean } }
  | { type: 'REVERT_ROW'; payload: { id: string } }
  | { type: 'MARK_ROW_SAVED'; payload: { id: string } }
  | { type: 'START_EDITING'; payload: { rowId: string; field: string; originalValue: string | number | boolean | null } }
  | { type: 'CANCEL_EDITING' }
  | { type: 'SAVE_EDITING' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGINATION'; payload: PaginationState };

/**
 * Context Interface
 */
export interface AppContextType {
  state: AppState;
  actions: {
    setQuotes: (quotes: Quote[], pagination: PaginationState) => void;
    appendQuotes: (quotes: Quote[]) => void;
    // field may be a dotted path like 'costing.firstCost'
    updateQuote: (id: string, field: string, value: string | number | boolean) => void;
    startEditing: (rowId: string, field: string, originalValue: string | number | boolean | null) => void;
    cancelEditing: () => void;
    saveEditing: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPagination: (pagination: PaginationState) => void;
    loadPage: (page: number) => Promise<void>;
    // Revert a row back to the original snapshot
    revertRow: (id: string) => void;
    // Mark a row as saved (update original snapshot)
    markRowSaved: (id: string) => void;
  };
}