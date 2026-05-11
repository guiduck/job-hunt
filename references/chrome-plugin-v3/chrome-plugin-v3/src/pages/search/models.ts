type CashbackType = {
  type: "PERCENTAGE" | "CURRENCY";
  rate: {
    current?: number;
    previous?: number;
  };
};

export interface OfferModel {
  id: number;
  title: string;
  slug: string;
  image: string;
  discount: number;
  quantity: number;
  limit: number;
  rules: string;
  url: string;
  badge: string;
  renderType: "COUPON_ONLINE" | "OFFER_ONLINE";
  pickedCount: number;
  partnerUrl?: string;
  expired: boolean;
  expirationDate: string;
  cashback?: CashbackType;
  storeId: number;
  categoryIds: number[];
  code?: string;
  hideCodeOnLoad?: boolean;
}

export interface StoreModel {
  id: number;
  storeId: number;
  slug: string;
  name: string;
  url: string;
  description: string;
  offerCount?: number;
  notice?: unknown;
  rules: string[];
  logo: string;
  maxDiscount: number;
  cashback?: CashbackType;
  partnerUrl?: string;
  lastRevision: string;
}

export type StoreData = StoreModel & { offers: OfferModel[] };
