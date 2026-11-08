import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepPlayer } from '../../hooks/useStepPlayer';
import type { AnimationSpeed } from '../../types';

const SPEEDS: { v: AnimationSpeed; label: string }[] = [
  { v: 'slow', label: 'Sekin' },
  { v: 'normal', label: 'Normal' },
  { v: 'fast', label: 'Tez' },
];

/** Animatsiya boshqaruv paneli: Boshlash / To‘xtatish / Davom ettirish / Oldingi / Keyingi / Qayta boshlash / Tezlik. */
export default function PlayerControls({ player, label }: { player: StepPlayer; label?: string }) {
  const { playing, started, step, total, isEnd } = player;
  const playLabel = playing ? 'To‘xtatish' : !started || isEnd ? (isEnd && started ? 'Qaytadan ko‘rish' : 'Boshlash') : 'Davom ettirish';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={playing ? player.pause : player.play}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-4 py-2 text-sm font-semibold text-navy shadow-glow transition hover:brightness-110"
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
        {playLabel}
      </button>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03]">
        <IconBtn onClick={player.prev} disabled={step === 0} label="Oldingi bosqich">
          <ChevronLeft size={16} />
        </IconBtn>
        <span className="min-w-[64px] px-1 text-center font-mono text-xs text-muted tabular-nums">
          {step + 1} / {total}
        </span>
        <IconBtn onClick={player.next} disabled={isEnd} label="Keyingi bosqich">
          <ChevronRight size={16} />
        </IconBtn>
      </div>
      <IconBtn onClick={player.reset} label="Qayta boshlash" bordered>
        <RotateCcw size={15} />
        <span className="hidden text-xs sm:inline">Qayta boshlash</span>
      </IconBtn>
      <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Animatsiya tezligi">
        {SPEEDS.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => player.setSpeed(s.v)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              player.speed === s.v ? 'bg-white/10 text-cyan' : 'text-muted hover:text-ink'
            }`}
            aria-pressed={player.speed === s.v}
          >
            {s.label}
          </button>
        ))}
      </div>
      {label && <div className="w-full text-xs text-muted">{label}</div>}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
  bordered,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  bordered?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-muted transition hover:text-ink disabled:opacity-30 ${
        bordered ? 'border border-white/10 bg-white/[0.03]' : ''
      }`}
    >
      {children}
    </button>
  );
}
