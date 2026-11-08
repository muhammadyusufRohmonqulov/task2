import type { ReactNode } from 'react';
import { BookOpen, Calculator, Clock, Sigma } from 'lucide-react';
import Tex from './Tex';

export interface Symbol {
  sym: string;
  desc: ReactNode;
}

/**
 * Formula + uning izohi: nimani anglatadi, belgilar, qachon ishlatiladi, bank misolida hisob.
 */
export default function FormulaCard({
  title,
  tex,
  meaning,
  symbols,
  when,
  example,
  accent = '#00D4FF',
}: {
  title: ReactNode;
  tex: string;
  meaning: ReactNode;
  symbols: Symbol[];
  when: ReactNode;
  example?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="glass gradient-border overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
        <Sigma size={16} style={{ color: accent }} />
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
      </div>
      <div
        className="px-5 py-6 text-center text-lg"
        style={{ background: `radial-gradient(600px 120px at 50% 50%, ${accent}12, transparent 70%)` }}
      >
        <Tex block>{tex}</Tex>
      </div>
      <div className="grid gap-px bg-white/[0.04] md:grid-cols-2">
        <Q icon={<BookOpen size={14} />} q="Formula nimani anglatadi?">
          {meaning}
        </Q>
        <Q icon={<Sigma size={14} />} q="Har bir belgi nimani bildiradi?">
          <ul className="space-y-1.5">
            {symbols.map((s) => (
              <li key={s.sym} className="flex gap-2">
                <span className="min-w-[44px] shrink-0">
                  <Tex>{s.sym}</Tex>
                </span>
                <span className="text-slate-300">— {s.desc}</span>
              </li>
            ))}
          </ul>
        </Q>
        <Q icon={<Clock size={14} />} q="Formula qachon ishlatiladi?">
          {when}
        </Q>
        {example && (
          <Q icon={<Calculator size={14} />} q="Bank misolida qanday hisoblanadi?">
            {example}
          </Q>
        )}
      </div>
    </div>
  );
}

function Q({ icon, q, children }: { icon: ReactNode; q: string; children: ReactNode }) {
  return (
    <div className="bg-[#0e1628] px-5 py-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan/90">
        {icon}
        {q}
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}
