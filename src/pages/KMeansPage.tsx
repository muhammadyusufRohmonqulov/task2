import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gem, Megaphone, PiggyBank, RefreshCw, ShoppingBag, Sparkles, Target, Users, Wallet } from 'lucide-react';
import { CUSTOMERS } from '../data/customerDataset';
import { CLUSTER_COLORS } from '../data/algorithms';
import { computeWCSS, elbowCurve, nearestCentroid, runKMeans, type KMeansInit } from '../algorithms/kmeans';
import { nameSegment, uniqueNames } from '../algorithms/segments';
import { fitScaler, inverseRow, transform } from '../utils/preprocessing';
import { mean } from '../utils/statistics';
import { useStepPlayer } from '../hooks/useStepPlayer';
import AlgorithmShell, { sectionIndex } from '../components/algorithm/AlgorithmShell';
import KMeansScatter from '../components/charts/KMeansScatter';
import { ElbowChart, SimpleBars } from '../components/charts/Charts';
import { AlgoMiniVisual } from '../components/diagrams/Visuals';
import DataTable from '../components/common/DataTable';
import FormulaCard from '../components/common/FormulaCard';
import PlayerControls from '../components/common/PlayerControls';
import ProcessStepper from '../components/common/ProcessStepper';
import Tex, { tn } from '../components/common/Tex';
import { Concept, ProsCons, Section, SyntheticNotice, UseCases } from '../components/common/misc';
import { Callout, Card, CardTitle, Stat } from '../components/ui/Card';
import { Segmented, Slider, Toggle } from '../components/ui/Controls';

const f1 = (v: number) => v.toFixed(1);
const f2 = (v: number) => v.toFixed(2);

