import type { ICellRendererParams } from 'ag-grid-community';

interface ExpandButtonProps extends ICellRendererParams {
  onClick: (rowId: string) => void;
  expandedRows: Set<string>;
}

export default function ExpandButton({ data, onClick, expandedRows }: ExpandButtonProps) {
  if (!data || data.isDetailRow) {
    return null;
  }

  const isExpanded = expandedRows.has(data.id);

  const handleClick = () => {
    onClick(data.id);
  };

  return (
    <button
      type="button"
      className={`expand-button ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={handleClick}
      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
    >
      {isExpanded ? '▼' : '▶'}
    </button>
  );
}