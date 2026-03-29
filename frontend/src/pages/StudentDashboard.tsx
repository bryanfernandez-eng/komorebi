import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  Sparkles,
  Activity,
  Users,
  Brain,
  Globe,
  CheckCircle,
} from 'lucide-react';
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
    <div className="h-1.5 w-full rounded-full bg-[#E8E3D9] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function scoreColor(score: number) {
  if (score > 70) return '#594031';
  if (score > 40) return '#B69265';
  return '#4E6E4C';
}

function scoreLabel(score: number) {
  if (score > 70) return 'High concern';
  if (score > 40) return 'Moderate';
  return 'Stable';
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
      <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#4E6E4C]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[13px] font-medium">Loading your wellness data...</span>
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
  const message =
    lang === 'es'
      ? (latestActionAlert?.message_es || latestActionAlert?.message_en)
      : latestActionAlert?.message_en;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {!hasScore && (
            <div className="lg:col-span-2">
              <div className="max-w-2xl mx-auto bg-white border border-[#D1CAA9] rounded-2xl p-10 text-center">
                <div className="w-10 h-10 rounded-full bg-[#D1CAA9] border border-[#B69265] flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-4 h-4 text-[#4E6E4C]" />
                </div>
                <p className="text-[14px] font-semibold text-[#304E2F] mb-1.5">No assessment yet</p>
                <p className="text-[13px] text-[#4E6E4C] max-w-xs mx-auto leading-relaxed">
                  Submit a check-in and the AI agents will analyse your data. Results appear here within seconds.
                </p>
              </div>
            </div>
          )}

          {hasScore && (
            <div>
              <div className="bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: `${color}50` }}>
                <div
                  className="px-5 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color }} />
                    <div>
                      <div className="text-[13px] font-bold text-[#304E2F]">AI Risk Assessment</div>
                      <div className="text-[11px] text-[#4E6E4C]">Analysed by 4 agents after your last check-in</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-bold leading-tight" style={{ color }}>
                      {finalScore}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                      {scoreLabel(finalScore)}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E8E3D9] bg-[#FBF7EC] p-4">
                      <div className="flex justify-between text-[12px] mb-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#304E2F]">Risk score</span>
                          <span className="text-[#4E6E4C]">Signal Agent · 3 analysis loops</span>
                        </div>
                        <span className="font-bold text-[#304E2F] flex-shrink-0 ml-2">
                          {latestAlert.risk_score}/100
                        </span>
                      </div>
                      <ScoreBar value={latestAlert.risk_score ?? 0} color="#594031" />
                    </div>

                    <div className="rounded-xl border border-[#E8E3D9] bg-[#FBF7EC] p-4">
                      <div className="flex justify-between text-[12px] mb-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#304E2F]">Academic stress multiplier</span>
                          <span className="text-[#4E6E4C]">Context Agent · USF calendar</span>
                        </div>
                        <span className="font-bold text-[#304E2F] flex-shrink-0 ml-2">
                          +{latestAlert.stress_multiplier}
                        </span>
                      </div>
                      <ScoreBar value={latestAlert.stress_multiplier ?? 0} max={25} color="#B69265" />
                    </div>

                    <div className="sm:col-span-2 rounded-xl border border-[#E8E3D9] p-4">
                      <div className="flex justify-between text-[13px] mb-2">
                        <span className="font-bold text-[#304E2F]">Final score</span>
                        <span className="font-bold" style={{ color }}>
                          {finalScore}/100
                        </span>
                      </div>
                      <ScoreBar value={finalScore} color={color} />
                      <p className="text-[11px] text-[#4E6E4C] mt-2.5 leading-relaxed">
                        {finalScore > 70
                          ? 'Score above 70 - Response Agent sent a full outreach message and notified your counselor.'
                          : finalScore > 40
                            ? 'Score 40-70 - Response Agent sent a gentle nudge to check in with support resources.'
                            : 'Score below 40 - Response Agent took no action. Keep it up.'}
                      </p>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 text-[12px] pt-1">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                      <span className="font-semibold" style={{ color }}>
                        {latestAlert.action_taken === 'full_outreach' && 'Response Agent: full outreach sent - Counselor dashboard flagged'}
                        {latestAlert.action_taken === 'nudge' && 'Response Agent: gentle nudge sent'}
                        {(!latestAlert.action_taken || latestAlert.action_taken === 'none') && 'Response Agent: no action needed'}
                      </span>
                    </div>

                    {latestAlert.minimization_detected && (
                      <div className="sm:col-span-2 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FBF7EC] border border-[#B69265]">
                        <AlertCircle className="w-3.5 h-3.5 text-[#B69265] mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-[#594031] leading-relaxed">
                          <span className="font-semibold">Emotion analysis flag:</span> Your written entries suggest more stress than your numerical scores indicate. The AI detected possible minimisation and adjusted your risk score upward.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {trendContext && (
            <div>
              <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm h-full">
                <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#304E2F]" />
                    <span className="text-[13px] font-bold text-[#304E2F]">Campus Context</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D1CAA9] border border-[#B69265] text-[#594031] uppercase tracking-wide">
                    Trend Agent · A2A
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[12px] text-[#4E6E4C] mb-2.5 leading-relaxed">
                    Your score exceeded 70, so the Response Agent called the Trend Agent to compare your situation to the rest of campus.
                  </p>
                  <p className="text-[14px] text-[#304E2F] font-semibold leading-relaxed">{trendContext}</p>
                </div>
              </div>
            </div>
          )}

          {latestActionAlert && message && (
            <div>
              <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm h-full">
                <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#4E6E4C]" />
                    <span className="text-[13px] font-bold text-[#304E2F]">Message from the AI</span>
                  </div>
                  {latestActionAlert.message_es && (
                    <button
                      onClick={() => setLang(l => (l === 'en' ? 'es' : 'en'))}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                      style={{ color: '#304E2F', backgroundColor: '#FBF7EC', border: '1px solid #D1CAA9' }}
                    >
                      <Globe className="w-3 h-3" />
                      {lang === 'en' ? 'Ver en espanol' : 'Switch to English'}
                    </button>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[12px] text-[#4E6E4C] mb-2.5 leading-relaxed">
                    Generated by Gemini via the Response Agent based on your risk score, academic context, and campus trends.
                  </p>
                  <p className="text-[14px] text-[#304E2F] leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
          )}

          {latestPrediction && (
            <div>
              <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm h-full">
                <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4E6E4C]" />
                  <span className="text-[13px] font-bold text-[#304E2F]">7-Day Forecast</span>
                </div>
                <div className="p-5">
                  <p className="text-[12px] text-[#4E6E4C] mb-2.5">
                    Gemini&apos;s prediction based on your recent trend and upcoming academic events.
                  </p>
                  <p className="text-[14px] text-[#304E2F] leading-relaxed">{latestPrediction}</p>
                </div>
              </div>
            </div>
          )}

          <div className="lg:col-span-2">
            <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#304E2F]" />
                  <span className="text-[13px] font-bold text-[#304E2F]">7-Day Check-in History</span>
                </div>
                <div className="flex gap-4 text-[11px] font-medium text-[#4E6E4C]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#A8C99A]" /> Mood
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#4E6E4C]" /> Sleep
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#594031]" /> Stress
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[11px] text-[#B69265] mb-4">
                  Raw data from your daily check-ins - the input the Signal Agent analyses.
                </p>
                <div className="h-[220px] w-full">
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E3D9" strokeOpacity={0.8} vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#B69265"
                          fontSize={10}
                          tickFormatter={(val) => {
                            const parts = val.split('-');
                            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                          }}
                          tickMargin={8}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 10]}
                          stroke="#B69265"
                          fontSize={10}
                          tickCount={4}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FBF7EC',
                            border: '1px solid #D1CAA9',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          itemStyle={{ padding: '2px 0' }}
                          labelStyle={{ color: '#4E6E4C', marginBottom: '4px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          name="Mood"
                          stroke="#A8C99A"
                          strokeWidth={2}
                          dot={{ fill: '#FBF7EC', stroke: '#A8C99A', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          name="Sleep"
                          stroke="#4E6E4C"
                          strokeWidth={2}
                          dot={{ fill: '#FBF7EC', stroke: '#4E6E4C', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="stress"
                          name="Stress"
                          stroke="#594031"
                          strokeWidth={2}
                          dot={{ fill: '#FBF7EC', stroke: '#594031', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#B69265]">
                      <Activity className="w-5 h-5 mb-2 opacity-40" />
                      <p className="text-[12px]">No check-in data yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
