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
  if (stress >= 7) return 'bg-[#4a2525] border-[#5a2d2d] text-[#e0a8a8]'; // High
  if (stress >= 4) return 'bg-[#3d331e] border-[#4a3e25] text-[#d4c39a]'; // Medium
  return 'bg-[#213326] border-[#2a4030] text-[#a0cfae]'; // Low
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
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#555]">
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
    <div className="min-h-screen bg-[#0c0c0c] p-6 font-sans text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Global Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-[#8a8dc4]" />
              <h1 className="text-xl font-semibold">Campus Overview</h1>
            </div>
            <p className="text-sm text-[#777]">Anonymised aggregated wellness data</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#161616] border border-[#252525] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-[#666]">Active Users</div>
                <div className="text-lg font-medium text-[#ccc]">{totalStudents}</div>
              </div>
              <div className="w-px h-8 bg-[#252525]" />
              <div className="text-center">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-[#666]">Agent Flags</div>
                <div className="text-lg font-medium text-[#c06060]">{totalFlagged}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Heatmap / List) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#161616] border border-[#252525] rounded-2xl p-5 shadow-sm">
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#777] mb-5">Dorm Floor Heatmap</h2>
              
              <div className="space-y-3">
                {data.floors.map(floor => (
                  <div key={floor.floor} className="flex items-center gap-4 p-3 rounded-xl bg-[#111] border border-[#1e1e1e]">
                    <div className="w-24">
                      <div className="text-[14px] font-medium text-[#ccc]">{floor.floor}</div>
                      <div className="text-[11px] text-[#666] flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {floor.student_count} 
                      </div>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="flex-1 flex gap-2">
                      <div className={`px-3 py-1.5 rounded-md border text-[12px] font-medium flex-1 flex justify-between items-center ${getStressColorClass(floor.avg_stress)}`}>
                        <span>Stress</span>
                        <span>{floor.avg_stress.toFixed(1)}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-md border text-[12px] font-medium flex-1 flex justify-between items-center ${getStressColorClass(10 - floor.avg_mood)}`}>
                        <span>Mood</span>
                        <span>{floor.avg_mood.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Flags indication */}
                    <div className="w-8 flex justify-center">
                      {floor.flagged_count > 0 ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c06060]/20 text-[#c06060] text-[11px] font-bold" title={`${floor.flagged_count} agent flags`}>
                          {floor.flagged_count}
                        </div>
                      ) : (
                        <span className="text-[#333]">&mdash;</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {data.floors.length === 0 && (
                  <div className="text-center py-6 text-[13px] text-[#555]">No floor data available this week.</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Spikes & Context) */}
          <div className="space-y-6">
            
            {/* Context Overlay */}
            <div className="bg-[#161616] border border-[#252525] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#7eb88a]" />
                <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#777]">Calendar Context</h2>
              </div>
              
              <div className="space-y-4">
                {data.upcoming_event ? (
                  <div className="p-3 bg-[#111] border border-[#1e1e1e] rounded-xl">
                    <div className="text-[11px] font-semibold tracking-wide uppercase text-[#8a8dc4] mb-1">Upcoming Event</div>
                    <div className="text-[14px] text-[#ccc] leading-snug">{data.upcoming_event}</div>
                  </div>
                ) : (
                  <div className="text-[13px] text-[#555]">No immediate academic events driving campus stress.</div>
                )}

                {/* Campus Wide Elevated State */}
                <div className={`p-4 rounded-xl border ${data.campus_stress_elevated ? 'bg-[#2a1717] border-[#4a2525]' : 'bg-[#152419] border-[#1e3323]'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[12px] font-semibold tracking-wide uppercase text-[#ccc]">Campus Stress</span>
                    <span className={`text-[12px] font-bold ${data.campus_stress_elevated ? 'text-[#c06060]' : 'text-[#7eb88a]'}`}>
                      {data.percent_high_stress}% High
                    </span>
                  </div>
                  <p className="text-[12px] text-[#888] leading-relaxed mt-2">
                    {data.campus_stress_elevated 
                      ? "Campus stress levels are significantly elevated. Agents may apply multiplier penalties."
                      : "Baselines are stable. Over half the campus reports normal stress levels."}
                  </p>
                </div>
              </div>
            </div>

            {/* Spike Feed */}
            <div className="bg-[#161616] border border-[#252525] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-[#cba052]" />
                <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#777]">Spike Alerts</h2>
              </div>
              
              <div className="space-y-3">
                {spikes.length > 0 ? (
                  spikes.map(spike => (
                    <div key={spike.floor} className="p-3 bg-[#1f1a11] border border-[#3b301c] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-medium text-[#ccc]">{spike.floor}</div>
                        <div className="text-[11px] text-[#a88a50] mt-0.5">Sudden deterioration</div>
                      </div>
                      <div className="flex items-center text-[#c06060] font-medium text-[13px] bg-[#3a1f1f] px-2 py-1 rounded">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        {Math.abs(spike.spike_delta)} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-[#555] py-2 text-center border border-dashed border-[#252525] rounded-xl">
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
