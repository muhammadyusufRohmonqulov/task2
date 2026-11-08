import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { AlgoInfo } from '../../data/algorithms';
import { AlgoMiniVisual } from '../diagrams/Visuals';

export default function AlgorithmCard({ a, index }: { a: AlgoInfo; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link
        to={a.path}
        className="glass gradient-border group relative flex h-full flex-col overflow-hidden rounded-3xl transition-shadow duration-300"
        style={{ ['--acc' as string]: a.accent }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(420px 220px at 50% 0%, ${a.accent}22, transparent 70%)` }}
        />
        <div className="relative h-40 border-b border-white/[0.06] bg-[#0b1324]/60 p-3">
          <AlgoMiniVisual id={a.id} />
          <span className="absolute left-4 top-4 font-mono text-xs text-muted">0{index + 1}</span>
        </div>
        <div className="relative flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="chip" style={{ color: a.accent, borderColor: `${a.accent}40` }}>
              {a.category}
            </span>
            <ArrowUpRight size={18} className="text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
          </div>
          <h3 className="text-xl font-bold text-ink">{a.name}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.summary}</p>
          <div className="mt-4 text-sm font-semibold" style={{ color: a.accent }}>
            Laboratoriyani ochish →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
