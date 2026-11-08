import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const v = {
    primary:
      'bg-gradient-to-r from-cyan to-electric text-navy font-semibold shadow-glow hover:brightness-110',
    outline: 'border border-white/15 bg-white/[0.03] text-ink hover:border-cyan/50 hover:bg-cyan/[0.06]',
    ghost: 'text-muted hover:bg-white/[0.06] hover:text-ink',
  }[variant];
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  format,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: ReactNode;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min || 1)) * 100;
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="rounded-md bg-cyan/10 px-2 py-0.5 font-mono text-sm font-semibold text-cyan tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(90deg, #00D4FF ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
      {hint && <div className="mt-1.5 text-xs leading-snug text-muted">{hint}</div>}
    </label>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label?: ReactNode;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const uid = useId();
  return (
    <div>
      {label && <div className="mb-2 text-sm font-medium text-slate-200">{label}</div>}
      <div className="relative flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              className={`relative z-[1] flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                active ? 'text-navy' : 'text-muted hover:text-ink'
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${uid}`}
                  className="absolute inset-0 -z-[1] rounded-lg bg-gradient-to-r from-cyan to-electric"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <div className="mt-1.5 text-xs leading-snug text-muted">{hint}</div>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  return (
    <div>
      <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3" aria-pressed={checked}>
        <span className="text-left text-sm font-medium text-slate-200">{label}</span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-cyan' : 'bg-white/15'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-navy transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>
      {hint && <div className="mt-1.5 text-xs leading-snug text-muted">{hint}</div>}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  error,
  hint,
  step,
  id,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  error?: string;
  hint?: ReactNode;
  step?: number;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-white/[0.03] transition-colors focus-within:border-cyan/60 ${
          error ? 'border-rose-500/60' : 'border-white/10'
        }`}
      >
        <input
          id={id}
          inputMode="decimal"
          type="text"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-ink outline-none"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {unit && <span className="pr-3 text-xs text-muted">{unit}</span>}
      </div>
      {error ? (
        <div id={`${id}-err`} className="mt-1 text-xs text-rose-400">
          {error}
        </div>
      ) : (
        hint && <div className="mt-1 text-xs text-muted">{hint}</div>
      )}
    </div>
  );
}
