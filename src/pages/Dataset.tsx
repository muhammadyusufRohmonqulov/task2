import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, Table2, Users } from 'lucide-react';
import type { BankClient, FeatureKey } from '../types';
import { BANK_DATA, FEATURES, HAND_SAMPLE, SPLIT, toCSV, formatFeature } from '../data/bankDataset';
import { CUSTOMERS } from '../data/customerDataset';
import { describe, mean } from '../utils/statistics';
import DataTable, { type Column } from '../components/common/DataTable';
import { ClassPill, PageHeader, SyntheticNotice } from '../components/common/misc';
import { Card, CardTitle, Stat } from '../components/ui/Card';
import { Segmented } from '../components/ui/Controls';
import { ClassDonut, SimpleBars } from '../components/charts/Charts';

const PAGE_SIZE = 15;

export default function Dataset() {
  const [tab, setTab] = useState<'credit' | 'segment'>('credit');
  return (
    <div>
      <PageHeader
        eyebrow="Ma’lumotlar · Dataset"
        title={
          <>
            Bank mijozlari <span className="gradient-text">ma’lumotlar to‘plami</span>
          </>
        }
        desc="Klassifikatsiya algoritmlari (KNN, Decision Tree, Random Forest) bitta umumiy kredit datasetidan foydalanadi. K-Means uchun alohida segmentatsiya dataseti yaratilgan. Ikkalasi ham seed = 42 bilan deterministik generator orqali hosil qilingan."
      >
        <div className="mt-6 max-w-3xl">
          <SyntheticNotice />
        </div>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-md">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'credit', label: `Kredit xavfi (${BANK_DATA.length})` },
              { value: 'segment', label: `Segmentatsiya (${CUSTOMERS.length})` },
            ]}
          />
        </div>
        {tab === 'credit' ? <CreditDataset /> : <SegmentDataset />}
      </div>
    </div>
  );
}

