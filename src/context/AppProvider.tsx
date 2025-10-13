import { useReducer, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import { appReducer, initialState } from './reducer';
import type { AppContextType, PaginationState } from './types';
import type { Quote } from '../types/quote';
import { loadQuoteDataPaginated } from '../utils/dataLoader';

/**
 * Provider Component
 */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Read and apply saved edit logs from localStorage to the given quotes
  type LocalEditLog = {
    type: 'save' | 'cancel';
    rowId: string | number;
    field?: string | null;
    originalValue?: string | number | boolean | null;
    newValue?: string | number | boolean | null;
    timestamp: string;
  };

  const getLogsFromLocalStorage = (): LocalEditLog[] => {
    try {
      const raw = localStorage.getItem('quoteEditLogs');
      if (!raw) return [];
      const logs = JSON.parse(raw) as LocalEditLog[];
      return Array.isArray(logs) ? logs : [];
    } catch {
      return [];
    }
  };

  // Set nested value by dotted path (e.g. 'costing.firstCost')
  const setValueByPath = (obj: unknown, path: string, value: unknown) => {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cursor: any = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      cursor[key] = { ...(cursor[key] ?? {}) };
      cursor = cursor[key];
    }
    cursor[parts[parts.length - 1]] = value;
  };

  const applySavedLogsToQuotes = (quotes: Quote[]): Quote[] => {
    const logs = getLogsFromLocalStorage().filter((l) => l.type === 'save' && l.field);
    if (logs.length === 0) return quotes;
    const quotesMap = new Map<string, Quote>(quotes.map((q) => [String(q.id), { ...q }]));
    for (const log of logs) {
      const q = quotesMap.get(String(log.rowId));
      if (!q || !log.field) continue;
      const clone: Quote = { ...q } as Quote;
      setValueByPath(clone, log.field, log.newValue as unknown);
      quotesMap.set(String(log.rowId), clone);
    }
    return Array.from(quotesMap.values());
  };

  // Action creators
  const setQuotes = useCallback((quotes: Quote[], pagination: PaginationState) => {
    dispatch({ type: 'SET_QUOTES', payload: { quotes, pagination } });
  }, []);

  const appendQuotes = useCallback((quotes: Quote[]) => {
    dispatch({ type: 'APPEND_QUOTES', payload: quotes });
  }, []);

  // field is a dotted path (e.g. 'costing.firstCost')
  const updateQuote = useCallback((id: string, field: string, value: string | number | boolean) => {
    dispatch({ type: 'UPDATE_QUOTE', payload: { id, field, value } });
  }, []);

  const startEditing = useCallback((rowId: string, field: string, originalValue: string | number | boolean | null) => {
    dispatch({ type: 'START_EDITING', payload: { rowId, field, originalValue } });
  }, []);

  const cancelEditing = useCallback((id: string) => {
    dispatch({ type: 'CANCEL_EDITING', payload: { id } });
  }, []);

  const saveEditing = useCallback(() => {
    dispatch({ type: 'SAVE_EDITING' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setPagination = useCallback((pagination: PaginationState) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  }, []);

  const loadPage = useCallback(async (page: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await loadQuoteDataPaginated({
        page,
        pageSize: 100 // Use fixed page size to avoid dependency
      });
      
      if (page === 1) {
        // First page - replace all data
        const merged = applySavedLogsToQuotes(response.quotes);
        dispatch({ type: 'SET_QUOTES', payload: { quotes: merged, pagination: response.pagination } });
      } else {
        // Subsequent pages - append data
        const mergedAppend = applySavedLogsToQuotes(response.quotes);
        dispatch({ type: 'APPEND_QUOTES', payload: mergedAppend });
        dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const revertRow = useCallback((id: string) => {
    dispatch({ type: 'REVERT_ROW', payload: { id } });
  }, []);

  const markRowSaved = useCallback((id: string) => {
    dispatch({ type: 'MARK_ROW_SAVED', payload: { id } });
  }, []);

  

  // Use useRef to stabilize actions object and avoid infinite loops
  const actionsRef = useRef({
    setQuotes,
    appendQuotes,
    updateQuote,
    startEditing,
    cancelEditing,
    saveEditing,
    setLoading,
    setError,
    setPagination,
    loadPage,
    revertRow,
    markRowSaved,
  });

  // Update function references in actionsRef
  actionsRef.current = {
    setQuotes,
    appendQuotes,
    updateQuote,
    startEditing,
    cancelEditing,
    saveEditing,
    setLoading,
    setError,
    setPagination,
    loadPage,
    revertRow,
    markRowSaved,
  };

  const actions = actionsRef.current;

  // Use more stable context value creation approach
  const contextValue: AppContextType = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}