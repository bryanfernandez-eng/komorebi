import { useState } from 'react';

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
}

export type { Profile };

export default function Login({ onLogin }: LoginProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#161616] border border-[#252525] mb-1">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="3.5" fill="#7eb88a" opacity="0.9"/>
              <line x1="11" y1="2"    x2="11" y2="5.5"  stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="11" y1="16.5" x2="11" y2="20"   stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="2"  y1="11"   x2="5.5" y2="11"  stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="16.5" y1="11" x2="20" y2="11"   stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="4.93" y1="4.93"   x2="7.35" y2="7.35"   stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
              <line x1="14.65" y1="14.65" x2="17.07" y2="17.07" stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
              <line x1="17.07" y1="4.93"  x2="14.65" y2="7.35"  stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
              <line x1="7.35" y1="14.65"  x2="4.93" y2="17.07"  stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#e8e8e8]">Komorebi</h1>
          <p className="text-[14px] text-[#777] leading-relaxed">
            An AI early-warning system for campus mental health.<br/>
            Students check in daily. AI agents detect when someone<br/>
            is struggling — before it becomes a crisis.
          </p>
        </div>

        {/* How it works — 3 steps */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📋', step: '1', label: 'Daily check-in', sub: 'mood · sleep · stress' },
            { icon: '🤖', step: '2', label: 'AI agents analyze', sub: 'risk + context' },
            { icon: '🛡️', step: '3', label: 'Counselors notified', sub: 'when scores spike' },
          ].map(({ icon, step, label, sub }) => (
            <div key={step} className="bg-[#161616] border border-[#252525] rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[12px] font-semibold text-[#ccc]">{label}</div>
              <div className="text-[10px] text-[#555] mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Profile picker */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#444] mb-3">
            Select a demo profile
          </p>

          {PROFILES.map(profile => (
            <button
              key={profile.id}
              onClick={() => onLogin(profile)}
              onMouseEnter={() => setHovered(profile.id)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{
                backgroundColor: hovered === profile.id ? '#1e1e1e' : '#161616',
                border: `1px solid ${hovered === profile.id ? '#333' : '#252525'}`,
              }}
            >
              <div
                className="flex items-center justify-center rounded-full text-[12px] font-semibold flex-shrink-0"
                style={{
                  width: 36, height: 36,
                  backgroundColor: profile.role === 'counselor' ? '#1e1e3a' : '#1e2e20',
                  border: `1px solid ${profile.role === 'counselor' ? '#2e2e5a' : '#2e4830'}`,
                  color: profile.role === 'counselor' ? '#8a8dc4' : '#7eb88a',
                }}
              >
                {profile.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-[#ccc]">{profile.name}</div>
                <div className="text-[11px] text-[#555] mt-0.5">
                  {profile.role === 'counselor'
                    ? 'See campus-wide AI flags and floor heatmap'
                    : profile.id === 1
                    ? 'High-risk student — declining check-ins, AI flagged'
                    : profile.id === 2
                    ? 'Moderate stress — bilingual Spanish support'
                    : 'Stable student — improving trend'}
                </div>
              </div>

              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ opacity: hovered === profile.id ? 0.6 : 0.2, transition: 'opacity 0.15s' }}>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="#e8e8e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#2e2e2e]">
          Demo mode · No real data collected
        </p>
      </div>
    </div>
  );
}
