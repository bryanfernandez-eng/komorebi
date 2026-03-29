import { useState } from 'react';
import Landing from './pages/Landing';
import Login, { type Profile } from './pages/Login';
import CheckIn from './pages/CheckIn';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';

type AppScreen = 'landing' | 'login' | 'app';
type Tab = 'checkin' | 'dashboard' | 'admin';

const STUDENT_TABS = [
  { id: 'checkin' as Tab,   label: 'Daily Check-in',    desc: 'Log your mood, sleep & stress' },
  { id: 'dashboard' as Tab, label: 'Wellness Insights',  desc: 'AI assessment of your wellbeing' },
];

export default function App() {
  const [screen, setScreen]     = useState<AppScreen>('landing');
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('checkin');

  if (screen === 'landing') {
    return <Landing onEnter={() => setScreen('login')} />;
  }

  if (screen === 'login' || !profile) {
    return (
      <Login
        onLogin={(p) => {
          setProfile(p);
          setActiveTab(p.role === 'counselor' ? 'admin' : 'checkin');
          setScreen('app');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  const pageTitle =
    activeTab === 'checkin'   ? 'Daily Check-in' :
    activeTab === 'dashboard' ? 'Wellness Insights' :
                                'Counselor Dashboard';

  const pageDesc =
    activeTab === 'checkin'   ? 'Your responses are analysed by AI agents after each submission.' :
    activeTab === 'dashboard' ? 'AI agents assess your risk level, campus context, and emotional signals.' :
                                'Anonymised campus-wide wellness data and AI-flagged students.';
  const isStudent = profile.role === 'student';

  return (
    <div className="font-sans text-[#594031] min-h-screen bg-[#FBF7EC] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-[#D1CAA9] bg-[#D1CAA9] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3.5" fill="#304E2F" opacity="0.9"/>
            <line x1="11" y1="2"    x2="11" y2="5.5"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="11" y1="16.5" x2="11" y2="20"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="2"  y1="11"   x2="5.5" y2="11"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="16.5" y1="11" x2="20" y2="11"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span className="text-[14px] font-semibold text-[#304E2F]">Komorebi</span>
          <span className="hidden sm:inline text-[12px] text-[#4E6E4C]">
            {isStudent ? 'Student workspace' : 'Counselor view'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                width: 26, height: 26,
                backgroundColor: profile.role === 'counselor' ? '#FBF7EC' : '#A8C99A',
                border: `1px solid ${profile.role === 'counselor' ? '#B69265' : '#4E6E4C'}`,
                color: profile.role === 'counselor' ? '#B69265' : '#304E2F',
              }}
            >
              {profile.initials}
            </div>
            <span className="text-[13px] text-[#594031]">{profile.name}</span>
          </div>
          <button
            onClick={() => { setProfile(null); setScreen('login'); }}
            className="text-[12px] text-[#594031] hover:text-[#B69265] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page header */}
      <div className="border-b border-[#D1CAA9] bg-[#FBF7EC] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B69265]">
              {isStudent ? 'Student flow' : 'Operations'}
            </div>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-[#304E2F] leading-tight mt-0.5">
              {pageTitle}
            </h1>
            <p className="text-[12px] text-[#4E6E4C] mt-1 max-w-2xl">{pageDesc}</p>
          </div>

          {isStudent && (
            <div className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-[#D1CAA9] bg-[#F7F2E8] p-1">
            {STUDENT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? '#A8C99A' : 'transparent',
                  color: activeTab === tab.id ? '#304E2F' : '#4E6E4C',
                  border: `1px solid ${activeTab === tab.id ? '#4E6E4C' : 'transparent'}`,
                  boxShadow: activeTab === tab.id ? '0 1px 0 rgba(48, 78, 47, 0.08)' : 'none',
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        {activeTab === 'checkin'   && profile.role === 'student'   && <CheckIn userId={profile.id} userName={profile.name} />}
        {activeTab === 'dashboard' && profile.role === 'student'   && <StudentDashboard userId={profile.id} />}
        {activeTab === 'admin'     && profile.role === 'counselor' && <CounselorDashboard />}
      </main>

    </div>
  );
}
