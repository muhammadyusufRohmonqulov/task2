import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ConfusionMatrix, Label } from '../../types';
import { CLASS_COLORS } from '../../data/algorithms';
import { CLASS_NAMES } from '../../data/bankDataset';

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted">
      <Loader2 className="mr-2 animate-spin text-cyan" size={20} /> Yuklanmoqda…
    </div>
  );
}

export function SyntheticNotice({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
      <p className="text-sm leading-relaxed text-amber-100/90">
        <strong className="text-amber-200">Eslatma:</strong> Ushbu platformada real mijozlarning shaxsiy ma’lumotlari emas, Machine
        Learning algoritmlarini o‘rganish uchun sun’iy yaratilgan ma’lumotlardan foydalaniladi.
      </p>
    </div>
  );
}

/** Algoritm sahifasidagi raqamlangan bo‘lim. */
export function Section({
  id,
  index,
  title,
  subtitle,
  children,
}: {
  id: string;
  index: number;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-start gap-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/[0.08] font-mono text-sm font-bold text-cyan">
          {String(index).padStart(2, '0')}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted sm:text-base">{subtitle}</p>}
        </div>
      </motion.div>
      {children}
    </section>
  );
}

export function ClassPill({ label, size = 'md' }: { label: Label; size?: 'sm' | 'md' | 'lg' }) {
  const c = CLASS_COLORS[label];
  const sz = size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sz}`} style={{ color: c, background: `${c}18`, border: `1px solid ${c}40` }}>
      {label === 1 ? <ShieldAlert size={size === 'lg' ? 18 : 12} /> : <ShieldCheck size={size === 'lg' ? 18 : 12} />}
      {label} — {CLASS_NAMES[label]}
    </span>
  );
}

export function ConfusionMatrixView({ cm, title }: { cm: ConfusionMatrix; title?: ReactNode }) {
  const total = cm.tp + cm.tn + cm.fp + cm.fn || 1;
  const cell = (v: number, label: string, desc: string, good: boolean) => (
    <div
      className="flex flex-col items-center justify-center rounded-xl border p-3 text-center sm:p-4"
      style={{
        borderColor: good ? '#10B98140' : '#F43F5E40',
        background: good ? `rgba(16,185,129,${0.06 + (v / total) * 0.5})` : `rgba(244,63,94,${0.05 + (v / total) * 0.5})`,
      }}
    >
      <div className="font-display text-2xl font-bold text-ink sm:text-3xl">{v}</div>
      <div className="mt-1 text-xs font-semibold" style={{ color: good ? '#34D399' : '#FB7185' }}>
        {label}
      </div>
      <div className="mt-0.5 hidden text-[11px] leading-tight text-muted sm:block">{desc}</div>
    </div>
  );
  return (
    <div>
      {title && <div className="mb-3 text-sm font-semibold text-ink">{title}</div>}
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
        <div />
        <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">Bashorat: 1</div>
        <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">Bashorat: 0</div>
        <div className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-muted [writing-mode:vertical-rl] rotate-180">Haqiqat: 1</div>
        {cell(cm.tp, 'TP', 'Muammoli mijoz to‘g‘ri aniqlandi', true)}
        {cell(cm.fn, 'FN', 'Muammoli mijoz o‘tkazib yuborildi', false)}
        <div className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-muted [writing-mode:vertical-rl] rotate-180">Haqiqat: 0</div>
        {cell(cm.fp, 'FP', 'Yaxshi mijoz xato rad etildi', false)}
        {cell(cm.tn, 'TN', 'Yaxshi mijoz to‘g‘ri tasdiqlandi', true)}
      </div>
    </div>
  );
}

export function ProsCons({ pros, cons }: { pros: ReactNode[]; cons: ReactNode[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 font-semibold text-emerald">
          <ThumbsUp size={18} /> Afzalliklari
        </div>
        <ul className="space-y-2.5">
          {pros.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 font-semibold text-rose-400">
          <ThumbsDown size={18} /> Kamchiliklari
        </div>
        <ul className="space-y-2.5">
          {cons.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function UseCases({ items }: { items: { icon: ReactNode; title: string; desc: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((u) => (
        <div key={u.title} className="glass rounded-xl p-4 transition hover:border-cyan/30">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-cyan">{u.icon}</div>
          <div className="text-sm font-semibold text-ink">{u.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted">{u.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function Concept({ term, en, children }: { term: string; en?: string; children: ReactNode }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold text-ink">{term}</span>
        {en && <span className="font-mono text-xs text-cyan/80">{en}</span>}
      </div>
      <div className="mt-1.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc, children }: { eyebrow: string; title: ReactNode; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-white/[0.05]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="chip mb-4">{eyebrow}</div>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
          {desc && <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{desc}</p>}
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;
