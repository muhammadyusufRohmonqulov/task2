/**
 * K-Means klasterlariga INSON tomonidan ma’no beruvchi nom berish.
 * Algoritm faqat klaster raqamini (0, 1, 2...) qaytaradi; nomlar centroidning
 * daromad va xarajat qiymatlarini dataset o‘rtachasi bilan solishtirib beriladi.
 */
export interface SegmentLabel {
  name: string;
  description: string;
}

export function nameSegment(
  centroidIncome: number,
  centroidSpending: number,
  meanIncome: number,
  meanSpending: number,
): SegmentLabel {
  const hiInc = centroidIncome >= meanIncome;
  const hiSp = centroidSpending >= meanSpending;
  const ratio = centroidIncome === 0 ? 0 : centroidSpending / centroidIncome;
  if (hiInc && hiSp)
    return { name: 'Premium mijozlar', description: 'Yuqori daromad va yuqori xarajat — premium karta, investitsiya va VIP xizmatlar uchun nomzodlar.' };
  if (hiInc && !hiSp)
    return { name: 'Jamg‘aruvchi mijozlar', description: 'Daromadi yuqori, lekin kam sarflaydi — omonat (depozit) va jamg‘arma mahsulotlari taklif qilinadi.' };
  if (!hiInc && (hiSp || ratio > 0.6))
    return { name: 'Faol mijozlar', description: 'Daromadiga nisbatan ko‘p sarflaydi va tranzaksiyalari ko‘p — keshbek, kredit karta, bo‘lib to‘lash.' };
  return { name: 'Tejamkor mijozlar', description: 'Daromad va xarajat past — oddiy debet karta, mikro-jamg‘arma va moliyaviy savodxonlik dasturlari.' };
}

/** Bir xil nomlar takrorlansa, raqam qo‘shib farqlaydi. */
export function uniqueNames(labels: SegmentLabel[]): SegmentLabel[] {
  const seen = new Map<string, number>();
  const totals = new Map<string, number>();
  labels.forEach((l) => totals.set(l.name, (totals.get(l.name) ?? 0) + 1));
  return labels.map((l) => {
    if ((totals.get(l.name) ?? 0) < 2) return l;
    const n = (seen.get(l.name) ?? 0) + 1;
    seen.set(l.name, n);
    return { ...l, name: `${l.name} ${n}` };
  });
}
