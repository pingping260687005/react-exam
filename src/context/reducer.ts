import type { AppState, AppAction } from './types';
import type { Quote } from '../types/quote';

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
  // keep a map of original quote snapshots by id
  originalQuotes: {},
  // changed fields per row id (list of dotted paths)
  changedFields: {},
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
        // initialize original snapshots for these quotes
        originalQuotes: action.payload.quotes.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Quote>),
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };

    case 'APPEND_QUOTES':
      return {
        ...state,
        quotes: [...state.quotes, ...action.payload],
        originalQuotes: {
          ...state.originalQuotes,
          ...action.payload.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Quote>),
        },
        loading: false,
        error: null,
      };

  case 'UPDATE_QUOTE':
      // Support nested field paths like 'costing.firstCost'
      // update the quote and record the changed field path
      return ((): AppState => {
        const updatedQuotes = state.quotes.map((quote) => {
          if (quote.id !== action.payload.id) return quote;
          const fieldPath = action.payload.field.split('.');
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
        });

        const prevChanged = state.changedFields[action.payload.id] ?? [];
        const newChangedSet = new Set(prevChanged.concat([action.payload.field]));

        return {
          ...state,
          quotes: updatedQuotes,
          changedFields: {
            ...state.changedFields,
            [action.payload.id]: Array.from(newChangedSet),
          },
          editing: {
            ...state.editing,
            hasChanges: true,
          },
        };
      })();

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

    case 'REVERT_ROW':
      return {
        ...state,
        quotes: state.quotes.map((q) => (q.id === action.payload.id ? state.originalQuotes[action.payload.id] ?? q : q)),
        changedFields: { ...state.changedFields, [action.payload.id]: [] },
        editing: {
          rowId: null,
          field: null,
          originalValue: null,
          hasChanges: false,
        },
      };

    case 'MARK_ROW_SAVED':
      return {
        ...state,
        // update snapshot so current quote becomes the new original
        originalQuotes: {
          ...state.originalQuotes,
          [action.payload.id]: state.quotes.find((q) => q.id === action.payload.id) ?? state.originalQuotes[action.payload.id],
        },
        changedFields: { ...state.changedFields, [action.payload.id]: [] },
        editing: {
          rowId: null,
          field: null,
          originalValue: null,
          hasChanges: false,
        },
      };

    default:
      return state;
  }
}