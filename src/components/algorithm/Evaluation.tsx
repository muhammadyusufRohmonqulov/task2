import type { Metrics } from '../../types';
import { TEST, TRAIN } from '../../data/bankDataset';
import { overfitStatus } from '../../algorithms/evaluation';
import { ConfusionMatrixView, pct } from '../common/misc';
import { MetricsBars } from '../charts/Charts';
import FormulaCard from '../common/FormulaCard';
import Tex from '../common/Tex';
import { Card, CardTitle } from '../ui/Card';
import DataTable from '../common/DataTable';

/** Bitta modelning train/test baholash paneli (confusion matrix + metrikalar). */
export function EvaluationPanel({ train, test, color, modelName }: { train: Metrics; test: Metrics; color: string; modelName: string }) {
  const of = overfitStatus(train, test);
  const rows = [
    { k: 'Training', m: train, n: TRAIN.y.length },
    { k: 'Testing', m: test, n: TEST.y.length },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle title={`${modelName}: Confusion Matrix (test)`} subtitle={`Test to‘plami: ${TEST.y.length} ta mijoz, o‘qitishda ishlatilmagan`} />
        <ConfusionMatrixView cm={test.cm} />
      </Card>
      <Card>
        <CardTitle title="Test metrikalari" subtitle="Positive sinf = 1 (to‘lovda muammo)" />
        <MetricsBars m={test} color={color} />
      </Card>
      <Card className="lg:col-span-2">
        <CardTitle title="Training va Testing natijalari" subtitle={`Overfitting holati: ${of.label} (train − test accuracy = ${((train.accuracy - test.accuracy) * 100).toFixed(1)} p.p.)`} />
        <DataTable
          rows={rows}
          rowKey={(r) => r.k}
          maxHeight="none"
          columns={[
            { key: 'k', header: 'To‘plam', render: (r) => <span className="font-sans text-ink">{r.k}</span> },
            { key: 'n', header: 'N', render: (r) => r.n, align: 'right' },
            { key: 'tp', header: 'TP', render: (r) => r.m.cm.tp, align: 'right' },
            { key: 'tn', header: 'TN', render: (r) => r.m.cm.tn, align: 'right' },
            { key: 'fp', header: 'FP', render: (r) => r.m.cm.fp, align: 'right' },
            { key: 'fn', header: 'FN', render: (r) => r.m.cm.fn, align: 'right' },
            { key: 'a', header: 'Accuracy', render: (r) => pct(r.m.accuracy), align: 'right' },
            { key: 'p', header: 'Precision', render: (r) => pct(r.m.precision), align: 'right' },
            { key: 'r', header: 'Recall', render: (r) => pct(r.m.recall), align: 'right' },
            { key: 'f', header: 'F1', render: (r) => pct(r.m.f1), align: 'right' },
          ]}
        />
      </Card>
    </div>
  );
}

