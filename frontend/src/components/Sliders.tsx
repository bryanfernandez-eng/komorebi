// Sliders.tsx — clean, minimal, no decoration for its own sake

const MOOD_STEPS  = ['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','✨'];
const SLEEP_STEPS = ['💀','😵','🥱','😴','😪','🛌','😌','😏','💪','🌟'];
const STRESS_STEPS = ['🧘','😌','😐','🤔','😬','😰','😱','🤯','🔥','💥'];

// Single, shared slider primitive
function Slider({
  id,
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  steps,
  accentColor,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  steps: string[];
  accentColor: string;
}) {
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#666]">
          {label}
        </label>
        <span className="text-sm" aria-label={`${value} out of 10`}>
          {steps[value - 1]}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-[3px] rounded-full bg-[#222] cursor-pointer">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 transition-[left] duration-75"
          style={{
            left: `calc(${pct}% - 9px)`,
            backgroundColor: '#0c0c0c',
            borderColor: accentColor,
          }}
        />
        {/* Native input (invisible, handles all interaction) */}
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '18px', marginTop: '-7px' }}
        />
      </div>

      {/* Min / value / max row */}
      <div className="flex items-center justify-between text-[11px] text-[#444]">
        <span>{lowLabel}</span>
        <span className="font-medium text-[#555]">{value} / 10</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// Public exports — thin wrappers with preset configs
export function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-mood"
      label="Mood"
      value={value}
      onChange={onChange}
      lowLabel="Really low"
      highLabel="Amazing"
      steps={MOOD_STEPS}
      accentColor="#7eb88a"
    />
  );
}

export function SleepSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-sleep"
      label="Sleep quality"
      value={value}
      onChange={onChange}
      lowLabel="Barely slept"
      highLabel="Slept great"
      steps={SLEEP_STEPS}
      accentColor="#7eb88a"
    />
  );
}

export function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // Stress accent shifts from calm (green) → tense (amber) → overwhelmed (red)
  const stressColor =
    value <= 3 ? '#7eb88a' :
    value <= 6 ? '#c9955a' :
                 '#c06060';

  return (
    <Slider
      id="slider-stress"
      label="Stress level"
      value={value}
      onChange={onChange}
      lowLabel="Very calm"
      highLabel="Overwhelmed"
      steps={STRESS_STEPS}
      accentColor={stressColor}
    />
  );
}
