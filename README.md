# BankML Lab — Interactive Machine Learning Laboratory

**BankML Lab** — bank sohasi misolida Machine Learning algoritmlarining ishlash mexanizmini, matematik asoslarini va hisob-kitoblarini interaktiv tarzda o‘rgatuvchi o‘quv web-platformasi.

Platformada 4 ta algoritm bor, ularning barchasi **tashqi ML kutubxonalarisiz, noldan TypeScript’da** yozilgan va **brauzerning o‘zida** ishlaydi:

| Yo‘nalish | Algoritm | Bank masalasi |
|---|---|---|
| Klassifikatsiya (Supervised) | **K-Nearest Neighbors (KNN)** | Yangi mijozning kreditni qaytarmaslik xavfi — eng yaqin mijozlar asosida |
| Klassifikatsiya (Supervised) | **Decision Tree (CART)** | Kredit qarori — shartlar va qarorlar daraxti orqali |
| Klassifikatsiya (Supervised) | **Random Forest** | Ko‘p daraxtlar ovozi orqali kredit xavfini baholash |
| Klasterizatsiya (Unsupervised) | **K-Means** | Mijozlarni daromad va xarajat bo‘yicha segmentlarga ajratish |

> **Eslatma:** Platformada real mijozlarning shaxsiy ma’lumotlari emas, Machine Learning algoritmlarini o‘rganish uchun sun’iy yaratilgan ma’lumotlardan foydalaniladi.

---

## Texnologiyalar

- **React 18 + TypeScript** — interfeys
- **Vite 5** — dev server va production build
- **Tailwind CSS 3** — dark futuristic dizayn (glassmorphism, gradientlar, grid fon)
- **Framer Motion** — algoritmni tushuntiruvchi animatsiyalar
- **Recharts** + maxsus **SVG** chizmalar — grafik va diagrammalar
- **KaTeX** — matematik formulalar
- **Lucide React** — ikonkalar
- **React Router** — sahifalar (SPA)
- **Vitest** — matematik funksiyalar uchun unit testlar

Backend, database, login, pullik API yoki API kaliti **talab qilinmaydi**. Environment variable ham kerak emas.

---

## Lokal ishga tushirish

Talab: **Node.js 18+** (tavsiya: 20 yoki undan yangi).

```bash
npm install
npm run dev
```

Brauzerda: `http://localhost:5173`

Boshqa buyruqlar:

```bash
npm run build     # TypeScript tekshiruvi + production build (dist/ papkaga)
npm run preview   # build natijasini lokal ko‘rish
npm test          # Vitest unit testlari
```

---

## Loyiha tuzilishi

```text
bank-ml-lab/
├── public/favicon.svg
├── src/
│   ├── algorithms/            # ← ML algoritmlarining o‘zi (UI’dan mustaqil)
│   │   ├── knn.ts             # KNN: scaler, masofa, qo‘shnilar, oddiy va weighted ovoz
│   │   ├── decisionTree.ts    # CART: Gini, Entropy, split qidirish, rekursiv qurish, bashorat yo‘li
│   │   ├── randomForest.ts    # Bootstrap, random feature selection, majority voting, OOB
│   │   ├── kmeans.ts          # Lloyd algoritmi, k-means++, WCSS, Elbow
│   │   ├── evaluation.ts      # 3 klassifikatorni bir xil train/test split’da baholash
│   │   └── segments.ts        # K-Means klasterlariga izohiy nom berish
│   ├── data/
│   │   ├── bankDataset.ts     # 150 ta sun’iy kredit mijozi (seed 42) + stratified split
│   │   ├── customerDataset.ts # 88 ta sun’iy segmentatsiya mijozi (seed 42)
│   │   └── algorithms.ts      # algoritmlar metama’lumoti, ranglar
│   ├── utils/
│   │   ├── random.ts          # Mulberry32 seeded RNG, normal/Poisson, shuffle
│   │   ├── statistics.ts      # mean, std, min, max, median
│   │   ├── distance.ts        # Euclidean, Manhattan
│   │   ├── preprocessing.ts   # Z-score, Min-Max, stratified split
│   │   ├── metrics.ts         # Confusion matrix, Accuracy, Precision, Recall, F1
│   │   └── validation.ts      # forma validatsiyasi (o‘zbekcha xabarlar)
│   ├── hooks/useStepPlayer.ts # animatsiya: play / pause / next / prev / reset / tezlik
│   ├── components/
│   │   ├── layout/            # Header, Footer, Layout, Logo
│   │   ├── ui/                # Card, Button, Slider, Segmented, Toggle, NumberField
│   │   ├── common/            # Tex (KaTeX), FormulaCard, DataTable, ProcessStepper, PlayerControls...
│   │   ├── charts/            # Recharts grafiklar, KNN va K-Means SVG scatter
│   │   ├── diagrams/          # TreeDiagram, MiniTree, ForestFlow, Hero va karta vizuallari
│   │   └── algorithm/         # AlgorithmShell (10 bo‘limli sahifa), baholash panellari
│   ├── pages/                 # Home, Algorithms, Dataset, Comparison, PredictionLab, About,
│   │                          # KNNPage, DecisionTreePage, RandomForestPage, KMeansPage
│   ├── types/index.ts
│   ├── App.tsx, main.tsx, index.css
├── tests/algorithms.test.ts   # unit testlar
├── index.html, vite.config.ts, tailwind.config.js, postcss.config.js
├── tsconfig.json, vercel.json, package.json
```

---

## Sahifalar

