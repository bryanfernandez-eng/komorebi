import { useState } from 'react';
import { MoodSlider, SleepSlider, StressSlider } from '../components/Sliders';
import { submitCheckin, runAssessment } from '../api';
import { CheckCircle, ArrowRight } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface CheckInProps {
  userId: number;
  userName: string;
}

export default function CheckIn({ userId, userName }: CheckInProps) {
  const [mood,      setMood]      = useState(5);
  const [sleep,     setSleep]     = useState(5);
  const [stress,    setStress]    = useState(5);
  const [text,      setText]      = useState('');
  const [state,     setState]     = useState<FormState>('idle');
  const [checkinId, setCheckinId] = useState<number | null>(null);
  const [error,     setError]     = useState('');

  async function handleSubmit(e: React.SyntheticEvent) {
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
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex items-start justify-center p-6 pt-10">
      <div className="w-full max-w-md">

        <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">

          {/* Card header band */}
          <div className="px-6 py-4 border-b border-[#D1CAA9] bg-[#FBF7EC]">
            <h2 className="text-[15px] font-semibold text-[#304E2F]">
              {state === 'success' ? 'Check-in recorded' : `How are you doing, ${userName}?`}
            </h2>
            <p className="text-[12px] text-[#4E6E4C] mt-0.5">
              {state === 'success'
                ? 'AI agents are now analysing your data.'
                : 'Takes under 30 seconds. AI agents analyse your responses immediately after.'}
            </p>
          </div>

          <div className="p-6">
            {state === 'success' ? (
              /* Success state */
              <div className="py-4 flex flex-col items-center text-center gap-5">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#A8C99A]/20 border border-[#A8C99A]">
                  <CheckCircle className="w-5 h-5 text-[#4E6E4C]" />
                </div>

                <div>
                  <p className="text-[15px] font-semibold text-[#304E2F]">Logged successfully</p>
                  {checkinId && (
                    <p className="text-[12px] text-[#4E6E4C] mt-1">Check-in #{checkinId} saved</p>
                  )}
                </div>

                <div className="w-full grid grid-cols-3 gap-3">
                  {([['Mood', mood], ['Sleep', sleep], ['Stress', stress]] as [string, number][]).map(([k, v]) => (
                    <div key={k} className="bg-[#FBF7EC] border border-[#D1CAA9] rounded-xl p-3 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B69265] mb-1">{k}</div>
                      <div className="text-[18px] font-bold text-[#304E2F]">{v}</div>
                      <div className="text-[10px] text-[#4E6E4C]">out of 10</div>
                    </div>
                  ))}
                </div>

                <p className="text-[13px] text-[#4E6E4C]">
                  Switch to <span className="font-semibold text-[#304E2F]">Wellness Insights</span> to see your AI assessment results.
                </p>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-[12px] text-[#4E6E4C] hover:text-[#304E2F] transition-colors"
                >
                  Submit another check-in
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-7">

                <MoodSlider   value={mood}   onChange={setMood}   />
                <SleepSlider  value={sleep}  onChange={setSleep}  />
                <StressSlider value={stress} onChange={setStress} />

                <div className="pt-1 border-t border-[#D1CAA9]">
                  <label
                    htmlFor="text-entry"
                    className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#4E6E4C] mb-2"
                  >
                    Anything on your mind?{' '}
                    <span className="font-normal normal-case text-[#B69265]">optional</span>
                  </label>
                  <textarea
                    id="text-entry"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Today has been..."
                    className="w-full px-3.5 py-2.5 text-[13px] bg-[#FBF7EC] border border-[#D1CAA9] rounded-xl text-[#594031] placeholder-[#B69265] resize-none outline-none focus:border-[#4E6E4C] transition-colors leading-relaxed"
                    style={{ boxSizing: 'border-box' }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-[#B69265]">{text.length} / 1000</span>
                  </div>
                </div>

                {state === 'error' && (
                  <div className="p-3 rounded-xl bg-[#FBF7EC] border border-[#B69265] text-[13px] text-[#B69265]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all"
                  style={{
                    backgroundColor: state === 'submitting' ? '#D1CAA9' : '#304E2F',
                    color: state === 'submitting' ? '#4E6E4C' : '#FBF7EC',
                    cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'submitting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Submit check-in'}
                </button>

              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] mt-4 text-[#B69265]">
          Your data is private and anonymised
        </p>
      </div>
    </div>
  );
}
