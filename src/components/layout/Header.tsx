import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ALGORITHMS } from '../../data/algorithms';
import Logo from './Logo';

const NAV = [
  { to: '/', label: 'Bosh sahifa', end: true },
  { to: '/algoritmlar', label: 'Algoritmlar', dropdown: true },
  { to: '/malumotlar', label: 'Ma’lumotlar' },
  { to: '/taqqoslash', label: 'Taqqoslash' },
  { to: '/laboratoriya', label: 'Prediction Lab' },
  { to: '/haqida', label: 'Platforma haqida' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setDd(false);
  }, [loc.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDd(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-ink bg-white/[0.06]' : 'text-muted hover:text-ink hover:bg-white/[0.04]'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/[0.06] bg-navy/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="BankML Lab bosh sahifa">
          <Logo />
          <div className="leading-tight">
            <div className="font-display text-[17px] font-bold tracking-tight">
              BankML <span className="gradient-text">Lab</span>
            </div>
            <div className="hidden text-[10.5px] uppercase tracking-[0.14em] text-muted sm:block">
              Interactive Machine Learning Laboratory
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy navigatsiya">
          {NAV.map((n) =>
            n.dropdown ? (
              <div key={n.to} className="relative" ref={ddRef}>
                <button
                  onClick={() => setDd((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    loc.pathname.startsWith('/algoritmlar') ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink hover:bg-white/[0.04]'
                  }`}
                  aria-expanded={dd}
                >
                  {n.label}
                  <ChevronDown size={14} className={`transition-transform ${dd ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {dd && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="glass-strong absolute left-0 top-full mt-2 w-80 rounded-2xl p-2 shadow-2xl"
                    >
                      <Link to="/algoritmlar" className="block rounded-xl px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-ink">
                        Barcha algoritmlar →
                      </Link>
                      {ALGORITHMS.map((a) => (
                        <Link
                          key={a.id}
                          to={a.path}
                          className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                        >
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: a.accent, boxShadow: `0 0 10px ${a.accent}` }} />
                          <span>
                            <span className="block text-sm font-semibold text-ink">{a.name}</span>
                            <span className="block text-xs text-muted">{a.categoryUz} · {a.category}</span>
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
                {n.label}
              </NavLink>
            ),
          )}
        </nav>

        <button
          className="rounded-lg p-2 text-muted hover:bg-white/[0.06] hover:text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06] bg-navy/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={(s) => `block ${linkCls(s)}`}>
                  {n.label}
                </NavLink>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {ALGORITHMS.map((a) => (
                  <Link key={a.id} to={a.path} className="glass rounded-xl px-3 py-2 text-sm">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: a.accent }} />
                    {a.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
