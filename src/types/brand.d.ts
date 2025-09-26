export type CurrencyCode = "EUR" | "USD" | "GBP" | (string & {});
export type Money = {
  amount: number;
  currency: CurrencyCode;
};
