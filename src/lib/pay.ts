export function payLabel(details: Record<string, unknown>) {
  const payType = String(details.payType || "");
  const currency = "ETB";
  if (payType === "negotiable" || details.salaryNegotiable === true) return "Negotiable";
  const min = Number(details.payMin);
  const max = Number(details.payMax);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${min} to ${max} ${currency}`;
  }
  const amount = Number(details.payAmount ?? details.salaryAmount);
  if (Number.isFinite(amount) && amount > 0) {
    if (!payType || payType === "fixed fee") return `${amount} ${currency}`;
    return `${amount} ${currency} ${payType}`;
  }
  return "Pay listed on the job";
}
