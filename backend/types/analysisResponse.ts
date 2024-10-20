export interface AnalysisResponse {
  type: string;
  brand: string;
  condition: string;
  rarity: string;
  authenticityConfirmed: 'Yes' | 'No';
  packagingAccessories: string | null;
  purchasePrice: number | null;
  cleaningRepairCosts: number | null;
  estimatedShippingCosts: number | null;
  platformFees: number | null;
  expectedProfit: number | null;
  marketDemand: string;
  historicalPriceTrends: string;
  marketSaturation: string;
  salesVelocity: string;
  purchaseRecommendation: 'Yes' | 'No';
  detailedBreakdown: string;
}
