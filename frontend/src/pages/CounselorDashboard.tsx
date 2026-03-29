import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Calendar, Activity, Users, ArrowDownRight } from 'lucide-react';
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

// Map stress value (1-10) to a background color
function getStressColorClass(stress: number) {
  if (stress >= 7) return 'bg-[#594031] border-[#594031] text-[#FBF7EC]';     // High (Text Brown)
  if (stress >= 4) return 'bg-[#B69265] border-[#B69265] text-[#FBF7EC]';     // Medium (Soft Brown)
  return 'bg-[#A8C99A] border-[#A8C99A] text-[#304E2F] opacity-90';           // Low (Main Green)
}

export default function CounselorDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getCounselorDashboard();
        setData(res);
      } catch (err) {
        console.error("Failed to fetch counselor data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#FBF7EC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#4E6E4C]">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium tracking-wide">Aggregating anonymized data...</span>
        </div>
      </div>
    );
  }

  // Find spikes
  const spikes = data.floors.filter(f => f.spike_detected);
  
  // Total flagged
  const totalFlagged = data.floors.reduce((acc, f) => acc + f.flagged_count, 0);
  const totalStudents = data.floors.reduce((acc, f) => acc + f.student_count, 0);

  return (
    <div className="min-h-screen bg-[#FBF7EC] p-6 font-sans text-[#594031]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Global Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-[#B69265]" />
              <h1 className="text-xl font-bold text-[#304E2F]">Campus Overview</h1>
            </div>
            <p className="text-sm font-medium text-[#4E6E4C]">Anonymised aggregated wellness data</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#D1CAA9] border border-[#B69265] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-[#4E6E4C]">Active Users</div>
                <div className="text-lg font-bold text-[#304E2F]">{totalStudents}</div>
              </div>
              <div className="w-px h-8 bg-[#B69265]" />
              <div className="text-center">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-[#4E6E4C]">Agent Flags</div>
                <div className="text-lg font-bold text-[#594031]">{totalFlagged}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Heatmap / List) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5 shadow-sm">
              <h2 className="text-[13px] font-bold tracking-[0.08em] uppercase text-[#304E2F] mb-5">Dorm Floor Heatmap</h2>
              
              <div className="space-y-3">
                {data.floors.map(floor => (
                  <div key={floor.floor} className="flex items-center gap-4 p-3 rounded-xl bg-[#FBF7EC] border border-[#B69265]">
                    <div className="w-24">
                      <div className="text-[14px] font-bold text-[#304E2F]">{floor.floor}</div>
                      <div className="text-[11px] font-medium text-[#4E6E4C] flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {floor.student_count} 
                      </div>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="flex-1 flex gap-2">
                      <div className={`px-3 py-1.5 rounded-md border text-[12px] font-semibold flex-1 flex justify-between items-center ${getStressColorClass(floor.avg_stress)}`}>
                        <span>Stress</span>
                        <span>{floor.avg_stress.toFixed(1)}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-md border text-[12px] font-semibold flex-1 flex justify-between items-center ${getStressColorClass(10 - floor.avg_mood)}`}>
                        <span>Mood</span>
                        <span>{floor.avg_mood.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Flags indication */}
                    <div className="w-8 flex justify-center">
                      {floor.flagged_count > 0 ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D1CAA9] text-[#594031] text-[11px] font-bold border border-[#594031]" title={`${floor.flagged_count} agent flags`}>
                          {floor.flagged_count}
                        </div>
                      ) : (
                        <span className="text-[#B69265]">&mdash;</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {data.floors.length === 0 && (
                  <div className="text-center py-6 text-[13px] font-medium text-[#4E6E4C]">No floor data available this week.</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Spikes & Context) */}
          <div className="space-y-6">
            
            {/* Context Overlay */}
            <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#304E2F]" />
                <h2 className="text-[13px] font-bold tracking-[0.08em] uppercase text-[#304E2F]">Calendar Context</h2>
              </div>
              
              <div className="space-y-4">
                {data.upcoming_event ? (
                  <div className="p-3 bg-[#FBF7EC] border border-[#B69265] rounded-xl">
                    <div className="text-[11px] font-bold tracking-wide uppercase text-[#B69265] mb-1">Upcoming Event</div>
                    <div className="text-[14px] font-medium text-[#304E2F] leading-snug">{data.upcoming_event}</div>
                  </div>
                ) : (
                  <div className="text-[13px] font-medium text-[#4E6E4C]">No immediate academic events driving campus stress.</div>
                )}

                {/* Campus Wide Elevated State */}
                <div className={`p-4 rounded-xl border ${data.campus_stress_elevated ? 'bg-[#FBF7EC] border-[#594031]' : 'bg-[#A8C99A] border-[#304E2F]'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[12px] font-bold tracking-wide uppercase text-[#304E2F]">Campus Stress</span>
                    <span className={`text-[12px] font-bold ${data.campus_stress_elevated ? 'text-[#594031]' : 'text-[#304E2F]'}`}>
                      {data.percent_high_stress}% High
                    </span>
                  </div>
                  <p className="text-[12px] font-medium leading-relaxed mt-2" style={{ color: data.campus_stress_elevated ? '#594031' : '#304E2F' }}>
                    {data.campus_stress_elevated 
                      ? "Campus stress levels are significantly elevated. Agents may apply multiplier penalties."
                      : "Baselines are stable. Over half the campus reports normal stress levels."}
                  </p>
                </div>
              </div>
            </div>

            {/* Spike Feed */}
            <div className="bg-[#D1CAA9] border border-[#B69265] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-[#B69265]" />
                <h2 className="text-[13px] font-bold tracking-[0.08em] uppercase text-[#304E2F]">Spike Alerts</h2>
              </div>
              
              <div className="space-y-3">
                {spikes.length > 0 ? (
                  spikes.map(spike => (
                    <div key={spike.floor} className="p-3 bg-[#FBF7EC] border border-[#B69265] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-bold text-[#304E2F]">{spike.floor}</div>
                        <div className="text-[11px] font-medium text-[#4E6E4C] mt-0.5">Sudden deterioration</div>
                      </div>
                      <div className="flex items-center text-[#594031] font-bold text-[13px] bg-[#D1CAA9] px-2 py-1 rounded">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        {Math.abs(spike.spike_delta)} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] font-medium text-[#4E6E4C] py-2 text-center border border-dashed border-[#B69265] rounded-xl">
                    No sudden floor spikes detected.
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
