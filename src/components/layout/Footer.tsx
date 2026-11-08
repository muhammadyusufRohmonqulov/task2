import { Link } from 'react-router-dom';
import { ALGORITHMS } from '../../data/algorithms';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="relative z-[1] mt-24 border-t border-white/[0.06] bg-navy/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="font-display text-lg font-bold">
              BankML <span className="gradient-text">Lab</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Bank sohasi misolida Machine Learning algoritmlarini interaktiv o‘rganish laboratoriyasi. Barcha hisob-kitoblar
            brauzeringizda, haqiqiy algoritmlar orqali bajariladi.
          </p>
          <p className="mt-4 max-w-md rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-200/90">
            Eslatma: platformada real mijozlarning shaxsiy ma’lumotlari emas, o‘quv maqsadida sun’iy yaratilgan
            ma’lumotlardan foydalaniladi.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">Algoritmlar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {ALGORITHMS.map((a) => (
              <li key={a.id}>
                <Link to={a.path} className="hover:text-cyan">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">Platforma</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/malumotlar" className="hover:text-cyan">Ma’lumotlar (Dataset)</Link></li>
            <li><Link to="/taqqoslash" className="hover:text-cyan">Algoritmlarni taqqoslash</Link></li>
            <li><Link to="/laboratoriya" className="hover:text-cyan">Prediction Lab</Link></li>
            <li><Link to="/haqida" className="hover:text-cyan">Platforma haqida</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.05] py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} BankML Lab · React · TypeScript · Machine Learning from scratch
      </div>
    </footer>
  );
}