/** Confusion matrix va metrika formulalari + bank misolidagi izoh (hisob qiymatlari haqiqiy modeldan). */
export function MetricsExplainer({ m, modelName }: { m: Metrics; modelName: string }) {
  const { tp, tn, fp, fn } = m.cm;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle title="Confusion Matrix nima?" />
          <div className="prose-uz text-sm">
            <p>
              Confusion Matrix — model bashoratlarini haqiqiy javoblar bilan solishtiruvchi 2×2 jadval. Bizda <strong>positive sinf = 1</strong>{' '}
              (mijoz kredit to‘lovida muammoga uchragan).
            </p>
            <ul>
              <li><strong>TP (True Positive)</strong> — muammoli mijozni model to‘g‘ri “xavfli” deb topdi.</li>
              <li><strong>TN (True Negative)</strong> — yaxshi mijozni model to‘g‘ri “xavfsiz” deb topdi.</li>
              <li><strong>FP (False Positive)</strong> — yaxshi mijozni model xato “xavfli” dedi.</li>
              <li><strong>FN (False Negative)</strong> — muammoli mijozni model xato “xavfsiz” dedi.</li>
            </ul>
          </div>
        </Card>
        <Card>
          <CardTitle title="Bank uchun FN va FP qanchalik qimmat?" />
          <div className="prose-uz text-sm">
            <p>
              <strong className="text-rose-300">False Negative</strong> — bank to‘lay olmaydigan mijozga kredit beradi. Natijada
              muddati o‘tgan qarz, zaxira (provision) xarajatlari va to‘g‘ridan-to‘g‘ri moliyaviy yo‘qotish yuzaga keladi. Kredit
              riskida bu odatda eng qimmat xato.
            </p>
            <p>
              <strong className="text-amber-300">False Positive</strong> — ishonchli mijoz rad etiladi. Bank foiz daromadini yo‘qotadi,
              mijoz raqobatchi bankka ketadi. Bu ham zarar, lekin odatda FN dan kichikroq.
            </p>
            <p>
              Shuning uchun kredit modelida faqat Accuracy’ga emas, ayniqsa <strong>Recall</strong>ga (muammoli mijozlarning qanchasini
              ushlay oldik) e’tibor beriladi.
            </p>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FormulaCard
          title="Accuracy — umumiy aniqlik"
          tex={String.raw`\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}`}
          meaning="Barcha bashoratlarning qancha qismi to‘g‘ri ekanini ko‘rsatadi."
          symbols={[
            { sym: 'TP, TN', desc: 'to‘g‘ri bashoratlar' },
            { sym: 'FP, FN', desc: 'xato bashoratlar' },
          ]}
          when="Sinflar taxminan teng bo‘lganda yaxshi umumiy ko‘rsatkich. Sinflar nomutanosib bo‘lsa, aldashi mumkin."
          example={<Tex>{String.raw`\frac{${tp} + ${tn}}{${tp} + ${tn} + ${fp} + ${fn}} = ${m.accuracy.toFixed(3)}`}</Tex>}
        />
        <FormulaCard
          title="Precision — aniqlik (xavfli deb topilganlar ichida)"
          tex={String.raw`\text{Precision} = \frac{TP}{TP + FP}`}
          meaning="Model “xavfli” degan mijozlarning qanchasi haqiqatan ham muammoli bo‘lgan."
          symbols={[
            { sym: 'TP', desc: 'to‘g‘ri topilgan muammoli mijozlar' },
            { sym: 'FP', desc: 'xato “xavfli” deyilgan yaxshi mijozlar' },
          ]}
          when="Yaxshi mijozni rad etish qimmat bo‘lsa (FP xarajati yuqori) muhim. Maxraj 0 bo‘lsa, 0 qaytariladi."
          example={<Tex>{String.raw`\frac{${tp}}{${tp} + ${fp}} = ${m.precision.toFixed(3)}`}</Tex>}
        />
        <FormulaCard
          title="Recall — to‘liqlik (sezgirlik)"
          tex={String.raw`\text{Recall} = \frac{TP}{TP + FN}`}
          meaning="Haqiqatan muammoli bo‘lgan mijozlarning qanchasini model ushlay oldi."
          symbols={[
            { sym: 'TP', desc: 'to‘g‘ri topilgan muammoli mijozlar' },
            { sym: 'FN', desc: 'o‘tkazib yuborilgan muammoli mijozlar' },
          ]}
          when="FN xarajati yuqori bo‘lganda (kredit riski, firibgarlik) eng muhim metrika. Maxraj 0 bo‘lsa, 0."
          example={<Tex>{String.raw`\frac{${tp}}{${tp} + ${fn}} = ${m.recall.toFixed(3)}`}</Tex>}
        />
        <FormulaCard
          title="F1-score — muvozanat"
          tex={String.raw`F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}`}
          meaning="Precision va Recall’ning garmonik o‘rtachasi: ikkalasi ham yuqori bo‘lsagina F1 yuqori bo‘ladi."
          symbols={[
            { sym: 'P', desc: 'Precision' },
            { sym: 'R', desc: 'Recall' },
          ]}
          when="Sinflar nomutanosib bo‘lganda va FP ham, FN ham muhim bo‘lganda. P + R = 0 bo‘lsa, 0."
          example={
            <Tex>{String.raw`2 \cdot \frac{${m.precision.toFixed(3)} \cdot ${m.recall.toFixed(3)}}{${m.precision.toFixed(3)} + ${m.recall.toFixed(3)}} = ${m.f1.toFixed(3)}`}</Tex>
          }
        />
      </div>
      <p className="text-xs text-muted">Yuqoridagi sonli misollar {modelName} modelining test to‘plamidagi haqiqiy natijalaridan olingan.</p>
    </div>
  );
}
