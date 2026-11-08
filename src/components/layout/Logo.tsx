export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0B1120" stroke="url(#lg-logo)" strokeOpacity="0.6" />
      <path d="M9 28 L17 14 L24 23 L31 11" fill="none" stroke="url(#lg-logo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[
        [9, 28],
        [17, 14],
        [24, 23],
        [31, 11],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" fill="#0B1120" stroke="url(#lg-logo)" strokeWidth="1.8" />
      ))}
    </svg>
  );
}
