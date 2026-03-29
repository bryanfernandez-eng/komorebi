import { useState } from 'react';
import { MoodSlider, SleepSlider, StressSlider } from '../components/Sliders';
import { submitCheckin, runAssessment } from '../api';
import { CheckCircle } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface CheckInProps {
  userId: number;
  userName: string;
}

export default function CheckIn({ userId }: CheckInProps) {
  const [mood,      setMood]      = useState(5);
  const [sleep,     setSleep]     = useState(5);
  const [stress,    setStress]    = useState(5);
  const [text,      setText]      = useState('');
  const [state,     setState]     = useState<FormState>('idle');
  const [error,     setError]     = useState('');

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setState('submitting');
    setError('');
    try {
      await submitCheckin({
        user_id: userId,
        mood, sleep, stress,
        text_entry: text.trim() || undefined,
        language: 'en',
      });

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
    setText(''); setError('');
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex items-start justify-center p-6 pt-16 relative overflow-hidden">
      
      {/* Decorative leaf shapes inside the container */}
      <div className="absolute top-10 right-10 opacity-30 pointer-events-none rotate-12 scale-150">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 0C100 0 160 20 180 80C200 140 100 200 100 200C100 200 40 180 20 120C0 60 100 0 100 0Z" fill="#D1CAA9" />
          <path d="M100 0C100 0 140 40 120 100C100 160 100 200 100 200C100 200 60 160 80 100C100 40 100 0 100 0Z" fill="#B69265" fillOpacity="0.4" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-10 opacity-40 pointer-events-none -rotate-12 scale-150">
        <svg width="250" height="200" viewBox="0 0 250 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0C50 0 180 10 220 70C260 130 150 200 150 200C150 200 20 190 -20 130C-60 70 50 0 50 0Z" fill="#A8C99A" fillOpacity="0.3"/>
          <path d="M50 0C50 0 150 40 150 100C150 160 150 200 150 200C150 200 50 160 50 100C50 40 50 0 50 0Z" fill="#4E6E4C" fillOpacity="0.15" />
        </svg>
      </div>

      <div className="w-full max-w-lg z-10">

        <div className="bg-[#F4EFE6] rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#EAE2D0]">

          <div className="text-center mb-10">
            <h1 className="text-[34px] font-bold text-[#304E2F] tracking-tight mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              How does today feel?
            </h1>
            <p className="text-[14px] text-[#4E6E4C] italic">
              Pause for a moment in the conservatory of your mind.
            </p>
          </div>

          <div>
            {state === 'success' ? (
              /* Success state */
              <div className="py-6 flex flex-col items-center text-center gap-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EAE2D0]">
                  <CheckCircle className="w-8 h-8 text-[#304E2F]" />
                </div>

                <div>
                  <p className="text-[20px] font-bold text-[#304E2F]" style={{ fontFamily: '"Fraunces", serif' }}>Ritual complete</p>
                  <p className="text-[13px] text-[#4E6E4C] mt-2">
                    Your check-in has been logged. Our AI is now analysing your entry to provide personalized wellness insights.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-full text-[14px] font-semibold text-[#304E2F] bg-[#EAE2D0] hover:bg-[#E0D6C0] transition-colors"
                >
                  Return to beginning
                </button>
              </div>

            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-8">

                <MoodSlider   value={mood}   onChange={setMood}   />
                <SleepSlider  value={sleep}  onChange={setSleep}  />
                <StressSlider value={stress} onChange={setStress} />

                <div className="pt-2">
                  <label
                    htmlFor="text-entry"
                    className="block text-[15px] font-bold text-[#304E2F] tracking-wide mb-3" style={{ fontFamily: '"Fraunces", serif' }}
                  >
                    Anything on your mind?
                  </label>
                  <textarea
                    id="text-entry"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="(Optional journal entry)..."
                    className="w-full px-5 py-4 text-[14px] bg-[#EAE2D0] rounded-2xl text-[#304E2F] placeholder-[#B69265] resize-none outline-none focus:ring-2 focus:ring-[#304E2F]/20 transition-all leading-relaxed"
                  />
                </div>

                {state === 'error' && (
                  <div className="p-4 rounded-2xl bg-[#FBF7EC] border border-[#B69265] text-[13px] text-[#B69265]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full py-4 mt-2 rounded-full text-[16px] font-bold transition-all shadow-[0_4px_14px_rgba(48,78,47,0.15)]"
                  style={{
                    backgroundColor: state === 'submitting' ? '#D1CAA9' : '#1A3323',
                    color: state === 'submitting' ? '#4E6E4C' : '#FBF7EC',
                    cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
                    fontFamily: '"Fraunces", serif',
                    letterSpacing: '0.02em',
                  }}
                >
                  {state === 'submitting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Analysing...
                    </span>
                  ) : 'Complete Ritual'}
                </button>

              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
