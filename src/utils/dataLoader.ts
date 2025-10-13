import type { Quote } from '../types/quote';
import type { PaginationState } from '../context/types';

/**
 * Pagination request interface
 */
export interface PaginationRequest {
  page: number;
  pageSize: number;
}

/**
 * Pagination response interface
 */
export interface PaginationResponse {
  quotes: Quote[];
  pagination: PaginationState;
}

/**
 * Generate large dataset for testing
 */
function generateLargeDataset(totalCount: number = 10000): Quote[] {
  const suppliers = ['Apex Imports', 'Global Furnishings Co.', 'Premium Outdoor Ltd.', 'Elite Furniture Inc.'];
  const countries = ['Vietnam', 'China', 'Thailand', 'Malaysia'];
  const products = [
    'Brenton 7-Piece Patio Set',
    'Halifax 4-Piece Conversation Set', 
    'Avalon 4-Piece Set with Firepit',
    'Sunset Dining Set',
    'Garden Paradise Collection',
    'Urban Style Outdoor Set'
  ];
  
  const quotes: Quote[] = [];
  
  for (let i = 0; i < totalCount; i++) {
    const productIndex = i % products.length;
    const supplierIndex = i % suppliers.length;
    const countryIndex = i % countries.length;
    
    quotes.push({
      id: `q${i + 1}-${Math.random().toString(36).substr(2, 8)}`,
      quoteName: `Quote #${i + 1}`,
      itemName: products[productIndex],
      itemDescription: `High-quality outdoor furniture set ${i + 1}. Premium materials and craftsmanship for outdoor living spaces.`,
      quoteDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      committedFlag: Math.random() > 0.5,
      supplier: { name: suppliers[supplierIndex] },
      fobPort: { countryOfOrigin: countries[countryIndex] },
      costing: {
        firstCost: Number((800 + Math.random() * 1500).toFixed(2)),
        componentMaterialCosting: [
          { materialDescription: 'Frame Material', costPerSellingUnit: Number((200 + Math.random() * 300).toFixed(2)) },
          { materialDescription: 'Fabric & Cushions', costPerSellingUnit: Number((150 + Math.random() * 250).toFixed(2)) },
          { materialDescription: 'Hardware & Assembly', costPerSellingUnit: Number((50 + Math.random() * 100).toFixed(2)) }
        ]
      },
      clubCosting: { retailPrice: Number((1200 + Math.random() * 2000).toFixed(2)) }
    });
  }
  
  return quotes;
}

// Global dataset for simulation
let globalDataset: Quote[] | null = null;

/**
 * Load paginated quote data
 */
export async function loadQuoteDataPaginated(request: PaginationRequest): Promise<PaginationResponse> {
  try {
    // Initialize dataset on first load
    if (!globalDataset) {
      console.log('Generating large dataset...');
      globalDataset = generateLargeDataset(10000);
      console.log(`Generated ${globalDataset.length} records`);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { page, pageSize } = request;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const quotes = globalDataset.slice(startIndex, endIndex);
    const totalCount = globalDataset.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      quotes,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error loading quote data:', error);
    throw new Error('Failed to load quote data');
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function loadQuoteData(): Promise<Quote[]> {
  const response = await loadQuoteDataPaginated({ page: 1, pageSize: 100 });
  return response.quotes;
}

/**
 * Format date as YYYY-MM-DD format
 */
export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}