export default function KMeansPage() {
  const [k, setK] = useState(4);
  const [use3, setUse3] = useState(false);
  const [standardize, setStandardize] = useState(true);
  const [init, setInit] = useState<KMeansInit>('kmeans++');
  const [seed, setSeed] = useState(42);
  const [focus, setFocus] = useState(0);

  const raw = useMemo(() => CUSTOMERS.map((c) => (use3 ? [c.income, c.spending, c.transactions] : [c.income, c.spending])), [use3]);
  const scaler = useMemo(() => fitScaler(raw, standardize ? 'zscore' : 'none'), [raw, standardize]);
  const Xs = useMemo(() => transform(scaler, raw), [scaler, raw]);
  const res = useMemo(() => runKMeans(Xs, { k, seed, init, maxIter: 100 }), [Xs, k, seed, init]);
  const elbow = useMemo(() => elbowCurve(Xs, 1, 8, 42), [Xs]);
  const toRaw = (c: number[]) => inverseRow(scaler, c);
  const toXY = (c: number[]) => {
    const r = toRaw(c);
    return { x: r[0], y: r[1] };
  };

  // Animatsiya bosqichlari
  const nIt = res.iterations.length;
  const total = 3 + 2 * nIt;
  const player = useStepPlayer(total, { resetKey: `${k}|${use3}|${standardize}|${init}|${seed}` });
  const st = player.started ? player.step : total - 1;
  const view = (() => {
    if (st === 0) return { phase: 'points' as const, it: null, assign: null, cents: res.initialCentroids, prev: null, showC: false, lines: false };
    if (st === 1) return { phase: 'init' as const, it: null, assign: null, cents: res.initialCentroids, prev: null, showC: true, lines: false };
    if (st >= total - 1) {
      const last = res.iterations[nIt - 1];
      return { phase: 'final' as const, it: last, assign: last.assignments, cents: last.centroidsAfter, prev: null, showC: true, lines: false };
    }
    const i = Math.floor((st - 2) / 2);
    const it = res.iterations[i];
    return (st - 2) % 2 === 0
      ? { phase: 'assign' as const, it, assign: it.assignments, cents: it.centroidsBefore, prev: null, showC: true, lines: true }
      : { phase: 'update' as const, it, assign: it.assignments, cents: it.centroidsAfter, prev: it.centroidsBefore, showC: true, lines: false };
  })();

  const points = useMemo(() => CUSTOMERS.map((c) => ({ id: c.id, x: c.income, y: c.spending, extra: `${c.transactions} tx` })), []);
  const curIt = view.it ?? res.iterations[0];
  const focusC = CUSTOMERS[focus];
  const fd = nearestCentroid(Xs[focus], curIt.centroidsBefore);

  // Yakuniy klaster statistikasi
  const meanInc = mean(CUSTOMERS.map((c) => c.income));
  const meanSp = mean(CUSTOMERS.map((c) => c.spending));
  const clusters = useMemo(() => {
    const rows = Array.from({ length: res.k }, (_, j) => {
      const members = CUSTOMERS.filter((_, i) => res.assignments[i] === j);
      const inc = mean(members.map((m) => m.income));
      const sp = mean(members.map((m) => m.spending));
      const tx = mean(members.map((m) => m.transactions));
      const cr = toRaw(res.centroids[j]);
      return { j, n: members.length, inc, sp, tx, cr, label: nameSegment(inc, sp, meanInc, meanSp) };
    });
    const names = uniqueNames(rows.map((r) => r.label));
    return rows.map((r, i) => ({ ...r, label: names[i] }));
  }, [res]); // eslint-disable-line react-hooks/exhaustive-deps

  // Centroid hisoblash misoli (1-klaster, joriy iteratsiya)
  const cj = 0;
  const membersJ = CUSTOMERS.filter((_, i) => curIt.assignments[i] === cj);
  const sumInc = membersJ.reduce((a, m) => a + m.income, 0);
  const sumSp = membersJ.reduce((a, m) => a + m.spending, 0);

  const phaseText = {
    points: `${CUSTOMERS.length} ta mijoz grafikda. Ularning guruhi hali noma’lum — target yo‘q.`,
    init: `${init === 'kmeans++' ? 'k-means++' : 'Tasodifiy'} usulida ${res.k} ta dastlabki centroid tanlandi.`,
    assign: `Iteratsiya ${curIt.iteration}: har bir mijoz eng yaqin centroidga biriktirildi. ${curIt.changedAssignments} ta mijoz klasterini o‘zgartirdi.`,
    update: `Iteratsiya ${curIt.iteration}: centroidlar o‘z klasteri nuqtalarining o‘rtachasiga siljidi. Maks. siljish = ${Math.max(...curIt.shift).toFixed(4)}. WCSS = ${curIt.wcss.toFixed(3)}.`,
    final: `${res.converged ? 'Konvergentsiya' : 'Maksimal iteratsiya'}: ${nIt} ta iteratsiyadan so‘ng centroidlar barqarorlashdi. Yakuniy WCSS = ${res.wcss.toFixed(3)}.`,
  }[view.phase];

  const unit = standardize ? 'standartlashtirilgan' : 'mln so‘m';
  const initWcss = computeWCSS(Xs, res.iterations[0].assignments, res.initialCentroids);

  return (
    <AlgorithmShell
      algo="k-means"
      definition={
        <>
          <b className="text-ink">K-Means</b> — yorliqsiz ma’lumotlarni o‘xshashlik bo‘yicha <b className="text-violet">K</b> ta guruhga (klasterga) ajratadigan Unsupervised Learning
          algoritmi. Har bir klaster o‘z markazi — <b>centroid</b> bilan ifodalanadi va har bir mijoz eng yaqin centroidga tegishli bo‘ladi.
        </>
      }
      problem={
        <>
          Bank o‘z mijozlarini daromadi, xarajati va tranzaksiya faolligiga qarab segmentlarga ajratmoqchi — masalan, tejamkor, faol va premium mijozlar. Har bir segmentga
          mos mahsulot (depozit, keshbek karta, VIP xizmat) taklif qilinadi. Oldindan segment yorliqlari yo‘q.
        </>
      }
      learningSteps={['Clustering', 'Standartlashtirish', 'Centroidlar', 'Iteratsiyalar', 'WCSS & Elbow', 'Segmentlar']}
      visual={<div className="h-64 w-full sm:h-72"><AlgoMiniVisual id="k-means" /></div>}
    >
      {/* 1 */}
      <Section id="haqida" index={sectionIndex('haqida')} title="K-Means nima?" subtitle="Klassifikatsiyadan farqi: bu yerda to‘g‘ri javob (target) yo‘q">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <div className="prose-uz">
              <p>
                <strong>Clustering (klasterizatsiya)</strong> — obyektlarni oldindan berilgan sinflarsiz, faqat bir-biriga o‘xshashligiga qarab guruhlash. KNN, Decision Tree va
                Random Forest’da har bir mijozning javobi (0/1) ma’lum edi. K-Means’da esa <strong>hech qanday yorliq yo‘q</strong> — algoritm guruhlarni o‘zi kashf qiladi.
              </p>
              <p>
                <strong>Unsupervised Learning</strong> — “o‘qituvchisiz o‘rganish”. Model to‘g‘ri javobni ko‘rmaydi; u ma’lumotlar ichidagi tuzilmani (zich guruhlarni) topadi.
              </p>
              <p>
                <strong>K-Means</strong> ikki qadamni takrorlaydi: (1) har bir mijozni eng yaqin markazga biriktirish; (2) har bir markazni o‘z mijozlarining o‘rtachasiga
                ko‘chirish. Markazlar joyidan qimirlamay qolganda algoritm to‘xtaydi.
              </p>
            </div>
            <Callout tone="info" title="Hayotiy misol">
              Maktab hovlisida bolalar tarqoq turibdi. O‘qituvchi 3 ta bayroqni tasodifiy joyga qo‘yadi va har bir bola eng yaqin bayroq yoniga boradi. Keyin har bir bayroq
              o‘z guruhining o‘rtasiga ko‘chiriladi, bolalar yana eng yaqin bayroqni tanlaydi… Bir necha qadamdan so‘ng guruhlar barqarorlashadi.
            </Callout>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Concept term="K" en="n_clusters">Klasterlar soni — foydalanuvchi oldindan belgilaydi (masalan, Elbow usuli yordamida).</Concept>
            <Concept term="Centroid" en="markaz">Klaster nuqtalarining o‘rtacha qiymati: masalan, “o‘rtacha daromad 21 mln, xarajat 12 mln”.</Concept>
            <Concept term="Cluster" en="klaster">Bitta centroidga eng yaqin bo‘lgan mijozlar to‘plami.</Concept>
            <Concept term="Intra-cluster distance" en="ichki masofa">Klaster ichidagi nuqtalardan centroidgacha masofa. Qancha kichik — klaster shuncha zich (WCSS).</Concept>
            <Concept term="Inter-cluster distance" en="tashqi masofa">Turli klasterlar centroidlari orasidagi masofa. Qancha katta — klasterlar shuncha aniq ajralgan.</Concept>
            <Concept term="Konvergentsiya" en="convergence">Centroidlar boshqa siljimay qolgan holat. Cheksiz sikl bo‘lmasligi uchun maksimal 100 iteratsiya chegarasi bor.</Concept>
          </div>
        </div>
      </Section>

      {/* 2 */}
      <Section id="masala" index={sectionIndex('masala')} title="Amaliy masala" subtitle="Bank mijozlarini segmentlarga ajratish">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { i: <Wallet size={18} />, t: 'Oddiy / tejamkor mijozlar', d: 'Daromad va xarajat past. Debet karta, kichik jamg‘arma.' },
            { i: <ShoppingBag size={18} />, t: 'Faol mijozlar', d: 'Ko‘p sarflaydi, tranzaksiyalar ko‘p. Keshbek, kredit karta.' },
            { i: <Gem size={18} />, t: 'Premium mijozlar', d: 'Daromad va xarajat yuqori. VIP xizmat, investitsiya mahsulotlari.' },
          ].map((s) => (
            <Card key={s.t}>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 text-violet">{s.i}</div>
              <div className="font-semibold">{s.t}</div>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300">
          Bu nomlar faqat <strong>maqsad namunasi</strong>. K-Means mijozlarni raqamlangan guruhlarga (C1, C2, …) ajratadi; ularga ma’no berish — tahlilchining ishi va u centroid qiymatlariga
          qarab amalga oshiriladi (9-bo‘lim).
        </p>
      </Section>

      {/* 3 */}
      <Section id="dataset" index={sectionIndex('dataset')} title="Dataset" subtitle="K-Means uchun alohida segmentatsiya dataseti — target ustuni yo‘q">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Mijozlar" value={CUSTOMERS.length} color="#8B5CF6" />
              <Stat label="Xususiyatlar" value={use3 ? 3 : 2} hint={use3 ? 'daromad, xarajat, tranzaksiya' : 'daromad, xarajat'} />
              <Stat label="O‘rt. daromad" value={f1(meanInc)} hint="mln so‘m" color="#00D4FF" />
              <Stat label="O‘rt. xarajat" value={f1(meanSp)} hint="mln so‘m" color="#10B981" />
            </div>
            <SyntheticNotice compact />
            <Link to="/malumotlar" className="chip hover:text-ink">To‘liq datasetni ko‘rish →</Link>
          </div>
          <Card>
            <CardTitle title="Namuna" subtitle="Monthly Income, Monthly Spending (mln so‘m), Transactions (oyiga)" />
            <DataTable
              rows={CUSTOMERS.slice(0, 8)}
              rowKey={(r) => r.id}
              maxHeight="none"
              dense
              columns={[
                { key: 'id', header: 'ID', render: (r) => <span className="text-violet">{r.id}</span> },
                { key: 'i', header: 'Daromad', render: (r) => f1(r.income), align: 'right' },
                { key: 's', header: 'Xarajat', render: (r) => f1(r.spending), align: 'right' },
                { key: 't', header: 'Tranzaksiyalar', render: (r) => r.transactions, align: 'right' },
                { key: 'z', header: 'z(daromad)', render: (r) => (scaler.method === 'zscore' ? f2((r.income - scaler.mean[0]) / scaler.std[0]) : '—'), align: 'right' },
                { key: 'zs', header: 'z(xarajat)', render: (r) => (scaler.method === 'zscore' ? f2((r.spending - scaler.mean[1]) / scaler.std[1]) : '—'), align: 'right' },
              ]}
            />
          </Card>
        </div>
      </Section>

      {/* 4 */}
      <Section id="matematika" index={sectionIndex('matematika')} title="Matematik asoslar" subtitle="Masofa, centroid va WCSS formulalari — joriy iteratsiyadagi real qiymatlar">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormulaCard
              accent="#8B5CF6"
              title="Euclidean masofa (mijoz → centroid)"
              tex={String.raw`d(x, c) = \sqrt{\sum_{i=1}^{n} (x_i - c_i)^2}`}
              meaning="Mijoz nuqtasidan klaster markazigacha bo‘lgan to‘g‘ri chiziqli masofa. Mijoz eng kichik masofali centroidga biriktiriladi."
              symbols={[
                { sym: 'x', desc: 'mijoz nuqtasi' },
                { sym: 'c', desc: 'centroid' },
                { sym: 'd', desc: 'masofa' },
                { sym: 'n', desc: `xususiyatlar soni (${use3 ? 3 : 2})` },
              ]}
              when="Har bir iteratsiyaning biriktirish bosqichida, har bir mijoz va har bir centroid jufti uchun."
              example={
                <div className="space-y-1">
                  <div>{focusC.id} va C1 ({unit}):</div>
                  <Tex>{String.raw`\sqrt{${Xs[focus].map((v, i) => `(${tn(v, 2)} - ${tn(curIt.centroidsBefore[0][i], 2)})^2`).join(' + ')}} = ${fd.distances[0].toFixed(3)}`}</Tex>
                </div>
              }
            />
            <FormulaCard
              accent="#00D4FF"
              title="Centroidni yangilash"
              tex={String.raw`C_j = \frac{1}{N_j} \sum_{x_i \in S_j} x_i`}
              meaning="Yangi centroid — klasterga tegishli barcha nuqtalarning o‘rtacha qiymati (har bir koordinata bo‘yicha alohida)."
              symbols={[
                { sym: 'C_j', desc: 'j-klasterning yangi centroidi' },
                { sym: 'N_j', desc: 'j-klasterdagi nuqtalar soni' },
                { sym: 'S_j', desc: 'j-klasterga biriktirilgan nuqtalar to‘plami' },
                { sym: 'x_i', desc: 'klasterdagi nuqta' },
              ]}
              when="Har bir iteratsiyaning yangilash bosqichida. Klaster bo‘sh qolsa, oldingi centroid saqlanadi (nolga bo‘lish yo‘q)."
              example={
                membersJ.length > 0 ? (
                  <div className="space-y-1">
                    <div>Iteratsiya {curIt.iteration}, C1: N₁ = {membersJ.length}</div>
                    <Tex>{String.raw`\bar{x}_{\text{daromad}} = \tfrac{${f1(sumInc)}}{${membersJ.length}} = ${f2(sumInc / membersJ.length)},\quad \bar{x}_{\text{xarajat}} = \tfrac{${f1(sumSp)}}{${membersJ.length}} = ${f2(sumSp / membersJ.length)}`}</Tex>
                    <div className="text-xs text-muted">(mln so‘mda; standartlashtirilgan fazodagi o‘rtacha aynan shu qiymatga mos keladi)</div>
                  </div>
                ) : (
                  'C1 bo‘sh'
                )
              }
            />
          </div>
          <FormulaCard
            accent="#10B981"
            title="WCSS — Within-Cluster Sum of Squares"
            tex={String.raw`\text{WCSS} = \sum_{j=1}^{K} \sum_{x_i \in S_j} \lVert x_i - C_j \rVert^2`}
            meaning="Har bir nuqtadan o‘z klasteri centroidigacha bo‘lgan kvadrat masofalar yig‘indisi. K-Means aynan shu qiymatni minimallashtiradi."
            symbols={[
              { sym: 'K', desc: 'klasterlar soni' },
              { sym: '\\lVert x_i - C_j \\rVert^2', desc: 'kvadrat Euclidean masofa' },
            ]}
            when="Klasterlash sifatini baholash va Elbow usulida K tanlash uchun. Har iteratsiyada WCSS kamayadi yoki o‘zgarmaydi."
            example={<Tex>{String.raw`\text{WCSS}_{\text{boshlang‘ich}} = ${initWcss.toFixed(3)} \;\rightarrow\; \text{WCSS}_{\text{yakuniy}} = ${res.wcss.toFixed(3)}`}</Tex>}
          />
          <Card>
            <CardTitle title={`${focusC.id} mijozdan barcha centroidlargacha masofa`} subtitle={`Iteratsiya ${curIt.iteration} centroidlari · grafikdagi istalgan nuqtani bosib mijozni almashtiring`} />
            <DataTable
              rows={curIt.centroidsBefore.map((c, j) => ({ c, j, d: fd.distances[j] }))}
              rowKey={(r) => r.j}
              maxHeight="none"
              highlight={(r) => (r.j === fd.index ? 'bg-violet/[0.12]' : undefined)}
              columns={[
                { key: 'c', header: 'Centroid', render: (r) => <span className="font-bold" style={{ color: CLUSTER_COLORS[r.j % CLUSTER_COLORS.length] }}>C{r.j + 1}</span> },
                { key: 'x', header: 'Centroid (daromad, xarajat)', render: (r) => { const v = toRaw(r.c); return `(${f2(v[0])}, ${f2(v[1])})`; } },
                { key: 'm', header: 'Mijoz', render: () => `(${f1(focusC.income)}, ${f1(focusC.spending)})` },
                { key: 'd', header: `Masofa (${unit})`, render: (r) => r.d.toFixed(4), align: 'right' },
                { key: 's', header: 'Tanlov', render: (r) => (r.j === fd.index ? <span className="font-sans font-bold text-violet">✓ eng yaqin</span> : ''), align: 'center' },
              ]}
            />
          </Card>
        </div>
      </Section>

      {/* 5 */}
      <Section id="ketma-ketlik" index={sectionIndex('ketma-ketlik')} title="Ishlash ketma-ketligi" subtitle="12 bosqich — joriy natija bo‘yicha">
        <ProcessStepper
          accent="#8B5CF6"
          steps={[
            { title: 'Datasetni tanlash', summary: `${CUSTOMERS.length} ta mijoz`, body: <p>Segmentatsiya dataseti: {CUSTOMERS.length} ta sun’iy mijoz, target ustuni yo‘q.</p> },
            { title: 'Xususiyatlarni ajratish', summary: use3 ? '3 ta xususiyat' : '2 ta xususiyat', body: <p>Ishlatiladigan xususiyatlar: oylik daromad, oylik xarajat{use3 ? ', tranzaksiyalar soni' : ''}. Grafikda X — daromad, Y — xarajat.</p> },
            { title: 'Standartlashtirish', summary: standardize ? 'Z-score' : 'o‘chirilgan', body: standardize && scaler.method === 'zscore' ? <><p>Har bir xususiyat z = (x − μ) / σ ko‘rinishiga keltiriladi:</p><ul>{scaler.mean.map((m, i) => <li key={i}>{['Daromad', 'Xarajat', 'Tranzaksiya'][i]}: μ = {f2(m)}, σ = {f2(scaler.std[i])}</li>)}</ul>{use3 && <p>Tranzaksiyalar soni o‘nlab birlikda — standartlashtirishsiz u masofada ustunlik qilardi.</p>}</> : <p>Standartlashtirish o‘chirilgan: masofa xom qiymatlarda hisoblanadi.{use3 && ' Ehtiyot bo‘ling: tranzaksiyalar soni masofada ustunlik qiladi!'}</p> },
            { title: 'K qiymatini tanlash', summary: `K = ${res.k}`, body: <p>K = {res.k}. Elbow grafigi (7-bo‘lim) qaysi K mantiqiy ekanini ko‘rsatadi.</p> },
            { title: 'Dastlabki centroidlar', summary: init, body: <><p>{init === 'kmeans++' ? 'k-means++: birinchi centroid tasodifiy, keyingilari mavjud centroidlardan uzoqroq nuqtalardan (D² ehtimol bilan) tanlanadi.' : 'Tasodifiy: K ta turli mijoz tasodifiy tanlanadi.'} Seed = {seed}.</p><ul>{res.initialCentroids.map((c, j) => { const v = toRaw(c); return <li key={j}>C{j + 1}: ({f2(v[0])}, {f2(v[1])})</li>; })}</ul></> },
            { title: 'Masofalarni hisoblash', summary: `${CUSTOMERS.length} × ${res.k} masofa`, body: <p>Har bir mijozdan har bir centroidgacha Euclidean masofa: jami {CUSTOMERS.length * res.k} ta masofa har iteratsiyada.</p> },
            { title: 'Eng yaqin centroidga biriktirish', summary: 'argmin d(x, C_j)', body: <p>Masalan, {focusC.id} uchun masofalar: {fd.distances.map((d, j) => `C${j + 1}: ${d.toFixed(3)}`).join(', ')} → C{fd.index + 1}.</p> },
            { title: 'O‘rtacha qiymatni hisoblash', summary: 'har bir klaster uchun', body: <p>1-iteratsiyadan so‘ng klasterlar hajmi: {res.iterations[0].counts.map((c, j) => `C${j + 1} = ${c}`).join(', ')}.</p> },
            { title: 'Yangi centroidlar', summary: 'C_j = mean(S_j)', body: <ul>{res.iterations[0].centroidsAfter.map((c, j) => { const v = toRaw(c); return <li key={j}>C{j + 1}: ({f2(v[0])}, {f2(v[1])})</li>; })}</ul> },
            { title: 'Siljishni tekshirish', summary: 'centroid shift', body: <p>1-iteratsiyadagi siljishlar: {res.iterations[0].shift.map((s) => s.toFixed(3)).join(', ')}. Siljish 10⁻⁶ dan kichik yoki biriktirishlar o‘zgarmasa — to‘xtaymiz.</p> },
            { title: 'Konvergentsiya', summary: `${nIt} iteratsiya`, body: <p>{res.converged ? `Algoritm ${nIt} ta iteratsiyada konvergentsiyaga erishdi.` : `Maksimal iteratsiya soniga yetildi (${nIt}).`} WCSS: {res.iterations.map((i) => i.wcss.toFixed(2)).join(' → ')}.</p> },
            { title: 'Yakuniy klasterlar', summary: `${res.k} ta segment`, body: <ul>{clusters.map((c) => <li key={c.j}>C{c.j + 1}: {c.n} ta mijoz — {c.label.name}</li>)}</ul> },
          ]}
        />
      </Section>

      {/* 6 */}
      <Section id="laboratoriya" index={sectionIndex('laboratoriya')} title="Interaktiv laboratoriya" subtitle="Centroidlar harakati va nuqtalarning klasterlarga biriktirilishi — bosqichma-bosqich">
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <Card className="min-w-0">
            <div className="mb-4"><PlayerControls player={player} /></div>
            <motion.div key={phaseText} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-xl border border-violet/25 bg-violet/[0.07] px-3 py-2 text-sm text-violet-100">
              {player.started ? phaseText : `Yakuniy klasterlar ko‘rsatilmoqda (${nIt} iteratsiya). Jarayonni ko‘rish uchun “Boshlash”ni bosing.`}
            </motion.div>
            <KMeansScatter
              points={points}
              assignments={view.assign}
              centroids={view.cents.map(toXY)}
              prevCentroids={view.prev ? view.prev.map(toXY) : null}
              showLines={view.lines}
              showCentroids={view.showC}
              focusIndex={focus}
              onPointClick={setFocus}
            />
            {use3 && <p className="mt-2 text-xs text-muted">3 xususiyat rejimi: klasterlash tranzaksiyalarni ham hisobga oladi, grafikda esa faqat daromad va xarajat ko‘rinadi.</p>}
          </Card>
          <div className="space-y-5">
            <Card>
              <div className="space-y-5">
                <Slider label="K (klasterlar soni)" value={k} min={2} max={8} onChange={setK} />
                <Segmented<KMeansInit> label="Dastlabki centroidlar" value={init} onChange={setInit} options={[{ value: 'kmeans++', label: 'k-means++' }, { value: 'random', label: 'Tasodifiy' }]} />
                <Toggle label="Z-score standartlashtirish" checked={standardize} onChange={setStandardize} />
                <Toggle label="Tranzaksiyalarni ham qo‘shish (3D)" checked={use3} onChange={setUse3} />
                <button type="button" onClick={() => setSeed((s) => s + 1)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-violet/50">
                  <RefreshCw size={14} /> Yangi boshlang‘ich centroidlar (seed {seed})
                </button>
              </div>
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Iteratsiya {view.it ? view.it.iteration : 0} / {nIt}</span>
                <span className="font-mono text-xs text-muted">WCSS {view.it ? view.it.wcss.toFixed(2) : initWcss.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {view.cents.map((c, j) => {
                  const v = toRaw(c);
                  const cnt = view.it ? view.it.counts[j] : 0;
                  const prev = view.prev ? toRaw(view.prev[j]) : null;
                  return (
                    <div key={j} className="rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: CLUSTER_COLORS[j % CLUSTER_COLORS.length] }}>C{j + 1}</span>
                        <span className="text-muted">{view.assign ? `${cnt} ta mijoz` : '—'}</span>
                      </div>
                      <div className="mt-1 font-mono text-slate-300">
                        {prev ? <>({f2(prev[0])}, {f2(prev[1])}) → </> : null}({f2(v[0])}, {f2(v[1])})
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* 7 */}
      <Section id="grafiklar" index={sectionIndex('grafiklar')} title="Grafik va diagrammalar" subtitle="Iteratsiyalar jurnali, WCSS va Elbow Method">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle title="Elbow Method" subtitle="K = 1…8 uchun WCSS (har bir K uchun 5 ta boshlanishdan eng yaxshisi)" />
              <ElbowChart data={elbow} current={res.k} />
              <p className="mt-1 text-xs leading-relaxed text-muted">
                K oshgan sari WCSS doim kamayadi (K = N bo‘lsa 0). Biz egri chiziq keskin pasayishdan sekin pasayishga o‘tadigan “tirsak” nuqtasini qidiramiz — undan keyin
                yangi klaster qo‘shish kam foyda beradi. Joriy sozlamalarda tirsak taxminan K = {elbowGuess(elbow)} da (keyingi K WCSS’ni 25% dan kam kamaytiradigan birinchi nuqta).
              </p>
            </Card>
            <Card>
              <CardTitle title="Iteratsiyalar bo‘yicha WCSS" subtitle="Har bir iteratsiyadan so‘ng" />
              <SimpleBars data={res.iterations.map((i) => ({ name: `#${i.iteration}`, v: Number(i.wcss.toFixed(3)) }))} color="#8B5CF6" yLabel="WCSS" />
            </Card>
          </div>
          <Card>
            <CardTitle title="Iteratsiyalar jurnali" subtitle="Centroidlarning oldingi va yangi koordinatalari (daromad, xarajat — mln so‘m)" />
            <DataTable
              rows={res.iterations}
              rowKey={(r) => r.iteration}
              maxHeight={420}
              highlight={(r) => (view.it?.iteration === r.iteration ? 'bg-violet/[0.1]' : undefined)}
              columns={[
                { key: 'i', header: 'Iter.', render: (r) => <span className="font-bold text-violet">{r.iteration}</span> },
                { key: 'n', header: 'Klaster hajmlari', render: (r) => r.counts.join(' / ') },
                { key: 'c', header: 'Centroidlar: oldingi → yangi', render: (r) => <span className="whitespace-normal">{r.centroidsBefore.map((c, j) => { const a = toRaw(c); const b = toRaw(r.centroidsAfter[j]); return `C${j + 1}: (${f1(a[0])}, ${f1(a[1])})→(${f1(b[0])}, ${f1(b[1])})`; }).join('  ')}</span> },
                { key: 'ch', header: 'O‘zgargan', render: (r) => r.changedAssignments, align: 'right' },
                { key: 's', header: 'Maks. siljish', render: (r) => Math.max(...r.shift).toFixed(4), align: 'right' },
                { key: 'w', header: 'WCSS', render: (r) => r.wcss.toFixed(3), align: 'right' },
              ]}
            />
          </Card>
        </div>
      </Section>

      {/* 8 */}
      <Section id="parametrlar" index={sectionIndex('parametrlar')} title="Parametrlar" subtitle="Natijaga ta’sir qiluvchi sozlamalar">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Concept term="K" en="n_clusters">2 dan 8 gacha. K o‘zgarsa, centroidlar qayta tanlanadi, nuqtalar qayta guruhlanadi va WCSS yangilanadi.</Concept>
          <Concept term="Initialization" en="init">k-means++ odatda tezroq va barqarorroq yaqinlashadi. “Tasodifiy” bilan seed’ni o‘zgartirib, mahalliy minimumlarni ko‘ring.</Concept>
          <Concept term="Standartlashtirish" en="StandardScaler">3D rejimda o‘chirib ko‘ring: tranzaksiyalar soni (o‘nlab) masofani butunlay egallab oladi.</Concept>
          <Concept term="Max iterations" en="max_iter = 100">Cheksiz sikldan himoya. Odatda K-Means 5–15 iteratsiyada yaqinlashadi.</Concept>
        </div>
        <Callout tone="warn" title="Mahalliy minimum">
          K-Means global eng yaxshi yechimni kafolatlamaydi — natija dastlabki centroidlarga bog‘liq. Shuning uchun amalda algoritm turli boshlanishlar bilan bir necha marta ishga
          tushiriladi va eng kichik WCSS tanlanadi (Elbow grafigida aynan shunday qilingan).
        </Callout>
      </Section>

      {/* 9 */}
      <Section id="natija" index={sectionIndex('natija')} title="Yakuniy klasterlarni izohlash" subtitle="Klaster nomlarini algoritm emas, tahlilchi beradi">
        <Card>
          <DataTable
            rows={clusters}
            rowKey={(r) => r.j}
            maxHeight="none"
            columns={[
              { key: 'id', header: 'Klaster', render: (r) => <span className="font-bold" style={{ color: CLUSTER_COLORS[r.j % CLUSTER_COLORS.length] }}>C{r.j + 1}</span> },
              { key: 'nm', header: 'Izohiy nom', render: (r) => <span className="font-sans font-semibold text-ink">{r.label.name}</span> },
              { key: 'n', header: 'Mijozlar', render: (r) => r.n, align: 'right' },
              { key: 'i', header: 'O‘rt. daromad', render: (r) => f2(r.inc), align: 'right' },
              { key: 's', header: 'O‘rt. xarajat', render: (r) => f2(r.sp), align: 'right' },
              { key: 't', header: 'O‘rt. tranzaksiya', render: (r) => f1(r.tx), align: 'right' },
              { key: 'c', header: 'Centroid', render: (r) => `(${r.cr.map((v) => f1(v)).join(', ')})` },
            ]}
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {clusters.map((c) => (
              <div key={c.j} className="rounded-xl border p-4" style={{ borderColor: `${CLUSTER_COLORS[c.j % CLUSTER_COLORS.length]}40`, background: `${CLUSTER_COLORS[c.j % CLUSTER_COLORS.length]}0a` }}>
                <div className="font-semibold" style={{ color: CLUSTER_COLORS[c.j % CLUSTER_COLORS.length] }}>
                  C{c.j + 1} · {c.label.name}
                </div>
                <p className="mt-1 text-sm text-slate-300">{c.label.description}</p>
              </div>
            ))}
          </div>
          <Callout tone="info" title="Nomlash qoidasi">
            Algoritm faqat C1, C2, … raqamlarini qaytaradi va bu raqamlar har safar (boshqa seed bilan) almashib qolishi mumkin. Nomlar centroid qiymatlarini dataset
            o‘rtachasi (daromad {f1(meanInc)}, xarajat {f1(meanSp)} mln so‘m) bilan solishtirib beriladi: daromad ham, xarajat ham yuqori — “Premium”; daromad yuqori, xarajat past —
            “Jamg‘aruvchi”; daromad past, xarajat nisbatan yuqori — “Faol”; ikkalasi past — “Tejamkor”.
          </Callout>
        </Card>
      </Section>

      {/* 10 */}
      <Section id="xulosa" index={sectionIndex('xulosa')} title="Xulosa" subtitle="Afzalliklar, kamchiliklar va bankdagi qo‘llanilishi">
        <ProsCons
          pros={[
            'Sodda, tez va katta datasetlarga yaxshi masshtablanadi (O(N·K·iteratsiya)).',
            'Natija tushunarli: har bir segment centroid — “o‘rtacha mijoz” bilan ifodalanadi.',
            'Yorliq talab qilmaydi — yangi bozor yoki mahsulot uchun segmentlarni tez topadi.',
            'Har doim konvergentsiyaga erishadi (WCSS kamaymaydigan holatga keladi).',
          ]}
          cons={[
            'K ni oldindan berish kerak; Elbow har doim aniq javob bermaydi.',
            'Natija dastlabki centroidlarga bog‘liq — mahalliy minimumga tushishi mumkin.',
            'Faqat sferik, taxminan teng o‘lchamli klasterlarni yaxshi topadi; outlierlarga sezgir.',
            'Scaling’ga sezgir; kategorial xususiyatlar bilan bevosita ishlamaydi.',
          ]}
        />
        <div className="mt-6">
          <UseCases
            items={[
              { icon: <Users size={18} />, title: 'Mijoz segmentatsiyasi', desc: 'Marketing va mahsulot strategiyasi uchun guruhlar.' },
              { icon: <Megaphone size={18} />, title: 'Maqsadli kampaniyalar', desc: 'Har bir segmentga mos taklif va xabarlar.' },
              { icon: <PiggyBank size={18} />, title: 'Depozit mahsulotlari', desc: 'Jamg‘aruvchi mijozlarni aniqlash va omonat taklif qilish.' },
              { icon: <Gem size={18} />, title: 'Premium banking', desc: 'Yuqori daromadli mijozlarni VIP xizmatga o‘tkazish.' },
              { icon: <Sparkles size={18} />, title: 'Anomaliyalarni topish', desc: 'Hech bir centroidga yaqin bo‘lmagan noodatiy xulq.' },
              { icon: <Target size={18} />, title: 'Filiallar joylashuvi', desc: 'Mijozlar geografiyasini klasterlash.' },
            ]}
          />
        </div>
      </Section>
    </AlgorithmShell>
  );
}

/**
 * Elbow nuqtasini sodda baholash: keyingi K qo‘shilganda WCSS 25% dan kamroq
 * kamayadigan birinchi K (ya’ni yangi klaster qo‘shish kam foyda beradigan nuqta).
 */
function elbowGuess(e: { k: number; wcss: number }[]): number {
  for (let i = 1; i < e.length - 1; i++) {
    const rel = e[i].wcss === 0 ? 0 : (e[i].wcss - e[i + 1].wcss) / e[i].wcss;
    if (rel < 0.25) return e[i].k;
  }
  return e[e.length - 1]?.k ?? 1;
}
