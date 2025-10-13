import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, CellEditingStoppedEvent, ICellRendererParams, IsFullWidthRowParams, IRowNode } from 'ag-grid-community';
import moment from 'moment';
import { useAppContext } from './useAppContext';
import type { Quote } from '../types/quote';
import { ExpandButton, DetailRow, ActionButtons } from '../components';

export function useQuoteTable() {
  const { state, actions } = useAppContext();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasInitialized = useRef(false);
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      actionsRef.current.loadPage(1);
    }
  }, []);

  const loadMoreData = useCallback(async () => {
    if (isLoadingMore || state.loading) return;
    const { currentPage, totalPages } = state.pagination;
    if (currentPage >= totalPages) return;
    setIsLoadingMore(true);
    try {
      await actionsRef.current.loadPage(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, state.loading, state.pagination]);

  const toggleRowExpansion = useCallback((rowId: string) => {
    const next = new Set(expandedRows);
    if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
    setExpandedRows(next);
  }, [expandedRows]);

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Expand',
      field: 'expand',
      width: 80,
      cellRenderer: (params: ICellRendererParams) => {
        if (params.data.isDetailRow) return null;
        return ExpandButton({ ...params, onClick: toggleRowExpansion, expandedRows });
      },
      pinned: 'left',
      sortable: false,
      filter: false,
    },
    { headerName: 'Item Name', field: 'itemName', width: 200, sortable: true, filter: true, autoHeight: true },
    { headerName: 'Item Description', field: 'itemDescription', filter: 'agTextColumnFilter', width: 400, sortable: true, wrapText: true, autoHeight: true },
    { headerName: 'Supplier', field: 'supplier.name', width: 150, sortable: true, filter: true },
    {
      headerName: 'Quote Date', field: 'quoteDate', width: 130, sortable: true, filter: 'agDateColumnFilter', editable: true, cellEditor: 'agDateStringCellEditor',
      cellEditorParams: { inputFormat: 'yyyy-mm-dd' },
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
      headerName: 'First Cost ($)', field: 'costing.firstCost', width: 130, sortable: true, filter: 'agNumberColumnFilter', editable: true, cellEditor: 'agNumberCellEditor',
      valueFormatter: (params) => typeof params.value === 'number' ? `$${params.value.toFixed(2)}` : '',
    },
    {
      headerName: 'Retail Price ($)', field: 'clubCosting.retailPrice', width: 140, sortable: true, filter: 'agNumberColumnFilter', editable: true, cellEditor: 'agNumberCellEditor',
      valueFormatter: (params) => typeof params.value === 'number' ? `$${params.value.toFixed(2)}` : '',
    },
    { headerName: 'Committed', field: 'committedFlag', width: 120, sortable: true, filter: 'agSetColumnFilter', editable: true, cellRenderer: 'agCheckboxCellRenderer', cellEditor: 'agCheckboxCellEditor' },
    { headerName: 'Actions', field: 'actions', width: 120, cellRenderer: ActionButtons, sortable: false, filter: false, pinned: 'right' },
  ], [expandedRows, toggleRowExpansion]);

  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    if (newValue !== oldValue && data && colDef?.field) {
      const field = colDef.field as keyof Quote;
      actionsRef.current.startEditing(data.id, field as unknown as string, oldValue as string | number | boolean | null);
      actionsRef.current.updateQuote(data.id, field as unknown as string, newValue as string | number | boolean);
    }
  }, []);

  const rowData = useMemo(() => {
    const rows: (Quote | { id: string; isDetailRow: true; parentId: string; data: Quote })[] = [];
    state.quotes.forEach((quote) => {
      rows.push(quote);
      if (expandedRows.has(quote.id)) {
        rows.push({ id: `${quote.id}-detail`, isDetailRow: true, parentId: quote.id, data: quote });
      }
    });
    return rows;
  }, [state.quotes, expandedRows]);

  const isFullWidthRow = useCallback((params: IsFullWidthRowParams) => params.rowNode.data?.isDetailRow === true, []);
  const fullWidthCellRenderer = useCallback((params: ICellRendererParams) => DetailRow(params), []);
  const getRowId = useCallback((params: { data: Quote | { id: string } }) => params.data.id, []);
  const isRowSelectable = useCallback((node: IRowNode<Quote | { id: string; isDetailRow?: boolean }>) => {
    return !node.data?.isDetailRow;
  }, []);
  const getRowClass = useCallback((params: { data: { isDetailRow?: boolean } }) => params.data.isDetailRow ? 'detail-row' : 'main-row', []);
  const getRowHeight = useCallback((params: { data: { isDetailRow?: boolean; data?: Quote } }) => {
    if (params.data.isDetailRow) {
      const materials = params.data.data?.costing?.componentMaterialCosting || [];
      const baseHeight = 120;
      const rowHeight = 44;
      return baseHeight + (materials.length * rowHeight);
    }
    return undefined;
  }, []);

  return {
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
  } as const;
}

export default useQuoteTable;


