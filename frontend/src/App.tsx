import { useState } from 'react';
import Login, { type Profile } from './pages/Login';
import CheckIn from './pages/CheckIn';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';

type Tab = 'checkin' | 'dashboard' | 'admin';

const STUDENT_TABS = [
  {
    id: 'checkin' as Tab,
    label: 'Daily Check-in',
    description: 'Log your mood, sleep & stress',
    icon: '📋',
  },
  {
    id: 'dashboard' as Tab,
    label: 'Wellness Insights',
    description: 'AI assessment of your wellbeing',
    icon: '🧠',
  },
];

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('checkin');

  if (!profile) {
    return (
      <Login
        onLogin={(p) => {
          setProfile(p);
          setActiveTab(p.role === 'counselor' ? 'admin' : 'checkin');
        }}
      />
    );
  }

  const pageTitle =
    activeTab === 'checkin'   ? 'Daily Check-in' :
    activeTab === 'dashboard' ? 'Wellness Insights' :
                                'Counselor Dashboard';

  const pageDesc =
    activeTab === 'checkin'   ? 'Your responses are analyzed by AI agents after each submission.' :
    activeTab === 'dashboard' ? 'AI agents assess your risk level, campus context, and emotional signals.' :
                                'Anonymised campus-wide wellness data and AI-flagged students.';

  return (
    <div className="font-sans text-[#e8e8e8] min-h-screen bg-[#0c0c0c] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-[#1e1e1e] bg-[#111] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3.5" fill="#7eb88a" opacity="0.9"/>
            <line x1="11" y1="2" x2="11" y2="5.5" stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="11" y1="16.5" x2="11" y2="20" stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="2" y1="11" x2="5.5" y2="11" stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="16.5" y1="11" x2="20" y2="11" stroke="#7eb88a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span className="text-[14px] font-semibold text-[#ccc]">Komorebi</span>
          <span className="text-[#333] text-[14px]">/</span>
          <span className="text-[14px] text-[#666]">{pageTitle}</span>
        </div>

        {/* User badge + sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                width: 26, height: 26,
                backgroundColor: profile.role === 'counselor' ? '#1e1e3a' : '#1e2e20',
                border: `1px solid ${profile.role === 'counselor' ? '#2e2e5a' : '#2e4830'}`,
                color: profile.role === 'counselor' ? '#8a8dc4' : '#7eb88a',
              }}
            >
              {profile.initials}
            </div>
            <span className="text-[13px] text-[#555]">{profile.name}</span>
          </div>
          <button
            onClick={() => setProfile(null)}
            className="text-[12px] text-[#3a3a3a] hover:text-[#777] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page header */}
      <div className="border-b border-[#1a1a1a] bg-[#0e0e0e] px-6 py-5">
        <h1 className="text-[20px] font-bold text-[#e8e8e8] mb-0.5">{pageTitle}</h1>
        <p className="text-[13px] text-[#555]">{pageDesc}</p>

        {/* Nav tabs — only for students */}
        {profile.role === 'student' && (
          <div className="flex gap-1 mt-4">
            {STUDENT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? '#1e1e1e' : 'transparent',
                  color: activeTab === tab.id ? '#e8e8e8' : '#555',
                  border: `1px solid ${activeTab === tab.id ? '#2e2e2e' : 'transparent'}`,
                }}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
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
