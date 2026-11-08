import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Binary, Database, FlaskConical, GitBranch, Layers, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { ALGORITHMS } from '../data/algorithms';
import { BANK_DATA } from '../data/bankDataset';
import { CUSTOMERS } from '../data/customerDataset';
import AlgorithmCard from '../components/algorithm/AlgorithmCard';
import { HeroVisual } from '../components/diagrams/Visuals';
import { SyntheticNotice } from '../components/common/misc';

const STATS = [
  { v: '4', l: 'Machine Learning algoritmi', icon: <Binary size={18} /> },
  { v: '2', l: 'ML yo‘nalishi', icon: <GitBranch size={18} /> },
  { v: '4', l: 'Amaliy laboratoriya', icon: <FlaskConical size={18} /> },
  { v: `${BANK_DATA.length + CUSTOMERS.length}+`, l: 'Sun’iy bank mijozlari yozuvi', icon: <Database size={18} /> },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-24 lg:pt-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="chip mb-6 border-cyan/30 text-cyan">
              <Sparkles size={13} /> Interactive Machine Learning Laboratory
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[3.6rem]">
              Bank sohasida <span className="gradient-text">Machine Learning</span> algoritmlarini interaktiv o‘rganing
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Klassifikatsiya va klasterizatsiya algoritmlarining ishlash mexanizmini real bank ma’lumotlari asosida o‘rganing,
              matematik hisob-kitoblarni kuzating va natijalarni o‘zingiz sinab ko‘ring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#algoritmlar"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('algoritmlar')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-6 py-3 text-sm font-semibold text-navy shadow-glow transition hover:brightness-110"
              >
                Algoritmlarni o‘rganish <ArrowRight size={16} />
              </a>
              <Link
                to="/laboratoriya"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-ink transition hover:border-cyan/50 hover:bg-cyan/[0.06]"
              >
                <FlaskConical size={16} /> Amaliy laboratoriyaga o‘tish
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald" /> Backend va API kalitisiz</span>
              <span className="flex items-center gap-1.5"><Binary size={14} className="text-cyan" /> Algoritmlar noldan TypeScript’da</span>
              <span className="flex items-center gap-1.5"><BarChart3 size={14} className="text-violet" /> Real vaqtda qayta hisoblash</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-cyan/10 via-electric/10 to-violet/10 blur-3xl" />
            <div className="glass gradient-border relative rounded-3xl p-4 sm:p-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" /> Credit Risk Model · live
                </span>
                <span className="font-mono">seed = 42</span>
              </div>
              <HeroVisual />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: 'Mijozlar', v: BANK_DATA.length, c: '#00D4FF' },
                  { k: 'Xususiyatlar', v: 5, c: '#8B5CF6' },
                  { k: 'Sinflar', v: 2, c: '#10B981' },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted">{s.k}</div>
                    <div className="font-display text-lg font-bold" style={{ color: s.c }}>
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATISTIKA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/10 text-cyan">{s.icon}</div>
              <div className="font-display text-3xl font-bold text-ink">{s.v}</div>
              <div className="mt-1 text-sm text-muted">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ALGORITMLAR */}
      <section id="algoritmlar" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="chip mb-3">Algoritmlar</div>
            <h2 className="text-3xl font-bold sm:text-4xl">To‘rtta interaktiv laboratoriya</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Algoritmni tanlang — har birida nazariya, formulalar, bosqichma-bosqich hisob-kitoblar, animatsiyalar va
              parametrlarni o‘zgartirib ko‘rish imkoniyati bor.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="chip"><Network size={12} className="text-cyan" /> Classification · 3</span>
            <span className="chip"><Layers size={12} className="text-violet" /> Clustering · 1</span>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ALGORITHMS.map((a, i) => (
            <AlgorithmCard key={a.id} a={a} index={i} />
          ))}
        </div>
      </section>

      {/* YO‘NALISHLAR */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="glass gradient-border rounded-3xl p-6 sm:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              <Network size={22} />
            </div>
            <h3 className="text-2xl font-bold">Klassifikatsiya</h3>
            <p className="mt-1 font-mono text-xs text-cyan/80">Supervised Learning</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Oldindan javobi (yorlig‘i) ma’lum bo‘lgan ma’lumotlardan o‘rganib, yangi obyektning qaysi sinfga tegishli ekanini
              bashorat qilish. Bizning misol: yangi mijoz kredit to‘lovida muammoga uchraydimi (1) yoki yo‘qmi (0)?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ALGORITHMS.filter((a) => a.category === 'Classification').map((a) => (
                <Link key={a.id} to={a.path} className="chip hover:text-ink">
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="glass gradient-border rounded-3xl p-6 sm:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet">
              <Layers size={22} />
            </div>
            <h3 className="text-2xl font-bold">Klasterizatsiya</h3>
            <p className="mt-1 font-mono text-xs text-violet">Unsupervised Learning</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Yorliqlarsiz ma’lumotlarda o‘xshash obyektlarni avtomatik guruhlarga ajratish. Bizning misol: bank mijozlarini
              daromad va xarajatlariga qarab segmentlarga bo‘lish va har bir segmentga mos xizmat taklif qilish.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/algoritmlar/k-means" className="chip hover:text-ink">
                K-Means
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QO‘SHIMCHA BO‘LIMLAR */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { to: '/malumotlar', icon: <Database size={20} />, t: 'Ma’lumotlar to‘plami', d: '150 ta sun’iy mijoz, statistika, qidiruv, sahifalash va CSV yuklab olish.' },
            { to: '/taqqoslash', icon: <BarChart3 size={20} />, t: 'Algoritmlarni taqqoslash', d: 'KNN, Decision Tree va Random Forest bir xil train/test split ustida.' },
            { to: '/laboratoriya', icon: <FlaskConical size={20} />, t: 'Prediction Lab', d: 'O‘z mijozingizni kiriting va modelning qarorga kelish yo‘lini ko‘ring.' },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-cyan/30">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-cyan">{c.icon}</div>
              <div className="flex items-center justify-between font-semibold">
                {c.t} <ArrowRight size={16} className="text-muted transition group-hover:translate-x-1 group-hover:text-cyan" />
              </div>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <SyntheticNotice />
        </div>
      </section>
    </div>
  );
}