| Yo‘l | Sahifa |
|---|---|
| `/` | Bosh sahifa: hero, algoritm kartalari, statistika |
| `/algoritmlar` | Barcha algoritmlar |
| `/algoritmlar/knn` | KNN laboratoriyasi |
| `/algoritmlar/decision-tree` | Decision Tree laboratoriyasi |
| `/algoritmlar/random-forest` | Random Forest laboratoriyasi |
| `/algoritmlar/k-means` | K-Means laboratoriyasi |
| `/malumotlar` | Dataset: jadval, qidiruv, sahifalash, statistika, CSV yuklab olish |
| `/taqqoslash` | KNN / DT / RF taqqoslash: metrikalar, confusion matrix, sifat jadvali |
| `/laboratoriya` | Prediction Lab: o‘z mijozingizni kiritib bashorat olish |
| `/haqida` | Platforma haqida |

Har bir algoritm sahifasi bir xil 10 bo‘limdan iborat: **Algoritm haqida → Amaliy masala → Dataset → Matematik asoslar → Ishlash ketma-ketligi → Interaktiv laboratoriya → Grafik va diagrammalar → Parametrlar → Yakuniy natija → Xulosa.**

---

## Asosiy algoritmlar haqida

### KNN
- Scaler (Z-score / Min-Max / yo‘q) **faqat training to‘plamida fit** qilinadi, test va yangi mijozga shu scaler qo‘llanadi.
- Masofa: Euclidean (asosiy) yoki Manhattan. K = 1…25. Oddiy yoki masofaga asoslangan (1/d) ovoz.
- Juft K da ovozlar teng bo‘lsa — weighted ovoz hal qiladi.

### Decision Tree
- CART: har bir xususiyatning barcha noyob qiymatlari o‘rtasi threshold sifatida sinaladi.
- Mezon: Gini yoki Entropy. Parametrlar: Max Depth, Min Samples Split, Min Samples Leaf.
- To‘xtash: toza tugun, maksimal chuqurlik (xavfsiz chegara 15), min samples, Gain ≤ 0.

### Random Forest
- Har bir daraxt o‘z seed’i bilan replacement bilan bootstrap namuna oladi.
- Har bir tugunda tasodifiy `max_features` (sqrt / log2 / 3 / 4 / all) xususiyat.
- Majority voting; ovozlar ulushi kalibrlangan ehtimol emasligi alohida tushuntirilgan. OOB accuracy hisoblanadi.
- 5–100 ta daraxt. Default sozlamalar test to‘plamiga emas, **OOB accuracy** ga qarab tanlangan.

### K-Means
- Lloyd algoritmi, k-means++ yoki tasodifiy boshlanish, maksimal 100 iteratsiya (cheksiz sikl yo‘q).
- Bo‘sh klaster bo‘lsa oldingi centroid saqlanadi. WCSS va Elbow (K = 1…8, har biri 5 ta boshlanish).

### Baholash
- Barcha klassifikatorlar bir xil **stratified 80/20 split** (seed 42): 120 training, 30 testing.
- Confusion matrix, Accuracy, Precision, Recall, F1 — nolga bo‘lishda 0 qaytariladi.

---

## Dataset haqida

**Kredit dataseti** (`src/data/bankDataset.ts`) — 150 ta mijoz: yosh, oylik daromad (mln so‘m), kredit reytingi, DTI (%), kechiktirilgan to‘lovlar, natija (0/1). Generator Mulberry32 seeded RNG (seed = 42) va logistik modeldan foydalanadi: past reyting, yuqori DTI va ko‘p kechikish default ehtimolini oshiradi, lekin tasodifiy shovqin tufayli sinflar to‘liq ajralmaydi.

**Segmentatsiya dataseti** (`src/data/customerDataset.ts`) — 88 ta mijoz: oylik daromad, oylik xarajat, tranzaksiyalar soni. Target ustuni yo‘q.

Ikkala dataset ham har safar bir xil yaratiladi (deterministik).

---

## Vercel’ga joylashtirish

1. GitHub’da yangi repository yarating.
2. Loyihani repository’ga push qiling:
   ```bash
   git init
   git add .
   git commit -m "BankML Lab"
   git branch -M main
   git remote add origin https://github.com/<username>/bank-ml-lab.git
   git push -u origin main
   ```
3. [vercel.com](https://vercel.com) hisobingizga kiring.
4. **Add New → Project** orqali GitHub repository’ni import qiling.
5. **Framework Preset:** Vite.
6. **Build Command:** `npm run build`.
7. **Output Directory:** `dist`.
8. **Deploy** tugmasini bosing.

SPA routing uchun `vercel.json` ichida barcha yo‘llarni `index.html` ga yo‘naltiruvchi rewrite allaqachon sozlangan, shuning uchun `/algoritmlar/knn` kabi sahifalar to‘g‘ridan-to‘g‘ri ochilganda ham ishlaydi. Environment variable kerak emas.

---

## Testlar

```bash
npm test
```

Tekshiriladigan funksiyalar: Euclidean va Manhattan masofa, mean/std va Z-score, Min-Max, Gini, Entropy, split nomzodlari va weighted Gini, Decision Tree qurish va bashorat, Confusion Matrix, Accuracy/Precision/Recall/F1 (nolga bo‘lish holati bilan), K-Means centroid va WCSS, bo‘sh klaster, konvergentsiya va iteratsiya chegarasi, KNN qo‘shnilari va ovozi, bootstrap determinizmi, Random Forest ovozlari, dataset determinizmi, stratified split, CSV eksport, validatsiya.
