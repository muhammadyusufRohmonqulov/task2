import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ALGORITHMS, type AlgoId } from '../../data/algorithms';

export const SECTIONS = [
  { id: 'haqida', label: 'Algoritm haqida' },
  { id: 'masala', label: 'Amaliy masala' },
  { id: 'dataset', label: 'Dataset' },
  { id: 'matematika', label: 'Matematik asoslar' },
  { id: 'ketma-ketlik', label: 'Ishlash ketma-ketligi' },
  { id: 'laboratoriya', label: 'Interaktiv laboratoriya' },
  { id: 'grafiklar', label: 'Grafik va diagrammalar' },
  { id: 'parametrlar', label: 'Parametrlar' },
  { id: 'natija', label: 'Yakuniy natija' },
  { id: 'xulosa', label: 'Xulosa' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
export const sectionIndex = (id: SectionId) => SECTIONS.findIndex((s) => s.id === id) + 1;

export default function AlgorithmShell({
  algo,
  definition,
  problem,
  learningSteps,
  visual,
  children,
}: {
  algo: AlgoId;
  definition: ReactNode;
  problem: ReactNode;
  learningSteps: string[];
  visual: ReactNode;
  children: ReactNode;
}) {
  const info = ALGORITHMS.find((a) => a.id === algo)!;
  const idx = ALGORITHMS.findIndex((a) => a.id === algo);
  const prev = ALGORITHMS[(idx + ALGORITHMS.length - 1) % ALGORITHMS.length];
  const next = ALGORITHMS[(idx + 1) % ALGORITHMS.length];
  const active = useActiveSection();

  return (
    <div>
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/[0.05]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(700px 360px at 85% 20%, ${info.accent}1f, transparent 70%)` }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:pt-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/algoritmlar" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-cyan">
              <ArrowLeft size={14} /> Barcha algoritmlar
            </Link>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="chip" style={{ color: info.accent, borderColor: `${info.accent}40` }}>
                {info.categoryUz} · {info.category}
              </span>
              <span className="chip">{info.learning} Learning</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              {info.name}
              {info.short !== info.name && info.short.length <= 3 && <span className="text-muted"> ({info.short})</span>}
            </h1>
            <div className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{definition}</div>
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: info.accent }}>
                Bankdagi amaliy masala
              </div>
              <div className="mt-1.5 text-sm leading-relaxed text-slate-300">{problem}</div>
            </div>
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">O‘rganish jarayoni</div>
              <div className="flex flex-wrap gap-2">
                {learningSteps.map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-xs text-slate-300">
                    <span className="font-mono" style={{ color: info.accent }}>
                      {i + 1}
                    </span>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass gradient-border relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-3xl p-4"
          >
            {visual}
          </motion.div>
        </div>
      </div>

      {/* Sticky bo‘limlar navigatsiyasi */}
      <div className="sticky top-16 z-40 border-b border-white/[0.06] bg-navy/85 backdrop-blur-xl">
        <div className="scroll-thin mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                active === s.id ? 'bg-cyan/10 text-cyan' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="mr-1.5 font-mono text-[10px] opacity-60">{i + 1}</span>
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>

      <div className="mx-auto mt-6 grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        <Link to={prev.path} className="glass group flex items-center gap-3 rounded-2xl p-4 transition hover:border-cyan/30">
          <ArrowLeft size={18} className="text-muted transition group-hover:-translate-x-1 group-hover:text-cyan" />
          <div>
            <div className="text-xs text-muted">Oldingi algoritm</div>
            <div className="font-semibold">{prev.name}</div>
          </div>
        </Link>
        <Link to={next.path} className="glass group flex items-center justify-end gap-3 rounded-2xl p-4 text-right transition hover:border-cyan/30">
          <div>
            <div className="text-xs text-muted">Keyingi algoritm</div>
            <div className="font-semibold">{next.name}</div>
          </div>
          <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1 group-hover:text-cyan" />
        </Link>
      </div>
    </div>
  );
}

function useActiveSection(): string {
  const [active, setActive] = useState<string>('haqida');
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}
