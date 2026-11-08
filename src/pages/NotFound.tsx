import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-7xl font-bold gradient-text">404</div>
      <h1 className="mt-4 text-2xl font-bold">Sahifa topilmadi</h1>
      <p className="mt-2 text-muted">Siz qidirgan sahifa mavjud emas yoki ko‘chirilgan.</p>
      <Link to="/" className="mt-6 rounded-xl bg-gradient-to-r from-cyan to-electric px-5 py-2.5 text-sm font-semibold text-navy">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
