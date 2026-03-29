import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  TrendingUp, AlertCircle, Sparkles, Activity, Users, Brain,
  Globe, CheckCircle, Flame, BookOpen, ChevronDown, ChevronUp, Clock, BellOff
} from 'lucide-react';
import { getHistory, getAlerts, getUserProfile, getDigest } from '../api';

interface CheckinRecord {
  date: string;
  mood: number;
  sleep: number;
  stress: number;
  text_entry?: string;
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

interface UserProfile {
  user_id: number;
  name: string;
  streak: number;
  dorm_floor?: string;
  language: string;
}

interface DigestResult {
  digest: string;
  best_day: string;
  worst_day: string;
  pattern: string;
  generated_at: string;
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

function actionLabel(action?: string) {
  if (action === 'full_outreach') return 'Full outreach sent · Counselor notified';
  if (action === 'nudge') return 'Gentle nudge sent';
  if (action === 'silence_outreach') return 'Silence check-in sent';
  return 'No action needed';
}

// Custom tooltip that also shows journal entry
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload as CheckinRecord;
  return (
    <div className="bg-[#FBF7EC] border border-[#D1CAA9] rounded-xl p-3 text-[12px] shadow-md max-w-[220px]">
      <div className="font-semibold text-[#304E2F] mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-[#304E2F]">{p.value}</span>
        </div>
      ))}
      {entry?.text_entry && (
        <div className="mt-2 pt-2 border-t border-[#E8E3D9]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B69265] mb-1">Journal</div>
          <p className="text-[#4E6E4C] leading-relaxed italic line-clamp-3">{entry.text_entry}</p>
        </div>
      )}
    </div>
  );
};

