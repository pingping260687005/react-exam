import type { ICellRendererParams } from 'ag-grid-community';
import type { Quote } from '../types/quote';

interface DetailRowProps extends ICellRendererParams {
  data: {
    isDetailRow: true;
    parentId: string;
    data: Quote;
  };
}

export default function DetailRow({ data }: DetailRowProps) {
  if (!data || !data.isDetailRow) {
    return null;
  }

  const quote = data.data;
  const materials = quote.costing.componentMaterialCosting;

  return (
    <div className="detail-row-container">
      <div className="detail-content">
        <h4>Component Material Costing</h4>
        <div className="materials-table">
          <div className="materials-header">
            <span className="material-desc-header">Material Description</span>
            <span className="material-cost-header">Cost per Selling Unit</span>
          </div>
          {materials.map((material, index) => (
            <div key={index} className="material-row">
              <span className="material-description">
                {material.materialDescription}
              </span>
              <span className="material-cost">
                ${material.costPerSellingUnit.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="materials-total">
            <span className="total-label">Total:</span>
            <span className="total-cost">
              ${materials.reduce((sum, m) => sum + m.costPerSellingUnit, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}