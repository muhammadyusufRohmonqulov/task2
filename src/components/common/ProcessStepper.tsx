import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ProcessStep {
  title: string;
  summary: string;
  body: ReactNode;
}

/**
 * Algoritm ishlash ketma-ketligi: chapda bosqichlar ro‘yxati, o‘ngda tanlangan bosqichning
 * batafsil izohi va real hisob-kitobi.
 */
export default function ProcessStepper({ steps, accent = '#00D4FF' }: { steps: ProcessStep[]; accent?: string }) {
  const [active, setActive] = useState(0);
  const s = steps[active];
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <ol className="scroll-thin flex gap-2 overflow-x-auto pb-1 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
        {steps.map((st, i) => {
          const on = i === active;
          const done = i < active;
          return (
            <li key={st.title} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`group flex w-56 items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:w-full ${
                  on ? 'border-cyan/40 bg-cyan/[0.07]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
                }`}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                  style={{
                    background: on ? accent : done ? `${accent}30` : 'rgba(255,255,255,0.06)',
                    color: on ? '#080D1B' : done ? accent : '#94A3B8',
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${on ? 'text-ink' : 'text-slate-300'}`}>{st.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{st.summary}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="glass gradient-border min-h-[320px] rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
              {active + 1}-bosqich / {steps.length}
            </div>
            <h3 className="mt-1 text-xl font-bold text-ink">{s.title}</h3>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive((a) => a - 1)}
              className="rounded-lg border border-white/10 p-2 text-muted hover:text-ink disabled:opacity-30"
              aria-label="Oldingi bosqich"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={active === steps.length - 1}
              onClick={() => setActive((a) => a + 1)}
              className="rounded-lg border border-white/10 p-2 text-muted hover:text-ink disabled:opacity-30"
              aria-label="Keyingi bosqich"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className="h-full rounded-full" style={{ background: accent }} animate={{ width: `${((active + 1) / steps.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            className="prose-uz mt-5 text-sm"
          >
            {s.body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
