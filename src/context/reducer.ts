import type { AppState, AppAction } from './types';

export const initialState: AppState = {
  quotes: [],
  pagination: {
    currentPage: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0,
  },
  editing: {
    rowId: null,
    field: null,
    originalValue: null,
    hasChanges: false,
  },
  loading: false,
  error: null,
};

/**
 * Reducer Function
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_QUOTES':
      return {
        ...state,
        quotes: action.payload.quotes,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };

    case 'APPEND_QUOTES':
      return {
        ...state,
        quotes: [...state.quotes, ...action.payload],
        loading: false,
        error: null,
      };

    case 'UPDATE_QUOTE':
      // Support nested field paths like 'costing.firstCost'
      return {
        ...state,
        quotes: state.quotes.map((quote) => {
          if (quote.id !== action.payload.id) return quote;
          const fieldPath = action.payload.field.split('.');
          // Create a shallow clone and then walk the path
          // Use localized any suppression for the dynamic update logic
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = { ...quote } as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let target: any = updated;
          for (let i = 0; i < fieldPath.length - 1; i++) {
            const key = fieldPath[i];
            target[key] = { ...(target[key] ?? {}) };
            target = target[key];
          }
          target[fieldPath[fieldPath.length - 1]] = action.payload.value;
          return updated as typeof quote;
        }),
        editing: {
          ...state.editing,
          hasChanges: true,
        },
      };

    case 'START_EDITING':
      return {
        ...state,
        editing: {
          rowId: action.payload.rowId,
          field: action.payload.field,
          originalValue: action.payload.originalValue,
          hasChanges: false,
        },
      };

    case 'CANCEL_EDITING':
      if (state.editing.rowId && state.editing.field && state.editing.hasChanges) {
        return {
          ...state,
          quotes: state.quotes.map((quote) => {
            if (quote.id !== state.editing.rowId) return quote;
            const fieldPath = state.editing.field!.split('.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const restored = { ...quote } as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let target: any = restored;
            for (let i = 0; i < fieldPath.length - 1; i++) {
              const key = fieldPath[i];
              target[key] = { ...(target[key] ?? {}) };
              target = target[key];
            }
            target[fieldPath[fieldPath.length - 1]] = state.editing.originalValue;
            return restored as typeof quote;
          }),
          editing: {
            rowId: null,
            field: null,
            originalValue: null,
            hasChanges: false,
          },
        };
      }
      return {
        ...state,
        editing: {
          rowId: null,
          field: null,
          originalValue: null,
          hasChanges: false,
        },
      };

    case 'SAVE_EDITING':
      return {
        ...state,
        editing: {
          rowId: null,
          field: null,
          originalValue: null,
          hasChanges: false,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: action.payload,
      };

    default:
      return state;
  }
}