function CreditDataset() {
  const [q, setQ] = useState('');
  const [cls, setCls] = useState<'all' | '0' | '1'>('all');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: FeatureKey | 'id'; dir: 1 | -1 }>({ key: 'id', dir: 1 });

  const counts: [number, number] = useMemo(() => {
    const c1 = BANK_DATA.filter((c) => c.default === 1).length;
    return [BANK_DATA.length - c1, c1];
  }, []);

  const stats = useMemo(
    () =>
      FEATURES.map((f) => {
        const all = describe(BANK_DATA.map((c) => c[f.key]));
        return {
          f,
          ...all,
          m0: mean(BANK_DATA.filter((c) => c.default === 0).map((c) => c[f.key])),
          m1: mean(BANK_DATA.filter((c) => c.default === 1).map((c) => c[f.key])),
        };
      }),
    [],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = BANK_DATA.filter((c) => (cls === 'all' ? true : String(c.default) === cls));
    if (s)
      rows = rows.filter((c) =>
        [c.id, c.age, c.income, c.creditScore, c.dti, c.latePayments].some((v) => String(v).toLowerCase().includes(s)),
      );
    const k = sort.key;
    return [...rows].sort((a, b) => (k === 'id' ? a.id.localeCompare(b.id) : (a[k] as number) - (b[k] as number)) * sort.dir);
  }, [q, cls, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const p = Math.min(page, pages - 1);
  const rows = filtered.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  const testSet = useMemo(() => new Set(SPLIT.test), []);

  const sortHeader = (key: FeatureKey | 'id', label: React.ReactNode) => (
    <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-ink" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}>
      {label}
      {sort.key === key && <span className="text-cyan">{sort.dir === 1 ? '↑' : '↓'}</span>}
    </button>
  );

  const columns: Column<BankClient>[] = [
    { key: 'id', header: sortHeader('id', 'ID'), render: (r) => <span className="text-cyan">{r.id}</span> },
    ...FEATURES.map<Column<BankClient>>((f) => ({
      key: f.key,
      header: sortHeader(f.key, f.short),
      render: (r) => formatFeature(f.key, r[f.key]),
      align: 'right',
    })),
    { key: 'default', header: 'Natija', render: (r) => <ClassPill label={r.default} size="sm" /> },
    {
      key: 'split',
      header: 'Qism',
      render: (r) => {
        const idx = Number(r.id.slice(1)) - 1;
        return <span className={`font-sans text-xs ${testSet.has(idx) ? 'text-amber-300' : 'text-muted'}`}>{testSet.has(idx) ? 'Test' : 'Train'}</span>;
      },
    },
  ];

  const download = () => {
    const blob = new Blob(['﻿' + toCSV(BANK_DATA)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bankml_credit_dataset.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Yozuvlar soni" value={BANK_DATA.length} hint="sun’iy mijozlar" />
        <Stat label="Xususiyatlar" value={FEATURES.length} hint="+ 1 ta target" color="#8B5CF6" />
        <Stat label="Target sinflar" value={2} hint="0 va 1" color="#3B82F6" />
        <Stat label="Sinf 0 (muammosiz)" value={counts[0]} hint={`${((counts[0] / BANK_DATA.length) * 100).toFixed(1)}%`} color="#10B981" />
        <Stat label="Sinf 1 (muammoli)" value={counts[1]} hint={`${((counts[1] / BANK_DATA.length) * 100).toFixed(1)}%`} color="#F43F5E" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardTitle icon={<Table2 size={18} />} title="Xususiyatlar (features) va target" subtitle="Har bir ustun nimani anglatadi" />
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink">{f.uz}</span>
                  <span className="font-mono text-xs text-cyan/80">{f.en}</span>
                </div>
                <div className="mt-1 text-xs text-muted">{f.description} Birlik: {f.unit}.</div>
              </div>
            ))}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">Natija (target)</span>
                <span className="font-mono text-xs text-rose-300">Payment Default</span>
              </div>
              <div className="mt-1 text-xs text-muted">1 — kredit to‘lovida muammo yuz bergan; 0 — muammosiz to‘lagan.</div>
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle title="Sinflar taqsimoti" subtitle="0 va 1 sinflar nisbati" />
          <ClassDonut counts={counts} />
          <p className="text-xs leading-relaxed text-muted">
            Sinflar to‘liq teng emas ({((counts[0] / BANK_DATA.length) * 100).toFixed(0)}% / {((counts[1] / BANK_DATA.length) * 100).toFixed(0)}%). Shuning uchun train/test ajratishda <b className="text-ink">stratified split</b> ishlatiladi —
            har ikki qismda nisbat saqlanadi: train {SPLIT.train.length} ta, test {SPLIT.test.length} ta.
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle title="Qisqacha statistika" subtitle="Har bir xususiyat bo‘yicha o‘rtacha, standart og‘ish, minimum, maksimum va sinflar bo‘yicha o‘rtacha" />
        <DataTable
          rows={stats}
          rowKey={(r) => r.f.key}
          maxHeight="none"
          columns={[
            { key: 'f', header: 'Xususiyat', render: (r) => <span className="font-sans text-ink">{r.f.uz} <span className="text-muted">({r.f.unit})</span></span> },
            { key: 'mean', header: 'O‘rtacha', render: (r) => r.mean.toFixed(2), align: 'right' },
            { key: 'std', header: 'Std (σ)', render: (r) => r.std.toFixed(2), align: 'right' },
            { key: 'min', header: 'Min', render: (r) => r.min, align: 'right' },
            { key: 'med', header: 'Mediana', render: (r) => r.median, align: 'right' },
            { key: 'max', header: 'Max', render: (r) => r.max, align: 'right' },
            { key: 'm0', header: <span className="text-emerald">O‘rt. (0)</span>, render: (r) => <span className="text-emerald">{r.m0.toFixed(2)}</span>, align: 'right' },
            { key: 'm1', header: <span className="text-rose-400">O‘rt. (1)</span>, render: (r) => <span className="text-rose-400">{r.m1.toFixed(2)}</span>, align: 'right' },
          ]}
        />
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Ko‘rinib turibdiki, muammoli (1) mijozlarda o‘rtacha kredit reytingi pastroq, DTI va kechikishlar soni esa yuqoriroq.
          Biroq taqsimotlar bir-birini kesib o‘tadi — ya’ni bitta oddiy qoida bilan barcha mijozlarni ajratib bo‘lmaydi.
        </p>
      </Card>

      <Card>
        <CardTitle
          icon={<Users size={18} />}
          title="Barcha ma’lumotlar jadvali"
          subtitle={`${filtered.length} ta yozuv topildi`}
          right={
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-4 py-2 text-sm font-semibold text-navy shadow-glow hover:brightness-110"
            >
              <Download size={16} /> CSV yuklab olish
            </button>
          }
        />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 focus-within:border-cyan/50">
            <Search size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Qidirish: ID yoki qiymat (masalan, M012 yoki 655)"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/70"
              aria-label="Jadvalda qidirish"
            />
          </div>
          <div className="w-full sm:w-72">
            <Segmented
              value={cls}
              onChange={(v) => {
                setCls(v);
                setPage(0);
              }}
              options={[
                { value: 'all', label: 'Hammasi' },
                { value: '0', label: 'Sinf 0' },
                { value: '1', label: 'Sinf 1' },
              ]}
            />
          </div>
        </div>
        <DataTable rows={rows} rowKey={(r) => r.id} columns={columns} maxHeight="none" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>
            {filtered.length === 0 ? 0 : p * PAGE_SIZE + 1}–{Math.min((p + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-lg border border-white/10 p-2 hover:text-ink disabled:opacity-30" aria-label="Oldingi sahifa">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pages }, (_, i) => i)
              .filter((i) => Math.abs(i - p) <= 2 || i === 0 || i === pages - 1)
              .map((i, k, arr) => (
                <span key={i} className="flex items-center">
                  {k > 0 && arr[k - 1] !== i - 1 && <span className="px-1">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(i)}
                    className={`min-w-[34px] rounded-lg px-2 py-1.5 font-mono text-xs ${i === p ? 'bg-cyan/15 text-cyan' : 'hover:bg-white/5 hover:text-ink'}`}
                  >
                    {i + 1}
                  </button>
                </span>
              ))}
            <button type="button" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-lg border border-white/10 p-2 hover:text-ink disabled:opacity-30" aria-label="Keyingi sahifa">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle title="Qo‘lda hisoblash uchun kichik namuna" subtitle="Datasetning birinchi 10 ta yozuvi — formulalarni qog‘ozda tekshirish uchun qulay" />
        <DataTable
          rows={HAND_SAMPLE}
          rowKey={(r) => r.id}
          maxHeight="none"
          columns={columns.slice(0, 7)}
        />
        <p className="mt-3 text-xs text-muted">
          Ushbu 10 ta mijozda: {HAND_SAMPLE.filter((c) => c.default === 0).length} ta sinf 0 va {HAND_SAMPLE.filter((c) => c.default === 1).length} ta sinf 1.
          Algoritm sahifalaridagi “qo‘lda hisoblash” misollari shu yozuvlar asosida avtomatik hisoblanadi.
        </p>
      </Card>
    </div>
  );
}

function SegmentDataset() {
  const st = useMemo(
    () => [
      { k: 'Oylik daromad', u: 'mln so‘m', ...describe(CUSTOMERS.map((c) => c.income)) },
      { k: 'Oylik xarajat', u: 'mln so‘m', ...describe(CUSTOMERS.map((c) => c.spending)) },
      { k: 'Tranzaksiyalar', u: 'ta/oy', ...describe(CUSTOMERS.map((c) => c.transactions)) },
    ],
    [],
  );
  const hist = useMemo(() => {
    const bins = [0, 5, 10, 15, 20, 25, 30, 40];
    return bins.slice(0, -1).map((b, i) => ({ name: `${b}–${bins[i + 1]}`, v: CUSTOMERS.filter((c) => c.income >= b && c.income < bins[i + 1]).length }));
  }, []);
  const download = () => {
    const csv = ['id,monthly_income_mln,monthly_spending_mln,transactions', ...CUSTOMERS.map((c) => `${c.id},${c.income},${c.spending},${c.transactions}`)].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bankml_segment_dataset.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Mijozlar" value={CUSTOMERS.length} color="#8B5CF6" />
        <Stat label="Xususiyatlar" value={3} hint="daromad, xarajat, tranzaksiya" />
        <Stat label="Target" value="yo‘q" hint="Unsupervised Learning" color="#F59E0B" />
        <Stat label="O‘rt. daromad" value={`${st[0].mean.toFixed(1)}`} hint="mln so‘m" color="#10B981" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardTitle title="Statistika" subtitle="K-Means datasetida sinf yorlig‘i yo‘q — algoritm guruhlarni o‘zi topadi" />
          <DataTable
            rows={st}
            rowKey={(r) => r.k}
            maxHeight="none"
            columns={[
              { key: 'k', header: 'Xususiyat', render: (r) => <span className="font-sans text-ink">{r.k} <span className="text-muted">({r.u})</span></span> },
              { key: 'mean', header: 'O‘rtacha', render: (r) => r.mean.toFixed(2), align: 'right' },
              { key: 'std', header: 'Std', render: (r) => r.std.toFixed(2), align: 'right' },
              { key: 'min', header: 'Min', render: (r) => r.min, align: 'right' },
              { key: 'max', header: 'Max', render: (r) => r.max, align: 'right' },
            ]}
          />
        </Card>
        <Card>
          <CardTitle title="Daromad taqsimoti" subtitle="mln so‘m oraliqlari bo‘yicha mijozlar soni" />
          <SimpleBars data={hist} color="#8B5CF6" />
        </Card>
      </div>
      <Card>
        <CardTitle
          title="Segmentatsiya ma’lumotlari"
          subtitle="Barcha yozuvlar"
          right={
            <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-cyan/50">
              <Download size={16} /> CSV
            </button>
          }
        />
        <DataTable
          rows={CUSTOMERS}
          rowKey={(r) => r.id}
          maxHeight={480}
          columns={[
            { key: 'id', header: 'ID', render: (r) => <span className="text-violet">{r.id}</span> },
            { key: 'inc', header: 'Daromad (mln)', render: (r) => r.income.toFixed(1), align: 'right' },
            { key: 'sp', header: 'Xarajat (mln)', render: (r) => r.spending.toFixed(1), align: 'right' },
            { key: 'tx', header: 'Tranzaksiyalar', render: (r) => r.transactions, align: 'right' },
          ]}
        />
      </Card>
    </div>
  );
}
