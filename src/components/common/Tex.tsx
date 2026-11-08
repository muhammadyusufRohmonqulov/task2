import { useMemo } from 'react';
import katex from 'katex';

/** KaTeX orqali matematik formulani chizadi. `block` — alohida qatorda markazda. */
export default function Tex({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: 'ignore', output: 'html' }),
    [children, block],
  );
  return block ? (
    <div className={`overflow-x-auto scroll-thin ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Sonni KaTeX ichida xavfsiz ko‘rsatish uchun formatlash. */
export const tn = (v: number, d = 3) => {
  if (!Number.isFinite(v)) return '0';
  const s = v.toFixed(d);
  return s.startsWith('-') ? `(${s})` : s;
};
