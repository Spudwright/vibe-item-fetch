// CRV (California Redemption Value) calculation utilities

export type MaterialType = 'aluminum' | 'glass' | 'plastic';

export interface CRVItem {
  id: string;
  barcode?: string;
  description: string;
  materialType: MaterialType;
  sizeOz: number;
  quantity: number;
}

// CRV rates per CalRecycle (January 2024)
export const getCRVRate = (sizeOz: number): number => {
  return sizeOz < 24 ? 0.05 : 0.10;
};

// Calculate full CRV value for items
export const calculateFullCRV = (items: CRVItem[]): number => {
  return items.reduce((total, item) => {
    const rate = getCRVRate(item.sizeOz);
    return total + (rate * item.quantity);
  }, 0);
};

// Calculate service fee based on user's total redeemed
// 50% below $100, 40% at or above $100
export const getServiceFeeRate = (userTotalRedeemed: number): number => {
  return userTotalRedeemed >= 100 ? 0.40 : 0.50;
};

// Calculate user payout after service fee
export const calculateUserPayout = (
  fullCRV: number, 
  userTotalRedeemed: number
): { payout: number; fee: number; feeRate: number } => {
  const feeRate = getServiceFeeRate(userTotalRedeemed);
  const fee = fullCRV * feeRate;
  const payout = fullCRV - fee;
  
  return { payout, fee, feeRate };
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Material display info
export const materialInfo: Record<MaterialType, { label: string; icon: string; color: string }> = {
  aluminum: { label: 'Aluminum Cans', icon: '🥫', color: 'bg-gray-200' },
  glass: { label: 'Glass Bottles', icon: '🍾', color: 'bg-emerald-200' },
  plastic: { label: 'Plastic Bottles', icon: '🧴', color: 'bg-blue-200' },
};

// Common container sizes
export const commonSizes = [
  { value: 8, label: '8 oz' },
  { value: 12, label: '12 oz (standard can)' },
  { value: 16, label: '16 oz' },
  { value: 20, label: '20 oz' },
  { value: 24, label: '24 oz' },
  { value: 32, label: '32 oz' },
  { value: 64, label: '64 oz (half gallon)' },
];

// Validate UPC barcode (12 digits for UPC-A)
export const isValidUPC = (barcode: string): boolean => {
  return /^\d{12}$/.test(barcode);
};
