import { ArrowRight, Brain, Activity, Zap, Users, BarChart2 } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
}

const AGENTS = [
  {
    icon: Activity,
    name: 'Signal Agent',
    role: 'Risk Detection',
    description: 'Runs 3 analysis loops on mood, sleep, and stress data. Detects emotional minimisation when written entries contradict numerical scores.',
  },
  {
    icon: BarChart2,
    name: 'Context Agent',
    role: 'Academic Calendar',
    description: 'Reads the USF academic calendar to identify exam periods, deadlines, and high-stress windows. Applies a stress multiplier to the base risk score.',
  },
  {
    icon: Users,
    name: 'Trend Agent',
    role: 'Campus Patterns',
    description: 'Aggregates anonymised campus data to detect floor-level and campus-wide stress spikes. Called by the Response Agent when individual scores cross 70.',
  },
  {
    icon: Zap,
    name: 'Response Agent',
    role: 'Outreach & Action',
    description: 'Decides what action to take based on the final score. Sends personalised support messages via Gemini and flags high-risk students to counselors.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Daily check-in',
    body: 'Students log mood, sleep quality, and stress level in under 30 seconds. An optional free-text field captures what words alone can reveal.',
  },
  {
    number: '02',
    title: 'Multi-agent analysis',
    body: 'Four specialised AI agents run in parallel and in sequence — scoring risk, reading campus context, and comparing trends across the dorm.',
  },
  {
    number: '03',
    title: 'Tiered response',
    body: 'Low scores receive no intervention. Moderate scores get a gentle nudge. High scores trigger a full outreach message and a counselor notification.',
  },
];

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#FBF7EC] font-sans text-[#594031]">

      {/* Nav */}
      <nav className="border-b border-[#D1CAA9] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3.5" fill="#304E2F" opacity="0.9"/>
            <line x1="11" y1="2"    x2="11" y2="5.5"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="11" y1="16.5" x2="11" y2="20"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="2"  y1="11"   x2="5.5" y2="11"  stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="16.5" y1="11" x2="20" y2="11"   stroke="#304E2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <span className="text-[15px] font-semibold text-[#304E2F] tracking-tight">Komorebi</span>
        </div>
        <button
          onClick={onEnter}
          className="text-[13px] font-semibold text-[#304E2F] hover:text-[#4E6E4C] transition-colors"
        >
          Open demo
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D1CAA9] border border-[#B69265] text-[11px] font-semibold text-[#594031] tracking-wide uppercase mb-8">
          Google ADK Hackathon Demo
        </div>
        <h1 className="text-[44px] md:text-[56px] font-bold text-[#304E2F] leading-[1.1] tracking-tight mb-6">
          Campus mental health,<br className="hidden sm:block" /> caught early.
        </h1>
        <p className="text-[17px] text-[#4E6E4C] leading-relaxed max-w-2xl mx-auto mb-10">
          Komorebi is an AI early-warning system for university residential life. Students check in daily.
          Four AI agents analyse the data and alert counselors before a crisis develops.
        </p>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#304E2F] text-[#FBF7EC] text-[14px] font-semibold hover:bg-[#4E6E4C] transition-colors"
        >
          Try the demo
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#D1CAA9]">
        <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-[#B69265] mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.number}>
              <div className="text-[32px] font-bold text-[#D1CAA9] mb-4 leading-none">{step.number}</div>
              <h3 className="text-[16px] font-semibold text-[#304E2F] mb-2">{step.title}</h3>
              <p className="text-[14px] text-[#4E6E4C] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent pipeline */}
      <section className="bg-[#D1CAA9] border-y border-[#B69265]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#304E2F]" />
            <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-[#594031]">AI Agent Pipeline</h2>
          </div>
          <p className="text-[15px] text-[#4E6E4C] mb-10 max-w-xl">
            Built with the Google Agent Development Kit. Each agent is a <code className="text-[13px] bg-[#FBF7EC] px-1.5 py-0.5 rounded text-[#304E2F]">BaseAgent</code> subclass running inside <code className="text-[13px] bg-[#FBF7EC] px-1.5 py-0.5 rounded text-[#304E2F]">ParallelAgent</code> and <code className="text-[13px] bg-[#FBF7EC] px-1.5 py-0.5 rounded text-[#304E2F]">LoopAgent</code> orchestration primitives.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div key={agent.name} className="bg-[#FBF7EC] border border-[#B69265] rounded-xl p-4">
                  <Icon className="w-4 h-4 text-[#4E6E4C] mb-3" />
                  <div className="text-[12px] font-semibold text-[#B69265] uppercase tracking-wide mb-1">{agent.role}</div>
                  <div className="text-[14px] font-bold text-[#304E2F] mb-2">{agent.name}</div>
                  <p className="text-[12px] text-[#4E6E4C] leading-relaxed">{agent.description}</p>
                </div>
              );
            })}
          </div>

          {/* Pipeline flow diagram */}
          <div className="mt-10 p-5 bg-[#FBF7EC] border border-[#B69265] rounded-xl">
            <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#B69265] mb-4">Execution flow</div>
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#4E6E4C]">
              <span className="px-2.5 py-1 bg-[#D1CAA9] border border-[#B69265] rounded-md text-[#304E2F]">Check-in submitted</span>
              <span className="text-[#B69265]">→</span>
              <span className="px-2.5 py-1 bg-[#D1CAA9] border border-[#B69265] rounded-md text-[#304E2F]">ParallelAgent</span>
              <span className="text-[10px] text-[#B69265]">(Signal LoopAgent + Context Agent)</span>
              <span className="text-[#B69265]">→</span>
              <span className="px-2.5 py-1 bg-[#D1CAA9] border border-[#B69265] rounded-md text-[#304E2F]">Response Agent</span>
              <span className="text-[#B69265]">→</span>
              <span className="px-2.5 py-1 bg-[#D1CAA9] border border-[#B69265] rounded-md text-[#304E2F]">A2A: Trend Agent</span>
              <span className="text-[10px] text-[#B69265]">(if score &gt; 70)</span>
              <span className="text-[#B69265]">→</span>
              <span className="px-2.5 py-1 bg-[#A8C99A] border border-[#4E6E4C] rounded-md text-[#304E2F]">Gemini outreach</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-[#B69265] mb-8">Built with</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: 'Google ADK', detail: 'Agent orchestration — LoopAgent, ParallelAgent, BaseAgent' },
            { name: 'Gemini 2.0 Flash', detail: 'Risk scoring, emotion analysis, outreach messages' },
            { name: 'FastAPI', detail: 'Python REST API with SQLAlchemy ORM' },
            { name: 'React + TypeScript', detail: 'Frontend UI with Tailwind CSS' },
            { name: 'APScheduler', detail: 'Nightly batch pipeline trigger' },
            { name: 'PostgreSQL', detail: 'Persistent storage for check-ins and alerts' },
          ].map(item => (
            <div key={item.name} className="border border-[#D1CAA9] rounded-xl p-4">
              <div className="text-[14px] font-semibold text-[#304E2F] mb-1">{item.name}</div>
              <div className="text-[12px] text-[#4E6E4C]">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#D1CAA9] bg-[#D1CAA9]">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#304E2F] mb-2">See it in action</h2>
            <p className="text-[14px] text-[#4E6E4C]">Log in as a student to submit a check-in and watch the agents run. Switch to the Counselor view to see campus-wide data.</p>
          </div>
          <button
            onClick={onEnter}
            className="flex-shrink-0 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#304E2F] text-[#FBF7EC] text-[14px] font-semibold hover:bg-[#4E6E4C] transition-colors"
          >
            Open demo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D1CAA9] px-6 py-6 text-center text-[11px] text-[#B69265]">
        Komorebi — Google ADK Hackathon 2025 · Demo mode, no real data collected
      </footer>

    </div>
  );
}
