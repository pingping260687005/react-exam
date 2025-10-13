import type { ICellRendererParams } from 'ag-grid-community';
import { useAppContext } from '../hooks/useAppContext';

type ActionButtonsProps = ICellRendererParams;

export default function ActionButtons({ data }: ActionButtonsProps) {
  const { state, actions } = useAppContext();

  if (!data || data.isDetailRow) {
    return null;
  }

  const isEditing = state.editing.rowId === data.id;
  const hasChanges = isEditing && state.editing.hasChanges;
  
  // Debug logging
  console.log('ActionButtons Debug:', {
    rowId: data.id,
    isEditing,
    hasChanges,
    editingState: state.editing,
    currentRowId: state.editing.rowId
  });

  const handleSave = () => {
    if (hasChanges) {
      actions.saveEditing();
      // TODO: Add server-side save logic here
      console.log('Saving changes for row:', data.id);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      actions.cancelEditing();
    }
  };

  return (
    <div className="action-buttons">
      {hasChanges ? (
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