import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon, BadgeCheck, CreditCard, Fingerprint, Landmark, ShieldQuestion, Target, UserPlus, Users } from 'lucide-react';
import type { ClientFeatures, DistanceMetric, ScalingMethod } from '../types';
import { FEATURES, NEW_CLIENT, TEST, TRAIN, toVector, formatFeature } from '../data/bankDataset';
import { fitKNN, knnQuery } from '../algorithms/knn';
import { evaluate } from '../utils/metrics';
import { useStepPlayer } from '../hooks/useStepPlayer';
import AlgorithmShell, { sectionIndex } from '../components/algorithm/AlgorithmShell';
import ClientSliders from '../components/algorithm/ClientForm';
import { EvaluationPanel } from '../components/algorithm/Evaluation';
import KNNScatter from '../components/charts/KNNScatter';
import { ParamSweepChart } from '../components/charts/Charts';
import { AlgoMiniVisual } from '../components/diagrams/Visuals';
import DataTable from '../components/common/DataTable';
import FormulaCard from '../components/common/FormulaCard';
import PlayerControls from '../components/common/PlayerControls';
import ProcessStepper from '../components/common/ProcessStepper';
import Tex, { tn } from '../components/common/Tex';
import { ClassPill, Concept, ProsCons, Section, SyntheticNotice, UseCases, pct } from '../components/common/misc';
import { Callout, Card, CardTitle, Stat } from '../components/ui/Card';
import { Segmented, Slider, Toggle } from '../components/ui/Controls';
import { CLASS_COLORS } from '../data/algorithms';

type FeatureSet = 'all' | '2d';
const COLS: Record<FeatureSet, number[]> = { all: [0, 1, 2, 3, 4], '2d': [2, 1] };

function buildKNN(cols: number[], scaling: ScalingMethod) {
  const Xtr = TRAIN.X.map((r) => cols.map((c) => r[c]));
  return fitKNN(Xtr, TRAIN.y, scaling);
}

