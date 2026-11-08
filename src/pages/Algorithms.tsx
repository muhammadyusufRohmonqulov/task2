import { ALGORITHMS } from '../data/algorithms';
import AlgorithmCard from '../components/algorithm/AlgorithmCard';
import { PageHeader } from '../components/common/misc';

export default function Algorithms() {
  return (
    <div>
      <PageHeader
        eyebrow="Algoritmlar"
        title={
          <>
            Machine Learning <span className="gradient-text">laboratoriyalari</span>
          </>
        }
        desc="Uchta klassifikatsiya (Supervised) va bitta klasterizatsiya (Unsupervised) algoritmi. Har bir sahifa bir xil tuzilishga ega: nazariya → masala → dataset → formulalar → bosqichlar → laboratoriya → grafiklar → parametrlar → natija → xulosa."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ALGORITHMS.map((a, i) => (
            <AlgorithmCard key={a.id} a={a} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
