import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, SlidersHorizontal } from 'lucide-react';
import { DEFAULT_FOREST, DEFAULT_KNN, DEFAULT_TREE, evaluateForest, evaluateKNN, evaluateTree, overfitStatus } from '../algorithms/evaluation';
import { SPLIT, TEST, TRAIN } from '../data/bankDataset';
import { MetricsComparisonChart } from '../components/charts/Charts';
import { MODEL_COLORS } from '../components/charts/chartTheme';
import { ConfusionMatrixView, PageHeader, pct } from '../components/common/misc';
import { Card, CardTitle, Callout } from '../components/ui/Card';
import { Slider } from '../components/ui/Controls';
import DataTable from '../components/common/DataTable';
import { MetricsExplainer } from '../components/algorithm/Evaluation';

const QUAL = [
  { k: 'Learning turi', knn: 'Supervised', dt: 'Supervised', rf: 'Supervised', note: 'Uchalasi ham yorliqli (0/1) ma’lumotdan o‘rganadi.' },
  { k: 'Asosiy mexanizm', knn: 'Masofa (o‘xshash mijozlar)', dt: 'Ketma-ket shartlar (if–else)', rf: 'Ko‘p daraxtlar ovozi', note: 'KNN “kimga o‘xshaydi?”, daraxt “qaysi qoidaga mos?” deb so‘raydi.' },
  { k: 'O‘qitish', knn: 'Yo‘q (lazy) — faqat eslab qoladi', dt: 'Tez, bitta daraxt', rf: 'Sekinroq, N ta daraxt', note: 'KNN hisobni bashorat vaqtiga qoldiradi.' },
  { k: 'Bashorat tezligi', knn: 'Sekin (barcha nuqtalargacha masofa)', dt: 'Juda tez', rf: 'Tez (N ta daraxt)', note: 'Katta datasetlarda KNN sekinlashadi.' },
  { k: 'Scaling', knn: 'Odatda kerak', dt: 'Kerak emas', rf: 'Kerak emas', note: 'Daraxt thresholdlari o‘lchov birligiga bog‘liq emas.' },
  { k: 'Interpretability', knn: 'O‘rtacha (qo‘shnilarni ko‘rsatish mumkin)', dt: 'Yuqori (qoidalar ko‘rinadi)', rf: 'Nisbatan past (feature importance bor)', note: 'Bank regulyatorlari tushuntiriladigan modellarni afzal ko‘radi.' },
  { k: 'Overfitting xavfi', knn: 'K ga bog‘liq (K=1 da yuqori)', dt: 'Yuqori bo‘lishi mumkin', rf: 'Odatda pastroq', note: 'Bagging dispersiyani kamaytiradi.' },
  { k: 'Asosiy parametrlar', knn: 'K, masofa, scaling', dt: 'max_depth, min_samples', rf: 'n_estimators, max_features', note: 'Barchasini algoritm sahifalarida o‘zgartirish mumkin.' },
];

