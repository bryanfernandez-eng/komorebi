import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface Profile {
  id: number;
  name: string;
  role: 'student' | 'counselor';
  floor?: string;
  initials: string;
}

const PROFILES: Profile[] = [
  { id: 1, name: 'Alex',      role: 'student',   floor: '3A', initials: 'AL' },
  { id: 2, name: 'Maria',     role: 'student',   floor: '2B', initials: 'MA' },
  { id: 3, name: 'Jordan',    role: 'student',   floor: '4C', initials: 'JO' },
  { id: 0, name: 'Counselor', role: 'counselor',              initials: 'CO' },
];

interface LoginProps {
  onLogin: (profile: Profile) => void;
  onBack?: () => void;
}

export type { Profile };

export default function Login({ onLogin, onBack }: LoginProps) {
  const [name, setName]     = useState('');
  const [role, setRole]     = useState<'student' | 'counselor'>('student');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    // Find matching demo profile, or create a minimal one
    const match = PROFILES.find(
      p => p.name.toLowerCase() === trimmed.toLowerCase() && p.role === role
    );
    if (match) {
      onLogin(match);
    } else {
      onLogin({
        id: role === 'counselor' ? 0 : 1,
        name: trimmed,
        role,
        initials: trimmed.slice(0, 2).toUpperCase(),
      });
    }
  }

  function quickFill(p: Profile) {
    onLogin(p);
  }

  return (
    <div className="min-h-screen bg-[#FBF7EC] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Back link */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] text-[#4E6E4C] hover:text-[#304E2F] transition-colors mb-8"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to overview
          </button>
        )}

        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#D1CAA9] border border-[#B69265]">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="3.5" fill="#304E2F" opacity="0.9"/>
              <line x1="11" y1="2"    x2="11" y2="5.5"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="11" y1="16.5" x2="11" y2="20"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="2"  y1="11"   x2="5.5" y2="11"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="16.5" y1="11" x2="20" y2="11"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-[#304E2F] leading-tight">Komorebi</div>
            <div className="text-[11px] text-[#4E6E4C]">Campus wellness system</div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold text-[#304E2F] mb-1.5">Sign in</h1>
        <p className="text-[13px] text-[#4E6E4C] mb-8 leading-relaxed">
          Demo mode — enter any name or use a quick-fill profile below.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#594031] mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-[#D1CAA9] rounded-xl text-[#304E2F] placeholder-[#B69265] outline-none focus:border-[#4E6E4C] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#594031] mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['student', 'counselor'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    backgroundColor: role === r ? '#A8C99A' : '#FBF7EC',
                    border: `1px solid ${role === r ? '#4E6E4C' : '#D1CAA9'}`,
                    color: role === r ? '#304E2F' : '#4E6E4C',
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all mt-2"
            style={{
              backgroundColor: name.trim() ? '#304E2F' : '#D1CAA9',
              color: name.trim() ? '#FBF7EC' : '#B69265',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Continue
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-7">
          <div className="flex-1 h-px bg-[#D1CAA9]" />
          <span className="text-[11px] text-[#B69265] font-medium">or use a demo profile</span>
          <div className="flex-1 h-px bg-[#D1CAA9]" />
        </div>

        {/* Quick-fill profiles */}
        <div className="grid grid-cols-2 gap-2">
          {PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => quickFill(p)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#D1CAA9] hover:border-[#4E6E4C] hover:bg-[#D1CAA9] transition-all text-left"
            >
              <div
                className="flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0"
                style={{
                  width: 30, height: 30,
                  backgroundColor: p.role === 'counselor' ? '#FBF7EC' : '#A8C99A',
                  border: `1px solid ${p.role === 'counselor' ? '#B69265' : '#4E6E4C'}`,
                  color: p.role === 'counselor' ? '#B69265' : '#304E2F',
                }}
              >
                {p.initials}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#304E2F] truncate">{p.name}</div>
                <div className="text-[10px] text-[#4E6E4C] truncate">
                  {p.role === 'counselor' ? 'Counselor' : `Student · Floor ${p.floor}`}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#B69265] mt-8">
          Demo mode · No real data collected
        </p>

      </div>
    </div>
  );
}
