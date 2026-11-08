import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, FileCheck2, GitBranch, Leaf, MousePointerClick, Scale, ShieldAlert, Target, UserCheck } from 'lucide-react';
import type { ClientFeatures, Criterion } from '../types';
import { FEATURES, HAND_SAMPLE, NEW_CLIENT, TEST, TRAIN, toVector, formatFeature } from '../data/bankDataset';
import {
  bfsOrder,
  buildTree,
  classCounts,
  entropy,
  evaluateFeatureSplits,
  featureImportance,
  findBestSplit,
  flattenTree,
  gini,
  predictTree,
  predictTreeMany,
  treeStats,
  type StopReason,
  type TreeNode,
} from '../algorithms/decisionTree';
import { evaluate } from '../utils/metrics';
import { useStepPlayer } from '../hooks/useStepPlayer';
import AlgorithmShell, { sectionIndex } from '../components/algorithm/AlgorithmShell';
import ClientSliders from '../components/algorithm/ClientForm';
import { EvaluationPanel } from '../components/algorithm/Evaluation';
import TreeDiagram, { conditionText } from '../components/diagrams/TreeDiagram';
import { AlgoMiniVisual } from '../components/diagrams/Visuals';
import { FeatureImportanceChart, ParamSweepChart } from '../components/charts/Charts';
import { AXIS, GRID, TOOLTIP } from '../components/charts/chartTheme';
import DataTable from '../components/common/DataTable';
import FormulaCard from '../components/common/FormulaCard';
import PlayerControls from '../components/common/PlayerControls';
import ProcessStepper from '../components/common/ProcessStepper';
import Tex from '../components/common/Tex';
import { ClassPill, Concept, ProsCons, Section, SyntheticNotice, UseCases, pct } from '../components/common/misc';
import { Callout, Card, CardTitle, Stat } from '../components/ui/Card';
import { Segmented, Slider } from '../components/ui/Controls';

const STOP_TEXT: Record<StopReason, string> = {
  pure: 'Tugun toza: barcha mijozlar bitta sinfda — ajratishga hojat yo‘q.',
  maxDepth: 'Max Depth chegarasiga yetildi.',
  minSamplesSplit: 'Tugundagi mijozlar soni Min Samples Split dan kam.',
  noValidSplit: 'Min Samples Leaf shartini qanoatlantiradigan split topilmadi.',
  noGain: 'Hech bir split impurity’ni kamaytirmaydi.',
};

const r3 = (v: number) => v.toFixed(3);

