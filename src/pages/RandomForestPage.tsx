import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Layers, Network, PiggyBank, Shuffle, Target, Trees, TrendingUp, Vote } from 'lucide-react';
import type { ClientFeatures, Label } from '../types';
import { FEATURES, NEW_CLIENT, TEST, TRAIN, toVector, formatFeature } from '../data/bankDataset';
import { CLASS_COLORS } from '../data/algorithms';
import { bootstrapSample, forestImportance, predictForest, resolveMaxFeatures, trainRandomForest, type Forest, type MaxFeaturesOption } from '../algorithms/randomForest';
import { buildTree, predictTree, predictTreeMany, treeStats } from '../algorithms/decisionTree';
import { overfitStatus } from '../algorithms/evaluation';
import { evaluate } from '../utils/metrics';
import { useStepPlayer } from '../hooks/useStepPlayer';
import AlgorithmShell, { sectionIndex } from '../components/algorithm/AlgorithmShell';
import ClientSliders from '../components/algorithm/ClientForm';
import { EvaluationPanel } from '../components/algorithm/Evaluation';
import ForestFlow from '../components/diagrams/ForestFlow';
import MiniTree from '../components/diagrams/MiniTree';
import TreeDiagram from '../components/diagrams/TreeDiagram';
import { AlgoMiniVisual } from '../components/diagrams/Visuals';
import { FeatureImportanceChart, ParamSweepChart } from '../components/charts/Charts';
import DataTable from '../components/common/DataTable';
import FormulaCard from '../components/common/FormulaCard';
import PlayerControls from '../components/common/PlayerControls';
import ProcessStepper from '../components/common/ProcessStepper';
import Tex from '../components/common/Tex';
import { ClassPill, Concept, ProsCons, Section, SyntheticNotice, UseCases, pct } from '../components/common/misc';
import { Callout, Card, CardTitle, Stat } from '../components/ui/Card';
import { Segmented, Slider } from '../components/ui/Controls';

type MF = 'sqrt' | 'log2' | 'all' | '3' | '4';
const toMF = (v: MF): MaxFeaturesOption => (v === '3' || v === '4' ? Number(v) : v);
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
/** Har bir bargda kamida 3 ta yozuv (OOB accuracy bo‘yicha tanlangan, test to‘plamiga qaramasdan). */
const RF_MIN_LEAF = 3;