export default function KNNPage() {
  const [k, setK] = useState(5);
  const [metric, setMetric] = useState<DistanceMetric>('euclidean');
  const [scaling, setScaling] = useState<ScalingMethod>('zscore');
  const [weighted, setWeighted] = useState(false);
  const [fs, setFs] = useState<FeatureSet>('all');
  const [client, setClient] = useState<ClientFeatures>({ ...NEW_CLIENT });
  const [showAll, setShowAll] = useState(false);
  const dClient = useDeferredValue(client);

  const cols = COLS[fs];
  const model = useMemo(() => buildKNN(cols, scaling), [cols, scaling]);
  const xFull = toVector(dClient);
  const x = cols.map((c) => xFull[c]);
  const opts = { k, metric, weighted };
  const res = useMemo(() => knnQuery(model, x, opts), [model, x.join(','), k, metric, weighted]); // eslint-disable-line react-hooks/exhaustive-deps
  const evalRes = useMemo(() => {
    const p = (X: number[][]) => X.map((r) => knnQuery(model, cols.map((c) => r[c]), opts).prediction);
    return { train: evaluate(TRAIN.y, p(TRAIN.X)), test: evaluate(TEST.y, p(TEST.X)) };
  }, [model, k, metric, weighted]); // eslint-disable-line react-hooks/exhaustive-deps
  const sweep = useMemo(() => {
    const out: Record<string, number>[] = [];
    for (let kk = 1; kk <= 25; kk += 1) {
      const o = { k: kk, metric, weighted };
      const tr = TRAIN.X.map((r) => knnQuery(model, cols.map((c) => r[c]), o).prediction);
      const te = TEST.X.map((r) => knnQuery(model, cols.map((c) => r[c]), o).prediction);
      out.push({ x: kk, train: evaluate(TRAIN.y, tr).accuracy, test: evaluate(TEST.y, te).accuracy });
    }
    return out;
  }, [model, metric, weighted]); // eslint-disable-line react-hooks/exhaustive-deps
  const kCompare = useMemo(
    () =>
      [1, 3, 5, 7, 9, 11, 15].map((kk) => {
        const r = knnQuery(model, x, { k: kk, metric, weighted });
        return { k: kk, votes: r.votes, pred: r.prediction, p: r.probabilities[r.prediction] };
      }),
    [model, x.join(','), metric, weighted], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Animatsiya: 0 nuqtalar · 1 yangi mijoz · 2 masofa · 3..2+k qo‘shnilar · 3+k ovoz
  const total = 4 + res.neighbors.length;
  const player = useStepPlayer(total, { resetKey: `${k}|${metric}|${scaling}|${fs}|${weighted}|${xFull.join(',')}` });
  const st = player.started ? player.step : total - 1;
  const revealed = Math.max(0, Math.min(res.neighbors.length, st - 2));
  const phaseText = [
    'Training to‘plamidagi mijozlar grafikda ko‘rsatildi (yashil — 0, qizil — 1).',
    'Yangi mijoz grafikka joylashtirildi. Uning sinfi hali noma’lum.',
    `Yangi mijozdan barcha ${TRAIN.y.length} ta training mijozgacha ${metric === 'euclidean' ? 'Euclidean' : 'Manhattan'} masofa hisoblanmoqda…`,
  ];
  const stepText =
    st < 3
      ? phaseText[st]
      : st < 3 + res.neighbors.length
        ? `${revealed}-eng yaqin qo‘shni: ${TRAIN.clients[res.neighbors[revealed - 1].index].id}, masofa = ${res.neighbors[revealed - 1].distance.toFixed(3)}, sinf ${res.neighbors[revealed - 1].label}.`
        : `Ovoz berish: 0 → ${res.votes[0]} ta, 1 → ${res.votes[1]} ta. Natija: sinf ${res.prediction}.`;

  const points = useMemo(
    () =>
      TRAIN.clients.map((c) => ({ id: c.id, x: c.creditScore, y: c.income, label: c.default, extra: `Yosh ${c.age} · DTI ${c.dti}% · kech. ${c.latePayments}` })),
    [],
  );

  // Standartlashtirish jadvali (yangi mijoz, faqat training asosidagi μ va σ)
  const zModel = useMemo(() => fitKNN(TRAIN.X, TRAIN.y, 'zscore'), []);
  const nb1 = res.neighbors[0];
  const nbClient = TRAIN.clients[nb1.index];
  const featNames = cols.map((c) => FEATURES[c]);

  // Scaling’siz va scaling bilan masofa ulushlari (birinchi qo‘shni misolida)
  const contrib = useMemo(() => {
    const raw = cols.map((c) => (xFull[c] - toVector(nbClient)[c]) ** 2);
    const zq = cols.map((c) => (zModel.scaler.method === 'zscore' ? (xFull[c] - zModel.scaler.mean[c]) / zModel.scaler.std[c] : 0));
    const zn = cols.map((c) => (zModel.scaler.method === 'zscore' ? (toVector(nbClient)[c] - zModel.scaler.mean[c]) / zModel.scaler.std[c] : 0));
    const z = zq.map((v, i) => (v - zn[i]) ** 2);
    const sr = raw.reduce((a, b) => a + b, 0) || 1;
    const sz = z.reduce((a, b) => a + b, 0) || 1;
    return cols.map((c, i) => ({ f: FEATURES[c], raw: raw[i], rawShare: raw[i] / sr, z: z[i], zShare: z[i] / sz }));
  }, [cols, xFull.join(','), nbClient, zModel]); // eslint-disable-line react-hooks/exhaustive-deps

  const qs = res.queryScaled;
  const ns = model.Xs[nb1.index];
  const distTex =
    metric === 'euclidean'
      ? String.raw`d = \sqrt{${qs.map((v, i) => `(${tn(v)} - ${tn(ns[i])})^2`).join(' + ')}} = ${nb1.distance.toFixed(3)}`
      : String.raw`d = ${qs.map((v, i) => `|${tn(v)} - ${tn(ns[i])}|`).join(' + ')} = ${nb1.distance.toFixed(3)}`;
  const scaleName = scaling === 'zscore' ? 'Z-score' : scaling === 'minmax' ? 'Min-Max' : 'scalingsiz';

  const conf = res.probabilities[res.prediction];

  return (
    <AlgorithmShell
      algo="knn"
      definition={
        <>
          <b className="text-ink">K-Nearest Neighbors</b> — yangi obyektni unga eng o‘xshash (eng yaqin) <b className="text-cyan">K</b> ta ma’lum obyektning
          sinflariga qarab tasniflaydigan Supervised Learning algoritmi. “Menga do‘stingni ayt — men sening kimligingni aytaman.”
        </>
      }
      problem={
        <>
          Bankka 34 yoshli, oylik daromadi 7.5 mln so‘m, kredit reytingi 655, DTI 40% va so‘nggi 12 oyda 2 marta to‘lovni kechiktirgan yangi mijoz
          murojaat qildi. U kredit to‘lovida muammoga uchraydimi (1) yoki yo‘qmi (0)?
        </>
      }
      learningSteps={['Nazariya', 'Standartlashtirish', 'Masofa', 'Qo‘shnilar', 'Ovoz berish', 'Baholash']}
      visual={<div className="h-64 w-full sm:h-72"><AlgoMiniVisual id="knn" /></div>}
    >
      {/* 1. HAQIDA */}
      <Section id="haqida" index={sectionIndex('haqida')} title="KNN nima?" subtitle="Sodda va ilmiy tushuntirish">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <div className="prose-uz">
              <p>
                <strong>K-Nearest Neighbors (KNN)</strong> — “K ta eng yaqin qo‘shni” degani. Algoritm yangi mijozni ko‘rganda
                o‘zidan so‘raydi: <em>“Bankning avvalgi mijozlari ichida unga eng o‘xshash K tasi kimlar va ular kreditni qanday to‘lashgan?”</em>
                Agar o‘xshash mijozlarning ko‘pchiligi muammoga uchragan bo‘lsa, yangi mijoz ham xavfli deb topiladi.
              </p>
              <p>
                <strong>Nega bu Machine Learning?</strong> Chunki qaror qoidasi dasturchi tomonidan qo‘lda yozilmaydi — u to‘liq
                ma’lumotlardan kelib chiqadi. Datasetni o‘zgartirsangiz, model xulqi ham o‘zgaradi. KNN “instance-based” yoki “lazy learning”
                deb ataladi: u o‘qitish bosqichida formula qurmaydi, balki misollarni eslab qoladi va hisobni bashorat paytida bajaradi.
              </p>
              <p>
                <strong>Supervised Learning bilan bog‘liqligi:</strong> training ma’lumotlarida har bir mijoz uchun to‘g‘ri javob (0 yoki 1)
                oldindan ma’lum — bu “o‘qituvchi” (supervisor) rolini o‘ynaydi. KNN aynan shu yorliqlardan foydalanadi.
              </p>
              <p>
                <strong>Nega klassifikatsiya?</strong> Natija — diskret sinf (0 yoki 1), son emas. Qo‘shnilar ovoz beradi va eng ko‘p ovoz
                olgan sinf tanlanadi.
              </p>
            </div>
          </Card>
          <div className="space-y-3">
            <Concept term="K qiymati" en="K">
              Nechta eng yaqin qo‘shni ovoz berishi. K=1 — faqat eng o‘xshash bitta mijoz; K=7 — eng o‘xshash yettita mijozning ko‘pchilik ovozi.
            </Concept>
            <Concept term="Eng yaqin qo‘shnilar" en="Nearest Neighbors">
              Xususiyatlar fazosida yangi nuqtaga masofasi eng kichik bo‘lgan training nuqtalari. “Yaqin” = xususiyatlari o‘xshash.
            </Concept>
            <Concept term="Tasniflash qanday bo‘ladi?" en="Classification">
              1) Barcha training mijozlargacha masofa hisoblanadi → 2) eng kichik K tasi tanlanadi → 3) ular sinflari bo‘yicha ovoz beradi → 4)
              ko‘pchilik sinfi — javob.
            </Concept>
            <Callout tone="info" title="Hayotiy misol">
              Yangi mahallaga ko‘chib keldingiz va qaysi choyxona yaxshi ekanini bilmaysiz. Eng yaqin 5 qo‘shningizdan so‘raysiz: 4 tasi
              “Bahor”ni maqtadi, 1 tasi “Navro‘z”ni. Siz “Bahor”ni tanlaysiz. KNN ham aynan shunday ishlaydi.
            </Callout>
          </div>
        </div>
      </Section>

      {/* 2. MASALA */}
      <Section id="masala" index={sectionIndex('masala')} title="Amaliy masala" subtitle="Yangi mijozning kredit to‘lovida muammoga uchrash xavfini aniqlash">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card glow="cyan">
            <CardTitle icon={<UserPlus size={18} />} title="Yangi mijoz" subtitle="Sinfi noma’lum — bashorat qilinadi" />
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="text-xs text-muted">{f.uz}</div>
                  <div className="mt-1 font-display text-xl font-bold text-ink">
                    {formatFeature(f.key, NEW_CLIENT[f.key])} <span className="text-xs font-normal text-muted">{f.unit}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center rounded-xl border border-dashed border-amber-400/40 bg-amber-400/[0.05] p-3 text-center">
                <div>
                  <ShieldQuestion className="mx-auto text-amber-300" size={22} />
                  <div className="mt-1 text-xs font-semibold text-amber-200">Natija = ?</div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="prose-uz">
              <p>
                Bank yangi mijozga kredit ajratishdan oldin xavfni baholashi kerak. Bankda avval kredit olgan <strong>{TRAIN.y.length + TEST.y.length}</strong> ta mijoz
                haqida ma’lumot bor va ularning har biri uchun natija ma’lum: kredit muammosiz to‘langan (0) yoki to‘lovda muammo bo‘lgan (1).
              </p>
              <p>
                KNN yondashuvi: yangi mijozga xususiyatlari bo‘yicha eng o‘xshash K ta eski mijozni topamiz. Agar ularning ko‘pchiligi muammoga uchragan bo‘lsa,
                yangi mijoz ham “yuqori xavf” guruhiga kiritiladi.
              </p>
              <ul>
                <li><strong>Kirish (X):</strong> yosh, oylik daromad, kredit reytingi, DTI, kechiktirilgan to‘lovlar.</li>
                <li><strong>Chiqish (y):</strong> Payment Default — 0 yoki 1.</li>
                <li><strong>Usul:</strong> K ta eng yaqin qo‘shnining ko‘pchilik ovozi.</li>
              </ul>
            </div>
          </Card>
        </div>
      </Section>

      {/* 3. DATASET */}
      <Section id="dataset" index={sectionIndex('dataset')} title="Dataset" subtitle="Xususiyatlar va target o‘zgaruvchini ajratish, train/test bo‘linish">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Training" value={TRAIN.y.length} hint="80% — model shu yerdan qo‘shni qidiradi" />
            <Stat label="Testing" value={TEST.y.length} hint="20% — faqat baholash uchun" color="#F59E0B" />
            <Stat label="Xususiyatlar (X)" value={5} color="#8B5CF6" />
            <Stat label="Target (y)" value="0 / 1" color="#10B981" />
          </div>
          <Card>
            <CardTitle title="Training to‘plamidan namuna" subtitle="X — birinchi 5 ustun, y — Natija ustuni" right={<Link to="/malumotlar" className="chip hover:text-ink">To‘liq dataset →</Link>} />
            <DataTable
              rows={TRAIN.clients.slice(0, 8)}
              rowKey={(r) => r.id}
              maxHeight="none"
              columns={[
                { key: 'id', header: 'ID', render: (r) => <span className="text-cyan">{r.id}</span> },
                ...FEATURES.map((f) => ({ key: f.key, header: `${f.short} (x)`, render: (r: typeof TRAIN.clients[number]) => formatFeature(f.key, r[f.key]), align: 'right' as const })),
                { key: 'y', header: 'Natija (y)', render: (r) => <ClassPill label={r.default} size="sm" /> },
              ]}
            />
          </Card>
          <SyntheticNotice compact />
        </div>
      </Section>

      {/* 4. MATEMATIKA */}
      <Section id="matematika" index={sectionIndex('matematika')} title="Matematik asoslar" subtitle="Masofa formulalari, standartlashtirish va ehtimol">
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              title="Euclidean Distance (asosiy)"
              tex={String.raw`d(x, y) = \sqrt{\sum_{i=1}^{n} (x_i - y_i)^2}`}
              meaning="Ikki nuqta orasidagi “to‘g‘ri chiziq” bo‘yicha masofa (Pifagor teoremasining n o‘lchovli umumlashmasi)."
              symbols={[
                { sym: 'x', desc: 'yangi mijozning (standartlashtirilgan) vektori' },
                { sym: 'y', desc: 'training to‘plamidagi mijoz vektori' },
                { sym: 'x_i, y_i', desc: 'i-xususiyat qiymatlari' },
                { sym: 'n', desc: `xususiyatlar soni (bizda ${cols.length})` },
              ]}
              when="Xususiyatlar uzluksiz va bir xil masshtabga keltirilgan bo‘lsa. Katta farqlarni kuchliroq jazolaydi (kvadrat tufayli)."
              example={
                <div className="space-y-2">
                  <div>Yangi mijoz va eng yaqin qo‘shni ({nbClient.id}) orasida, {scaleName} qiymatlar bilan:</div>
                  <Tex block className="text-xs">{String.raw`d = \sqrt{${qs.map((v, i) => `(${tn(v, 2)} - ${tn(ns[i], 2)})^2`).join(' + ')}}`}</Tex>
                  <div>
                    Natija: <b className="text-cyan">{metric === 'euclidean' ? nb1.distance.toFixed(3) : Math.sqrt(qs.reduce((a, v, i) => a + (v - ns[i]) ** 2, 0)).toFixed(3)}</b>
                  </div>
                </div>
              }
            />
            <FormulaCard
              title="Manhattan Distance"
              tex={String.raw`d(x, y) = \sum_{i=1}^{n} |x_i - y_i|`}
              meaning="Har bir o‘q bo‘yicha farqlarning absolyut qiymatlari yig‘indisi — shahar ko‘chalari bo‘ylab “to‘rtburchak” yurish masofasi."
              symbols={[
                { sym: '|x_i - y_i|', desc: 'i-xususiyat bo‘yicha absolyut farq' },
                { sym: 'n', desc: 'xususiyatlar soni' },
              ]}
              when="Ko‘p o‘lchovli ma’lumotlarda, chetga chiqqan qiymatlar (outlier) ko‘p bo‘lganda yoki xususiyatlar bir-biridan mustaqil bo‘lganda. Katta farqlarni kvadratga oshirmaydi."
              example={
                <div className="space-y-2">
                  <div>Xuddi shu ikki mijoz uchun:</div>
                  <Tex block className="text-xs">{String.raw`d = ${qs.map((v, i) => `|${tn(v, 2)} - ${tn(ns[i], 2)}|`).join(' + ')}`}</Tex>
                  <div>
                    Natija: <b className="text-cyan">{qs.reduce((a, v, i) => a + Math.abs(v - ns[i]), 0).toFixed(3)}</b>
                  </div>
                </div>
              }
            />
          </div>

          <Card>
            <CardTitle title="Nega standartlashtirish kerak?" subtitle="O‘lchov birliklari turlicha: yosh — yil, daromad — mln so‘m, reyting — yuzlab ball, DTI — foiz" />
            <div className="prose-uz mb-4">
              <p>
                Masofa formulasida barcha xususiyatlar teng qo‘shiladi. Kredit reytingi 450–850 oralig‘ida o‘zgaradi, daromad esa 2–35 oralig‘ida.
                Scaling qilinmasa, 30 balllik reyting farqi (30² = 900) daromaddagi 3 mln farqdan (3² = 9) 100 marta kuchliroq ta’sir qiladi —
                masofani amalda <strong>faqat kredit reytingi</strong> belgilaydi. Quyidagi jadval yangi mijoz va {nbClient.id} misolida har bir
                xususiyatning <Tex>{'(x_i - y_i)^2'}</Tex> hissasini ko‘rsatadi:
              </p>
            </div>
            <DataTable
              rows={contrib}
              rowKey={(r) => r.f.key}
              maxHeight="none"
              columns={[
                { key: 'f', header: 'Xususiyat', render: (r) => <span className="font-sans text-ink">{r.f.uz}</span> },
                { key: 'raw', header: 'Scalingsiz (x−y)²', render: (r) => r.raw.toFixed(2), align: 'right' },
                { key: 'rs', header: 'Ulushi', render: (r) => <ShareBar v={r.rawShare} color="#F43F5E" />, align: 'right' },
                { key: 'z', header: 'Z-score (x−y)²', render: (r) => r.z.toFixed(3), align: 'right' },
                { key: 'zs', header: 'Ulushi', render: (r) => <ShareBar v={r.zShare} color="#00D4FF" />, align: 'right' },
              ]}
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              title="Z-score Standardization"
              tex={String.raw`z = \frac{x - \mu}{\sigma}, \quad \mu = \frac{1}{N}\sum_{j=1}^{N} x_j, \quad \sigma = \sqrt{\frac{1}{N}\sum_{j=1}^{N}(x_j - \mu)^2}`}
              meaning="Qiymat o‘rtachadan necha standart og‘ish uzoqda ekanini ko‘rsatadi. Natijada har bir xususiyatning o‘rtachasi 0, standart og‘ishi 1 bo‘ladi."
              symbols={[
                { sym: 'x', desc: 'asl qiymat' },
                { sym: '\\mu', desc: 'training to‘plamidagi o‘rtacha qiymat' },
                { sym: '\\sigma', desc: 'training to‘plamidagi standart og‘ish (populyatsiya, N ga bo‘linadi)' },
                { sym: 'N', desc: `training yozuvlar soni (${TRAIN.y.length})` },
              ]}
              when="Masofaga asoslangan algoritmlarda (KNN, K-Means) xususiyatlarni teng huquqli qilish uchun. μ va σ FAQAT training to‘plamida hisoblanadi — aks holda data leakage bo‘ladi."
              example={
                zModel.scaler.method === 'zscore' && (
                  <Tex>{String.raw`z_{\text{score}} = \frac{${client.creditScore} - ${zModel.scaler.mean[2].toFixed(2)}}{${zModel.scaler.std[2].toFixed(2)}} = ${((client.creditScore - zModel.scaler.mean[2]) / zModel.scaler.std[2]).toFixed(3)}`}</Tex>
                )
              }
            />
            <FormulaCard
              title="Min-Max Normalization"
              tex={String.raw`x' = \frac{x - x_{\min}}{x_{\max} - x_{\min}}`}
              meaning="Qiymatni [0, 1] oralig‘iga o‘tkazadi: minimum → 0, maksimum → 1."
              symbols={[
                { sym: 'x_{\\min}', desc: 'training to‘plamidagi minimum' },
                { sym: 'x_{\\max}', desc: 'training to‘plamidagi maksimum' },
              ]}
              when="Qiymatlar chegaralangan va outlier kam bo‘lganda. Bitta ekstremal qiymat butun shkalani siqib yuborishi mumkin. Yangi mijoz qiymati diapazondan tashqarida bo‘lsa, natija 0–1 dan chiqadi."
              example={(() => {
                const m = fitKNN(TRAIN.X, TRAIN.y, 'minmax').scaler;
                return m.method === 'minmax' ? (
                  <Tex>{String.raw`x'_{\text{score}} = \frac{${client.creditScore} - ${m.min[2]}}{${m.max[2]} - ${m.min[2]}} = ${((client.creditScore - m.min[2]) / (m.max[2] - m.min[2])).toFixed(3)}`}</Tex>
                ) : null;
              })()}
            />
          </div>

          <Card>
            <CardTitle title="Yangi mijozni standartlashtirish (Z-score)" subtitle={`μ va σ — faqat ${TRAIN.y.length} ta training yozuvidan. Qiymatlar joriy slider holatiga mos.`} />
            <DataTable
              rows={FEATURES.map((f, j) => ({ f, j }))}
              rowKey={(r) => r.f.key}
              maxHeight="none"
              columns={[
                { key: 'f', header: 'Xususiyat', render: (r) => <span className="font-sans text-ink">{r.f.uz}</span> },
                { key: 'x', header: 'Dastlabki qiymat', render: (r) => formatFeature(r.f.key, client[r.f.key]), align: 'right' },
                { key: 'm', header: 'O‘rtacha (μ)', render: (r) => (zModel.scaler.method === 'zscore' ? zModel.scaler.mean[r.j].toFixed(3) : '-'), align: 'right' },
                { key: 's', header: 'Std (σ)', render: (r) => (zModel.scaler.method === 'zscore' ? zModel.scaler.std[r.j].toFixed(3) : '-'), align: 'right' },
                {
                  key: 'z',
                  header: 'Standartlashtirilgan (z)',
                  render: (r) =>
                    zModel.scaler.method === 'zscore' ? (
                      <span className="font-semibold text-cyan">{((client[r.f.key] - zModel.scaler.mean[r.j]) / zModel.scaler.std[r.j]).toFixed(3)}</span>
                    ) : (
                      '-'
                    ),
                  align: 'right',
                },
              ]}
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              title="Sinf ehtimoli (ovozlar ulushi)"
              tex={String.raw`P(c) = \frac{\text{c sinfga tegishli qo‘shnilar soni}}{K}`}
              meaning="K ta qo‘shnining qancha qismi shu sinfga tegishli. Bu klassifikatsiya ishonchliligining sodda o‘lchovi."
              symbols={[
                { sym: 'c', desc: 'sinf (0 yoki 1)' },
                { sym: 'K', desc: 'qo‘shnilar soni' },
              ]}
              when="Oddiy (majority) ovoz berishda. Natija — eng katta P(c) li sinf."
              example={<Tex>{String.raw`P(1) = \frac{${res.votes[1]}}{${res.neighbors.length}} = ${(res.votes[1] / res.neighbors.length).toFixed(3)}, \quad P(0) = \frac{${res.votes[0]}}{${res.neighbors.length}} = ${(res.votes[0] / res.neighbors.length).toFixed(3)}`}</Tex>}
            />
            <FormulaCard
              title="Weighted voting (masofaga asoslangan)"
              tex={String.raw`w_j = \frac{1}{d_j + \varepsilon}, \qquad P(c) = \frac{\sum_{j \in N_K,\, y_j = c} w_j}{\sum_{j \in N_K} w_j}`}
              meaning="Yaqinroq qo‘shnining ovozi og‘irroq. Uzoqdagi qo‘shni ham ovoz beradi, lekin kamroq ta’sir bilan."
              symbols={[
                { sym: 'w_j', desc: 'j-qo‘shnining og‘irligi' },
                { sym: 'd_j', desc: 'j-qo‘shnigacha masofa' },
                { sym: '\\varepsilon', desc: 'nolga bo‘lishning oldini oluvchi kichik son (10⁻⁶)' },
                { sym: 'N_K', desc: 'K ta eng yaqin qo‘shnilar to‘plami' },
              ]}
              when="Qo‘shnilar masofalari bir-biridan sezilarli farq qilganda, yoki juft K da ovozlar teng chiqqanda. Bu sahifada oddiy ovozda tenglik bo‘lsa, weighted ovoz hal qiladi."
              example={<Tex>{String.raw`W_0 = ${res.weightedVotes[0].toFixed(2)},\; W_1 = ${res.weightedVotes[1].toFixed(2)} \Rightarrow P_w(1) = ${(res.weightedVotes[1] / (res.weightedVotes[0] + res.weightedVotes[1])).toFixed(3)}`}</Tex>}
            />
          </div>
        </div>
      </Section>

      {/* 5. KETMA-KETLIK */}
      <Section id="ketma-ketlik" index={sectionIndex('ketma-ketlik')} title="Ishlash ketma-ketligi" subtitle="Har bir bosqichni bosing — izoh va joriy sozlamalardagi real hisob-kitob ko‘rsatiladi">
        <ProcessStepper
          steps={[
            { title: 'Datasetni yuklash', summary: `${TRAIN.y.length + TEST.y.length} ta mijoz yozuvi`, body: <><p>Seed = 42 bilan yaratilgan {TRAIN.y.length + TEST.y.length} ta sun’iy mijoz yozuvi xotiraga yuklanadi. Har bir yozuvda 5 ta xususiyat va 1 ta natija bor.</p><p>Stratified split: <strong>{TRAIN.y.length}</strong> ta training, <strong>{TEST.y.length}</strong> ta testing. Training’da sinf 1 ulushi {pct(TRAIN.y.filter(Boolean).length / TRAIN.y.length)}, testda {pct(TEST.y.filter(Boolean).length / TEST.y.length)}.</p></> },
            { title: 'X va y ni ajratish', summary: 'Features va target', body: <><p><strong>X</strong> — {TRAIN.y.length}×{cols.length} o‘lchamli matritsa: {featNames.map((f) => f.en).join(', ')}.</p><p><strong>y</strong> — {TRAIN.y.length} ta 0/1 qiymatli vektor (Payment Default).</p></> },
            { title: 'Ma’lumotlarni tayyorlash', summary: 'Tekshirish va tozalash', body: <><p>Barcha qiymatlar sonli, bo‘sh qiymatlar yo‘q. Yangi mijoz qiymatlari validatsiyadan o‘tadi (masalan, yosh 18–80, reyting 300–900).</p><p>KNN “lazy” algoritm: o‘qitish bosqichida faqat training nuqtalari va scaler parametrlari saqlanadi.</p></> },
            { title: 'Standartlashtirish', summary: scaleName, body: <><p>Scaler training to‘plamida fit qilinadi. Joriy usul: <strong>{scaleName}</strong>.</p><p>Yangi mijozning standartlashtirilgan vektori:</p><Tex block>{String.raw`x' = [${qs.map((v) => v.toFixed(3)).join(',\\; ')}]`}</Tex></> },
            { title: 'Yangi mijozni kiritish', summary: 'Sinfi noma’lum nuqta', body: <><p>Yangi mijoz: {featNames.map((f) => `${f.short} = ${formatFeature(f.key, client[f.key])}`).join(', ')}.</p><p>U aynan shu scaler bilan o‘zgartiriladi (qayta fit qilinmaydi).</p></> },
            { title: 'Masofani hisoblash', summary: `${TRAIN.y.length} ta masofa`, body: <><p>Yangi mijozdan har bir training mijozgacha {metric === 'euclidean' ? 'Euclidean' : 'Manhattan'} masofa hisoblanadi. Eng yaqin mijoz uchun:</p><Tex block className="text-xs">{distTex}</Tex><p>Eng uzoq mijozgacha masofa: {res.ranked[res.ranked.length - 1].distance.toFixed(3)}.</p></> },
            { title: `Eng yaqin K = ${k} tani tanlash`, summary: 'Masofa bo‘yicha saralash', body: <><p>Masofalar o‘sish tartibida saralanadi va birinchi {k} tasi olinadi:</p><ul>{res.neighbors.map((n) => <li key={n.index}>{n.rank}. {TRAIN.clients[n.index].id} — d = {n.distance.toFixed(3)}, sinf {n.label}</li>)}</ul></> },
            { title: 'Qo‘shnilar ovoz beradi', summary: `0 → ${res.votes[0]}, 1 → ${res.votes[1]}`, body: <><p>Sinf 0 ga: <strong className="text-emerald">{res.votes[0]}</strong> ta ovoz, sinf 1 ga: <strong className="text-rose-400">{res.votes[1]}</strong> ta ovoz.</p><Tex block>{String.raw`P(0) = \tfrac{${res.votes[0]}}{${k}} = ${(res.votes[0] / k).toFixed(2)}, \quad P(1) = \tfrac{${res.votes[1]}}{${k}} = ${(res.votes[1] / k).toFixed(2)}`}</Tex>{weighted && <p>Weighted rejim yoqilgan: W₀ = {res.weightedVotes[0].toFixed(2)}, W₁ = {res.weightedVotes[1].toFixed(2)}.</p>}</> },
            { title: 'Yakuniy klassifikatsiya', summary: `Sinf ${res.prediction}`, body: <><p>Ko‘pchilik ovozi bo‘yicha natija: <ClassPill label={res.prediction} /></p><p>Ishonchlilik (ulush): <strong>{pct(conf)}</strong>.{res.tie && !weighted && ' Ovozlar teng bo‘lgani uchun masofaga asoslangan og‘irliklar hal qildi.'}</p></> },
          ]}
        />
      </Section>

      {/* 6. LABORATORIYA */}
      <Section id="laboratoriya" index={sectionIndex('laboratoriya')} title="Interaktiv laboratoriya" subtitle="Parametrlarni o‘zgartiring — qo‘shnilar, masofalar, grafik va natija darhol qayta hisoblanadi">
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <Card className="min-w-0">
            <div className="mb-4">
              <PlayerControls player={player} />
            </div>
            <motion.div key={stepText} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-sm text-amber-100">
              {player.started ? stepText : `Yakuniy holat ko‘rsatilmoqda. Animatsiyani ko‘rish uchun “Boshlash”ni bosing.`}
            </motion.div>
            <KNNScatter points={points} query={{ x: client.creditScore, y: client.income }} neighbors={res.neighbors} revealed={revealed} showQuery={st >= 1} scanning={st === 2} />
            {fs === 'all' && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Diqqat: grafikda faqat 2 ta xususiyat (Credit Score va Income) ko‘rinadi, masofa esa barcha 5 xususiyat bo‘yicha hisoblanadi. Shuning uchun ba’zi
                qo‘shnilar grafikda uzoqroq ko‘rinishi mumkin — ular yosh, DTI yoki kechikishlar bo‘yicha o‘xshash. “Faqat 2 xususiyat” rejimida grafik va
                masofa to‘liq mos keladi.
              </p>
            )}
          </Card>
          <div className="space-y-5">
            <Card>
              <div className="space-y-5">
                <Slider label="K qiymati (qo‘shnilar soni)" value={k} min={1} max={25} onChange={setK} hint="Toq K tenglik ehtimolini kamaytiradi" />
                <Segmented<DistanceMetric> label="Masofa turi" value={metric} onChange={setMetric} options={[{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }]} />
                <Segmented<ScalingMethod> label="Standartlashtirish" value={scaling} onChange={setScaling} options={[{ value: 'zscore', label: 'Z-score' }, { value: 'minmax', label: 'Min-Max' }, { value: 'none', label: 'Yo‘q' }]} />
                <Segmented<FeatureSet> label="Masofadagi xususiyatlar" value={fs} onChange={setFs} options={[{ value: 'all', label: 'Barcha 5 ta' }, { value: '2d', label: 'Faqat 2 ta' }]} />
                <Toggle label="Weighted voting (1/d)" checked={weighted} onChange={setWeighted} hint="Yaqin qo‘shnilar ovozi og‘irroq" />
              </div>
            </Card>
            <Card>
              <ClientSliders value={client} onChange={setClient} />
            </Card>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <VoteCard label="Sinf 0 ovozlari" v={res.votes[0]} k={res.neighbors.length} color={CLASS_COLORS[0]} w={weighted ? res.weightedVotes[0] / (res.weightedVotes[0] + res.weightedVotes[1]) : undefined} />
          <VoteCard label="Sinf 1 ovozlari" v={res.votes[1]} k={res.neighbors.length} color={CLASS_COLORS[1]} w={weighted ? res.weightedVotes[1] / (res.weightedVotes[0] + res.weightedVotes[1]) : undefined} />
          <div className="glass flex flex-col justify-center rounded-2xl p-5" style={{ boxShadow: `0 0 40px -18px ${CLASS_COLORS[res.prediction]}` }}>
            <div className="text-xs uppercase tracking-wider text-muted">Bashorat</div>
            <div className="mt-2"><ClassPill label={res.prediction} size="lg" /></div>
            <div className="mt-2 text-sm text-muted">Ishonchlilik: <b className="text-ink">{pct(conf)}</b></div>
          </div>
        </div>
      </Section>

      {/* 7. GRAFIKLAR */}
      <Section id="grafiklar" index={sectionIndex('grafiklar')} title="Grafik va diagrammalar" subtitle="Masofalar jadvali va test to‘plamidagi model sifati">
        <div className="space-y-5">
          <Card>
            <CardTitle
              title="Yangi mijozdan training mijozlargacha masofalar"
              subtitle={`Masofa bo‘yicha saralangan · eng yaqin ${k} tasi ajratib ko‘rsatilgan · ${scaleName}, ${metric === 'euclidean' ? 'Euclidean' : 'Manhattan'}`}
              right={<button type="button" onClick={() => setShowAll((v) => !v)} className="chip hover:text-ink">{showAll ? 'Faqat birinchi 20 ta' : `Barcha ${res.ranked.length} tasini ko‘rsatish`}</button>}
            />
            <DataTable
              rows={showAll ? res.ranked : res.ranked.slice(0, Math.max(20, k))}
              rowKey={(r) => r.index}
              maxHeight={520}
              highlight={(r) => (r.rank <= k ? 'bg-cyan/[0.07]' : undefined)}
              columns={[
                { key: 'r', header: '#', render: (r) => <span className={r.rank <= k ? 'font-bold text-cyan' : 'text-muted'}>{r.rank}</span> },
                { key: 'id', header: 'Mijoz ID', render: (r) => <span className="text-cyan">{TRAIN.clients[r.index].id}</span> },
                { key: 'a', header: 'Yoshi', render: (r) => TRAIN.clients[r.index].age, align: 'right' },
                { key: 'i', header: 'Daromadi', render: (r) => TRAIN.clients[r.index].income.toFixed(1), align: 'right' },
                { key: 'c', header: 'Credit Score', render: (r) => TRAIN.clients[r.index].creditScore, align: 'right' },
                { key: 'd', header: 'DTI', render: (r) => TRAIN.clients[r.index].dti, align: 'right' },
                { key: 'l', header: 'Kechikishlar', render: (r) => TRAIN.clients[r.index].latePayments, align: 'right' },
                { key: 'dist', header: 'Masofa', render: (r) => <span className={r.rank <= k ? 'font-bold text-ink' : ''}>{r.distance.toFixed(3)}</span>, align: 'right' },
                { key: 's', header: 'Sinf', render: (r) => <ClassPill label={r.label} size="sm" /> },
              ]}
            />
          </Card>
          <EvaluationPanel train={evalRes.train} test={evalRes.test} color="#00D4FF" modelName={`KNN (K=${k})`} />
          <Callout tone="info">
            KNN’da training accuracy hisoblanganda har bir training nuqtaning o‘zi ham qo‘shnilar ichiga tushadi (masofa 0). Shuning uchun K=1 da training
            accuracy deyarli 100% bo‘ladi — bu overfitting’ning klassik ko‘rinishi.
          </Callout>
        </div>
      </Section>

      {/* 8. PARAMETRLAR */}
      <Section id="parametrlar" index={sectionIndex('parametrlar')} title="Parametrlar" subtitle="Har bir parametr natijaga qanday ta’sir qiladi">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardTitle title="K qiymati va model aniqligi" subtitle={`K = 1…25 uchun training va testing accuracy (${scaleName}, ${metric})`} />
            <ParamSweepChart data={sweep} xLabel="K" current={k} />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Kichik K — model shovqinga sezgir (overfitting): training aniqligi yuqori, test aniqligi beqaror. Katta K — qaror chegarasi silliqlashadi, lekin
              juda katta K da model ko‘pchilik sinfga “og‘ib” ketadi (underfitting).
            </p>
          </Card>
          <Card>
            <CardTitle title="Turli K qiymatlarida yangi mijoz" subtitle="Bir xil mijoz, bir xil masofalar — faqat K o‘zgaradi" />
            <DataTable
              rows={kCompare}
              rowKey={(r) => r.k}
              maxHeight="none"
              highlight={(r) => (r.k === k ? 'bg-cyan/[0.07]' : undefined)}
              columns={[
                { key: 'k', header: 'K', render: (r) => <span className="font-bold text-cyan">{r.k}</span> },
                { key: 'v0', header: '0 ovoz', render: (r) => <span className="text-emerald">{r.votes[0]}</span>, align: 'right' },
                { key: 'v1', header: '1 ovoz', render: (r) => <span className="text-rose-400">{r.votes[1]}</span>, align: 'right' },
                { key: 'p', header: 'Bashorat', render: (r) => <ClassPill label={r.pred} size="sm" /> },
                { key: 'c', header: 'Ulush', render: (r) => pct(r.p, 0), align: 'right' },
              ]}
            />
          </Card>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Concept term="K" en="n_neighbors">Ovoz beruvchi qo‘shnilar soni. Model murakkabligini boshqaradi: K kichik — murakkab, K katta — sodda.</Concept>
          <Concept term="Masofa turi" en="metric">Euclidean katta farqlarni kuchliroq jazolaydi; Manhattan outlierlarga chidamliroq.</Concept>
          <Concept term="Standartlashtirish" en="scaling">“Yo‘q” tanlansa, masofani deyarli faqat Credit Score belgilaydi — test natijasini solishtiring.</Concept>
          <Concept term="Weighted voting" en="weights='distance'">Yaqin qo‘shnilarga katta og‘irlik beradi; juft K dagi tenglikni hal qiladi.</Concept>
        </div>
      </Section>

      {/* 9. NATIJA */}
      <Section id="natija" index={sectionIndex('natija')} title="Yakuniy natija" subtitle="Yangi mijoz bo‘yicha xulosa">
        <Card glow={res.prediction === 1 ? 'none' : 'green'}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted">Bashorat qilingan sinf</div>
                <div className="mt-2"><ClassPill label={res.prediction} size="lg" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="K" value={k} />
                <Stat label="0 ovoz" value={res.votes[0]} color="#10B981" />
                <Stat label="1 ovoz" value={res.votes[1]} color="#F43F5E" />
              </div>
              <Stat label="Ishonchlilik (qo‘shnilar ulushi)" value={pct(conf)} hint={weighted ? 'masofaga asoslangan og‘irliklar bilan' : `${res.votes[res.prediction]} / ${k}`} color="#00D4FF" />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-ink">Eng yaqin qo‘shnilar</div>
              <div className="flex flex-wrap gap-2">
                {res.neighbors.map((n) => (
                  <span key={n.index} className="rounded-lg border px-2.5 py-1 font-mono text-xs" style={{ borderColor: `${CLASS_COLORS[n.label]}50`, color: CLASS_COLORS[n.label] }}>
                    {TRAIN.clients[n.index].id} · {n.distance.toFixed(2)}
                  </span>
                ))}
              </div>
              <div className="prose-uz mt-5">
                <p>
                  <strong>Sodda tilda:</strong> bankning avvalgi mijozlari ichida yangi mijozga eng o‘xshash {k} kishi topildi.
                  Ulardan <strong className="text-emerald">{res.votes[0]}</strong> tasi kreditni muammosiz to‘lagan,{' '}
                  <strong className="text-rose-400">{res.votes[1]}</strong> tasi esa to‘lovda muammoga uchragan.{' '}
                  {res.prediction === 1
                    ? 'Ko‘pchilik muammoga uchragani uchun yangi mijoz “yuqori xavf” guruhiga kiritildi — bank qo‘shimcha kafolat yoki kichikroq kredit summasini talab qilishi mumkin.'
                    : 'Ko‘pchilik kreditni muammosiz qaytargani uchun yangi mijoz “past xavf” guruhiga kiritildi.'}
                </p>
                <p>
                  Ishonchlilik {pct(conf)} — {conf >= 0.8 ? 'qo‘shnilar deyarli bir ovozdan qaror qildi.' : conf >= 0.6 ? 'qo‘shnilar ko‘pchilik bilan qaror qildi, lekin bir ovozli emas.' : 'ovozlar deyarli teng — bu “chegaraviy” mijoz, qo‘lda tekshirish tavsiya etiladi.'} K ni o‘zgartirib, natija qanchalik barqaror ekanini tekshiring.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* 10. XULOSA */}
      <Section id="xulosa" index={sectionIndex('xulosa')} title="Xulosa" subtitle="Afzalliklar, kamchiliklar va bankdagi qo‘llanilishi">
        <ProsCons
          pros={[
            'Juda sodda va intuitiv: “o‘xshash mijozlar o‘xshash xulq ko‘rsatadi”.',
            'O‘qitish bosqichi yo‘q — yangi ma’lumot qo‘shilsa, darhol hisobga olinadi.',
            'Murakkab, chiziqsiz qaror chegaralarini ham ifodalay oladi.',
            'Qarorni tushuntirish oson: “mana shu 5 ta mijozga o‘xshaysiz”.',
          ]}
          cons={[
            'Bashorat sekin: har safar barcha mijozlargacha masofa hisoblanadi (millionlab mijozda qimmat).',
            'Scaling’ga juda sezgir — standartlashtirishsiz natija buziladi.',
            'Ko‘p o‘lchovli fazoda masofalar ma’nosini yo‘qotadi (curse of dimensionality).',
            'Ahamiyatsiz xususiyatlar ham masofaga teng ta’sir qiladi; K ni to‘g‘ri tanlash kerak.',
          ]}
        />
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold">Bankda qayerda ishlatiladi?</h3>
          <UseCases
            items={[
              { icon: <CreditCard size={18} />, title: 'Kredit skoring', desc: 'Yangi arizachini o‘xshash tarixga ega mijozlar bilan solishtirish.' },
              { icon: <AlertOctagon size={18} />, title: 'Firibgarlikni aniqlash', desc: 'Tranzaksiya avvalgi firibgarlik holatlariga o‘xshashmi?' },
              { icon: <Users size={18} />, title: 'Tavsiya tizimlari', desc: 'O‘xshash mijozlar foydalangan bank mahsulotlarini taklif qilish.' },
              { icon: <Fingerprint size={18} />, title: 'Anomaliyalarni topish', desc: 'Eng yaqin qo‘shnilardan juda uzoq bo‘lgan noodatiy faollik.' },
              { icon: <Landmark size={18} />, title: 'Mijoz ketishini bashorat qilish', desc: 'Churn: ketib qolgan mijozlarga o‘xshash faol mijozlarni aniqlash.' },
              { icon: <BadgeCheck size={18} />, title: 'KYC tekshiruvi', desc: 'Hujjat yoki profil ma’lumotlarini ma’lum namunalar bilan solishtirish.' },
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/laboratoriya" className="chip hover:text-ink"><Target size={12} /> Prediction Lab’da sinab ko‘rish →</Link>
          <Link to="/taqqoslash" className="chip hover:text-ink">Boshqa algoritmlar bilan taqqoslash →</Link>
        </div>
      </Section>
    </AlgorithmShell>
  );
}

function ShareBar({ v, color }: { v: number; color: string }) {
  return (
    <div className="ml-auto flex w-36 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color }} />
      </div>
      <span className="w-12 text-right">{(v * 100).toFixed(1)}%</span>
    </div>
  );
}

function VoteCard({ label, v, k, color, w }: { label: string; v: number; k: number; color: string; w?: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span className="font-mono">{v} / {k}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>
        {pct(v / k, 0)}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${(v / k) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
      </div>
      {w !== undefined && <div className="mt-2 text-xs text-muted">Weighted ulush: {pct(w)}</div>}
    </div>
  );
}


