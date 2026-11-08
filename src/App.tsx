import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import PageLoader from './components/common/PageLoader';

const Algorithms = lazy(() => import('./pages/Algorithms'));
const Dataset = lazy(() => import('./pages/Dataset'));
const Comparison = lazy(() => import('./pages/Comparison'));
const PredictionLab = lazy(() => import('./pages/PredictionLab'));
const About = lazy(() => import('./pages/About'));
const KNNPage = lazy(() => import('./pages/KNNPage'));
const DecisionTreePage = lazy(() => import('./pages/DecisionTreePage'));
const RandomForestPage = lazy(() => import('./pages/RandomForestPage'));
const KMeansPage = lazy(() => import('./pages/KMeansPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="algoritmlar" element={<Lazy el={<Algorithms />} />} />
        <Route path="algoritmlar/knn" element={<Lazy el={<KNNPage />} />} />
        <Route path="algoritmlar/decision-tree" element={<Lazy el={<DecisionTreePage />} />} />
        <Route path="algoritmlar/random-forest" element={<Lazy el={<RandomForestPage />} />} />
        <Route path="algoritmlar/k-means" element={<Lazy el={<KMeansPage />} />} />
        <Route path="malumotlar" element={<Lazy el={<Dataset />} />} />
        <Route path="taqqoslash" element={<Lazy el={<Comparison />} />} />
        <Route path="laboratoriya" element={<Lazy el={<PredictionLab />} />} />
        <Route path="haqida" element={<Lazy el={<About />} />} />
        <Route path="*" element={<Lazy el={<NotFound />} />} />
      </Route>
    </Routes>
  );
}

function Lazy({ el }: { el: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{el}</Suspense>;
}
