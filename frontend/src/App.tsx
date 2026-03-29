import { useState } from 'react';
import Login, { type Profile } from './pages/Login';
import CheckIn from './pages/CheckIn';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'checkin' | 'dashboard' | 'admin'>('checkin');

  if (!profile) {
    return <Login onLogin={(p) => {
      setProfile(p);
      setActiveTab(p.role === 'counselor' ? 'admin' : 'checkin');
    }} />;
  }

  return (
    <div className="font-sans text-[#e8e8e8] min-h-screen bg-[#0c0c0c] flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-[#252525] px-6 py-4 flex justify-between items-center bg-[#111]">
        <div className="text-[15px] font-semibold text-[#ccc]">Komorebi</div>

        <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg border border-[#252525]">
          {profile.role === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('checkin')}
                className={`px-4 py-1.5 rounded-md text-[13px] transition-colors ${
                  activeTab === 'checkin' ? 'bg-[#2a2a2a] text-[#fff] shadow-sm' : 'text-[#777] hover:text-[#ccc]'
                }`}
              >
                Check In
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded-md text-[13px] transition-colors ${
                  activeTab === 'dashboard' ? 'bg-[#2a2a2a] text-[#fff] shadow-sm' : 'text-[#777] hover:text-[#ccc]'
                }`}
              >
                Insights
              </button>
            </>
          )}
          {profile.role === 'counselor' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-md text-[13px] transition-colors ${
                activeTab === 'admin' ? 'bg-[#2a2a2a] text-[#fff] shadow-sm' : 'text-[#777] hover:text-[#ccc]'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {/* User badge + sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                width: 28, height: 28,
                backgroundColor: profile.role === 'counselor' ? '#1e1e3a' : '#1e2e20',
                border: `1px solid ${profile.role === 'counselor' ? '#2e2e5a' : '#2e4830'}`,
                color: profile.role === 'counselor' ? '#8a8dc4' : '#7eb88a',
              }}
            >
              {profile.initials}
            </div>
            <span className="text-[13px] text-[#666]">{profile.name}</span>
          </div>
          <button
            onClick={() => setProfile(null)}
            className="text-[12px] text-[#444] hover:text-[#888] transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'checkin' && profile.role === 'student' && (
          <CheckIn userId={profile.id} userName={profile.name} />
        )}
        {activeTab === 'dashboard' && profile.role === 'student' && (
          <StudentDashboard userId={profile.id} />
        )}
        {activeTab === 'admin' && <CounselorDashboard />}
      </main>
    </div>
  );
}
