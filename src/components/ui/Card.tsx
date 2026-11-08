import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'violet' | 'green' | 'none';
  padded?: boolean;
}

const GLOW = {
  cyan: 'shadow-glow',
  violet: 'shadow-glow-violet',
  green: 'shadow-glow-green',
  none: '',
};

export function Card({ children, className = '', glow = 'none', padded = true }: CardProps) {
  return (
    <div className={`glass gradient-border rounded-2xl ${padded ? 'p-5 sm:p-6' : ''} ${GLOW[glow]} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ icon, title, subtitle, right }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Badge({ children, color = '#00D4FF', className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, color = '#00D4FF' }: { label: ReactNode; value: ReactNode; hint?: ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Callout({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'warn' | 'success' | 'danger'; title?: ReactNode }) {
  const tones = {
    info: 'border-cyan/25 bg-cyan/[0.06] text-cyan-100',
    warn: 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100',
    success: 'border-emerald/25 bg-emerald/[0.07] text-emerald-100',
    danger: 'border-rose-500/25 bg-rose-500/[0.07] text-rose-100',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="text-slate-300">{children}</div>
    </div>
  );
}