export default function RandomForestPage() {
  const [nTrees, setNTrees] = useState(25);
  const [maxDepth, setMaxDepth] = useState(6);
  const [minSplit, setMinSplit] = useState(12);
  const [mf, setMf] = useState<MF>('sqrt');
  const [client, setClient] = useState<ClientFeatures>({ ...NEW_CLIENT });
  const [focus, setFocus] = useState(0);
  const [bsSeed, setBsSeed] = useState(1);
  const dN = useDeferredValue(nTrees);
  const dClient = useDeferredValue(client);

  const params = { nEstimators: dN, maxDepth, minSamplesSplit: minSplit, minSamplesLeaf: RF_MIN_LEAF, maxFeatures: toMF(mf), criterion: 'gini' as const, seed: 42 };
  const forest: Forest = useMemo(() => trainRandomForest(TRAIN.X, TRAIN.y, params), [dN, maxDepth, minSplit, mf]); // eslint-disable-line react-hooks/exhaustive-deps
  const x = toVector(dClient);
  const pred = useMemo(() => predictForest(forest, x), [forest, x.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const mfNum = resolveMaxFeatures(toMF(mf), 5);

  const evalRes = useMemo(() => {
    const p = (X: number[][]) => X.map((r) => predictForest(forest, r).prediction);
    return { train: evaluate(TRAIN.y, p(TRAIN.X)), test: evaluate(TEST.y, p(TEST.X)) };
  }, [forest]);
  const single = useMemo(() => {
    const t = buildTree(TRAIN.X, TRAIN.y, { maxDepth, minSamplesSplit: minSplit, minSamplesLeaf: RF_MIN_LEAF, criterion: 'gini' });
    return { train: evaluate(TRAIN.y, predictTreeMany(t, TRAIN.X)), test: evaluate(TEST.y, predictTreeMany(t, TEST.X)), stats: treeStats(t) };
  }, [maxDepth, minSplit]);

  // daraxtlar soni bo‘yicha sweep: 100 ta daraxtli o‘rmon bir marta, keyin birinchi n tasi (daraxtlar seed bo‘yicha deterministik)
  const sweep = useMemo(() => {
    const big = trainRandomForest(TRAIN.X, TRAIN.y, { ...params, nEstimators: 100 });
    const run = (r: number[]) => big.trees.map((t) => predictTree(t.root, r));
    const predsTr = TRAIN.X.map(run);
    const predsTe = TEST.X.map(run);
    // predictForest bilan bir xil qoida: ko‘pchilik ovozi, tenglikda barglardagi o‘rtacha P(1)
    const vote = (ps: { prediction: Label; probability: number }[], n: number): Label => {
      let s = 0;
      let p = 0;
      for (let i = 0; i < n; i++) {
        s += ps[i].prediction;
        p += ps[i].probability;
      }
      if (s * 2 === n) return p / n >= 0.5 ? 1 : 0;
      return s * 2 > n ? 1 : 0;
    };
    return [1, 3, 5, 10, 15, 20, 30, 40, 50, 75, 100].map((n) => ({
      x: n,
      train: evaluate(TRAIN.y, predsTr.map((p) => vote(p, n))).accuracy,
      test: evaluate(TEST.y, predsTe.map((p) => vote(p, n))).accuracy,
    }));
  }, [maxDepth, minSplit, mf]); // eslint-disable-line react-hooks/exhaustive-deps

  const importance = useMemo(() => forestImportance(forest, 5).map((v, i) => ({ name: FEATURES[i].short, v })).sort((a, b) => b.v - a.v), [forest]);

  // Animatsiya: daraxtlar ovozini guruhlab ochish (ko‘pi bilan ~20 qadam)
  const batch = Math.max(1, Math.ceil(forest.trees.length / 20));
  const nBatches = Math.ceil(forest.trees.length / batch);
  const total = nBatches + 2;
  const player = useStepPlayer(total, { resetKey: `${dN}|${maxDepth}|${minSplit}|${mf}|${x.join(',')}` });
  const st = player.started ? player.step : total - 1;
  const revealedTrees = Math.min(forest.trees.length, Math.max(0, st) * batch);
  const final = st >= total - 1;
  const partial: [number, number] = [0, 0];
  pred.treeVotes.slice(0, revealedTrees).forEach((v) => partial[v.prediction]++);
  const flowN = Math.min(7, forest.trees.length);

  const ft = forest.trees[Math.min(focus, forest.trees.length - 1)];
  const fv = pred.treeVotes[Math.min(focus, forest.trees.length - 1)];

  // Bootstrap kichik misoli (A..E)
  const bsDemo = useMemo(() => [0, 1, 2].map((t) => bootstrapSample(5, bsSeed * 31 + t * 7)), [bsSeed]);
  const t1 = forest.trees[0];
  const freq = useMemo(() => {
    const c = new Map<number, number>();
    t1.bootstrap.forEach((i) => c.set(i, (c.get(i) ?? 0) + 1));
    const bins = [0, 0, 0, 0];
    for (let i = 0; i < TRAIN.y.length; i++) {
      const v = c.get(i) ?? 0;
      bins[Math.min(3, v)]++;
    }
    return bins;
  }, [t1]);
  const n = TRAIN.y.length;
  const expectedUnique = 1 - (1 - 1 / n) ** n;
  const ofRF = overfitStatus(evalRes.train, evalRes.test);
  const ofDT = overfitStatus(single.train, single.test);

  return (
    <AlgorithmShell
      algo="random-forest"
      definition={
        <>
          <b className="text-ink">Random Forest</b> — ko‘plab mustaqil qaror daraxtlarini tasodifiylik (bootstrap + tasodifiy xususiyatlar) yordamida qurib, ularning
          ovozlarini birlashtiradigan <b className="text-emerald">Ensemble Learning</b> algoritmi. “Bitta mutaxassis xato qilishi mumkin, ko‘pchilik esa kamroq.”
        </>
      }
      problem={
        <>
          Bank yangi kredit oluvchining to‘lov intizomini baholashi kerak. Bitta Decision Tree o‘rniga {nTrees} ta daraxt quriladi; har biri mijoz haqida o‘z
          qarorini beradi va yakuniy natija ko‘pchilik ovozi bilan aniqlanadi.
        </>
      }
      learningSteps={['Ensemble', 'Bootstrap', 'Feature randomness', 'Daraxtlar', 'Majority voting', 'OOB va baholash']}
      visual={<div className="h-64 w-full sm:h-72"><AlgoMiniVisual id="random-forest" /></div>}
    >
      {/* 1 */}
      <Section id="haqida" index={sectionIndex('haqida')} title="Random Forest nima?" subtitle="Ensemble Learning — ko‘pchilikning donoligi">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Card>
            <div className="prose-uz">
              <p>
                <strong>Ensemble Learning</strong> — bir nechta modelni birlashtirib, har biridan kuchliroq model hosil qilish. Kredit qo‘mitasini tasavvur qiling: bitta inspektor
                charchagan yoki biror omilga ortiqcha e’tibor bergan bo‘lishi mumkin, lekin 25 nafar mustaqil mutaxassisning ko‘pchilik ovozi ancha ishonchli.
              </p>
              <p>
                <strong>Nega bir nechta model?</strong> Bitta chuqur Decision Tree juda beqaror: training ma’lumotidagi kichik o‘zgarish butunlay boshqa daraxtga olib keladi
                (yuqori dispersiya). Agar daraxtlar <em>bir-biridan farqli</em> xato qilsa, ovoz berishda xatolar bir-birini yo‘qqa chiqaradi.
              </p>
              <p>
                <strong>Decision Tree bilan bog‘liqligi:</strong> o‘rmondagi har bir daraxt — oddiy CART daraxti (Gini bilan). Farq faqat ularga beriladigan ma’lumot va
                xususiyatlarda.
              </p>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Concept term="Bootstrap Sampling" en="qayta tanlash">Har bir daraxt uchun training to‘plamidan <b>replacement bilan</b> N marta tasodifiy mijoz olinadi — ba’zilari takrorlanadi, ba’zilari tushmaydi.</Concept>
            <Concept term="Bagging" en="Bootstrap AGGregatING">Bootstrap namunalarda alohida modellar qurish va natijalarni birlashtirish. Dispersiyani kamaytiradi.</Concept>
            <Concept term="Random Feature Selection" en="max_features">Har bir tugunda barcha 5 xususiyat emas, tasodifiy {mfNum} tasi ko‘rib chiqiladi — daraxtlar bir-biriga o‘xshab qolmaydi.</Concept>
            <Concept term="Majority Voting" en="ko‘pchilik ovozi">Har bir daraxt 0 yoki 1 deb ovoz beradi; ko‘p ovoz olgan sinf — yakuniy qaror.</Concept>
            <Concept term="Out-of-Bag (OOB)" en="sumkadan tashqari">Daraxtning bootstrap namunasiga tushmagan mijozlar (~36.8%). Ular shu daraxt uchun “bepul test to‘plami”.</Concept>
            <Concept term="Bank misoli" en="kredit qo‘mitasi">Har bir “inspektor” mijozlarning turli qismini ko‘rgan va turli savollar beradi — yakunda ovoz beriladi.</Concept>
          </div>
        </div>
      </Section>

      {/* 2 */}
      <Section id="masala" index={sectionIndex('masala')} title="Amaliy masala" subtitle="Yangi kredit oluvchining to‘lov intizomini baholash">
        <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardTitle icon={<Trees size={18} />} title="Yangi mijoz" />
            <ul className="space-y-1.5 text-sm">
              {FEATURES.map((f) => (
                <li key={f.key} className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-muted">{f.uz}</span>
                  <span className="font-mono text-ink">{formatFeature(f.key, NEW_CLIENT[f.key])} {f.unit}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="prose-uz">
              <p>Masala KNN va Decision Tree bilan bir xil — bu algoritmlarni adolatli taqqoslash imkonini beradi. Farq yondashuvda:</p>
              <ul>
                <li>{nTrees} ta daraxt quriladi, har biri {n} ta mijozdan bootstrap namuna oladi;</li>
                <li>har bir tugunda 5 xususiyatdan tasodifiy {mfNum} tasi ko‘rib chiqiladi;</li>
                <li>yangi mijoz har bir daraxtdan o‘tadi va {nTrees} ta ovoz yig‘iladi;</li>
                <li>yakuniy qaror — ko‘pchilik ovozi, “ishonch” — ovozlar ulushi.</li>
              </ul>
            </div>
          </Card>
        </div>
      </Section>

      {/* 3 */}
      <Section id="dataset" index={sectionIndex('dataset')} title="Dataset" subtitle="Bitta training to‘plamidan ko‘plab bootstrap namunalar">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Training (N)" value={n} />
            <Stat label="Testing" value={TEST.y.length} color="#F59E0B" />
            <Stat label="Tree 1: noyob yozuvlar" value={t1.uniqueCount} hint={`${pct(t1.uniqueCount / n)} (nazariy ≈ ${pct(expectedUnique)})`} color="#10B981" />
            <Stat label="Tree 1: OOB yozuvlar" value={t1.oob.length} hint="namunaga tushmagan" color="#8B5CF6" />
          </div>
          <Card>
            <CardTitle title="Tree 1 bootstrap namunasida yozuvlar necha marta takrorlandi?" subtitle={`${n} ta tanlov replacement bilan`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['0 marta (OOB)', '1 marta', '2 marta', '3+ marta'].map((l, i) => (
                <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="text-xs text-muted">{l}</div>
                  <div className="mt-1 font-display text-2xl font-bold text-ink">{freq[i]}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full bg-emerald" initial={{ width: 0 }} whileInView={{ width: `${(freq[i] / n) * 100}%` }} viewport={{ once: true }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <SyntheticNotice compact />
        </div>
      </Section>

      {/* 4 */}
      <Section id="matematika" index={sectionIndex('matematika')} title="Matematik asoslar" subtitle="Bootstrap, feature randomness va majority voting formulalari">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              accent="#10B981"
              title="Bootstrap Sampling (replacement bilan)"
              tex={String.raw`D_t = \{x_{j_1}, x_{j_2}, \dots, x_{j_N}\}, \quad j_k \sim \text{Uniform}\{1, \dots, N\}`}
              meaning="t-daraxt uchun namuna: N ta indeks bir-biridan mustaqil, teng ehtimol bilan tanlanadi. Bir yozuv bir necha marta tushishi mumkin."
              symbols={[
                { sym: 'D_t', desc: 't-daraxtning bootstrap namunasi' },
                { sym: 'N', desc: `training yozuvlar soni (${n})` },
                { sym: 'j_k', desc: 'k-tanlovdagi tasodifiy indeks' },
              ]}
              when="Har bir daraxt uchun alohida, o‘z seed’i bilan. Daraxtlar turli ma’lumot ko‘rgani uchun turlicha xato qiladi."
              example={<Tex>{String.raw`P(\text{yozuv tushmaydi}) = \left(1 - \tfrac{1}{${n}}\right)^{${n}} = ${(1 - expectedUnique).toFixed(3)} \approx e^{-1}`}</Tex>}
            />
            <FormulaCard
              accent="#3B82F6"
              title="Random Feature Selection"
              tex={String.raw`m = \lfloor \sqrt{p} \rceil \;(\text{sqrt}), \qquad m = \lfloor \log_2 p \rceil \;(\text{log2})`}
              meaning="Har bir tugunda p ta xususiyatdan tasodifiy m tasi tanlanadi va eng yaxshi split faqat ular orasidan qidiriladi."
              symbols={[
                { sym: 'p', desc: 'jami xususiyatlar soni (5)' },
                { sym: 'm', desc: 'tugunda ko‘riladigan xususiyatlar (max_features)' },
              ]}
              when="Kuchli bitta xususiyat (masalan, Credit Score) barcha daraxtlarda root bo‘lib qolmasligi uchun — daraxtlar korrelyatsiyasini kamaytiradi."
              example={<Tex>{String.raw`p = 5 \Rightarrow m_{\text{sqrt}} = \text{round}(\sqrt{5}) = 2,\; m_{\text{log2}} = \text{round}(2.32) = 2;\; \text{joriy } m = ${mfNum}`}</Tex>}
            />
            <FormulaCard
              accent="#F59E0B"
              title="Majority Voting"
              tex={String.raw`\hat{y} = \operatorname{mode}\big(h_1(x), h_2(x), \dots, h_T(x)\big)`}
              meaning="Yakuniy bashorat — daraxtlar ovozlari ichida eng ko‘p uchragan sinf."
              symbols={[
                { sym: 'h_t(x)', desc: 't-daraxtning x mijoz uchun bashorati (0/1)' },
                { sym: 'T', desc: 'daraxtlar soni (n_estimators)' },
                { sym: '\\hat{y}', desc: 'yakuniy bashorat' },
              ]}
              when="Klassifikatsiyada (regressiyada o‘rtacha olinadi). Juft T da ovozlar teng bo‘lsa, bu yerda barglardagi o‘rtacha P(1) hal qiladi."
              example={<Tex>{String.raw`\#\{h_t = 0\} = ${pred.votes[0]},\; \#\{h_t = 1\} = ${pred.votes[1]} \Rightarrow \hat{y} = ${pred.prediction}`}</Tex>}
            />
            <FormulaCard
              accent="#8B5CF6"
              title="Ovozlar ulushi (vote share)"
              tex={String.raw`\text{share}(c) = \frac{1}{T}\sum_{t=1}^{T} \mathbb{1}\left[h_t(x) = c\right]`}
              meaning="c sinfga ovoz bergan daraxtlar ulushi. Bu modelning “ishonch” ko‘rsatkichi, LEKIN kalibrlangan ehtimol emas."
              symbols={[
                { sym: '\\mathbb{1}[\\cdot]', desc: 'shart bajarilsa 1, aks holda 0' },
                { sym: 'c', desc: 'sinf (0 yoki 1)' },
              ]}
              when="Natijani tushuntirish uchun. Haqiqiy defolt ehtimolini olish uchun qo‘shimcha kalibrlash (Platt, isotonic) kerak bo‘ladi."
              example={<Tex>{String.raw`\text{share}(1) = \tfrac{${pred.votes[1]}}{${forest.trees.length}} = ${pred.share[1].toFixed(3)}`}</Tex>}
            />
          </div>

          <Card>
            <CardTitle
              icon={<Shuffle size={18} />}
              title="Bootstrap: kichik misol"
              subtitle="Dastlabki dataset: A, B, C, D, E. Har bir daraxt uchun 5 marta replacement bilan tanlaymiz"
              right={<button type="button" onClick={() => setBsSeed((s) => s + 1)} className="chip hover:text-ink"><Shuffle size={12} /> Qayta tanlash</button>}
            />
            <div className="mb-4 flex gap-2">
              {LETTERS.map((l) => (
                <span key={l} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono font-bold">{l}</span>
              ))}
            </div>
            <div className="space-y-3">
              {bsDemo.map((s, t) => {
                const missing = LETTERS.filter((_, i) => !s.includes(i));
                return (
                  <div key={`${bsSeed}-${t}`} className="flex flex-wrap items-center gap-2">
                    <span className="w-20 text-sm text-muted">Tree {t + 1}:</span>
                    {s.map((i, k) => {
                      const dup = s.indexOf(i) !== k;
                      return (
                        <motion.span
                          key={k}
                          initial={{ opacity: 0, y: -14, scale: 0.6 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: t * 0.4 + k * 0.12 }}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono font-bold ${dup ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-emerald/50 bg-emerald/10 text-emerald'}`}
                        >
                          {LETTERS[i]}
                        </motion.span>
                      );
                    })}
                    <span className="ml-2 text-xs text-muted">OOB: {missing.length ? missing.join(', ') : '—'}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">Sariq — takroriy tanlangan yozuv. OOB — bu daraxt ko‘rmagan yozuvlar; ular OOB baholashda ishlatiladi.</p>
          </Card>
        </div>
      </Section>

      {/* 5 */}
      <Section id="ketma-ketlik" index={sectionIndex('ketma-ketlik')} title="Ishlash ketma-ketligi" subtitle="10 bosqich — joriy o‘rmon bo‘yicha real qiymatlar">
        <ProcessStepper
          accent="#10B981"
          steps={[
            { title: 'Datasetni olish', summary: `${n} ta training mijoz`, body: <p>Training to‘plami {n} ta yozuv. Test to‘plami ({TEST.y.length} ta) o‘rmonni o‘qitishda ishlatilmaydi.</p> },
            { title: 'Daraxtlar sonini belgilash', summary: `T = ${forest.trees.length}`, body: <p>n_estimators = {forest.trees.length}. Har bir daraxt o‘z seed’iga ega (seed = 42 asosida), shuning uchun natijalar takrorlanuvchan.</p> },
            { title: 'Bootstrap namunalar', summary: `har biri ${n} ta tanlov`, body: <ul>{forest.trees.slice(0, 5).map((t) => <li key={t.id}>Tree {t.id}: {t.uniqueCount} ta noyob yozuv, {t.oob.length} ta OOB</li>)}</ul> },
            { title: 'Har bir namunada daraxt', summary: `max_depth = ${maxDepth}`, body: <p>Har bir bootstrap namunada CART daraxti quriladi: max_depth = {maxDepth}, min_samples_split = {minSplit}, min_samples_leaf = {RF_MIN_LEAF}, Gini mezoni.</p> },
            { title: 'Tasodifiy xususiyatlar', summary: `m = ${mfNum} / 5`, body: <><p>Har bir tugunda 5 xususiyatdan {mfNum} tasi tasodifiy tanlanadi. Root tugunlarda ko‘rilgan xususiyatlar:</p><ul>{forest.trees.slice(0, 5).map((t) => <li key={t.id}>Tree {t.id}: {t.root.featuresConsidered.map((f) => FEATURES[f].short).join(', ')}</li>)}</ul></> },
            { title: 'Daraxtlarni o‘qitish', summary: `${forest.trees.length} ta daraxt tayyor`, body: <p>Barcha daraxtlar o‘qitildi. O‘rtacha tugunlar soni: {(forest.trees.reduce((a, t) => a + treeStats(t.root).nodes, 0) / forest.trees.length).toFixed(1)}. OOB accuracy: {pct(forest.oobAccuracy)} ({forest.oobEvaluated} ta yozuv bo‘yicha).</p> },
            { title: 'Yangi mijozni har bir daraxtga berish', summary: 'T ta mustaqil yo‘l', body: <p>Yangi mijoz vektori [{x.join(', ')}] har bir daraxtning ildizidan bargigacha o‘tadi.</p> },
            { title: 'Har bir daraxt bashorati', summary: `0: ${pred.votes[0]}, 1: ${pred.votes[1]}`, body: <ul>{pred.treeVotes.slice(0, 8).map((v) => <li key={v.treeId}>Tree {v.treeId} → {v.prediction} (barg P(1) = {v.probability.toFixed(2)})</li>)}{pred.treeVotes.length > 8 && <li>… va yana {pred.treeVotes.length - 8} ta daraxt</li>}</ul> },
            { title: 'Majority Voting', summary: `sinf ${pred.prediction}`, body: <Tex block>{String.raw`\operatorname{mode}(${pred.treeVotes.slice(0, 10).map((v) => v.prediction).join(', ')}${pred.treeVotes.length > 10 ? ', \\dots' : ''}) = ${pred.prediction}`}</Tex> },
            { title: 'Yakuniy xulosa', summary: pct(pred.share[pred.prediction]), body: <p>{forest.trees.length} ta daraxtdan {pred.votes[pred.prediction]} tasi sinf {pred.prediction} ga ovoz berdi ({pct(pred.share[pred.prediction])}). Natija: <ClassPill label={pred.prediction} size="sm" /></p> },
          ]}
        />
      </Section>

      {/* 6 */}
      <Section id="laboratoriya" index={sectionIndex('laboratoriya')} title="Interaktiv laboratoriya" subtitle="Daraxtlar ketma-ket ovoz beradi — natijalar haqiqiy o‘qitilgan modellardan">
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <Card>
              <div className="mb-4"><PlayerControls player={player} /></div>
              <div className="mb-3 rounded-xl border border-emerald/25 bg-emerald/[0.06] px-3 py-2 text-sm text-emerald-100">
                {!player.started
                  ? 'Yakuniy holat ko‘rsatilmoqda. Daraxtlar ovozini ketma-ket ko‘rish uchun “Boshlash”ni bosing.'
                  : st === 0
                    ? `${forest.trees.length} ta daraxt tayyor. Yangi mijoz har biriga yuboriladi…`
                    : final
                      ? `Majority Voting: 0 → ${pred.votes[0]}, 1 → ${pred.votes[1]}. Yakuniy qaror: sinf ${pred.prediction}.`
                      : `${revealedTrees} ta daraxt ovoz berdi: 0 → ${partial[0]}, 1 → ${partial[1]}`}
              </div>
              <ForestFlow votes={pred.treeVotes.slice(0, flowN).map((v) => v.prediction)} revealed={Math.min(flowN, revealedTrees)} final={final} totalVotes={pred.votes} prediction={pred.prediction} />
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-8">
                {pred.treeVotes.map((v, i) => {
                  const on = i < revealedTrees;
                  const c = CLASS_COLORS[v.prediction];
                  return (
                    <motion.button
                      type="button"
                      key={v.treeId}
                      onClick={() => setFocus(i)}
                      animate={{ opacity: on ? 1 : 0.35, scale: on ? 1 : 0.96 }}
                      className={`rounded-xl border p-1.5 text-left transition ${focus === i ? 'ring-2 ring-cyan' : ''}`}
                      style={{ borderColor: on ? `${c}55` : 'rgba(148,163,184,0.12)', background: on ? `${c}0f` : 'transparent' }}
                    >
                      <div className="flex items-center justify-between px-0.5 text-[10.5px]">
                        <span className="text-muted">T{v.treeId}</span>
                        <span className="font-bold" style={{ color: on ? c : '#64748B' }}>{on ? v.prediction : '?'}</span>
                      </div>
                      <MiniTree root={forest.trees[i].root} pathIds={on ? new Set([...v.path.map((p) => p.nodeId), v.leafId]) : undefined} height={40} />
                    </motion.button>
                  );
                })}
              </div>
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              <VoteTally label="Sinf 0 ovozlari" v={final || !player.started ? pred.votes[0] : partial[0]} t={forest.trees.length} color={CLASS_COLORS[0]} />
              <VoteTally label="Sinf 1 ovozlari" v={final || !player.started ? pred.votes[1] : partial[1]} t={forest.trees.length} color={CLASS_COLORS[1]} />
              <div className="glass flex flex-col justify-center rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Yakuniy qaror</div>
                <div className="mt-2">{final || !player.started ? <ClassPill label={pred.prediction} size="lg" /> : <span className="text-muted">ovoz berish davom etmoqda…</span>}</div>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <Card>
              <div className="space-y-5">
                <Slider label="Number of Estimators (daraxtlar)" value={nTrees} min={5} max={100} onChange={setNTrees} />
                <Slider label="Max Depth" value={maxDepth} min={1} max={10} onChange={setMaxDepth} />
                <Slider label="Min Samples Split" value={minSplit} min={2} max={30} onChange={setMinSplit} />
                <Segmented<MF> label="Max Features" value={mf} onChange={setMf} options={[{ value: 'sqrt', label: 'sqrt' }, { value: 'log2', label: 'log2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: 'all', label: 'all' }]} hint={`Har bir tugunda ${mfNum} ta xususiyat. “all” = oddiy bagging.`} />
              </div>
            </Card>
            <Card>
              <ClientSliders value={client} onChange={setClient} />
            </Card>
          </div>
        </div>
        <Card className="mt-5">
          <CardTitle
            title={`Tree ${ft.id} — batafsil ko‘rinish`}
            subtitle={`Bootstrap: ${ft.uniqueCount} ta noyob yozuv, ${ft.oob.length} ta OOB · ishlatilgan xususiyatlar: ${ft.featuresUsed.map((f) => FEATURES[f].short).join(', ') || '—'} · bashorat: ${fv.prediction}`}
            right={<span className="text-xs text-muted">Yuqoridagi kartalardan birini bosing</span>}
          />
          <AnimatePresence mode="wait">
            <motion.div key={`${ft.id}-${dN}-${maxDepth}-${minSplit}-${mf}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TreeDiagram root={ft.root} criterion="gini" pathIds={new Set([...fv.path.map((p) => p.nodeId), fv.leafId])} />
            </motion.div>
          </AnimatePresence>
        </Card>
      </Section>

      {/* 7 */}
      <Section id="grafiklar" index={sectionIndex('grafiklar')} title="Grafik va diagrammalar" subtitle="Feature randomness, daraxtlar ovozlari jadvali va baholash">
        <div className="space-y-5">
          <Card>
            <CardTitle icon={<Layers size={18} />} title="Feature Randomness: qaysi daraxt qaysi xususiyatdan foydalandi?" subtitle="Rangli katak — xususiyat shu daraxtning kamida bitta splitida ishlatilgan" />
            <div className="scroll-thin overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-[#0e1628] px-2 py-1 text-left text-muted">Xususiyat</th>
                    {forest.trees.slice(0, 40).map((t) => (
                      <th key={t.id} className="px-0.5 py-1 font-mono font-normal text-muted">{t.id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, fi) => (
                    <tr key={f.key}>
                      <td className="sticky left-0 whitespace-nowrap bg-[#0e1628] px-2 py-1 text-slate-300">{f.short}</td>
                      {forest.trees.slice(0, 40).map((t) => {
                        const used = t.featuresUsed.includes(fi);
                        const root = t.root.split?.feature === fi;
                        return (
                          <td key={t.id} className="p-0.5">
                            <div className={`h-5 w-5 rounded ${root ? 'bg-emerald' : used ? 'bg-emerald/35' : 'bg-white/[0.04]'}`} title={root ? 'root split' : used ? 'ishlatilgan' : 'ishlatilmagan'} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">To‘q yashil — root tugundagi xususiyat. Root’lar turlicha ekani daraxtlarning bir-biridan farqli ekanini ko‘rsatadi.{forest.trees.length > 40 && ' (birinchi 40 ta daraxt)'}</p>
          </Card>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardTitle title="Har bir daraxtning bashorati" subtitle="Yangi mijoz uchun" />
              <DataTable
                rows={pred.treeVotes}
                rowKey={(r) => r.treeId}
                maxHeight={380}
                columns={[
                  { key: 't', header: 'Daraxt', render: (r) => <span className="text-emerald">Tree {r.treeId}</span> },
                  { key: 'u', header: 'Noyob', render: (r) => forest.trees[r.treeId - 1].uniqueCount, align: 'right' },
                  { key: 'o', header: 'OOB', render: (r) => forest.trees[r.treeId - 1].oob.length, align: 'right' },
                  { key: 'd', header: 'Yo‘l uzunligi', render: (r) => r.path.length, align: 'right' },
                  { key: 'p1', header: 'Barg P(1)', render: (r) => r.probability.toFixed(2), align: 'right' },
                  { key: 'p', header: 'Bashorat', render: (r) => <ClassPill label={r.prediction} size="sm" /> },
                ]}
              />
            </Card>
            <Card>
              <CardTitle title="Xususiyatlar ahamiyati" subtitle="Barcha daraxtlar bo‘yicha o‘rtacha" />
              <FeatureImportanceChart data={importance} color="#10B981" />
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Stat label="OOB accuracy" value={pct(forest.oobAccuracy)} color="#8B5CF6" hint={`${forest.oobEvaluated} yozuv`} />
                <Stat label="Test accuracy" value={pct(evalRes.test.accuracy)} color="#10B981" />
              </div>
            </Card>
          </div>
          <EvaluationPanel train={evalRes.train} test={evalRes.test} color="#10B981" modelName="Random Forest" />
          <Card>
            <CardTitle icon={<TrendingUp size={18} />} title="Random Forest va bitta Decision Tree" subtitle={`Bir xil train/test split, bir xil max_depth = ${maxDepth} va min_samples_split = ${minSplit}`} />
            <DataTable
              rows={[
                { name: 'Decision Tree', trees: 1, m: single, of: ofDT, color: '#3B82F6' },
                { name: 'Random Forest', trees: forest.trees.length, m: evalRes, of: ofRF, color: '#10B981' },
              ]}
              rowKey={(r) => r.name}
              maxHeight="none"
              columns={[
                { key: 'n', header: 'Model turi', render: (r) => <span className="font-sans font-semibold" style={{ color: r.color }}>{r.name}</span> },
                { key: 't', header: 'Daraxtlar', render: (r) => r.trees, align: 'right' },
                { key: 'tr', header: 'Training acc.', render: (r) => pct(r.m.train.accuracy), align: 'right' },
                { key: 'te', header: 'Testing acc.', render: (r) => pct(r.m.test.accuracy), align: 'right' },
                { key: 'p', header: 'Precision', render: (r) => pct(r.m.test.precision), align: 'right' },
                { key: 'rc', header: 'Recall', render: (r) => pct(r.m.test.recall), align: 'right' },
                { key: 'f', header: 'F1-score', render: (r) => pct(r.m.test.f1), align: 'right' },
                { key: 'o', header: 'Overfitting', render: (r) => <span className={`font-sans text-xs ${r.of.level === 'high' ? 'text-rose-400' : r.of.level === 'mid' ? 'text-amber-300' : 'text-emerald'}`}>{r.of.label}</span> },
              ]}
            />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Eslatma: test to‘plami kichik ({TEST.y.length} ta), shuning uchun farqlar bir-ikki mijozga bog‘liq bo‘lishi mumkin. Random Forest’ning asosiy foydasi —
              barqarorlik: daraxtlar sonini o‘zgartirganda natija silliq o‘zgaradi, bitta daraxt esa ma’lumotdagi kichik o‘zgarishga sezgir. Random Forest’ning training accuracy’si tabiatan yuqori chiqadi, chunki har bir training yozuvi daraxtlarning ~63% ida bootstrap namunaga tushgan. Shuning uchun RF uchun haqqoniyroq ichki baho — OOB accuracy ({pct(forest.oobAccuracy)}).
            </p>
          </Card>
        </div>
      </Section>

      {/* 8 */}
      <Section id="parametrlar" index={sectionIndex('parametrlar')} title="Parametrlar" subtitle="Daraxtlar soni va boshqa giperparametrlarning ta’siri">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardTitle title="Daraxtlar soni va aniqlik" subtitle="T = 1…100 uchun training va testing accuracy (joriy max_depth va max_features)" />
            <ParamSweepChart data={sweep} xLabel="Daraxtlar soni" current={[1, 3, 5, 10, 15, 20, 30, 40, 50, 75, 100].reduce((a, b) => (Math.abs(b - nTrees) < Math.abs(a - nTrees) ? b : a))} />
            <p className="mt-2 text-xs text-muted">Daraxtlar ko‘paygan sari natija barqarorlashadi. Random Forest’da daraxtlar sonini oshirish overfitting’ga olib kelmaydi — faqat hisoblash vaqti oshadi.</p>
          </Card>
          <div className="grid gap-3">
            <Concept term="Number of Estimators" en="n_estimators">O‘rmondagi daraxtlar soni (5–100). Ko‘proq daraxt — barqarorroq ovoz, lekin sekinroq.</Concept>
            <Concept term="Max Depth" en="max_depth">Har bir daraxtning chuqurligi. RF’da daraxtlar odatda chuqurroq quriladi — ovoz berish overfitting’ni yumshatadi.</Concept>
            <Concept term="Min Samples Split" en="min_samples_split">Tugunni bo‘lish uchun minimal yozuvlar. Kattaroq qiymat — soddaroq daraxtlar.</Concept>
            <Concept term="Max Features" en="max_features">Tugunda ko‘riladigan xususiyatlar. Kichik m — daraxtlar xilma-xilroq; “all” — oddiy bagging.</Concept>
          </div>
        </div>
      </Section>

      {/* 9 */}
      <Section id="natija" index={sectionIndex('natija')} title="Yakuniy natija" subtitle="O‘rmon qarori sodda tilda">
        <Card glow={pred.prediction === 0 ? 'green' : 'none'}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-4">
              <ClassPill label={pred.prediction} size="lg" />
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Daraxtlar" value={forest.trees.length} />
                <Stat label="0 ovoz" value={pred.votes[0]} color="#10B981" />
                <Stat label="1 ovoz" value={pred.votes[1]} color="#F43F5E" />
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="flex h-full">
                  <motion.div className="bg-emerald" animate={{ width: `${pred.share[0] * 100}%` }} />
                  <motion.div className="bg-rose-500" animate={{ width: `${pred.share[1] * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="prose-uz">
              <p>
                <strong>Sodda tilda:</strong> {forest.trees.length} nafar “virtual kredit inspektori” (daraxt) mijozni mustaqil baholadi. Ulardan{' '}
                <strong className="text-emerald">{pred.votes[0]}</strong> tasi “muammosiz to‘laydi”, <strong className="text-rose-400">{pred.votes[1]}</strong> tasi esa “muammo bo‘ladi” deb ovoz berdi.
                Ko‘pchilik qarori: <strong>sinf {pred.prediction}</strong>.
              </p>
              <p>
                Ovozlar ulushi {pct(pred.share[pred.prediction])} — bu daraxtlar ovozlarining ulushi, <em>kalibrlangan ehtimol emas</em>. Masalan, 70% ulush “mijoz 70% ehtimol bilan
                defolt qiladi” degani emas; u faqat daraxtlarning qanchalik hamfikr ekanini bildiradi.
              </p>
              {pred.tie && <p>Ovozlar teng bo‘lgani uchun qaror barglardagi o‘rtacha P(1) bo‘yicha qabul qilindi.</p>}
            </div>
          </div>
        </Card>
      </Section>

      {/* 10 */}
      <Section id="xulosa" index={sectionIndex('xulosa')} title="Xulosa" subtitle="Afzalliklar, kamchiliklar va bankdagi qo‘llanilishi">
        <ProsCons
          pros={[
            'Bitta daraxtga qaraganda barqarorroq va odatda aniqroq — dispersiya kamayadi.',
            'Overfitting’ga chidamli; daraxtlar sonini oshirish xavfsiz.',
            'Scaling talab qilmaydi, outlier va shovqinga nisbatan chidamli.',
            'OOB baholash va feature importance “bepul” olinadi.',
          ]}
          cons={[
            'Interpretability past: yuzlab daraxtni bitta qoidaga aylantirib bo‘lmaydi.',
            'Ko‘proq xotira va hisoblash vaqti talab qiladi.',
            'Ovozlar ulushi kalibrlangan ehtimol emas.',
            'Juda kam uchraydigan holatlarni (rare events) baholashda qo‘shimcha sozlash kerak.',
          ]}
        />
        <div className="mt-6">
          <UseCases
            items={[
              { icon: <Target size={18} />, title: 'Kredit riski skoringi', desc: 'Iste’mol va biznes kreditlari bo‘yicha defolt xavfi.' },
              { icon: <Network size={18} />, title: 'Firibgarlikni aniqlash', desc: 'Karta tranzaksiyalaridagi shubhali naqshlar.' },
              { icon: <Briefcase size={18} />, title: 'Mijoz ketishi (churn)', desc: 'Qaysi mijozlar bankni tark etishi mumkin.' },
              { icon: <PiggyBank size={18} />, title: 'Cross-selling', desc: 'Depozit yoki sug‘urta mahsulotiga qiziqish bashorati.' },
              { icon: <Vote size={18} />, title: 'AML monitoring', desc: 'Pul yuvish xavfi bo‘lgan operatsiyalarni saralash.' },
              { icon: <Trees size={18} />, title: 'Xususiyatlarni tanlash', desc: 'Feature importance orqali muhim omillarni aniqlash.' },
            ]}
          />
        </div>
        <Callout tone="info" title="Keyingi qadam">
          Uchala klassifikatsiya algoritmini <Link to="/taqqoslash" className="font-semibold text-cyan">Taqqoslash</Link> sahifasida bir xil sharoitda solishtiring yoki{' '}
          <Link to="/laboratoriya" className="font-semibold text-cyan">Prediction Lab</Link>da o‘z mijozingizni sinab ko‘ring.
        </Callout>
      </Section>
    </AlgorithmShell>
  );
}

function VoteTally({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span className="font-mono">{v} / {t}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>{pct(v / t, 0)}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${(v / t) * 100}%` }} />
      </div>
    </div>
  );
}