export default function StudentDashboard({ userId }: StudentDashboardProps) {
  const [history,  setHistory]  = useState<CheckinRecord[]>([]);
  const [alerts,   setAlerts]   = useState<AlertRecord[]>([]);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [digest,   setDigest]   = useState<DigestResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [lang,     setLang]     = useState<'en' | 'es'>('en');
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [historyRes, alertsRes, profileRes, digestRes] = await Promise.all([
          getHistory(userId),
          getAlerts(userId),
          getUserProfile(userId),
          getDigest(userId).catch(() => null), // non-fatal
        ]);
        setHistory([...(historyRes.checkins || [])].reverse());
        setAlerts(alertsRes.alerts || []);
        setProfile(profileRes);
        setDigest(digestRes);
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

  const latestAlert       = alerts[0] ?? null;
  const latestActionAlert = alerts.find(a => a.action_taken && a.action_taken !== 'none') ?? null;
  const latestPrediction  = alerts.find(a => a.prediction)?.prediction;
  const trendContext      = alerts.find(a => a.trend_context)?.trend_context;
  const hasScore          = latestAlert?.final_score != null;
  const finalScore        = latestAlert?.final_score ?? 0;
  const color             = scoreColor(finalScore);
  const message           = lang === 'es'
    ? (latestActionAlert?.message_es || latestActionAlert?.message_en)
    : latestActionAlert?.message_en;

  // Silence outreach — look for a more recent silence alert than the latest action alert
  const silenceAlert = alerts.find(a => a.action_taken === 'silence_outreach');
  const silenceMessage = silenceAlert
    ? (lang === 'es' ? silenceAlert.message_es || silenceAlert.message_en : silenceAlert.message_en)
    : null;

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);
  const hasJournalEntries = history.some(h => h.text_entry);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Streak Badge ──────────────────────────────────────────────── */}
        {profile && profile.streak > 0 && (
          <div className="flex items-center justify-between bg-white border border-[#D1CAA9] rounded-2xl px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FBF7EC] border border-[#B69265] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#B69265]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#304E2F]">
                  {profile.streak}-day check-in streak
                </div>
                <div className="text-[11px] text-[#4E6E4C]">
                  {profile.streak >= 7
                    ? 'Incredible consistency — you\'re showing up for yourself.'
                    : profile.streak >= 3
                    ? 'Building momentum. Keep it going!'
                    : 'Great start — one day at a time.'}
                </div>
              </div>
            </div>
            <div
              className="text-[28px] font-bold px-3 py-1 rounded-xl"
              style={{ color: '#B69265', backgroundColor: '#FBF7EC', border: '1px solid #D1CAA9' }}
            >
              {profile.streak}
            </div>
          </div>
        )}

        {/* ── No data state ──────────────────────────────────────────────── */}
        {!hasScore && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-[#D1CAA9] border border-[#B69265] flex items-center justify-center mx-auto mb-4">
              <Brain className="w-4 h-4 text-[#4E6E4C]" />
            </div>
            <p className="text-[14px] font-semibold text-[#304E2F] mb-1.5">No assessment yet</p>
            <p className="text-[13px] text-[#4E6E4C] max-w-xs mx-auto leading-relaxed">
              Submit a check-in and the AI agents will analyse your data. Results appear here within seconds.
            </p>
          </div>
        )}

        {/* ── AI Risk Assessment ─────────────────────────────────────────── */}
        {hasScore && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: `${color}50` }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" style={{ color }} />
                <div>
                  <div className="text-[13px] font-bold text-[#304E2F]">AI Risk Assessment</div>
                  <div className="text-[11px] text-[#4E6E4C]">Analysed by 4 agents after your last check-in</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-bold leading-tight" style={{ color }}>{finalScore}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>{scoreLabel(finalScore)}</div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#304E2F]">Risk score</span>
                    <span className="text-[#4E6E4C]">Signal Agent · 3 analysis loops</span>
                  </div>
                  <span className="font-bold text-[#304E2F] flex-shrink-0 ml-2">{latestAlert!.risk_score}/100</span>
                </div>
                <ScoreBar value={latestAlert!.risk_score ?? 0} color="#594031" />
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#304E2F]">Academic stress multiplier</span>
                    <span className="text-[#4E6E4C]">Context Agent · USF calendar</span>
                  </div>
                  <span className="font-bold text-[#304E2F] flex-shrink-0 ml-2">+{latestAlert!.stress_multiplier}</span>
                </div>
                <ScoreBar value={latestAlert!.stress_multiplier ?? 0} max={25} color="#B69265" />
              </div>

              <div className="pt-3 border-t border-[#E8E3D9]">
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="font-bold text-[#304E2F]">Final score</span>
                  <span className="font-bold" style={{ color }}>{finalScore}/100</span>
                </div>
                <ScoreBar value={finalScore} color={color} />
                <p className="text-[11px] text-[#4E6E4C] mt-2.5 leading-relaxed">
                  {finalScore > 70
                    ? 'Score above 70 — Response Agent sent a full outreach message and notified your counselor.'
                    : finalScore > 40
                    ? 'Score 40–70 — Response Agent sent a gentle nudge to check in with support resources.'
                    : 'Score below 40 — Response Agent took no action. Keep it up.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[12px] pt-1 border-t border-[#E8E3D9]">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <span className="font-semibold" style={{ color }}>{actionLabel(latestAlert!.action_taken)}</span>
              </div>

              {latestAlert!.minimization_detected && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FBF7EC] border border-[#B69265]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#B69265] mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-[#594031] leading-relaxed">
                    <span className="font-semibold">Emotion analysis flag:</span> Your written entries suggest more stress than your numerical scores indicate. The AI detected possible minimisation and adjusted your risk score upward.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Silence Outreach Message ──────────────────────────────────── */}
        {silenceMessage && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff className="w-3.5 h-3.5 text-[#4E6E4C]" />
                <span className="text-[13px] font-bold text-[#304E2F]">We noticed you've been away</span>
              </div>
              {silenceAlert?.message_es && (
                <button
                  onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: '#304E2F', backgroundColor: '#FBF7EC', border: '1px solid #D1CAA9' }}
                >
                  <Globe className="w-3 h-3" />
                  {lang === 'en' ? 'Ver en español' : 'Switch to English'}
                </button>
              )}
            </div>
            <div className="p-5">
              <p className="text-[12px] text-[#4E6E4C] mb-2.5">
                Sent automatically by the Silence Detection scheduler when check-ins are missed.
              </p>
              <p className="text-[14px] text-[#304E2F] leading-relaxed">{silenceMessage}</p>
            </div>
          </div>
        )}

        {/* ── Campus Context (Trend Agent A2A) ──────────────────────────── */}
        {trendContext && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
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
        )}

        {/* ── Outreach message ──────────────────────────────────────────── */}
        {latestActionAlert && message && latestActionAlert.action_taken !== 'silence_outreach' && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#4E6E4C]" />
                <span className="text-[13px] font-bold text-[#304E2F]">Message from the AI</span>
              </div>
              {latestActionAlert.message_es && (
                <button
                  onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                  style={{ color: '#304E2F', backgroundColor: '#FBF7EC', border: '1px solid #D1CAA9' }}
                >
                  <Globe className="w-3 h-3" />
                  {lang === 'en' ? 'Ver en español' : 'Switch to English'}
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
        )}

        {/* ── 7-Day Forecast ────────────────────────────────────────────── */}
        {latestPrediction && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#4E6E4C]" />
              <span className="text-[13px] font-bold text-[#304E2F]">7-Day Forecast</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-[#4E6E4C] mb-2.5">Gemini's prediction based on your recent trend and upcoming academic events.</p>
              <p className="text-[14px] text-[#304E2F] leading-relaxed">{latestPrediction}</p>
            </div>
          </div>
        )}

        {/* ── Weekly Digest ─────────────────────────────────────────────── */}
        {digest && digest.digest && digest.digest !== 'No check-in data found for this week.' && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#304E2F]" />
                <span className="text-[13px] font-bold text-[#304E2F]">Weekly Reflection</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A8C99A]/30 border border-[#4E6E4C] text-[#4E6E4C] uppercase tracking-wide">
                Digest Service
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[14px] text-[#304E2F] leading-relaxed italic">{digest.digest}</p>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#E8E3D9]">
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B69265] mb-1">Best day</div>
                  <div className="text-[14px] font-bold text-[#4E6E4C]">{digest.best_day}</div>
                </div>
                <div className="text-center border-x border-[#E8E3D9]">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B69265] mb-1">Rough day</div>
                  <div className="text-[14px] font-bold text-[#594031]">{digest.worst_day}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B69265] mb-1">Pattern</div>
                  <div className="text-[11px] text-[#304E2F] leading-snug">{digest.pattern.split('.')[0]}.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── History Journal Entries ───────────────────────────────────── */}
        {hasJournalEntries && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#4E6E4C]" />
              <span className="text-[13px] font-bold text-[#304E2F]">Your Journal Entries</span>
            </div>
            <div className="divide-y divide-[#E8E3D9]">
              {history.filter(h => h.text_entry).map((entry) => {
                const key = entry.date;
                const expanded = historyExpanded[key];
                return (
                  <div key={key} className="px-5 py-4">
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setHistoryExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[12px] font-semibold text-[#304E2F]">
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex gap-2 text-[11px] text-[#4E6E4C]">
                          <span>😊 {entry.mood}</span>
                          <span>💤 {entry.sleep}</span>
                          <span>😤 {entry.stress}</span>
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#B69265]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#B69265]" />}
                    </button>
                    {expanded && (
                      <p className="mt-3 text-[13px] text-[#4E6E4C] leading-relaxed italic pl-0.5 border-l-2 border-[#D1CAA9] pl-3">
                        "{entry.text_entry}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 7-Day Check-in Chart ──────────────────────────────────────── */}
        <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#304E2F]" />
              <span className="text-[13px] font-bold text-[#304E2F]">7-Day Check-in History</span>
            </div>
            <div className="flex gap-4 text-[11px] font-medium text-[#4E6E4C]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#A8C99A]" /> Mood</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4E6E4C]" /> Sleep</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#594031]" /> Stress</div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-[11px] text-[#B69265] mb-4">
              Raw data from your daily check-ins — the input the Signal Agent analyses.
              {hasJournalEntries && ' Hover over a data point to read your journal entry for that day.'}
            </p>
            <div className="h-[200px] w-full">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E3D9" strokeOpacity={0.8} vertical={false} />
                    <XAxis
                      dataKey="date" stroke="#B69265" fontSize={10}
                      tickFormatter={(val) => { const p = val.split('-'); return p.length === 3 ? `${p[1]}/${p[2]}` : val; }}
                      tickMargin={8} axisLine={false} tickLine={false}
                    />
                    <YAxis domain={[1, 10]} stroke="#B69265" fontSize={10} tickCount={4} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="mood"   name="Mood"   stroke="#A8C99A" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#A8C99A', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="sleep"  name="Sleep"  stroke="#4E6E4C" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#4E6E4C', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#594031" strokeWidth={2} dot={{ fill: '#FBF7EC', stroke: '#594031', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
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

        {/* ── Full Alert History ────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#304E2F]" />
                <span className="text-[13px] font-bold text-[#304E2F]">Assessment History</span>
              </div>
              <span className="text-[11px] text-[#B69265]">{alerts.length} total</span>
            </div>
            <div className="divide-y divide-[#E8E3D9]">
              {visibleAlerts.map((alert) => {
                const ac = scoreColor(alert.final_score ?? 0);
                return (
                  <div key={alert.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                        style={{ backgroundColor: `${ac}15`, color: ac, border: `1px solid ${ac}40` }}
                      >
                        {alert.final_score ?? '—'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#304E2F] truncate">
                          {actionLabel(alert.action_taken)}
                        </div>
                        <div className="text-[11px] text-[#B69265]">
                          {new Date(alert.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {alert.counselor_flagged && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#594031]/10 text-[#594031] border border-[#594031]/20">
                          Flagged
                        </span>
                      )}
                      {alert.minimization_detected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#B69265]/10 text-[#B69265] border border-[#B69265]/20">
                          Minimized
                        </span>
                      )}
                      <span className="text-[11px] font-bold" style={{ color: ac }}>
                        {scoreLabel(alert.final_score ?? 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {alerts.length > 3 && (
              <button
                onClick={() => setShowAllAlerts(v => !v)}
                className="w-full py-3 text-[12px] font-semibold text-[#4E6E4C] hover:bg-[#FBF7EC] transition-colors flex items-center justify-center gap-1.5 border-t border-[#E8E3D9]"
              >
                {showAllAlerts ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {alerts.length} assessments</>}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
