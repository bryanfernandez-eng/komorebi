// Sliders.tsx — professional, match the conservatory style

function Slider({
  id,
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[17px] font-bold text-[#304E2F] tracking-wide" style={{ fontFamily: '"Fraunces", serif' }}>
          {label}
        </label>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#304E2F]">
          {lowLabel} &nbsp;/&nbsp; {highLabel}
        </span>
      </div>

      <div className="relative h-[14px] rounded-full bg-[#EAE2D0] cursor-pointer">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full border-[1.5px] transition-[left] duration-75 shadow-sm"
          style={{
            left: `calc(${pct}% - 12px)`,
            backgroundColor: '#304E2F',
            borderColor: '#FBF7EC',
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
          style={{ height: '24px', marginTop: '-5px' }}
        />
      </div>
    </div>
  );
}



export function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-mood"
      label="Mood"
      value={value}
      onChange={onChange}
      lowLabel="HEAVY"
      highLabel="RADIANT"
    />
  );
}

export function SleepSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-sleep"
      label="Sleep"
      value={value}
      onChange={onChange}
      lowLabel="RESTLESS"
      highLabel="DEEP"
    />
  );
}

export function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      id="slider-stress"
      label="Stress"
      value={value}
      onChange={onChange}
      lowLabel="CALM"
      highLabel="TENSE"
    />
  );
}
