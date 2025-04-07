export type MonetaryValue = {
  amount: string;
  currency: string;
};

export type PaymentCategory =
  | "ERP"
  | "POS"
  | "ECOMMERCE"
  | "UTILITY"
  | "PAYROLL"
  | "SUPPLIER"
  | "LOAN"
  | "GOVERNMENT"
  | "MISCELLANEOUS"
  | "OTHER";

export type CreatePayment = {
  monetaryValue: MonetaryValue;
  description?: string;
  statusCallbackUrl?: string; // URL for payment status updates
  redirectUri?: string; // URL to redirect user after payment
  expiresIn?: string; // ISO 8601 duration string
  refundableFor?: string; // ISO 8601 duration string
  category?: PaymentCategory;
};

export type PaymentResponse = {
  paymentId: string;
  readableCode: string;
  qrCode: string; // A base64 encoded image or URL
  validUntil: string; // ISO 8601 date string
  personalAppLink: string;
  businessAppLink: string;
  corporateAppLink: string;
};

export type PaymentStatus = "PAID" | "UNPAID" | "DECLINED";

export type PaymentDecliningReason = "SERVER_FAILURE" | "PAYMENT_EXPIRATION" | "PAYMENT_CANCELLATION";

export type PayerInfo = {
  name: string;
  iban: string;
};

export type CheckPaymentStatusResponse = {
  paymentId: string;
  status: PaymentStatus;

  // Fields present for 'PAID' status
  paidAt?: string; // ISO 8601 date string
  amount?: MonetaryValue;
  paidBy?: PayerInfo;

  // Fields present for 'DECLINED' status
  decliningReason?: PaymentDecliningReason;
  declinedAt?: string; // ISO 8601 date string
};

export type FibAuthenticate = {
  grant_type: string;
  client_id: string;
  client_secret: string;
};

export type PaymentStatusCallback = {
  id: string; // the paymentId
  status: PaymentStatus;
};

export type FIBEnvironments = "development" | "staging" | "production";
