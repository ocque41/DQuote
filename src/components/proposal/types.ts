export type PortfolioAsset = {
  id: string;
  title?: string | null;
  type: string;
  url: string;
  tags?: string[];
};

export type RuntimeOption = {
  id: string;
  kind: "ITEM" | "BUNDLE";
  description?: string | null;
  priceOverride?: number | null;
  isDefault: boolean;
  isAddOn: boolean;
  minQty?: number | null;
  maxQty?: number | null;
  defaultQty?: number | null;
  catalogItem?: {
    id: string;
    name: string;
    description?: string | null;
    unitPrice: number;
    currency: string;
    tags: string[];
  } | null;
};

export type RuntimeSlide = {
  id: string;
  type: "INTRO" | "CHOICE_CORE" | "ADDONS" | "PORTFOLIO" | "REVIEW" | "ACCEPT";
  title?: string | null;
  subtitle?: string | null;
  position: number;
  meta?: Record<string, unknown> | null;
  options: RuntimeOption[];
};

export type RuntimeSelection = {
  optionId: string;
  qty: number;
};

export type ProposalRuntimeProps = {
  proposalId: string;
  shareId: string;
  currency: string;
  orgName: string;
  clientName: string;
  clientCompany?: string | null;
  slides: RuntimeSlide[];
  selections: RuntimeSelection[];
  assets: PortfolioAsset[];
  initialTotals?: {
    subtotal: number;
    tax: number;
    total: number;
    deposit?: number | null;
  } | null;
  quoteStatus?: {
    signatureId?: string | null;
    depositPaidAt?: string | null;
    acceptedByName?: string | null;
    acceptedByEmail?: string | null;
    pdfUrl?: string | null;
  } | null;
  theme?: Record<string, unknown> | null;
};
