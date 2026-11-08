import { Link } from 'react-router-dom';
import { BookOpen, Code2, Cpu, Database, GraduationCap, Lock, Sigma, Sparkles } from 'lucide-react';
import { PageHeader, SyntheticNotice } from '../components/common/misc';
import { Card, CardTitle } from '../components/ui/Card';

const STACK = [
  { n: 'React 18 + TypeScript', d: 'Komponentlarga asoslangan, qat’iy tiplangan interfeys' },
  { n: 'Vite', d: 'Tezkor ishlab chiqish va production build' },
  { n: 'Tailwind CSS', d: 'Dark futuristic dizayn tizimi' },
  { n: 'Framer Motion', d: 'Algoritmni tushuntiruvchi animatsiyalar' },
  { n: 'Recharts + SVG', d: 'Diagrammalar va maxsus interaktiv chizmalar' },
  { n: 'KaTeX', d: 'Matematik formulalarni to‘g‘ri ko‘rsatish' },
  { n: 'Lucide React', d: 'Ikonkalar' },
  { n: 'Vitest', d: 'Matematik funksiyalar uchun unit testlar' },
];

export default function About() {
  return (
    <div>
      <PageHeader
        eyebrow="Platforma haqida"
        title={
          <>
            BankML Lab — <span className="gradient-text">o‘rganish uchun</span> yaratilgan ML laboratoriya
          </>
        }
        desc="Platforma Machine Learning’ni endi o‘rganayotgan talabalar va o‘qituvchilar uchun mo‘ljallangan. Har bir algoritm bank sohasidagi aniq masala orqali, formulalar, real hisob-kitoblar va animatsiyalar bilan tushuntiriladi."
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: <Cpu size={20} />, t: 'Haqiqiy algoritmlar', d: 'KNN, Decision Tree (CART), Random Forest va K-Means tashqi ML kutubxonalarisiz, noldan TypeScript’da yozilgan. Natijalar oldindan yozib qo‘yilmagan.' },
            { i: <Lock size={20} />, t: 'Backend’siz va xavfsiz', d: 'Barcha hisob-kitoblar brauzerda bajariladi. Server, database, login yoki API kaliti talab qilinmaydi.' },
            { i: <Database size={20} />, t: 'Takrorlanuvchan ma’lumot', d: 'Sun’iy datasetlar seed = 42 bilan Mulberry32 generatori orqali yaratiladi — har safar bir xil natija.' },
            { i: <Sigma size={20} />, t: 'Formula = kod', d: 'Sahifadagi formulalar ostidagi sonli misollar aynan shu kod qaytargan qiymatlardan avtomatik hisoblanadi.' },
            { i: <GraduationCap size={20} />, t: 'Bir xil o‘quv tuzilmasi', d: 'Har bir sahifa 10 bo‘limdan iborat: nazariya, masala, dataset, matematika, bosqichlar, laboratoriya, grafiklar, parametrlar, natija, xulosa.' },
            { i: <Sparkles size={20} />, t: 'Ma’noli animatsiyalar', d: 'Animatsiyalar bezak emas: qo‘shnilarni topish, daraxt shoxlarining ochilishi, ovoz berish, centroidlar harakatini ko‘rsatadi.' },
          ].map((c) => (
            <Card key={c.t}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/10 text-cyan">{c.i}</div>
              <h3 className="font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle icon={<Code2 size={18} />} title="Texnologiyalar" />
            <ul className="space-y-2">
              {STACK.map((s) => (
                <li key={s.n} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2 text-sm last:border-0">
                  <span className="font-semibold text-ink">{s.n}</span>
                  <span className="text-right text-muted">{s.d}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle icon={<BookOpen size={18} />} title="Qanday o‘rganish tavsiya etiladi?" />
            <ol className="space-y-3 text-sm text-slate-300">
              {[
                ['Ma’lumotlar', 'Avval datasetni ko‘rib chiqing: xususiyatlar, sinflar va statistika.', '/malumotlar'],
                ['KNN', 'Eng sodda g‘oya — o‘xshash mijozlar. Standartlashtirish nima uchun kerakligini tushunasiz.', '/algoritmlar/knn'],
                ['Decision Tree', 'Gini, Entropy va split tanlash — qoidalar qanday paydo bo‘ladi.', '/algoritmlar/decision-tree'],
                ['Random Forest', 'Ko‘p daraxtlar nega bitta daraxtdan barqarorroq.', '/algoritmlar/random-forest'],
                ['K-Means', 'Yorliqsiz ma’lumotda guruhlarni topish (Unsupervised).', '/algoritmlar/k-means'],
                ['Taqqoslash va Lab', 'Modellarni solishtiring va o‘z mijozingizni sinab ko‘ring.', '/taqqoslash'],
              ].map(([t, d, to], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/15 font-mono text-xs font-bold text-cyan">{i + 1}</span>
                  <span>
                    <Link to={to} className="font-semibold text-ink hover:text-cyan">
                      {t}
                    </Link>{' '}
                    — {d}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <SyntheticNotice />
      </div>
    </div>
  );
}
