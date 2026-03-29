import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, AlertCircle, Sparkles, Activity, Users, Brain, Globe, CheckCircle } from 'lucide-react';
import { getHistory, getAlerts } from '../api';

interface CheckinRecord {
  date: string;
  mood: number;
  sleep: number;
  stress: number;
}

interface AlertRecord {
  id: number;
  risk_score?: number;
  stress_multiplier?: number;
  final_score?: number;
  action_taken?: string;
  message_en?: string;
  message_es?: string;
  prediction?: string;
  trend_context?: string;
  minimization_detected?: boolean;
  counselor_flagged?: boolean;
  created_at: string;
}

interface StudentDashboardProps {
  userId: number;
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-[#222] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function scoreColor(score: number) {
  if (score > 70) return '#594031'; // Text Brown
  if (score > 40) return '#B69265'; // Soft Brown
  return '#A8C99A';                 // Main Green
}

function scoreLabel(score: number) {
  if (score > 70) return 'High concern';
  if (score > 40) return 'Moderate';
  return 'Looking stable';
}

export default function StudentDashboard({ userId }: StudentDashboardProps) {
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    async function fetchData() {
      try {
        const [historyRes, alertsRes] = await Promise.all([
          getHistory(userId),
          getAlerts(userId),
        ]);
        setHistory([...(historyRes.checkins || [])].reverse());
        setAlerts(alertsRes.alerts || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7EC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#4E6E4C]">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium tracking-wide">Loading your wellness data...</span>
        </div>
      </div>
    );
  }

  const latestAlert = alerts[0] ?? null;
  const latestActionAlert = alerts.find(a => a.action_taken && a.action_taken !== 'none') ?? null;
  const latestPrediction = alerts.find(a => a.prediction)?.prediction;
  const trendContext = alerts.find(a => a.trend_context)?.trend_context;
  const hasScore = latestAlert?.final_score != null;
  const finalScore = latestAlert?.final_score ?? 0;
  const color = scoreColor(finalScore);
  const message = lang === 'es'
    ? (latestActionAlert?.message_es || latestActionAlert?.message_en)
    : latestActionAlert?.message_en;

  return (
    <div className="min-h-screen bg-[#FBF7EC] p-6 font-sans text-[#594031]">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold mb-1 text-[#304E2F]">Your Wellness Insights</h1>
          <p className="text-sm text-[#4E6E4C]">
            After each check-in, AI agents analyze your mood, sleep, stress, and campus context to assess your wellbeing.
          </p>
        </div>

        {/* No data state */}
        {!hasScore && (
          <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-8 text-center text-[#594031] opacity-90">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-[15px] font-bold mb-1">No assessment yet</p>
            <p className="text-[13px] text-[#4E6E4C]">Submit a check-in and the AI agents will analyze your data — results appear here within seconds.</p>
          </div>
        )}

        {/* HERO — Agent Risk Assessment */}
        {hasScore && (
          <div
            className="rounded-2xl p-5 shadow-sm bg-[#D1CAA9]"
            style={{
              border: `1px solid ${color}`,
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" style={{ color }} />
                <div>
                  <h2 className="text-[14px] font-bold text-[#304E2F]">AI Risk Assessment</h2>
                  <p className="text-[11px] font-medium text-[#4E6E4C] mt-0.5">Analyzed by 4 AI agents after your last check-in</p>
                </div>
              </div>
              {/* Overall verdict */}
              <div
                className="text-right px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
              >
                <div className="text-[18px] font-bold" style={{ color }}>{finalScore}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: `${color}` }}>
                  {scoreLabel(finalScore)}
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-4 mb-5">
              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <div>
                    <span className="text-[#304E2F] font-bold">Risk score</span>
                    <span className="text-[#4E6E4C] ml-2">Signal Agent ran 3 loops — mood, sleep, stress + emotion analysis</span>
                  </div>
                  <span className="text-[#304E2F] font-bold flex-shrink-0 ml-2">{latestAlert.risk_score}/100</span>
                </div>
                <ScoreBar value={latestAlert.risk_score ?? 0} color="#594031" />
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <div>
                    <span className="text-[#304E2F] font-bold">Academic stress multiplier</span>
                    <span className="text-[#4E6E4C] ml-2">Context Agent read the USF academic calendar</span>
                  </div>
                  <span className="text-[#304E2F] font-bold flex-shrink-0 ml-2">+{latestAlert.stress_multiplier}</span>
                </div>
                <ScoreBar value={latestAlert.stress_multiplier ?? 0} max={25} color="#B69265" />
              </div>

              <div className="pt-3 border-t border-[#B69265]/40">
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="font-bold text-[#304E2F]">Final score</span>
                  <span className="font-bold" style={{ color }}>{finalScore}/100</span>
                </div>
                <ScoreBar value={finalScore} color={color} />
                <p className="text-[11px] font-semibold text-[#4E6E4C] mt-2">
                  {finalScore > 70
                    ? 'Score above 70 — Response Agent sent a full outreach message and notified your counselor.'
                    : finalScore > 40
                    ? 'Score 40–70 — Response Agent sent a gentle nudge to check in with support resources.'
                    : 'Score below 40 — Response Agent took no action. Keep it up.'}
                </p>
              </div>
            </div>

            {/* Action taken */}
            <div className="flex items-center gap-2 text-[12px]">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              <span className="font-bold" style={{ color: `${color}` }}>
                {latestAlert.action_taken === 'full_outreach' && 'Response Agent: full outreach sent · Counselor dashboard flagged'}
                {latestAlert.action_taken === 'nudge' && 'Response Agent: gentle nudge sent'}
                {(!latestAlert.action_taken || latestAlert.action_taken === 'none') && 'Response Agent: no action needed'}
              </span>
            </div>

            {/* Minimization warning */}
            {latestAlert.minimization_detected && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#FBF7EC] border border-[#B69265]">
                <AlertCircle className="w-3.5 h-3.5 text-[#B69265] mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-[#594031] leading-relaxed">
                  <span className="font-bold">Emotion analysis flag:</span> Your text entries suggest more stress than your numerical scores indicate. The AI detected possible minimisation and adjusted your risk score upward.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trend Agent — Campus Context (A2A, only when score > 70) */}
        {trendContext && (
          <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#304E2F]" />
                <h2 className="text-[13px] font-bold text-[#304E2F]">Campus Context</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF7EC] border border-[#B69265] text-[#594031]">
                Trend Agent · A2A call
              </span>
            </div>
            <p className="text-[13px] text-[#4E6E4C] mb-2 font-medium">
              Because your score exceeded 70, the Response Agent called the Trend Agent to compare your situation to the rest of campus.
            </p>
            <p className="text-[14px] leading-relaxed text-[#594031] font-semibold">{trendContext}</p>
          </div>
        )}

        {/* Outreach message */}
        {latestActionAlert && message && (
          <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A8C99A]" />
                <h2 className="text-[13px] font-bold text-[#304E2F]">Message from the AI</h2>
              </div>
              {latestActionAlert.message_es && (
                <button
                  onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                  style={{ color: '#304E2F', backgroundColor: '#FBF7EC', border: '1px solid #B69265' }}
                >
                  <Globe className="w-3 h-3" />
                  {lang === 'en' ? 'Switch to Spanish' : 'Switch to English'}
                </button>
              )}
            </div>
            <p className="text-[14px] font-medium text-[#4E6E4C] mb-2">
              Generated by Gemini via the Response Agent based on your risk score, academic context, and campus trends.
            </p>
            <p className="text-[15px] leading-relaxed text-[#594031] font-semibold">{message}</p>
          </div>
        )}

        {/* AI Forecast */}
        {latestPrediction && (
          <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#A8C99A]" />
              <h2 className="text-[13px] font-bold text-[#304E2F]">7-Day Forecast</h2>
            </div>
            <p className="text-[13px] font-medium text-[#4E6E4C] mb-2">Gemini's prediction based on your recent trend and upcoming academic events.</p>
            <p className="text-[15px] leading-relaxed text-[#594031] font-semibold">{latestPrediction}</p>
          </div>
        )}

        {/* 7-Day Trend Chart */}
        <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5 opacity-95">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#304E2F]" />
              <h2 className="text-[13px] font-bold text-[#304E2F]">7-Day Check-in History</h2>
            </div>
            <div className="flex gap-4 text-[11px] font-semibold text-[#4E6E4C]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#A8C99A]" /> Mood</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4E6E4C]" /> Sleep</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#594031]" /> Stress</div>
            </div>
          </div>
          <p className="text-[12px] text-[#594031] font-medium mb-5">Raw data from your daily check-ins — what the Signal Agent sees.</p>

          <div className="h-[220px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B69265" strokeOpacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="date" stroke="#4E6E4C" fontSize={11}
                    tickFormatter={(val) => { const p = val.split('-'); return p.length === 3 ? `${p[1]}/${p[2]}` : val; }}
                    tickMargin={10} axisLine={false} tickLine={false}
                  />
                  <YAxis domain={[1, 10]} stroke="#4E6E4C" fontSize={11} tickCount={4} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FBF7EC', border: '1px solid #B69265', borderRadius: '8px', fontSize: '13px' }}
                    itemStyle={{ padding: '2px 0' }}
                    labelStyle={{ color: '#4E6E4C', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="mood"   name="Mood"   stroke="#A8C99A" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#A8C99A', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="sleep"  name="Sleep"  stroke="#4E6E4C" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#4E6E4C', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="#594031" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#594031', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#4E6E4C]">
                <Activity className="w-6 h-6 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No check-in data yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
