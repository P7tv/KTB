const PRIORITY_SCORE = { high: 3, medium: 2, low: 1 };
const CATEGORY_LABELS = {
  mutualFund: 'กองทุนรวม',
  stock: 'หุ้น',
  gold: 'ทองคำ',
  machine: 'เครื่องจักร',
  expansion: 'ขยายสาขา',
  hiring: 'จ้างพนักงาน',
  upgrade: 'อัปเกรดระบบ',
};

const ACCOUNT_WEIGHTS = {
  'พร้อมใช้งาน': 0.4,
  'กันสำรอง': 0.25,
  'ระงับชั่วคราว': 0.1,
};

export const summarizeCategory = (category) => CATEGORY_LABELS[category] || category;

export function createInvestmentPlan(accounts, opportunities) {
  if (!accounts.length || !opportunities.length) {
    return { allocations: [], notes: 'เพิ่มบัญชีและแผนลงทุนเพื่อให้ระบบช่วยจัดสรรได้' };
  }

  const funds = accounts.map((account) => {
    const weight = ACCOUNT_WEIGHTS[account.status] ?? 0.2;
    const available = Math.max(Math.floor(account.balance * weight), 0);
    return {
      accountId: account.id,
      name: account.name,
      available,
      originalBalance: account.balance,
    };
  });

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const scoreA = PRIORITY_SCORE[a.priority] || 1;
    const scoreB = PRIORITY_SCORE[b.priority] || 1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (a.targetDate || '').localeCompare(b.targetDate || '');
  });

  const allocations = [];

  sortedOpportunities.forEach((opportunity) => {
    let target = opportunity.amount;
    const contribution = [];

    funds.sort((a, b) => b.available - a.available);
    for (const fund of funds) {
      if (target <= 0 || fund.available <= 0) continue;
      const amount = Math.min(target, fund.available);
      fund.available -= amount;
      target -= amount;
      contribution.push({ accountId: fund.accountId, name: fund.name, amount });
    }

    allocations.push({
      opportunity: opportunity.name,
      category: summarizeCategory(opportunity.category),
      requested: opportunity.amount,
      fulfilled: opportunity.amount - target,
      remaining: Math.max(target, 0),
      contribution,
      priority: opportunity.priority,
      notes: opportunity.notes,
    });
  });

  const exhausted = funds.filter((fund) => fund.available <= fund.originalBalance * 0.1).map((fund) => fund.name);
  const notes = exhausted.length
    ? `บัญชีที่ใช้เกือบเต็ม: ${exhausted.join(', ')}`
    : 'ยังมีสภาพคล่องเหลือในทุกบัญชี';

  return { allocations, notes };
}
