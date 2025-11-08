const CORPORATE_TAX_RATE = 0.20;
const VAT_RATE = 0.07;

export function summarizeTax(transactions = []) {
  const incomeEntries = transactions.filter((tx) => tx.amount > 0);
  const expenseEntries = transactions.filter((tx) => tx.amount < 0);
  const totalIncome = incomeEntries.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = expenseEntries.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const profit = totalIncome - totalExpense;
  const estimatedCorporateTax = Math.max(profit * CORPORATE_TAX_RATE, 0);
  const vatBase = incomeEntries.reduce((sum, tx) => sum + tx.amount, 0);
  const vatDue = vatBase * VAT_RATE;
  const vatCredit = expenseEntries.reduce((sum, tx) => sum + Math.abs(tx.amount) * VAT_RATE, 0);
  const netVat = vatDue - vatCredit;
  return {
    totalIncome,
    totalExpense,
    profit,
    estimatedCorporateTax,
    vatDue,
    vatCredit,
    netVat,
  };
}
