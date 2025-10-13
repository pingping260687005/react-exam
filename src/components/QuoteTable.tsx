import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, IsFullWidthRowParams, IsRowSelectable } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useQuoteTable } from '../hooks/useQuoteTable';

export default function QuoteTable() {
  const {
    state,
    isLoadingMore,
    loadMoreData,
    columnDefs,
    onCellEditingStopped,
    rowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    getRowId,
    isRowSelectable,
    getRowClass,
    getRowHeight,
  } = useQuoteTable();

  if (state.loading) {
    return (
      <div className="loading-container">
        <p>Loading quotes...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="error-container">
        <p>Error: {state.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="quote-table-container">
      <div className="quote-header">
        <h1>Quote Management</h1>
        <div className="pagination-info">
          <span>
            Showing {state.quotes.length} of {state.pagination.totalCount} records
            {isLoadingMore && <span className="loading-text"> (Loading more...)</span>}
          </span>
        </div>
      </div>
      <div className="ag-theme-alpine quote-grid">
        <AgGridReact
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: false, filter: false }}
          animateRows={true}
          onCellEditingStopped={onCellEditingStopped}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          getRowId={getRowId}
          isRowSelectable={isRowSelectable as unknown as IsRowSelectable<unknown>}
          isFullWidthRow={isFullWidthRow as (p: IsFullWidthRowParams) => boolean}
          fullWidthCellRenderer={fullWidthCellRenderer as (p: ICellRendererParams) => unknown}
          rowModelType="clientSide"
          rowBuffer={10}
          maxBlocksInCache={10}
          cacheBlockSize={100}
          getRowClass={getRowClass as unknown as (p: any) => string}
          getRowHeight={getRowHeight as unknown as (p: any) => number | undefined}
        />
      </div>
      {/* Footer with Load More */}
      <div className="table-footer">
        <div className="footer-info">
          Page {state.pagination.currentPage} / {state.pagination.totalPages}
        </div>
        <button
          type="button"
          className="load-more-button"
          onClick={loadMoreData}
          disabled={isLoadingMore || state.loading || state.pagination.currentPage >= state.pagination.totalPages}
        >
          {state.pagination.currentPage >= state.pagination.totalPages
            ? 'No more data'
            : (isLoadingMore || state.loading) ? 'Loading...' : 'Load More (100)'}
        </button>
      </div>
    </div>
  );
}