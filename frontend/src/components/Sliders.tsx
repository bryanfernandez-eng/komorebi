// Sliders.tsx — professional, no emoji decorations

function Slider({
  id,
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  accentColor,
  valueLabel,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  accentColor: string;
  valueLabel: string;
}) {
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#4E6E4C]">
          {label}
        </label>
        <span className="text-[11px] font-semibold text-[#594031] bg-[#FBF7EC] border border-[#D1CAA9] px-2 py-0.5 rounded-md">
          {valueLabel}
        </span>
      </div>

      <div className="relative h-[3px] rounded-full bg-[#D1CAA9] cursor-pointer">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 transition-[left] duration-75"
          style={{
            left: `calc(${pct}% - 9px)`,
            backgroundColor: '#FBF7EC',
            borderColor: accentColor,
          }}
        />
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

      <div className="flex items-center justify-between text-[11px] text-[#4E6E4C]">
        <span>{lowLabel}</span>
        <span className="font-medium text-[#594031]">{value} / 10</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

const MOOD_LABELS = ['Very low', 'Low', 'Below average', 'Slightly low', 'Neutral', 'Good', 'Pretty good', 'Great', 'Excellent', 'Amazing'];
const SLEEP_LABELS = ['No sleep', 'Very poor', 'Poor', 'Broken', 'Below avg', 'Okay', 'Good', 'Very good', 'Great', 'Excellent'];
const STRESS_LABELS = ['Very calm', 'Calm', 'Relaxed', 'Mild', 'Moderate', 'Elevated', 'High', 'Very high', 'Intense', 'Overwhelmed'];

export function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-mood"
      label="Mood"
      value={value}
      onChange={onChange}
      lowLabel="Very low"
      highLabel="Amazing"
      accentColor="#A8C99A"
      valueLabel={MOOD_LABELS[value - 1]}
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
      accentColor="#A8C99A"
      valueLabel={SLEEP_LABELS[value - 1]}
    />
  );
}

export function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const stressColor =
    value <= 3 ? '#A8C99A' :
    value <= 6 ? '#B69265' :
                 '#594031';

  return (
    <Slider
      id="slider-stress"
      label="Stress level"
      value={value}
      onChange={onChange}
      lowLabel="Very calm"
      highLabel="Overwhelmed"
      accentColor={stressColor}
      valueLabel={STRESS_LABELS[value - 1]}
    />
  );
}