export default function DecisionTreePage() {
  const [maxDepth, setMaxDepth] = useState(4);
  const [minSplit, setMinSplit] = useState(6);
  const [minLeaf, setMinLeaf] = useState(3);
  const [criterion, setCriterion] = useState<Criterion>('gini');
  const [client, setClient] = useState<ClientFeatures>({ ...NEW_CLIENT });
  const [mode, setMode] = useState<'build' | 'path'>('build');
  const [selId, setSelId] = useState<number | null>(0);
  const [curveFeat, setCurveFeat] = useState(2);
  const dClient = useDeferredValue(client);

  const params = { maxDepth, minSamplesSplit: minSplit, minSamplesLeaf: minLeaf, criterion };
  const tree = useMemo(() => buildTree(TRAIN.X, TRAIN.y, params), [maxDepth, minSplit, minLeaf, criterion]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = useMemo(() => bfsOrder(tree), [tree]);
  const all = useMemo(() => flattenTree(tree), [tree]);
  const stats = useMemo(() => treeStats(tree), [tree]);
  const x = toVector(dClient);
  const pred = useMemo(() => predictTree(tree, x), [tree, x.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const pathNodeIds = useMemo(() => [...pred.path.map((p) => p.nodeId), pred.leaf.id], [pred]);
  const evalRes = useMemo(
    () => ({ train: evaluate(TRAIN.y, predictTreeMany(tree, TRAIN.X)), test: evaluate(TEST.y, predictTreeMany(tree, TEST.X)) }),
    [tree],
  );
  const sweep = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = buildTree(TRAIN.X, TRAIN.y, { ...params, maxDepth: i + 1 });
        return { x: i + 1, train: evaluate(TRAIN.y, predictTreeMany(t, TRAIN.X)).accuracy, test: evaluate(TEST.y, predictTreeMany(t, TEST.X)).accuracy };
      }),
    [minSplit, minLeaf, criterion], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const importance = useMemo(() => featureImportance(tree, 5).map((v, i) => ({ name: FEATURES[i].short, v })).sort((a, b) => b.v - a.v), [tree]);

  // Root tugundagi barcha nomzod splitlar
  const rootIdx = useMemo(() => TRAIN.X.map((_, i) => i), []);
  const rootCands = useMemo(
    () => FEATURES.flatMap((_, f) => evaluateFeatureSplits(TRAIN.X, TRAIN.y, rootIdx, f, criterion, minLeaf)).sort((a, b) => b.gain - a.gain),
    [criterion, minLeaf, rootIdx],
  );
  const curve = useMemo(
    () => evaluateFeatureSplits(TRAIN.X, TRAIN.y, rootIdx, curveFeat, criterion, minLeaf).map((c) => ({ t: Number(c.threshold.toFixed(2)), w: c.weighted, g: c.gain })),
    [curveFeat, criterion, minLeaf, rootIdx],
  );

  // Qo‘lda hisoblash: kichik namuna (10 ta mijoz)
  const hand = useMemo(() => {
    const X = HAND_SAMPLE.map(toVector);
    const y = HAND_SAMPLE.map((c) => c.default);
    const idx = X.map((_, i) => i);
    const counts = classCounts(y, idx);
    const { best } = findBestSplit(X, y, idx, [0, 1, 2, 3, 4], 'gini', 1);
    return { X, y, counts, best };
  }, []);

  // Animatsiya
  const total = mode === 'build' ? order.length : pathNodeIds.length;
  const player = useStepPlayer(total, { resetKey: `${mode}|${maxDepth}|${minSplit}|${minLeaf}|${criterion}|${x.join(',')}` });
  const st = player.started ? player.step : total - 1;
  const visibleIds = useMemo(() => (mode === 'build' ? new Set(order.slice(0, st + 1).map((n) => n.id)) : undefined), [mode, order, st]);
  const pathIds = useMemo(() => new Set(mode === 'path' ? pathNodeIds.slice(0, st + 1) : player.started ? [] : pathNodeIds), [mode, pathNodeIds, st, player.started]);
  const curNode = mode === 'build' ? order[Math.min(st, order.length - 1)] : all.find((n) => n.id === pathNodeIds[Math.min(st, pathNodeIds.length - 1)]);
  const sel = all.find((n) => n.id === selId) ?? tree;

  const rootImp = tree.impurity;
  const impName = criterion === 'gini' ? 'Gini' : 'Entropy';
  const c0 = tree.counts[0];
  const c1 = tree.counts[1];
  const N = tree.samples;

  const stepText = (() => {
    if (!curNode) return '';
    if (mode === 'build') {
      if (curNode.isLeaf) return `Tugun #${curNode.id} (chuqurlik ${curNode.depth}) — Leaf Node: sinf ${curNode.prediction}. Sabab: ${STOP_TEXT[curNode.stopReason!]}`;
      return `Tugun #${curNode.id} (chuqurlik ${curNode.depth}): ${curNode.samples} ta mijoz, ${impName} = ${r3(curNode.impurity)}. Eng yaxshi split: ${conditionText(curNode.split!.feature, curNode.split!.threshold)} (Gain = ${r3(curNode.split!.gain)}).`;
    }
    const i = pathNodeIds.indexOf(curNode.id);
    const ps = pred.path[i];
    if (!ps) return `Barg: ${curNode.samples} ta mijoz [${curNode.counts[0]} / ${curNode.counts[1]}] → yangi mijoz sinf ${curNode.prediction} deb tasniflandi.`;
    return `Tekshiriladi: ${conditionText(ps.feature, ps.threshold)}? Mijozda ${formatFeature(FEATURES[ps.feature].key, ps.value)} → ${ps.goLeft ? 'Ha, chap shoxga' : 'Yo‘q, o‘ng shoxga'}.`;
  })();

  return (
    <AlgorithmShell
      algo="decision-tree"
      definition={
        <>
          <b className="text-ink">Decision Tree</b> (qaror daraxti) — ma’lumotlarni “Ha / Yo‘q” savollari orqali ketma-ket bo‘lib, har bir bargda (leaf) yakuniy
          qaror chiqaradigan Supervised Learning algoritmi. Har bir savol ma’lumotlarni eng “toza” guruhlarga ajratadigan qilib tanlanadi.
        </>
      }
      problem={
        <>
          Bank yangi mijozga kredit ajratishdan oldin uning to‘lovda muammoga uchrash ehtimolini aniqlamoqchi. Daraxt mijozning kredit reytingi,
          kechikishlari, DTI va boshqa ko‘rsatkichlarini ketma-ket tekshirib, yakuniy qarorga keladi — xuddi tajribali kredit inspektori kabi.
        </>
      }
      learningSteps={['Tushunchalar', 'Gini / Entropy', 'Split tanlash', 'Daraxt qurish', 'Mijoz yo‘li', 'Baholash']}
      visual={<div className="h-64 w-full sm:h-72"><AlgoMiniVisual id="decision-tree" /></div>}
    >
      {/* 1 */}
      <Section id="haqida" index={sectionIndex('haqida')} title="Decision Tree nima?" subtitle="Asosiy tushunchalar — bank misolida">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <div className="prose-uz">
              <p>
                Qaror daraxti — bu bir qator <strong>if–else</strong> savollar zanjiri. Masalan: “Kredit reytingi 600 dan pastmi?” → Ha bo‘lsa
                “Kechikishlar 2 tadan ko‘pmi?”, Yo‘q bo‘lsa “DTI 50% dan yuqorimi?” va hokazo. Oxirida har bir yo‘l bitta qarorga olib keladi.
              </p>
              <p>
                Algoritm bu savollarni o‘zi o‘ylab topadi: har bir qadamda barcha xususiyatlar va barcha mumkin bo‘lgan chegaralarni sinab, mijozlarni
                sinflar bo‘yicha eng yaxshi ajratadigan savolni tanlaydi. Bu jarayon <strong>CART</strong> (Classification and Regression Trees)
                algoritmi deb ataladi.
              </p>
              <p>Natija — inson o‘qiy oladigan qoidalar to‘plami. Shu sababli daraxtlar bankda regulyator va mijozga qarorni tushuntirish uchun qulay.</p>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Concept term="Root Node" en="Ildiz tugun">Daraxtning eng yuqori tuguni — barcha {N} ta training mijoz shu yerdan boshlanadi.</Concept>
            <Concept term="Decision Node" en="Qaror tuguni">Shart tekshiriladigan ichki tugun, masalan “Credit Score ≤ 601.5?”.</Concept>
            <Concept term="Leaf Node" en="Barg">Yakuniy tugun — u yerda savol yo‘q, faqat qaror: sinf 0 yoki 1.</Concept>
            <Concept term="Branch" en="Shox">Tugundan chiquvchi yo‘l: “Ha” (shart bajarildi) yoki “Yo‘q”.</Concept>
            <Concept term="Feature" en="Xususiyat">Savolda ishlatiladigan ko‘rsatkich: yosh, daromad, reyting, DTI, kechikishlar.</Concept>
            <Concept term="Target" en="Maqsad">Bashorat qilinadigan natija — Payment Default (0/1).</Concept>
            <Concept term="Split" en="Ajratish">Tugundagi mijozlarni shart bo‘yicha ikki guruhga bo‘lish.</Concept>
            <Concept term="Gini Impurity" en="Gini nopokligi">Tugun qanchalik “aralash” ekanini o‘lchaydi: 0 — toza, 0.5 — ikki sinf teng.</Concept>
            <Concept term="Entropy" en="Entropiya">Axborot nazariyasidagi noaniqlik o‘lchovi: 0 — toza, 1 — maksimal aralash.</Concept>
            <Concept term="Information Gain" en="Axborot yutug‘i">Split natijasida noaniqlik qanchaga kamaygani. Eng katta Gain — eng yaxshi split.</Concept>
          </div>
        </div>
      </Section>

      {/* 2 */}
      <Section id="masala" index={sectionIndex('masala')} title="Amaliy masala" subtitle="Kredit qarorini shartlar ketma-ketligi orqali qabul qilish">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardTitle icon={<UserCheck size={18} />} title="Yangi mijoz" />
            <ul className="space-y-1.5 text-sm">
              {FEATURES.map((f) => (
                <li key={f.key} className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-muted">{f.uz}</span>
                  <span className="font-mono text-ink">{formatFeature(f.key, NEW_CLIENT[f.key])} {f.unit}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="md:col-span-2">
            <div className="prose-uz">
              <p>
                Kredit inspektori odatda shunday fikrlaydi: “Reytingi pastmi? Unda kechikishlariga qarayman. Reytingi yaxshimi? Unda qarz yukini (DTI)
                tekshiraman.” Decision Tree aynan shunday ketma-ketlikni <strong>ma’lumotlardan avtomatik</strong> o‘rganadi.
              </p>
              <p>
                Muhim: daraxtdagi barcha shartlar va chegaralar (threshold) oldindan yozilmagan — ular {N} ta training mijoz ustida Gini yoki Entropy hisoblash
                orqali topiladi. Parametrlarni o‘zgartirsangiz, daraxt qaytadan quriladi.
              </p>
              <p>Natija sifatida: (1) qoidalar daraxti, (2) yangi mijoz bosib o‘tgan yo‘l va (3) bargdagi sinf — yakuniy qaror.</p>
            </div>
          </Card>
        </div>
      </Section>

      {/* 3 */}
      <Section id="dataset" index={sectionIndex('dataset')} title="Dataset" subtitle="Umumiy kredit dataseti; daraxt uchun standartlashtirish shart emas">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Training" value={TRAIN.y.length} />
              <Stat label="Testing" value={TEST.y.length} color="#F59E0B" />
              <Stat label="Root: sinf 0" value={c0} color="#10B981" />
              <Stat label="Root: sinf 1" value={c1} color="#F43F5E" />
            </div>
            <Callout tone="info" title="Nega scaling kerak emas?">
              Daraxt faqat “x ≤ t” ko‘rinishidagi taqqoslashlarni bajaradi. Qiymatlarni chiziqli o‘zgartirsak, threshold ham mos ravishda o‘zgaradi, lekin
              ajratilgan guruhlar bir xil qoladi. Shuning uchun Decision Tree xom qiymatlar bilan ishlaydi.
            </Callout>
            <SyntheticNotice compact />
          </div>
          <Card>
            <CardTitle title="Qo‘lda hisoblash uchun 10 ta mijoz" subtitle="Datasetning birinchi 10 yozuvi" />
            <DataTable
              rows={HAND_SAMPLE}
              rowKey={(r) => r.id}
              maxHeight="none"
              dense
              columns={[
                { key: 'id', header: 'ID', render: (r) => <span className="text-electric">{r.id}</span> },
                ...FEATURES.map((f) => ({ key: f.key, header: f.short, render: (r: (typeof HAND_SAMPLE)[number]) => formatFeature(f.key, r[f.key]), align: 'right' as const })),
                { key: 'y', header: 'y', render: (r) => <ClassPill label={r.default} size="sm" /> },
              ]}
            />
          </Card>
        </div>
      </Section>

      {/* 4 */}
      <Section id="matematika" index={sectionIndex('matematika')} title="Matematik asoslar" subtitle="Gini Impurity, Entropy, Weighted impurity va Gain">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              accent="#3B82F6"
              title="Gini Impurity (asosiy mezon)"
              tex={String.raw`\text{Gini} = 1 - \sum_{i=1}^{C} p_i^2`}
              meaning="Tugundan tasodifiy olingan mijozni tugundagi sinflar ulushiga ko‘ra tasodifiy yorliqlasak, xato qilish ehtimoli."
              symbols={[
                { sym: 'p_i', desc: 'tugundagi i-sinf ulushi (soni / jami)' },
                { sym: 'C', desc: 'sinflar soni (bizda 2)' },
              ]}
              when="Har bir nomzod splitda chap va o‘ng tugunlarning tozaligini baholash uchun. 0 — toza tugun, 0.5 — ikki sinf teng (2 sinf uchun maksimum)."
              example={
                <div className="space-y-2">
                  <div>Tugunda 6 ta mijoz kreditni qaytargan (0), 4 tasi qaytarmagan (1):</div>
                  <Tex>{String.raw`1 - \left(\tfrac{6}{10}\right)^2 - \left(\tfrac{4}{10}\right)^2 = 1 - 0.36 - 0.16 = ${gini([6, 4]).toFixed(2)}`}</Tex>
                  <div className="pt-1">Bizning Root Node ({c0} ta 0, {c1} ta 1):</div>
                  <Tex>{String.raw`1 - \left(\tfrac{${c0}}{${N}}\right)^2 - \left(\tfrac{${c1}}{${N}}\right)^2 = ${r3(gini(tree.counts))}`}</Tex>
                </div>
              }
            />
            <FormulaCard
              accent="#8B5CF6"
              title="Entropy"
              tex={String.raw`\text{Entropy} = -\sum_{i=1}^{C} p_i \log_2 p_i`}
              meaning="Tugundagi noaniqlik miqdori (bitlarda). Sinflar teng bo‘lsa 1 bit, toza bo‘lsa 0."
              symbols={[
                { sym: 'p_i', desc: 'i-sinf ulushi; p = 0 bo‘lsa, had 0 deb olinadi' },
                { sym: '\\log_2', desc: 'ikki asosli logarifm' },
              ]}
              when="Information Gain hisoblash uchun (ID3, C4.5 algoritmlari). Gini bilan deyarli bir xil daraxt beradi, lekin logarifm tufayli biroz sekinroq."
              example={
                <div className="space-y-2">
                  <Tex>{String.raw`-0.6\log_2 0.6 - 0.4\log_2 0.4 = ${entropy([6, 4]).toFixed(3)}`}</Tex>
                  <div className="pt-1">Root Node:</div>
                  <Tex>{String.raw`-\tfrac{${c0}}{${N}}\log_2\tfrac{${c0}}{${N}} - \tfrac{${c1}}{${N}}\log_2\tfrac{${c1}}{${N}} = ${r3(entropy(tree.counts))}`}</Tex>
                </div>
              }
            />
            <FormulaCard
              accent="#00D4FF"
              title="Weighted Gini (split sifati)"
              tex={String.raw`\text{Gini}_{split} = \frac{N_{left}}{N}\,\text{Gini}_{left} + \frac{N_{right}}{N}\,\text{Gini}_{right}`}
              meaning="Split natijasidagi ikki bola tugun nopokligining, tugundagi mijozlar soniga ko‘ra tortilgan o‘rtachasi."
              symbols={[
                { sym: 'N', desc: 'ota tugundagi mijozlar soni' },
                { sym: 'N_{left}, N_{right}', desc: 'chap (shart bajarildi) va o‘ng tugundagi mijozlar soni' },
              ]}
              when="Har bir nomzod split (xususiyat + threshold) uchun. Eng kichik Weighted Gini — eng yaxshi split."
              example={
                rootCands[0] && (
                  <Tex>{String.raw`\tfrac{${rootCands[0].nLeft}}{${N}}\cdot ${r3(rootCands[0].impurityLeft)} + \tfrac{${rootCands[0].nRight}}{${N}}\cdot ${r3(rootCands[0].impurityRight)} = ${r3(rootCands[0].weighted)}`}</Tex>
                )
              }
            />
            <FormulaCard
              accent="#10B981"
              title="Gini Gain / Information Gain"
              tex={String.raw`\text{Gain} = I_{parent} - \left(\tfrac{N_{left}}{N} I_{left} + \tfrac{N_{right}}{N} I_{right}\right)`}
              meaning="Split noaniqlikni qanchaga kamaytirgani. I — Gini yoki Entropy. Entropy uchun bu Information Gain (IG) deyiladi."
              symbols={[
                { sym: 'I_{parent}', desc: 'ota tugun impurity qiymati' },
                { sym: 'I_{left}, I_{right}', desc: 'bola tugunlar impurity qiymatlari' },
              ]}
              when="Barcha nomzodlar orasidan eng katta Gain beruvchi split tanlanadi. Gain ≤ 0 bo‘lsa, tugun bargga aylanadi."
              example={rootCands[0] && <Tex>{String.raw`${r3(rootImp)} - ${r3(rootCands[0].weighted)} = ${r3(rootCands[0].gain)}`}</Tex>}
            />
          </div>
          <Card>
            <CardTitle title="Gini va Entropy farqi — sodda qilib" />
            <div className="grid gap-4 md:grid-cols-3">
              <Callout tone="info" title="O‘xshashligi">Ikkalasi ham toza tugunda 0, aralash tugunda maksimal. Ko‘p hollarda bir xil yoki juda o‘xshash daraxt beradi.</Callout>
              <Callout tone="success" title="Gini">Hisoblash tezroq (logarifm yo‘q). Ko‘pchilik sinfni alohida tugunga ajratishga biroz moyil. scikit-learn’da default.</Callout>
              <Callout tone="warn" title="Entropy">Axborot nazariyasiga asoslangan, noaniqlikni bitlarda o‘lchaydi. Biroz muvozanatliroq daraxtlar berishi mumkin.</Callout>
            </div>
          </Card>
          <Card>
            <CardTitle title="Qo‘lda hisoblash: 10 ta mijozdagi eng yaxshi split" subtitle="Yuqoridagi kichik namuna bo‘yicha, Gini mezoni bilan — barcha 5 xususiyat va barcha threshold’lar sinab ko‘rildi" />
            {hand.best && (
              <div className="prose-uz">
                <p>
                  Namunada {hand.counts[0]} ta sinf 0 va {hand.counts[1]} ta sinf 1. Ota tugun:{' '}
                  <Tex>{String.raw`\text{Gini} = 1 - (\tfrac{${hand.counts[0]}}{10})^2 - (\tfrac{${hand.counts[1]}}{10})^2 = ${r3(gini(hand.counts))}`}</Tex>
                </p>
                <p>
                  Eng yaxshi split: <strong>{conditionText(hand.best.feature, hand.best.threshold)}</strong>. Chapga {hand.best.nLeft} ta mijoz [{hand.best.countsLeft.join(' / ')}],
                  o‘ngga {hand.best.nRight} ta [{hand.best.countsRight.join(' / ')}].
                </p>
                <Tex block>{String.raw`\text{Gini}_L = ${r3(hand.best.impurityLeft)},\; \text{Gini}_R = ${r3(hand.best.impurityRight)},\; \text{Gini}_{split} = \tfrac{${hand.best.nLeft}}{10}\cdot${r3(hand.best.impurityLeft)} + \tfrac{${hand.best.nRight}}{10}\cdot${r3(hand.best.impurityRight)} = ${r3(hand.best.weighted)}`}</Tex>
                <Tex block>{String.raw`\text{Gain} = ${r3(gini(hand.counts))} - ${r3(hand.best.weighted)} = ${r3(hand.best.gain)}`}</Tex>
              </div>
            )}
          </Card>
        </div>
      </Section>

      {/* 5 */}
      <Section id="ketma-ketlik" index={sectionIndex('ketma-ketlik')} title="Ishlash ketma-ketligi" subtitle="13 bosqich — joriy parametrlar bo‘yicha real qiymatlar bilan">
        <ProcessStepper
          accent="#3B82F6"
          steps={[
            { title: 'Datasetni olish', summary: `${N} ta training mijoz`, body: <p>Training to‘plami: {N} ta mijoz ({c0} ta sinf 0, {c1} ta sinf 1). Test to‘plami ({TEST.y.length} ta) o‘qitishda ishlatilmaydi.</p> },
            { title: 'Xususiyatlarni ajratish', summary: '5 ta feature + target', body: <p>X: {FEATURES.map((f) => f.en).join(', ')}. y: Payment Default. Scaling qo‘llanilmaydi.</p> },
            { title: 'Root Node hosil qilish', summary: `${impName} = ${r3(rootImp)}`, body: <><p>Barcha {N} ta mijoz ildiz tugunga joylashtiriladi.</p><Tex block>{criterion === 'gini' ? String.raw`\text{Gini}_{root} = 1 - (\tfrac{${c0}}{${N}})^2 - (\tfrac{${c1}}{${N}})^2 = ${r3(rootImp)}` : String.raw`H_{root} = ${r3(rootImp)}`}</Tex></> },
            { title: 'Eng yaxshi xususiyatni izlash', summary: `${rootCands.length} ta nomzod`, body: <p>Har bir xususiyat qiymatlari saralanadi va qo‘shni noyob qiymatlar o‘rtasi threshold sifatida olinadi. Root’da jami <strong>{rootCands.length}</strong> ta nomzod split baholandi.</p> },
            { title: 'Ma’lumotlarni bo‘lish', summary: 'x ≤ t → chap, aks holda o‘ng', body: <p>Har bir nomzod uchun mijozlar ikki guruhga bo‘linadi: shart bajarilgan (chap, “Ha”) va bajarilmagan (o‘ng, “Yo‘q”). Min Samples Leaf = {minLeaf} dan kichik guruh hosil qiluvchi nomzodlar tashlab yuboriladi.</p> },
            { title: `${impName} ni hisoblash`, summary: 'Chap va o‘ng tugunlar', body: rootCands[0] && <p>Masalan, eng yaxshi nomzod uchun: chap {impName} = {r3(rootCands[0].impurityLeft)} ({rootCands[0].countsLeft.join('/')}), o‘ng {impName} = {r3(rootCands[0].impurityRight)} ({rootCands[0].countsRight.join('/')}).</p> },
            { title: 'Barcha splitlarni solishtirish', summary: 'Weighted impurity va Gain', body: <ul>{rootCands.slice(0, 5).map((c, i) => <li key={i}>{conditionText(c.feature, c.threshold)} — weighted {r3(c.weighted)}, gain {r3(c.gain)}</li>)}</ul> },
            { title: 'Eng yaxshi splitni tanlash', summary: tree.split ? conditionText(tree.split.feature, tree.split.threshold) : '—', body: tree.split ? <p>Eng katta Gain: <strong>{conditionText(tree.split.feature, tree.split.threshold)}</strong>, Gain = {r3(tree.split.gain)}.</p> : <p>Split topilmadi.</p> },
            { title: 'Chap va o‘ng shoxlar', summary: tree.split ? `${tree.split.nLeft} / ${tree.split.nRight}` : '—', body: tree.left && tree.right ? <p>Chap shox: {tree.left.samples} ta mijoz [{tree.left.counts.join(' / ')}]. O‘ng shox: {tree.right.samples} ta mijoz [{tree.right.counts.join(' / ')}].</p> : <p>Root bargga aylandi.</p> },
            { title: 'Rekursiv davom ettirish', summary: `${stats.nodes} ta tugun`, body: <p>Xuddi shu jarayon har bir bola tugun uchun takrorlanadi. Natijada {stats.nodes} ta tugun, {stats.leaves} ta barg, chuqurlik {stats.depth}.</p> },
            { title: 'To‘xtash shartlari', summary: 'Max Depth, min samples, pure', body: <ul><li>Tugun toza (impurity = 0)</li><li>Chuqurlik = Max Depth ({maxDepth})</li><li>Mijozlar soni &lt; Min Samples Split ({minSplit})</li><li>Min Samples Leaf ({minLeaf}) ni qanoatlantiruvchi split yo‘q yoki Gain = 0</li></ul> },
            { title: 'Leaf Node hosil qilish', summary: `${stats.leaves} ta barg`, body: <p>Bargning sinfi — undagi ko‘pchilik sinf. Barg ehtimoli: P(1) = sinf 1 soni / bargdagi mijozlar. Tenglik bo‘lsa, ehtiyotkorlik uchun sinf 1 tanlanadi.</p> },
            { title: 'Yangi mijoz uchun qaror', summary: `Sinf ${pred.prediction}`, body: <><ol className="list-decimal space-y-1 pl-5">{pred.path.map((p) => <li key={p.nodeId}>{conditionText(p.feature, p.threshold)}? ({formatFeature(FEATURES[p.feature].key, p.value)}) → {p.goLeft ? 'Ha' : 'Yo‘q'}</li>)}</ol><p className="mt-2">Barg: [{pred.leaf.counts.join(' / ')}] → <ClassPill label={pred.prediction} size="sm" /></p></> },
          ]}
        />
      </Section>

      {/* 6 */}
      <Section id="laboratoriya" index={sectionIndex('laboratoriya')} title="Interaktiv laboratoriya" subtitle="Daraxt real hisob-kitob asosida quriladi. Tugunni bosing — batafsil ma’lumot chiqadi">
        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-80">
                <Segmented
                  value={mode}
                  onChange={(v) => setMode(v)}
                  options={[
                    { value: 'build', label: 'Daraxt qurilishi' },
                    { value: 'path', label: 'Yangi mijoz yo‘li' },
                  ]}
                />
              </div>
              <div className="flex-1">
                <PlayerControls player={player} />
              </div>
            </div>
            <div className="mb-3 min-h-[44px] rounded-xl border border-electric/25 bg-electric/[0.06] px-3 py-2 text-sm text-blue-100">
              {player.started ? stepText : 'To‘liq daraxt ko‘rsatilmoqda. Sariq yo‘l — yangi mijozning yo‘li. Animatsiya uchun “Boshlash”ni bosing.'}
            </div>
            <TreeDiagram root={tree} criterion={criterion} visibleIds={visibleIds} pathIds={pathIds} selectedId={selId} onSelect={(n) => setSelId(n.id)} />
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><MousePointerClick size={12} /> Tugunni bosing</span>
              <span>[a / b] — sinf 0 va sinf 1 mijozlar soni</span>
              <span className="text-amber-300">— yangi mijoz yo‘li</span>
            </div>
          </Card>
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_340px]">
            <NodeDetails node={sel} criterion={criterion} all={all} />
            <Card>
              <CardTitle title="Parametrlar" subtitle="O‘zgarishda daraxt darhol qayta quriladi" />
              <div className="space-y-5">
                <Slider label="Max Depth" value={maxDepth} min={1} max={8} onChange={setMaxDepth} hint="Daraxtning maksimal chuqurligi" />
                <Slider label="Min Samples Split" value={minSplit} min={2} max={40} onChange={setMinSplit} hint="Tugunni bo‘lish uchun kerakli minimal mijozlar" />
                <Slider label="Min Samples Leaf" value={minLeaf} min={1} max={20} onChange={setMinLeaf} hint="Har bir bargdagi minimal mijozlar" />
                <Segmented<Criterion> label="Split Criterion" value={criterion} onChange={setCriterion} options={[{ value: 'gini', label: 'Gini' }, { value: 'entropy', label: 'Entropy' }]} />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Stat label="Tugun" value={stats.nodes} />
                  <Stat label="Barg" value={stats.leaves} color="#10B981" />
                  <Stat label="Chuqurlik" value={stats.depth} color="#8B5CF6" />
                </div>
              </div>
            </Card>
            <Card>
              <ClientSliders value={client} onChange={setClient} />
            </Card>
          </div>
        </div>
      </Section>

      {/* 7 */}
      <Section id="grafiklar" index={sectionIndex('grafiklar')} title="Grafik va diagrammalar" subtitle="Root tugundagi nomzod splitlar, threshold egri chizig‘i, xususiyat ahamiyati va baholash">
        <div className="space-y-5">
          <Card>
            <CardTitle title="Root Node: nomzod splitlar reytingi" subtitle={`Barcha ${rootCands.length} ta nomzoddan eng yaxshi 15 tasi · mezon: ${impName}`} />
            <DataTable
              rows={rootCands.slice(0, 15)}
              rowKey={(r, i) => `${r.feature}-${r.threshold}-${i}`}
              maxHeight={480}
              highlight={(_, i) => (i === 0 ? 'bg-electric/[0.1]' : undefined)}
              columns={[
                { key: 'r', header: '#', render: (_, i) => <span className={i === 0 ? 'font-bold text-electric' : 'text-muted'}>{i + 1}</span> },
                { key: 'f', header: 'Shart', render: (r) => <span className="text-ink">{conditionText(r.feature, r.threshold)}</span> },
                { key: 'nl', header: 'N chap', render: (r) => r.nLeft, align: 'right' },
                { key: 'nr', header: 'N o‘ng', render: (r) => r.nRight, align: 'right' },
                { key: 'il', header: `${impName} chap`, render: (r) => r3(r.impurityLeft), align: 'right' },
                { key: 'ir', header: `${impName} o‘ng`, render: (r) => r3(r.impurityRight), align: 'right' },
                { key: 'w', header: 'Weighted', render: (r) => r3(r.weighted), align: 'right' },
                { key: 'g', header: 'Gain', render: (r) => <span className="font-semibold text-emerald">{r3(r.gain)}</span>, align: 'right' },
              ]}
            />
          </Card>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardTitle
                title="Threshold tanlash egri chizig‘i"
                subtitle={`Root tugunda ${FEATURES[curveFeat].en} bo‘yicha har bir threshold uchun Weighted ${impName}`}
                right={
                  <select value={curveFeat} onChange={(e) => setCurveFeat(Number(e.target.value))} className="rounded-lg border border-white/10 bg-[#0f1729] px-2 py-1.5 text-sm text-ink" aria-label="Xususiyatni tanlash">
                    {FEATURES.map((f, i) => (
                      <option key={f.key} value={i}>{f.en}</option>
                    ))}
                  </select>
                }
              />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={curve} margin={{ top: 10, right: 12, left: -6, bottom: 8 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} {...AXIS} />
                  <YAxis {...AXIS} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(2)} />
                  <Tooltip {...TOOLTIP} formatter={(v: number, n: string) => [v.toFixed(4), n === 'w' ? `Weighted ${impName}` : 'Gain']} labelFormatter={(l) => `threshold = ${l}`} />
                  <ReferenceLine y={rootImp} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: `ota: ${r3(rootImp)}`, fill: '#FB7185', fontSize: 11, position: 'insideTopRight' }} />
                  <Line type="stepAfter" dataKey="w" stroke="#3B82F6" strokeWidth={2.2} dot={false} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-1 text-xs text-muted">Egri chiziqning eng past nuqtasi — shu xususiyat uchun eng yaxshi threshold. Algoritm 5 ta xususiyatning eng past nuqtalarini solishtiradi.</p>
            </Card>
            <Card>
              <CardTitle title="Xususiyatlar ahamiyati" subtitle="Σ (tugundagi mijozlar × Gain), normallashtirilgan" />
              <FeatureImportanceChart data={importance} />
            </Card>
          </div>
          <EvaluationPanel train={evalRes.train} test={evalRes.test} color="#3B82F6" modelName="Decision Tree" />
        </div>
      </Section>

      {/* 8 */}
      <Section id="parametrlar" index={sectionIndex('parametrlar')} title="Parametrlar" subtitle="Daraxt murakkabligini boshqarish va overfitting">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardTitle title="Max Depth va aniqlik" subtitle="Chuqurlik 1…10 uchun training va testing accuracy" />
            <ParamSweepChart data={sweep} xLabel="Max Depth" current={maxDepth} />
            <p className="mt-2 text-xs text-muted">Chuqurlik oshgan sari training accuracy 100% ga yaqinlashadi (daraxt ma’lumotni “yodlaydi”), test accuracy esa bir nuqtadan keyin o‘smaydi yoki pasayadi — bu overfitting.</p>
          </Card>
          <div className="grid gap-3">
            <Concept term="Max Depth" en="max_depth">Savollar zanjirining maksimal uzunligi. Kichik — sodda, tushunarli daraxt; katta — murakkab, overfitting xavfi.</Concept>
            <Concept term="Min Samples Split" en="min_samples_split">Tugunni bo‘lish uchun unda kamida shuncha mijoz bo‘lishi kerak. Kichik guruhlar bo‘yicha “tasodifiy” qoidalarning oldini oladi.</Concept>
            <Concept term="Min Samples Leaf" en="min_samples_leaf">Har bir bargda kamida shuncha mijoz qolishi shart. Bargdagi qaror statistik jihatdan ishonchliroq bo‘ladi.</Concept>
            <Concept term="Split Criterion" en="criterion">Gini yoki Entropy — tugun tozaligi o‘lchovi. O‘zgartirib, daraxt qanday o‘zgarishini kuzating.</Concept>
          </div>
        </div>
      </Section>

      {/* 9 */}
      <Section id="natija" index={sectionIndex('natija')} title="Yakuniy natija" subtitle="Yangi mijoz daraxtdan qanday o‘tdi">
        <Card glow={pred.prediction === 0 ? 'green' : 'none'}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-wider text-muted">Bashorat</div>
              <ClassPill label={pred.prediction} size="lg" />
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Bargdagi mijozlar" value={pred.leaf.samples} />
                <Stat label="Sinf ulushi" value={pct(pred.prediction === 1 ? pred.probability : 1 - pred.probability, 0)} color="#00D4FF" hint={`[${pred.leaf.counts.join(' / ')}]`} />
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold">Qaror yo‘li</div>
              <ol className="space-y-2">
                {pred.path.map((p, i) => (
                  <motion.li key={p.nodeId} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
                    <span className="font-mono text-ink">{conditionText(p.feature, p.threshold)}?</span>
                    <span className="text-muted">mijozda {formatFeature(FEATURES[p.feature].key, p.value)}</span>
                    <span className={`ml-auto text-xs font-bold ${p.goLeft ? 'text-emerald' : 'text-rose-300'}`}>{p.goLeft ? 'Ha' : 'Yo‘q'}</span>
                  </motion.li>
                ))}
              </ol>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                <strong className="text-ink">Sodda tilda:</strong> daraxt mijozga {pred.path.length} ta savol berdi va u {pred.leaf.samples} ta o‘xshash mijozlar guruhiga tushdi. Bu
                guruhda {pred.leaf.counts[0]} kishi kreditni muammosiz to‘lagan, {pred.leaf.counts[1]} kishi esa muammoga uchragan. Shuning uchun daraxt mijozni{' '}
                <b>{pred.prediction === 1 ? '“yuqori xavf”' : '“past xavf”'}</b> deb belgiladi.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* 10 */}
      <Section id="xulosa" index={sectionIndex('xulosa')} title="Xulosa" subtitle="Afzalliklar, kamchiliklar va bankdagi qo‘llanilishi">
        <ProsCons
          pros={[
            'Natijani inson tushunadigan qoidalar ko‘rinishida beradi — regulyator va mijozga tushuntirish oson.',
            'Scaling talab qilmaydi; sonli va kategorial ma’lumotlar bilan ishlaydi.',
            'Xususiyatlar orasidagi chiziqsiz bog‘lanishlar va o‘zaro ta’sirlarni ushlaydi.',
            'Bashorat juda tez — bir necha taqqoslash xolos.',
          ]}
          cons={[
            'Chuqur daraxt osongina overfitting qiladi (training ma’lumotini yodlab oladi).',
            'Beqaror: datasetdagi kichik o‘zgarish butunlay boshqa daraxt berishi mumkin.',
            'Har bir split faqat bitta o‘q bo‘yicha — qiya chegaralarni zinapoya kabi taxminlaydi.',
            'Ko‘p qiymatli xususiyatlarni afzal ko‘rishga moyil.',
          ]}
        />
        <div className="mt-6">
          <UseCases
            items={[
              { icon: <FileCheck2 size={18} />, title: 'Kredit ariza qarorlari', desc: 'Tushuntiriladigan “tasdiqlash / rad etish” qoidalari.' },
              { icon: <ShieldAlert size={18} />, title: 'Risk siyosati', desc: 'Kredit siyosati qoidalarini ma’lumotlardan chiqarish va tekshirish.' },
              { icon: <Banknote size={18} />, title: 'Limitlarni belgilash', desc: 'Mijoz segmentiga qarab kredit karta limiti.' },
              { icon: <Scale size={18} />, title: 'Regulyator hisobotlari', desc: 'Qaror mantiqini auditorlarga ko‘rsatish.' },
              { icon: <GitBranch size={18} />, title: 'Muddati o‘tgan qarzlar', desc: 'Undiruv strategiyasini tanlash (qo‘ng‘iroq, SMS, sud).' },
              { icon: <Leaf size={18} />, title: 'Ensemble asosi', desc: 'Random Forest va Gradient Boosting aynan daraxtlardan quriladi.' },
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/algoritmlar/random-forest" className="chip hover:text-ink"><Target size={12} /> Ko‘p daraxt: Random Forest →</Link>
          <Link to="/laboratoriya" className="chip hover:text-ink">Prediction Lab →</Link>
        </div>
      </Section>
    </AlgorithmShell>
  );
}

function NodeDetails({ node, criterion, all }: { node: TreeNode; criterion: Criterion; all: TreeNode[] }) {
  const impName = criterion === 'gini' ? 'Gini' : 'Entropy';
  const parent = all.find((n) => n.left?.id === node.id || n.right?.id === node.id);
  return (
    <Card>
      <AnimatePresence mode="wait">
        <motion.div key={node.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              Tugun #{node.id} <span className="text-muted">· chuqurlik {node.depth}</span>
            </h3>
            <span className="chip">{node.depth === 0 ? 'Root Node' : node.isLeaf ? 'Leaf Node' : 'Decision Node'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Mijozlar" value={node.samples} />
            <Stat label="Sinf 0 / 1" value={`${node.counts[0]}/${node.counts[1]}`} color="#10B981" />
            <Stat label={impName} value={node.impurity.toFixed(3)} color="#8B5CF6" />
          </div>
          {parent && parent.split && (
            <p className="text-muted">
              Ota tugundan: <span className="font-mono text-ink">{conditionText(parent.split.feature, parent.split.threshold)}</span> →{' '}
              {parent.left?.id === node.id ? 'Ha' : 'Yo‘q'}
            </p>
          )}
          {node.split ? (
            <>
              <p>
                Tekshiriladigan shart: <span className="font-mono font-semibold text-electric">{conditionText(node.split.feature, node.split.threshold)}</span>
              </p>
              <p className="text-slate-300">
                Nega shu xususiyat? Har bir xususiyatning eng yaxshi split’i solishtirildi va eng katta {impName} Gain shu shartda:
              </p>
              <div className="space-y-1">
                {node.bestPerFeature.map((c, i) => (
                  <div key={c.feature} className={`flex items-center justify-between rounded-md px-2 py-1 font-mono text-xs ${i === 0 ? 'bg-electric/15 text-ink' : 'text-muted'}`}>
                    <span>{conditionText(c.feature, c.threshold)}</span>
                    <span>gain {c.gain.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-300">
                Keyingi tugunlar: chap (Ha) — {node.left?.samples} ta [{node.left?.counts.join('/')}], o‘ng (Yo‘q) — {node.right?.samples} ta [{node.right?.counts.join('/')}].
              </p>
            </>
          ) : (
            <>
              <p>
                Barg qarori: <ClassPill label={node.prediction} size="sm" /> (P(1) = {node.probability.toFixed(3)})
              </p>
              <p className="text-slate-300">Nima uchun barg? {node.stopReason && STOP_TEXT[node.stopReason]}</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
