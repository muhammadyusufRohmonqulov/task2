import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, FlaskConical, GitBranch, Network, Trees, Wand2 } from 'lucide-react';
import type { ClientFeatures, Label } from '../types';
import { CLASS_NAMES, FEATURES, NEW_CLIENT, TRAIN, toVector, formatFeature } from '../data/bankDataset';
import { DEFAULT_FOREST, DEFAULT_KNN, DEFAULT_TREE, trainForest, trainTree } from '../algorithms/evaluation';
import { fitKNN, knnQuery } from '../algorithms/knn';
import { predictTree } from '../algorithms/decisionTree';
import { predictForest } from '../algorithms/randomForest';
import { toDraft, validateClient, type ClientDraft, type ValidationErrors } from '../utils/validation';
import { ClassPill, PageHeader, pct } from '../components/common/misc';
import { Card, CardTitle, Callout } from '../components/ui/Card';
import { Button, NumberField, Segmented } from '../components/ui/Controls';
import DataTable from '../components/common/DataTable';
import TreeDiagram, { conditionText } from '../components/diagrams/TreeDiagram';
import MiniTree from '../components/diagrams/MiniTree';
import { CLASS_COLORS } from '../data/algorithms';

type Model = 'knn' | 'dt' | 'rf';

const PRESETS: { label: string; v: ClientFeatures }[] = [
  { label: 'Asosiy misol', v: NEW_CLIENT },
  { label: 'Ishonchli mijoz', v: { age: 45, income: 18, creditScore: 760, dti: 18, latePayments: 0 } },
  { label: 'Xavfli mijoz', v: { age: 26, income: 4.2, creditScore: 540, dti: 58, latePayments: 5 } },
];

