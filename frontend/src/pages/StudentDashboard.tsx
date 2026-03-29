import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { getHistory, getAlerts } from '../api';

// Define interfaces matching backend schemas
interface CheckinRecord {
  date: string;
  mood: number;
  sleep: number;
  stress: number;
}

interface AlertRecord {
  id: number;
  action_taken?: string;
  message_en?: string;
  prediction?: string;
  created_at: string;
}

interface StudentDashboardProps {
  userId: number;
}

export default function StudentDashboard({ userId }: StudentDashboardProps) {
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [historyRes, alertsRes] = await Promise.all([
          getHistory(userId),
          getAlerts(userId)
        ]);
        
        // Reverse history so oldest is first for the chart, assuming backend returns latest first
        const sortedHistory = [...(historyRes.checkins || [])].reverse();
        setHistory(sortedHistory);
        setAlerts(alertsRes.alerts || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#555]">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium tracking-wide">Loading insights...</span>
        </div>
      </div>
    );
  }

  // Find the most recent action-oriented alert for the alert card
  const latestAlert = alerts.find(a => 
    a.action_taken && a.action_taken !== 'none'
  );
  
  // Find the most recent prediction
  const latestPrediction = alerts.find(a => a.prediction)?.prediction;

  return (
    <div className="min-h-screen bg-[#0c0c0c] p-6 font-sans text-[#e8e8e8]">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold mb-1">Your Insights</h1>
          <p className="text-sm text-[#777]">Tracking your well-being over the past 7 days</p>
        </div>

        {/* Forecast Card */}
        <div className="bg-[#161616] border border-[#252525] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#7eb88a]" />
            <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#777]">AI Forecast</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[#ccc]">
            {latestPrediction || "Keep checking in to generate personalized forecasts and insights about your weekly rhythms."}
          </p>
        </div>

        {/* Alert Card (only show if there's a recent actionable alert) */}
        {latestAlert && latestAlert.message_en && (
          <div className="bg-[#1a1515] border border-[#3a1f1f] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-[#b87070]" />
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#b87070]">Support Nudge</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-[#d49a9a]">
              {latestAlert.message_en}
            </p>
          </div>
        )}

        {/* Trend Chart */}
        <div className="bg-[#161616] border border-[#252525] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#555]" />
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#777]">7-Day Trends</h2>
            </div>
            {/* Legend inside the header for cleaner layout */}
            <div className="flex gap-4 text-[11px] font-medium tracking-wide uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#7eb88a]" /> Mood</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4a8ba8]" /> Sleep</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#c06060]" /> Stress</div>
            </div>
          </div>
          
          <div className="h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#444" 
                    fontSize={11} 
                    tickFormatter={(val) => {
                      // format YYYY-MM-DD to MM/DD
                      const parts = val.split('-');
                      if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                      return val;
                    }} 
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[1, 10]} 
                    stroke="#444" 
                    fontSize={11} 
                    tickCount={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                    itemStyle={{ padding: '2px 0' }}
                    labelStyle={{ color: '#777', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="#7eb88a" strokeWidth={2} dot={{ fill: '#0c0c0c', stroke: '#7eb88a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="sleep" name="Sleep" stroke="#4a8ba8" strokeWidth={2} dot={{ fill: '#0c0c0c', stroke: '#4a8ba8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="#c06060" strokeWidth={2} dot={{ fill: '#0c0c0c', stroke: '#c06060', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#555]">
                <Activity className="w-6 h-6 mb-2 opacity-50" />
                <p className="text-sm">Not enough data to graph trends yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
