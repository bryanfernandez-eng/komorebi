import { useState } from 'react';
import CheckIn from './pages/CheckIn';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'dashboard' | 'admin'>('admin');

  return (
    <div className="font-sans text-[#e8e8e8] min-h-screen bg-[#0c0c0c] flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-[#252525] px-6 py-4 flex justify-between items-center bg-[#111]">
        <div className="text-[15px] font-semibold text-[#ccc]">Komorebi</div>
        <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg border border-[#252525]">
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
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-md text-[13px] transition-colors ${
              activeTab === 'admin' ? 'bg-[#2a2a2a] text-[#fff] shadow-sm' : 'text-[#777] hover:text-[#ccc]'
            }`}
          >
            Admin
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'checkin' && <CheckIn />}
        {activeTab === 'dashboard' && <StudentDashboard />}
        {activeTab === 'admin' && <CounselorDashboard />}
      </main>
    </div>
  );
}