export default function PredictionLab() {
  const [draft, setDraft] = useState<ClientDraft>(toDraft(NEW_CLIENT));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [model, setModel] = useState<Model>('knn');
  const [submitted, setSubmitted] = useState<{ x: ClientFeatures; model: Model; n: number } | null>(null);

  // Modellar bir marta o‘qitiladi (barchasi bir xil training to‘plamida)
  const knnModel = useMemo(() => fitKNN(TRAIN.X, TRAIN.y, DEFAULT_KNN.scaling), []);
  const tree = useMemo(() => trainTree(DEFAULT_TREE), []);
  const forest = useMemo(() => trainForest(DEFAULT_FOREST), []);

  const predict = () => {
    const r = validateClient(draft);
    setErrors(r.errors);
    if (!r.ok || !r.value) {
      setSubmitted(null);
      return;
    }
    setSubmitted((s) => ({ x: r.value!, model, n: (s?.n ?? 0) + 1 }));
  };

  const result = useMemo(() => {
    if (!submitted) return null;
    const v = toVector(submitted.x);
    if (submitted.model === 'knn') {
      const r = knnQuery(knnModel, v, DEFAULT_KNN);
      return { kind: 'knn' as const, pred: r.prediction, prob: r.probabilities[r.prediction], r };
    }
    if (submitted.model === 'dt') {
      const r = predictTree(tree, v);
      const p = r.prediction === 1 ? r.probability : 1 - r.probability;
      return { kind: 'dt' as const, pred: r.prediction, prob: p, r };
    }
    const r = predictForest(forest, v);
    return { kind: 'rf' as const, pred: r.prediction, prob: r.share[r.prediction], r };
  }, [submitted, knnModel, tree, forest]);

  return (
    <div>
      <PageHeader
        eyebrow="Prediction Lab"
        title={
          <>
            Yangi mijoz uchun <span className="gradient-text">amaliy bashorat</span> laboratoriyasi
          </>
        }
        desc="Mijoz ma’lumotlarini kiriting, modelni tanlang va Predict tugmasini bosing. Natija oldindan yozilgan emas — tanlangan model training ma’lumotlari ustida haqiqatan hisoblaydi va qarorga qanday kelganini ko‘rsatadi."
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[400px_1fr] lg:px-8">
        <div className="space-y-5">
          <Card>
            <CardTitle icon={<FlaskConical size={18} />} title="Mijoz ma’lumotlari" subtitle="Barcha maydonlar tekshiriladi (validatsiya)" />
            <div className="mb-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDraft(toDraft(p.v));
                    setErrors({});
                  }}
                  className="chip hover:border-cyan/40 hover:text-ink"
                >
                  <Wand2 size={12} /> {p.label}
                </button>
              ))}
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                predict();
              }}
              noValidate
            >
              {FEATURES.map((f) => (
                <NumberField
                  key={f.key}
                  id={`f-${f.key}`}
                  label={
                    <span>
                      {f.uz} <span className="font-mono text-xs text-muted">· {f.en}</span>
                    </span>
                  }
                  unit={f.unit}
                  value={draft[f.key]}
                  error={errors[f.key]}
                  hint={`${f.min} – ${f.max} ${f.unit}`}
                  onChange={(v) => {
                    setDraft((d) => ({ ...d, [f.key]: v }));
                    if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: undefined }));
                  }}
                />
              ))}
              <Segmented<Model>
                label="Algoritm"
                value={model}
                onChange={setModel}
                options={[
                  { value: 'knn', label: 'KNN' },
                  { value: 'dt', label: 'Decision Tree' },
                  { value: 'rf', label: 'Random Forest' },
                ]}
              />
              <Button type="submit" className="w-full py-3 text-base">
                <Cpu size={18} /> Predict
              </Button>
              {Object.values(errors).some(Boolean) && (
                <Callout tone="danger">Ba’zi qiymatlar noto‘g‘ri kiritilgan. Qizil rangdagi maydonlarni tuzating.</Callout>
              )}
            </form>
          </Card>
          <Callout tone="info" title="Model sozlamalari">
            KNN: K={DEFAULT_KNN.k}, Euclidean, Z-score · Decision Tree: max_depth={DEFAULT_TREE.maxDepth}, Gini · Random Forest: {DEFAULT_FOREST.nEstimators} ta
            daraxt, max_features = sqrt. Barchasi {TRAIN.y.length} ta training yozuvida o‘qitilgan.
          </Callout>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {!result || !submitted ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
                    <Cpu size={30} />
                  </div>
                  <h3 className="text-xl font-bold">Natija shu yerda paydo bo‘ladi</h3>
                  <p className="mt-2 max-w-md text-sm text-muted">Chap tomonda mijoz ma’lumotlarini kiriting, algoritmni tanlang va “Predict” tugmasini bosing.</p>
                </Card>
              </motion.div>
            ) : (
              <motion.div key={`${submitted.model}-${submitted.n}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <ResultHeader pred={result.pred} prob={result.prob} model={submitted.model} x={submitted.x} />
                {result.kind === 'knn' && (
                  <Card>
                    <CardTitle icon={<Network size={18} />} title={`Eng yaqin ${DEFAULT_KNN.k} ta qo‘shni`} subtitle="Z-score bilan standartlashtirilgan 5 o‘lchovli fazodagi Euclidean masofa" />
                    <DataTable
                      rows={result.r.neighbors}
                      rowKey={(r) => r.index}
                      maxHeight="none"
                      columns={[
                        { key: 'r', header: '#', render: (r) => r.rank },
                        { key: 'id', header: 'Mijoz', render: (r) => <span className="text-cyan">{TRAIN.clients[r.index].id}</span> },
                        ...FEATURES.map((f) => ({ key: f.key, header: f.short, render: (r: { index: number }) => formatFeature(f.key, TRAIN.clients[r.index][f.key]), align: 'right' as const })),
                        { key: 'd', header: 'Masofa', render: (r) => r.distance.toFixed(3), align: 'right' },
                        { key: 'c', header: 'Sinf', render: (r) => <ClassPill label={r.label} size="sm" /> },
                      ]}
                    />
                    <p className="mt-3 text-sm text-slate-300">
                      Ovozlar: <b className="text-emerald">0 → {result.r.votes[0]}</b>, <b className="text-rose-400">1 → {result.r.votes[1]}</b>. Ko‘pchilik ovozi{' '}
                      <b>sinf {result.pred}</b> ni tanladi. P = {result.r.votes[result.pred]} / {DEFAULT_KNN.k} = {pct(result.prob)}.
                      {result.r.tie && ' Ovozlar teng bo‘lgani uchun masofaga asoslangan og‘irliklar hal qildi.'}
                    </p>
                  </Card>
                )}
                {result.kind === 'dt' && (
                  <Card>
                    <CardTitle icon={<GitBranch size={18} />} title="Bosib o‘tilgan qaror yo‘li" subtitle="Har bir tugunda tekshirilgan shart va tanlangan yo‘nalish" />
                    <ol className="space-y-2">
                      {result.r.path.map((s, i) => (
                        <motion.li key={s.nodeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted">{i + 1}.</span>
                          <span className="font-mono text-ink">{conditionText(s.feature, s.threshold)}</span>
                          <span className="text-muted">— mijozda {formatFeature(FEATURES[s.feature].key, s.value)}</span>
                          <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-bold ${s.goLeft ? 'bg-emerald/15 text-emerald' : 'bg-rose-500/15 text-rose-300'}`}>
                            {s.goLeft ? 'Ha → chapga' : 'Yo‘q → o‘ngga'}
                          </span>
                        </motion.li>
                      ))}
                      <li className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: `${CLASS_COLORS[result.pred]}55`, background: `${CLASS_COLORS[result.pred]}12` }}>
                        Barg (Leaf Node): {result.r.leaf.samples} ta training mijoz, taqsimot [{result.r.leaf.counts[0]} / {result.r.leaf.counts[1]}] → <b>sinf {result.pred}</b>
                      </li>
                    </ol>
                    <div className="mt-5">
                      <TreeDiagram root={tree} criterion="gini" pathIds={new Set([...result.r.path.map((p) => p.nodeId), result.r.leaf.id])} />
                    </div>
                  </Card>
                )}
                {result.kind === 'rf' && (
                  <Card>
                    <CardTitle icon={<Trees size={18} />} title={`${forest.trees.length} ta daraxtning ovozi`} subtitle="Har bir daraxt o‘z bootstrap namunasida o‘qitilgan" />
                    <div className="mb-4 h-4 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="flex h-full">
                        <motion.div className="h-full bg-emerald" initial={{ width: 0 }} animate={{ width: `${result.r.share[0] * 100}%` }} transition={{ duration: 0.8 }} />
                        <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: `${result.r.share[1] * 100}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {result.r.treeVotes.map((v, i) => {
                        const t = forest.trees[i];
                        return (
                          <motion.div key={v.treeId} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="rounded-xl border p-2" style={{ borderColor: `${CLASS_COLORS[v.prediction]}40`, background: `${CLASS_COLORS[v.prediction]}0d` }}>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted">Tree {v.treeId}</span>
                              <span className="font-bold" style={{ color: CLASS_COLORS[v.prediction] }}>
                                → {v.prediction}
                              </span>
                            </div>
                            <MiniTree root={t.root} pathIds={new Set([...v.path.map((p) => p.nodeId), v.leafId])} height={48} />
                          </motion.div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-slate-300">
                      Ovozlar: <b className="text-emerald">0 → {result.r.votes[0]}</b>, <b className="text-rose-400">1 → {result.r.votes[1]}</b>. Ulush{' '}
                      {pct(result.prob)} — bu daraxtlar ovozlarining ulushi, kalibrlangan ehtimol emas.
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResultHeader({ pred, prob, model, x }: { pred: Label; prob: number; model: Model; x: ClientFeatures }) {
  const name = model === 'knn' ? 'KNN' : model === 'dt' ? 'Decision Tree' : 'Random Forest';
  const measure = model === 'knn' ? 'qo‘shnilar ulushi' : model === 'dt' ? 'bargdagi sinf ulushi' : 'daraxtlar ovozi ulushi';
  const c = CLASS_COLORS[pred];
  return (
    <div className="glass gradient-border relative overflow-hidden rounded-2xl p-6" style={{ boxShadow: `0 0 50px -20px ${c}` }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(500px 200px at 90% 0%, ${c}22, transparent 70%)` }} />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">{name} bashorati</div>
          <div className="mt-2">
            <ClassPill label={pred} size="lg" />
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            {pred === 1
              ? `Model ushbu mijozni kredit to‘lovida muammoga uchrash xavfi yuqori deb baholadi. Bank qo‘shimcha kafolat, kichikroq summa yoki qo‘lda tekshiruvni ko‘rib chiqishi mumkin.`
              : `Model ushbu mijozni kreditni muammosiz to‘lashi ehtimoli yuqori deb baholadi (${CLASS_NAMES[0].toLowerCase()} sinfi).`}
          </p>
          <p className="mt-2 font-mono text-xs text-muted">
            Yosh {x.age} · {x.income} mln · CS {x.creditScore} · DTI {x.dti}% · kechikish {x.latePayments}
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-5xl font-bold" style={{ color: c }}>
            {pct(prob, 0)}
          </div>
          <div className="text-xs text-muted">{measure}</div>
        </div>
      </div>
    </div>
  );
}