export default function Comparison() {
  const [k, setK] = useState(DEFAULT_KNN.k);
  const [depth, setDepth] = useState(DEFAULT_TREE.maxDepth);
  const [nTrees, setNTrees] = useState(DEFAULT_FOREST.nEstimators);
  const dk = useDeferredValue(k);
  const dd = useDeferredValue(depth);
  const dn = useDeferredValue(nTrees);

  const knn = useMemo(() => evaluateKNN({ ...DEFAULT_KNN, k: dk }), [dk]);
  const dt = useMemo(() => evaluateTree({ ...DEFAULT_TREE, maxDepth: dd }), [dd]);
  const rf = useMemo(() => evaluateForest({ ...DEFAULT_FOREST, nEstimators: dn }), [dn]);

  const models = [
    { name: 'KNN' as const, r: knn, cfg: `K=${dk}, Euclidean, Z-score`, trees: '—' },
    { name: 'Decision Tree' as const, r: dt, cfg: `max_depth=${dd}, min_split=${DEFAULT_TREE.minSamplesSplit}, Gini`, trees: '1' },
    { name: 'Random Forest' as const, r: rf, cfg: `n=${dn}, max_depth=${DEFAULT_FOREST.maxDepth}, sqrt`, trees: String(dn) },
  ];
  const best = [...models].sort((a, b) => b.r.test.f1 - a.r.test.f1)[0];

  return (
    <div>
      <PageHeader
        eyebrow="Taqqoslash · Comparison"
        title={
          <>
            KNN, Decision Tree va Random Forest <span className="gradient-text">bir xil sharoitda</span>
          </>
        }
        desc={`Uchala model ham aynan bir xil stratified train/test split ustida o‘qitiladi va baholanadi: ${TRAIN.y.length} ta training (80%) va ${TEST.y.length} ta testing (20%) yozuv, seed = 42. Test yozuvlari o‘qitishda ishlatilmaydi. KNN uchun Z-score scaler faqat training ma’lumotida fit qilinadi.`}
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <Card>
          <CardTitle icon={<SlidersHorizontal size={18} />} title="Asosiy parametrlarni o‘zgartiring" subtitle="Har bir o‘zgarishda modellar qaytadan o‘qitiladi va natijalar darhol yangilanadi" />
          <div className="grid gap-6 md:grid-cols-3">
            <Slider label="KNN: K qiymati" value={k} min={1} max={25} onChange={setK} />
            <Slider label="Decision Tree: Max Depth" value={depth} min={1} max={10} onChange={setDepth} />
            <Slider label="Random Forest: daraxtlar soni" value={nTrees} min={5} max={100} onChange={setNTrees} />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardTitle icon={<Scale size={18} />} title="Test metrikalari taqqoslanishi" subtitle="Accuracy, Precision, Recall, F1-score — haqiqiy implementatsiyadan" />
            <MetricsComparisonChart data={models.map((m) => ({ name: m.name, m: m.r.test }))} />
          </Card>
          <Card>
            <CardTitle title="Qisqa xulosa" />
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Joriy parametrlarda test to‘plamidagi eng yuqori F1-score: <b style={{ color: MODEL_COLORS[best.name] }}>{best.name}</b> ({pct(best.r.test.f1)}).
              </p>
              {models.map((m) => {
                const o = overfitStatus(m.r.train, m.r.test);
                return (
                  <div key={m.name} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2">
                    <span style={{ color: MODEL_COLORS[m.name] }} className="font-semibold">{m.name}</span>
                    <span className="text-xs text-muted">train {pct(m.r.train.accuracy, 0)} → test {pct(m.r.test.accuracy, 0)} · {o.label}</span>
                  </div>
                );
              })}
              <Callout tone="warn">
                Test to‘plami atigi {TEST.y.length} ta mijozdan iborat — bitta mijozning xato tasniflanishi accuracy’ni {(100 / TEST.y.length).toFixed(1)} foiz
                punktga o‘zgartiradi. Kichik datasetlarda natijalar orasidagi kichik farqlarni haddan tashqari talqin qilmaslik kerak. Random Forest sozlamalari test to‘plamiga qarab emas, OOB accuracy bo‘yicha tanlangan.
              </Callout>
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle title="Miqdoriy taqqoslash jadvali" subtitle="Bir xil train/test split (stratified, 80/20, seed 42)" />
          <DataTable
            rows={models}
            rowKey={(r) => r.name}
            maxHeight="none"
            columns={[
              { key: 'n', header: 'Model turi', render: (r) => <span className="font-sans font-semibold" style={{ color: MODEL_COLORS[r.name] }}>{r.name}</span> },
              { key: 'c', header: 'Sozlamalar', render: (r) => <span className="font-sans text-xs text-muted">{r.cfg}</span> },
              { key: 't', header: 'Daraxtlar', render: (r) => r.trees, align: 'right' },
              { key: 'tr', header: 'Train acc.', render: (r) => pct(r.r.train.accuracy), align: 'right' },
              { key: 'te', header: 'Test acc.', render: (r) => pct(r.r.test.accuracy), align: 'right' },
              { key: 'p', header: 'Precision', render: (r) => pct(r.r.test.precision), align: 'right' },
              { key: 'rc', header: 'Recall', render: (r) => pct(r.r.test.recall), align: 'right' },
              { key: 'f', header: 'F1', render: (r) => pct(r.r.test.f1), align: 'right' },
              { key: 'o', header: 'Overfitting', render: (r) => {
                const o = overfitStatus(r.r.train, r.r.test);
                const col = o.level === 'high' ? 'text-rose-400' : o.level === 'mid' ? 'text-amber-300' : 'text-emerald';
                return <span className={`font-sans text-xs ${col}`}>{o.label}</span>;
              } },
            ]}
          />
        </Card>

        <div className="grid gap-5 md:grid-cols-3">
          {models.map((m) => (
            <Card key={m.name}>
              <ConfusionMatrixView cm={m.r.test.cm} title={<span style={{ color: MODEL_COLORS[m.name] }}>{m.name} — test confusion matrix</span>} />
            </Card>
          ))}
        </div>

        <Card>
          <CardTitle title="Sifat bo‘yicha taqqoslash" subtitle="Algoritmlarning tabiati, afzalliklari va cheklovlari" />
          <DataTable
            rows={QUAL}
            rowKey={(r) => r.k}
            maxHeight="none"
            columns={[
              { key: 'k', header: 'Mezon', render: (r) => <span className="font-sans font-semibold text-ink">{r.k}</span> },
              { key: 'knn', header: <span className="text-cyan">KNN</span>, render: (r) => <span className="whitespace-normal font-sans text-slate-300">{r.knn}</span> },
              { key: 'dt', header: <span className="text-electric">Decision Tree</span>, render: (r) => <span className="whitespace-normal font-sans text-slate-300">{r.dt}</span> },
              { key: 'rf', header: <span className="text-emerald">Random Forest</span>, render: (r) => <span className="whitespace-normal font-sans text-slate-300">{r.rf}</span> },
              { key: 'note', header: 'Izoh', render: (r) => <span className="block min-w-[220px] whitespace-normal font-sans text-xs text-muted">{r.note}</span> },
            ]}
          />
        </Card>

        <section>
          <h2 className="mb-2 text-2xl font-bold">Baholash metrikalari: formulalar va bank talqini</h2>
          <p className="mb-5 max-w-3xl text-sm text-muted">
            Train/test ajratish: {SPLIT.train.length} / {SPLIT.test.length}, stratified. Quyidagi misollarda {best.name} modelining test natijasi ishlatilgan.
          </p>
          <MetricsExplainer m={best.r.test} modelName={best.name} />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/algoritmlar/knn" className="chip hover:text-ink">KNN laboratoriyasi →</Link>
          <Link to="/algoritmlar/decision-tree" className="chip hover:text-ink">Decision Tree laboratoriyasi →</Link>
          <Link to="/algoritmlar/random-forest" className="chip hover:text-ink">Random Forest laboratoriyasi →</Link>
        </div>
      </div>
    </div>
  );
}
