export const paymentMethodIds = [
  "telebirr",
  "cbe-birr",
  "cbe",
  "awash",
  "dashen",
  "abyssinia",
  "coop-oromia",
  "wegagen",
] as const;

export type PaymentMethodId = (typeof paymentMethodIds)[number];

export const paymentMethods: {
  id: PaymentMethodId;
  label: string;
  detail: string;
  tone: string;
}[] = [
  { id: "telebirr", label: "Telebirr", detail: "Ethio telecom wallet", tone: "bg-stat-crew text-stat-crew-ink" },
  { id: "cbe-birr", label: "CBE Birr", detail: "Commercial Bank of Ethiopia wallet", tone: "bg-stat-job text-stat-job-ink" },
  { id: "cbe", label: "Commercial Bank of Ethiopia", detail: "Bank transfer", tone: "bg-stat-material text-stat-material-ink" },
  { id: "awash", label: "Awash Bank", detail: "Bank transfer", tone: "bg-stat-gear text-stat-gear-ink" },
  { id: "dashen", label: "Dashen Bank", detail: "Bank transfer", tone: "bg-navy text-page" },
  { id: "abyssinia", label: "Bank of Abyssinia", detail: "Bank transfer", tone: "bg-accent text-accent-ink" },
  { id: "coop-oromia", label: "Cooperative Bank of Oromia", detail: "Bank transfer", tone: "bg-success text-success-bg" },
  { id: "wegagen", label: "Wegagen Bank", detail: "Bank transfer", tone: "bg-teal text-stat-crew-ink" },
];

export function paymentMethodById(id: string) {
  return paymentMethods.find((method) => method.id === id);
}
