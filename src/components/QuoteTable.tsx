import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import moment from 'moment';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellEditingStoppedEvent, ICellRendererParams, IsFullWidthRowParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { useAppContext } from '../hooks/useAppContext';
import type { Quote } from '../types/quote';

import { ExpandButton, DetailRow, ActionButtons } from './index';

export default function QuoteTable() {
  const { state, actions } = useAppContext();
  // const [, setGridApi] = useState<GridApi | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initialize and load data - use ref to avoid dependency cycles
  const hasInitialized = useRef(false);
  const actionsRef = useRef(actions);
  
  // Update refs only when actions actually change
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      actionsRef.current.loadPage(1);
    }
  }, []); // CRITICAL: Empty dependency array to run only once

  // Load more data when scrolling near bottom - use refs to avoid dependencies
  const loadMoreData = useCallback(async () => {
    console.log('loadMoreData called - isLoadingMore:', isLoadingMore, 'state.loading:', state.loading);
    
    if (isLoadingMore || state.loading) {
      console.log('Skipping loadMore - already loading');
      return;
    }
    
    const { currentPage, totalPages } = state.pagination;
    console.log('Pagination state - currentPage:', currentPage, 'totalPages:', totalPages);
    
    if (currentPage >= totalPages) {
      console.log('Skipping loadMore - no more pages');
      return;
    }
    
    console.log('Loading page:', currentPage + 1);
    setIsLoadingMore(true);
    try {
      await actionsRef.current.loadPage(currentPage + 1);
      console.log('Successfully loaded page:', currentPage + 1);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, state.loading, state.pagination]);


  // Toggle row expansion state
  const toggleRowExpansion = useCallback((rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  }, [expandedRows]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Expand',
      field: 'expand',
      width: 90,
      cellRenderer: (params: ICellRendererParams) => {
        if (params.data.isDetailRow) {
          return null;
        }
        return ExpandButton({
          ...params,
          onClick: toggleRowExpansion,
          expandedRows: expandedRows,
        });
      },
      pinned: 'left',
      sortable: false,
      filter: false,
    },
    {
      headerName: 'No',
      field: 'quoteName',
      width: 55,
      autoHeight: true,
    },
    {
      headerName: 'Item Name',
      field: 'itemName',
      wrapText: true,
      width: 200,
      sortable: true,
      filter: true,
      autoHeight: true,
    },
    {
      headerName: 'Item Description',
      field: 'itemDescription',
      filter: 'agTextColumnFilter',
      width: 400,
      sortable: true,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: 'Supplier',
      field: 'supplier.name',
      width: 150,
      wrapText: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Quote Date',
      field: 'quoteDate',
      width: 130,
      sortable: true,
      filter: 'agDateColumnFilter',
      editable: true,
      cellEditor: 'agDateStringCellEditor',
      cellEditorParams: {
        inputFormat: 'yyyy-mm-dd',
      },
      valueFormatter: (params) => {
        const v = params.value as string | Date | undefined;
        if (!v) return '';
        const m = moment.utc(v);
        return m.isValid() ? m.format('YYYY-MM-DD') : '';
      },
      valueParser: (params) => {
        const input = params.newValue as string | undefined;
        if (!input) return params.oldValue;
        const m = moment.utc(input, 'YYYY-MM-DD', true);
        if (!m.isValid()) return params.oldValue;
        return m.toISOString();
      },
    },
    {
      headerName: 'First Cost ($)',
      field: 'costing.firstCost',
      width: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueFormatter: (params) => {
        if (typeof params.value === 'number') {
          return `$${params.value.toFixed(2)}`;
        }
        return '';
      },
    },
    {
      headerName: 'Retail Price ($)',
      field: 'clubCosting.retailPrice',
      width: 140,
      sortable: true,
      filter: 'agNumberColumnFilter',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueFormatter: (params) => {
        if (typeof params.value === 'number') {
          return `$${params.value.toFixed(2)}`;
        }
        return '';
      },
    },
    {
      headerName: 'Committed',
      field: 'committedFlag',
      width: 120,
      sortable: true,
      filter: 'agSetColumnFilter',
      editable: true,
      cellRenderer: 'agCheckboxCellRenderer',
      cellEditor: 'agCheckboxCellEditor',
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      cellRenderer: ActionButtons,
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ], [expandedRows, toggleRowExpansion]);

  // Handle cell editing stopped event
  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, value, oldValue } = event;
    const currentValue = value||newValue;
    console.log('.........', currentValue)
    if (currentValue !== oldValue && data && colDef?.field) {
      const field = colDef.field as keyof Quote;
      console.log('Updating quote and starting editing for:', data.id, field);
      // First start editing to set up the editing state
      actionsRef.current.startEditing(data.id, field, oldValue);
      // Then update the quote value and mark as changed
      actionsRef.current.updateQuote(data.id, field, currentValue);
    }
  }, []);

  // Combine row data (including expanded detail rows)
  const rowData = useMemo(() => {
    const rows: (Quote | { id: string; isDetailRow: true; parentId: string; data: Quote })[] = [];
    
    state.quotes.forEach((quote) => {
      rows.push(quote);
      
      if (expandedRows.has(quote.id)) {
        rows.push({
          id: `${quote.id}-detail`,
          isDetailRow: true,
          parentId: quote.id,
          data: quote,
        });
      }
    });
    
    return rows;
  }, [state.quotes, expandedRows]);

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
          defaultColDef={{
            resizable: true,
            sortable: false,
            filter: false,
          }}
          // animateRows={true}
          onCellEditingStopped={onCellEditingStopped}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          getRowId={(params) => params.data.id}
          isRowSelectable={(params) => !params.data.isDetailRow}
          isFullWidthRow={(params: IsFullWidthRowParams) => params.rowNode.data?.isDetailRow === true}
          fullWidthCellRenderer={(params: ICellRendererParams) => DetailRow(params)}
          rowModelType="clientSide"
          // rowBuffer={10}
          // maxBlocksInCache={10}
          // cacheBlockSize={100}
          getRowClass={(params) => {
            if (params.data.isDetailRow) {
              return 'detail-row';
            }
            return 'main-row';
          }}
          getRowHeight={(params) => {
            if (params.data.isDetailRow) {
              // Calculate height based on number of materials
              const materials = params.data.data?.costing?.componentMaterialCosting || [];
              const baseHeight = 120; // Header + padding
              const rowHeight = 44; // Each material row
              return baseHeight + (materials.length * rowHeight);
            }
            return undefined;
          }}
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