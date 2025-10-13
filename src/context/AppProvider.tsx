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

  const cancelEditing = useCallback(() => {
    dispatch({ type: 'CANCEL_EDITING' });
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
        dispatch({ type: 'SET_QUOTES', payload: { quotes: response.quotes, pagination: response.pagination } });
      } else {
        // Subsequent pages - append data
        dispatch({ type: 'APPEND_QUOTES', payload: response.quotes });
        dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
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
  };

  const actions = actionsRef.current;

  // Use more stable context value creation approach
  const contextValue: AppContextType = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}