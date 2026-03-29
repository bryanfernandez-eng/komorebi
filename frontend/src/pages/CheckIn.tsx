import { useState, useEffect } from 'react';
import { MoodSlider, SleepSlider, StressSlider } from '../components/Sliders';
import { submitCheckin, runAssessment } from '../api';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

// Derive a simple vibe from mood vs stress — used only for the window tint
function vibe(mood: number, stress: number): 'clear' | 'mixed' | 'heavy' {
  const score = mood * 1.2 - stress;
  if (score > 5) return 'clear';
  if (score > 0) return 'mixed';
  return 'heavy';
}

// Window pane shown above the form — minimal, purposeful
function WindowPane({ mood, stress }: { mood: number; stress: number }) {
  const state = vibe(mood, stress);
  const [fogKey, setFogKey] = useState(0);

  // Trigger fog wipe when state changes
  useEffect(() => {
    setFogKey(prev => prev + 1);
  }, [state]);

  const skyColors: Record<typeof state, string> = {
    clear:  '#FBF7EC',
    mixed:  '#D1CAA9',
    heavy:  '#594031',
  };

  const groundColors: Record<typeof state, string> = {
    clear: '#A8C99A',
    mixed: '#4E6E4C',
    heavy: '#304E2F',
  };

  const sunOpacity: Record<typeof state, number> = {
    clear: 1,
    mixed: 0.35,
    heavy: 0,
  };

  return (
    <div
      className="relative w-full rounded-t-[16px] overflow-hidden"
      style={{ height: '120px', backgroundColor: skyColors[state], transition: 'background-color 0.8s ease' }}
      aria-hidden="true"
    >
      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '40px',
          backgroundColor: groundColors[state],
          transition: 'background-color 0.8s ease',
        }}
      />

      {/* Sun */}
      <div
        className="absolute"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#B69265',
          top: 20,
          right: 32,
          opacity: sunOpacity[state],
          transition: 'opacity 0.8s ease',
          boxShadow: '0 0 16px 4px rgba(182,146,101,0.35)',
        }}
      />

      {/* Cloud(s) — shown when mixed or heavy */}
      {(state === 'mixed' || state === 'heavy') && (
        <>
          <div
            className="absolute"
            style={{
              width: 72, height: 28,
              borderRadius: 99,
              backgroundColor: state === 'heavy' ? '#304E2F' : '#FBF7EC',
              top: 18, left: 28,
              transition: 'background-color 0.8s ease',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 44, height: 20,
              borderRadius: 99,
              backgroundColor: state === 'heavy' ? '#4E6E4C' : '#FBF7EC',
              top: 26, left: 56,
              transition: 'background-color 0.8s ease',
            }}
          />
          {state === 'heavy' && (
            <div
              className="absolute"
              style={{ width: 88, height: 32, borderRadius: 99, backgroundColor: '#304E2F', top: 12, right: 40 }}
            />
          )}
        </>
      )}

      {/* Fog wipe animation (triggers on state change) */}
      <div
        key={fogKey}
        className="absolute inset-0 bg-white/70 blur-md pointer-events-none animate-fog-wipe"
      />

      {/* Window frame — two bars that visually make a 4-pane window */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#304E2F]/20 -translate-x-1/2" />
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#304E2F]/20 -translate-y-1/2" />
      </div>
    </div>
  );
}

interface CheckInProps {
  userId: number;
  userName: string;
}

