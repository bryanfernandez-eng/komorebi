import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Calendar, Activity, Users, ArrowDownRight, Brain, BarChart2, Zap } from 'lucide-react';
import { getCounselorDashboard } from '../api';

interface FloorSummary {
  floor: string;
  avg_stress: number;
  avg_mood: number;
  student_count: number;
  flagged_count: number;
  spike_detected: boolean;
  spike_delta: number;
}

interface DashboardResponse {
  floors: FloorSummary[];
  campus_stress_elevated: boolean;
  percent_high_stress: number;
  upcoming_event?: string;
}

function stressStyle(stress: number): { bg: string; border: string; text: string; label: string } {
  if (stress >= 7) return { bg: '#594031', border: '#594031', text: '#FBF7EC', label: 'High' };
  if (stress >= 4) return { bg: '#B69265', border: '#B69265', text: '#FBF7EC', label: 'Moderate' };
  return { bg: '#A8C99A', border: '#4E6E4C', text: '#304E2F', label: 'Low' };
}

export default function CounselorDashboard() {
  const [data,    setData]    = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getCounselorDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to fetch counselor data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#4E6E4C]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[13px] font-medium">Aggregating anonymised data...</span>
        </div>
      </div>
    );
  }

  const spikes        = data.floors.filter(f => f.spike_detected);
  const totalFlagged  = data.floors.reduce((acc, f) => acc + f.flagged_count, 0);
  const totalStudents = data.floors.reduce((acc, f) => acc + f.student_count, 0);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active students', value: totalStudents, icon: Users,       sub: 'checked in this week' },
            { label: 'Agent flags',     value: totalFlagged,  icon: ShieldAlert,  sub: 'counselor notifications' },
            { label: 'High stress',     value: `${data.percent_high_stress}%`, icon: BarChart2, sub: 'of campus' },
            { label: 'Floor spikes',    value: spikes.length, icon: AlertTriangle, sub: 'sudden deteriorations' },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-white border border-[#D1CAA9] rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-[#4E6E4C]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#4E6E4C]">{label}</span>
              </div>
              <div className="text-[22px] font-bold text-[#304E2F]">{value}</div>
              <div className="text-[11px] text-[#B69265] mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* How agents feed this view */}
        <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-[#304E2F]" />
            <span className="text-[13px] font-bold text-[#304E2F]">How the AI pipeline feeds this view</span>
          </div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Activity,     name: 'Signal Agent',   detail: '3-loop risk scoring per student. Detects emotional minimisation.' },
              { icon: BarChart2,    name: 'Context Agent',  detail: 'Reads USF academic calendar. Applies stress multiplier to base scores.' },
              { icon: Users,        name: 'Trend Agent',    detail: 'Aggregates anonymised floor data. Provides campus comparison context.' },
              { icon: Zap,          name: 'Response Agent', detail: 'Determines action tier. Triggers counselor flag when score exceeds 70.' },
            ].map(({ icon: Icon, name, detail }) => (
              <div key={name} className="p-3.5 bg-[#FBF7EC] border border-[#E8E3D9] rounded-xl">
                <Icon className="w-3.5 h-3.5 text-[#4E6E4C] mb-2" />
                <div className="text-[12px] font-bold text-[#304E2F] mb-1">{name}</div>
                <p className="text-[11px] text-[#4E6E4C] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* Floor heatmap */}
          <div className="lg:col-span-2 bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E3D9]">
              <span className="text-[13px] font-bold text-[#304E2F]">Dorm Floor Heatmap</span>
              <p className="text-[11px] text-[#4E6E4C] mt-0.5">Anonymised averages from student check-ins</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[96px_1fr_1fr_32px] gap-3 text-[10px] font-semibold uppercase tracking-wide text-[#B69265] px-0.5">
                <span>Floor</span>
                <span>Avg stress</span>
                <span>Avg mood</span>
                <span>Flags</span>
              </div>

              {data.floors.map(floor => {
                const ss = stressStyle(floor.avg_stress);
                const ms = stressStyle(10 - floor.avg_mood);
                return (
                  <div key={floor.floor} className="grid grid-cols-[96px_1fr_1fr_32px] gap-3 items-center p-3 bg-[#FBF7EC] border border-[#E8E3D9] rounded-xl">
                    <div>
                      <div className="text-[13px] font-bold text-[#304E2F]">{floor.floor}</div>
                      <div className="text-[10px] text-[#4E6E4C] flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5" />{floor.student_count}
                      </div>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex justify-between items-center"
                      style={{ backgroundColor: ss.bg, border: `1px solid ${ss.border}`, color: ss.text }}
                    >
                      <span>{ss.label}</span>
                      <span>{floor.avg_stress.toFixed(1)}</span>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex justify-between items-center"
                      style={{ backgroundColor: ms.bg, border: `1px solid ${ms.border}`, color: ms.text }}
                    >
                      <span>{floor.avg_mood >= 7 ? 'Good' : floor.avg_mood >= 4 ? 'Fair' : 'Low'}</span>
                      <span>{floor.avg_mood.toFixed(1)}</span>
                    </div>

                    <div className="flex justify-center">
                      {floor.flagged_count > 0 ? (
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: '#FBF7EC', border: '1px solid #594031', color: '#594031' }}
                          title={`${floor.flagged_count} AI flag${floor.flagged_count > 1 ? 's' : ''}`}
                        >
                          {floor.flagged_count}
                        </div>
                      ) : (
                        <span className="text-[#D1CAA9] text-[14px]">&mdash;</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {data.floors.length === 0 && (
                <p className="text-center py-6 text-[13px] text-[#4E6E4C]">No floor data available this week.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Calendar context */}
            <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#304E2F]" />
                <span className="text-[13px] font-bold text-[#304E2F]">Calendar Context</span>
              </div>
              <div className="p-4 space-y-3">
                {data.upcoming_event ? (
                  <div className="p-3 bg-[#FBF7EC] border border-[#D1CAA9] rounded-xl">
                    <div className="text-[10px] font-bold tracking-wide uppercase text-[#B69265] mb-1">Upcoming event</div>
                    <div className="text-[13px] font-medium text-[#304E2F] leading-snug">{data.upcoming_event}</div>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#4E6E4C]">No immediate academic events detected.</p>
                )}

                <div
                  className="p-3.5 rounded-xl border"
                  style={{
                    backgroundColor: data.campus_stress_elevated ? '#FBF7EC' : '#A8C99A20',
                    borderColor: data.campus_stress_elevated ? '#594031' : '#4E6E4C',
                  }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#304E2F]">Campus stress</span>
                    <span className="text-[12px] font-bold" style={{ color: data.campus_stress_elevated ? '#594031' : '#4E6E4C' }}>
                      {data.percent_high_stress}% high
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: data.campus_stress_elevated ? '#594031' : '#4E6E4C' }}>
                    {data.campus_stress_elevated
                      ? 'Campus stress elevated. Context Agent is applying score multipliers.'
                      : 'Baselines stable. Over half the campus reports normal stress.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Spike feed */}
            <div className="bg-white border border-[#D1CAA9] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#E8E3D9] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B69265]" />
                <span className="text-[13px] font-bold text-[#304E2F]">Floor Spike Alerts</span>
              </div>
              <div className="p-4 space-y-2.5">
                {spikes.length > 0 ? (
                  spikes.map(spike => (
                    <div key={spike.floor} className="flex items-center justify-between p-3 bg-[#FBF7EC] border border-[#D1CAA9] rounded-xl">
                      <div>
                        <div className="text-[13px] font-bold text-[#304E2F]">{spike.floor}</div>
                        <div className="text-[11px] text-[#4E6E4C] mt-0.5">Sudden deterioration detected</div>
                      </div>
                      <div className="flex items-center text-[#594031] font-bold text-[12px] bg-[#D1CAA9] px-2 py-1 rounded-lg">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        {Math.abs(spike.spike_delta)} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center border border-dashed border-[#D1CAA9] rounded-xl">
                    <p className="text-[12px] text-[#4E6E4C]">No sudden floor spikes detected.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
