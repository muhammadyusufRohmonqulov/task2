export type AlgoId = 'knn' | 'decision-tree' | 'random-forest' | 'k-means';

export interface AlgoInfo {
  id: AlgoId;
  name: string;
  short: string;
  category: 'Classification' | 'Clustering';
  categoryUz: string;
  learning: 'Supervised' | 'Unsupervised';
  summary: string;
  path: string;
  accent: string;
  accentClass: string;
}

export const ALGORITHMS: AlgoInfo[] = [
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    short: 'KNN',
    category: 'Classification',
    categoryUz: 'Klassifikatsiya',
    learning: 'Supervised',
    summary: 'Yangi bank mijozining kreditni qaytarmaslik xavfini eng yaqin mijozlar asosida aniqlash.',
    path: '/algoritmlar/knn',
    accent: '#00D4FF',
    accentClass: 'text-cyan',
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree',
    short: 'DT',
    category: 'Classification',
    categoryUz: 'Klassifikatsiya',
    learning: 'Supervised',
    summary: 'Bank mijozining kreditni qaytarish ehtimolini shartlar va qarorlar daraxti orqali aniqlash.',
    path: '/algoritmlar/decision-tree',
    accent: '#3B82F6',
    accentClass: 'text-electric',
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    short: 'RF',
    category: 'Classification',
    categoryUz: 'Klassifikatsiya',
    learning: 'Supervised',
    summary: 'Bir nechta qaror daraxtlarining natijalarini birlashtirish orqali kredit xavfini baholash.',
    path: '/algoritmlar/random-forest',
    accent: '#10B981',
    accentClass: 'text-emerald',
  },
  {
    id: 'k-means',
    name: 'K-Means',
    short: 'K-Means',
    category: 'Clustering',
    categoryUz: 'Klasterizatsiya',
    learning: 'Unsupervised',
    summary: 'Bank mijozlarini daromadi va xarajatlari asosida turli guruhlarga ajratish.',
    path: '/algoritmlar/k-means',
    accent: '#8B5CF6',
    accentClass: 'text-violet',
  },
];

export const CLASS_COLORS = { 0: '#10B981', 1: '#F43F5E' } as const;
export const CLUSTER_COLORS = ['#00D4FF', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899', '#A3E635'];
