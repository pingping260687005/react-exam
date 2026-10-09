import type { ICellRendererParams } from 'ag-grid-community';
import { useAppContext } from '../hooks/useAppContext';
import type { EditingState } from '../types/quote';

type ActionButtonsProps = ICellRendererParams;

type EditLog = {
  type: 'save' | 'cancel';
  rowId: string | number;
  field?: string | null;
  originalValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
  timestamp: string;
};

export default function ActionButtons({ data }: ActionButtonsProps) {
  const { state, actions } = useAppContext();

  if (!data || data.isDetailRow) {
    return null;
  }

  const isEditing = state.editing.rowId === data.id;
  const hasChanges = isEditing && state.editing.hasChanges;

  // Identify dirty fields by comparing current row data with original snapshot
  // read changed fields tracked in state by reducer
  const dirtyFields = state.changedFields?.[data.id] ?? [];
  
  const getValueByPath = (obj: EditingState, path?: string | null) => {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur: EditingState = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      // @ts-expect-error: p is a string
      cur = cur[p as keyof EditingState] as string | number | boolean | null;
    }
    return cur;
  };

  const persistToLocalStorage = (type: 'save' | 'cancel') => {
    try {
      const logsRaw = localStorage.getItem('quoteEditLogs');
      const logs: EditLog[] = logsRaw ? JSON.parse(logsRaw) : [];
      const field = state.editing.field;
      const originalValue = state.editing.originalValue;
      const newValue = getValueByPath(data as unknown as EditingState, field);
      const hasLog = logs.find(log=>log.rowId===data.id && log.field===field)
       if(hasLog){
        hasLog.originalValue=originalValue;
        // @ts-expect-error: newValue can be undefined
        hasLog.newValue=newValue||false;
        hasLog.timestamp=new Date().toISOString();
        localStorage.setItem('quoteEditLogs', JSON.stringify(logs));
        return;
      }
      logs.push({
        type,
        rowId: data.id,
        field,
        originalValue,
        // @ts-expect-error: newValue can be undefined
        newValue,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('quoteEditLogs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to persist edit log:', e);
    }
  };

  const handleSave = () => {
    if (hasChanges) {
      persistToLocalStorage('save');
      // mark row saved (update snapshot) then clear editing state
      actions.markRowSaved(data.id);
      console.log('Saved changes for row:', data.id);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      // revert full row to original snapshot
      actions.revertRow(data.id);
      actions.cancelEditing(data.id);
    }
  };

  return (
    <div className="action-buttons">
      {dirtyFields.length > 0 ? (
        <>
          <button
            type="button"
            className="save-button"
            onClick={handleSave}
            title="Save changes"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            title="Cancel changes"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </>
      ) : (
        <span className="no-actions" style={{ color: '#999', fontSize: '12px' }}>
          No changes
        </span>
      )}
    </div>
  );
}