export default function CheckIn({ userId, userName }: CheckInProps) {
  const [mood,   setMood]   = useState(5);
  const [sleep,  setSleep]  = useState(5);
  const [stress, setStress] = useState(5);
  const [text,   setText]   = useState('');
  const [state,  setState]  = useState<FormState>('idle');
  const [checkinId, setCheckinId] = useState<number | null>(null);
  const [error,  setError]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setError('');
    try {
      const result = await submitCheckin({
        user_id: userId,
        mood, sleep, stress,
        text_entry: text.trim() || undefined,
        language: 'en',
      });
      setCheckinId(result.checkin_id);
      // Trigger ADK pipeline assessment after check-in
      await runAssessment(userId).catch(() => {});
      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      setState('error');
    }
  }

  function handleReset() {
    setState('idle');
    setMood(5); setSleep(5); setStress(5);
    setText(''); setCheckinId(null); setError('');
  }

  return (
    <div className="min-h-screen bg-[#FBF7EC] flex items-center justify-center p-5">
      <div className="w-full" style={{ maxWidth: 400 }}>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#D1CAA9', border: '1px solid #B69265' }}
        >
          {/* Window pane — top of card */}
          <WindowPane mood={mood} stress={stress} />

          {/* Window frame bottom edge */}
          <div style={{ height: 1, backgroundColor: '#B69265' }} />

          {/* Form body */}
          <div className="p-6">
            {state === 'success' ? (
              /* ── Success ─────────────────────────────────────────────── */
              <div className="py-8 flex flex-col items-center gap-4">
                {/* Checkmark */}
                <div
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FBF7EC', border: '1px solid #A8C99A' }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M4 10l4.5 4.5L16 6" stroke="#A8C99A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="text-center">
                  <p className="text-[15px] font-medium text-[#304E2F]">Logged</p>
                  <p className="text-[13px] text-[#4E6E4C] mt-1">Check-in #{checkinId} saved</p>
                </div>

                <div
                  className="flex gap-5 mt-1"
                  style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#FBF7EC', border: '1px solid #B69265' }}
                >
                  {[['Mood', mood], ['Sleep', sleep], ['Stress', stress]].map(([k, v]) => (
                    <div key={String(k)} className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] text-[#594031] uppercase tracking-wider">{k}</span>
                      <span className="text-[15px] font-medium text-[#304E2F]">{v}<span className="text-[11px] text-[#4E6E4C]">/10</span></span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="mt-1 text-[13px] text-[#594031] hover:text-[#B69265] transition-colors"
                >
                  Check in again
                </button>
              </div>

            ) : (
              /* ── Form ────────────────────────────────────────────────── */
              <form onSubmit={handleSubmit}>

                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-[15px] font-semibold text-[#304E2F]">How are you doing, {userName}?</h1>
                  <p className="text-[13px] text-[#4E6E4C] mt-1 leading-relaxed">
                    Takes 30 seconds. After you submit, AI agents will analyze your responses and update your wellness insights.
                  </p>
                </div>

                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <MoodSlider   value={mood}   onChange={setMood}   />
                  <SleepSlider  value={sleep}  onChange={setSleep}  />
                  <StressSlider value={stress} onChange={setStress} />
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#B69265', margin: '24px 0' }} />

                {/* Text entry */}
                <div>
                  <label
                    htmlFor="text-entry"
                    className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#4E6E4C] mb-2"
                  >
                    Anything on your mind?{' '}
                    <span className="font-normal normal-case text-[#594031]">optional</span>
                  </label>
                  <textarea
                    id="text-entry"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Today has been..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FBF7EC',
                      border: '1px solid #B69265',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: '#594031',
                      resize: 'none',
                      outline: 'none',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#4E6E4C'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#B69265'; }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-[#4E6E4C]">{text.length} / 1000</span>
                  </div>
                </div>

                {/* Error */}
                {state === 'error' && (
                  <div
                    className="mt-4 text-[13px]"
                    style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#FBF7EC', border: '1px solid #B69265', color: '#B69265' }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full mt-6 text-[13px] font-semibold transition-all"
                  style={{
                    padding: '11px 0',
                    borderRadius: 10,
                    backgroundColor: state === 'submitting' ? '#D1CAA9' : '#A8C99A',
                    color: state === 'submitting' ? '#4E6E4C' : '#304E2F',
                    border: `1px solid ${state === 'submitting' ? '#B69265' : '#4E6E4C'}`,
                    cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.01em',
                  }}
                >
                  {state === 'submitting' ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg className="animate-spin" width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Saving…
                    </span>
                  ) : 'Submit check-in'}
                </button>

              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-4 font-semibold" style={{ color: '#B69265' }}>
          Komorebi · Your data is private
        </p>
      </div>
    </div>
  );
}
