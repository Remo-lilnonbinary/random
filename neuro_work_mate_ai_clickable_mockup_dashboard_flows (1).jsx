// v1.2 – Fix: removed extra parenthesis in FocusTimer seconds, added formatMMSS helper + tests, and restored Wellbeing component.
import React, { useState, useEffect, isValidElement } from "react";
import { Calendar, Clock, Bell, Mic, CheckCircle2, ChevronRight, PauseCircle, PlayCircle, MapPin, ShieldCheck, Sparkles, FileText, Settings as SettingsIcon, Activity, Brain, MessageSquare, Smartphone, Eye } from "lucide-react";

// --- Logo handling ---
// Tries: data URL → public URL → local file (/public/newro.png) → SVG fallback
const LOGO_URL = ""; // optional public URL
const LOGO_DATA_URL = ""; // optional base64 data-URI: data:image/png;base64,.....
const LOGO_FILE_PATH = "/newro.png"; // put newro.png in your project's public/ folder

const Logo = () => {
  const [mode, setMode] = useState(LOGO_DATA_URL ? "data" : (LOGO_URL ? "url" : (LOGO_FILE_PATH ? "file" : "svg")));
  if (mode === "data") return <img src={LOGO_DATA_URL} alt="NEWRO logo" width={96} height={30} style={{objectFit:"contain"}} onError={() => setMode(LOGO_URL ? "url" : (LOGO_FILE_PATH ? "file" : "svg"))} />;
  if (mode === "url") return <img src={LOGO_URL} alt="NEWRO logo" width={96} height={30} style={{objectFit:"contain"}} onError={() => setMode(LOGO_FILE_PATH ? "file" : "svg")} />;
  if (mode === "file") return <img src={LOGO_FILE_PATH} alt="NEWRO logo" width={96} height={30} style={{objectFit:"contain"}} onError={() => setMode("svg")} />;
  return (
    <svg width="96" height="30" viewBox="0 0 560 180" preserveAspectRatio="xMidYMid meet" aria-label="NEWRO logo" role="img">
      <defs>
        <style>{`.t{font-family: ui-rounded, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-weight: 800;}`}</style>
      </defs>
      <text x="0" y="132" fontSize="140" className="t" fill="#FFD95A">N</text>
      <text x="110" y="132" fontSize="140" className="t" fill="#FF7A59">E</text>
      <text x="210" y="132" fontSize="140" className="t" fill="#FF3434">W</text>
      <text x="360" y="132" fontSize="140" className="t" fill="#5B2DFF">R</text>
      <g transform="translate(470,10)">
        <circle cx="70" cy="80" r="70" fill="#1207B7"/>
        <circle cx="70" cy="80" r="48" fill="#FFFFFF"/>
        <circle cx="70" cy="80" r="18" fill="#1F1F1F"/>
      </g>
    </svg>
  );
};

// --- App ---
export default function App() {
  const [tab, setTab] = useState("welcome");
  const [calm, setCalm] = useState(true);
  const [focusOn, setFocusOn] = useState(false);
  const [digestTime, setDigestTime] = useState("10:30");
  const [room, setRoom] = useState("Quiet Pod B");
  const [preset, setPreset] = useState("Low light • 20°C • Noise mask");
  const [urgentLane, setUrgentLane] = useState(true);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [showTests, setShowTests] = useState(false);

  // Start a focus session and remain on Welcome (HUD appears there)
  const beginFocus = () => {
    setTab('welcome');
    setFocusOn(true);
  };
  const goSettings = () => setTab('settings');

  // Helper used by the Welcome chat
  const draftDayPlan = (): string => [
    "Here’s a balanced plan for today:",
    "• 09:00 Settle in + quick scan of priorities",
    "• 09:10 Focus (25m) — DND on, tree grows; 5m reset",
    "• 10:00 Desk stretch + water",
    "• 10:30 Digest — bundle Slack/Email; urgent lane stays open",
    "• 11:00 Adjustment hub check (quiet pod confirmed)",
    "• 12:30 Lunch + short walk",
    "• 13:30 Focus (25m) x2 — with 5m breathing/grounding between",
    "• 15:00 Meeting — capture decisions→actions (auto‑recap)",
    "• 16:30 Digest — catch‑up + draft replies",
    "• 17:00 Wrap — rollover, set tomorrow’s top 3"
  ].join("\n");

  // --- Small helper to format time ---
  const formatMMSS = (remaining: number) => {
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    return { mm, ss };
  };

  // UI primitives
  const TabButton = ({ id, icon: Icon, label }) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 ${tab === id ? "bg-white border-indigo-200" : "bg-indigo-50/30 border-transparent"}`} aria-pressed={tab === id}>
      <Icon className="w-4 h-4 opacity-70" aria-hidden /> {label}
    </button>
  );

  const Section = ({ title, children, right }) => (
    <section className="bg-white rounded-2xl border border-indigo-100 p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );

  const Pill = ({ children }) => (
    <span className="px-2.5 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700">{children}</span>
  );

  const maybe = (content) => (calm ? null : content);

  // --- Focus Timer with progress bar ---
  const FocusTimer = ({ minutes = 90, isRunning = false, onComplete, onTick }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => { if (isRunning) setElapsed(0); }, [isRunning]);

    useEffect(() => {
      if (!isRunning) return;
      const id = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          const total = minutes * 60;
          const pct = Math.round((next / total) * 100);
          if (onTick) onTick({ elapsed: next, total, pct, remaining: Math.max(total - next, 0) });
          if (next >= total) {
            clearInterval(id);
            if (onComplete) onComplete();
            return total;
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(id);
    }, [isRunning, minutes, onComplete, onTick]);

    const total = minutes * 60;
    const remaining = Math.max(total - elapsed, 0);
    const pct = Math.round((elapsed / total) * 100);
    const { mm, ss } = formatMMSS(remaining);

    return (
      <div className="space-y-2" aria-live="polite">
        <div className="text-2xl font-semibold tracking-tight">
          {mm}:{ss} <span className="text-sm text-slate-600">remaining</span>
        </div>
        <div role="progressbar" aria-label="Focus time remaining" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-4 rounded-full bg-indigo-100 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-[width] duration-1000 ease-linear motion-reduce:transition-none" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  // --- Visuals & subcomponents ---
  function Breathing(){
    return (
      <div className="rounded-2xl border border-indigo-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Breathing helper</div>
          <div className="text-xs text-slate-600">In 4 • Hold 4 • Out 6</div>
        </div>
        <div className="w-full h-28 grid place-items-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-indigo-200/60 motion-reduce:animate-none animate-[pulse_6s_ease-in-out_infinite]"></div>
            <div className="absolute inset-2 rounded-full bg-indigo-300/50 motion-reduce:animate-none animate-[pulse_6s_ease-in-out_infinite]" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute inset-4 rounded-full bg-indigo-400/40 motion-reduce:animate-none animate-[pulse_6s_ease-in-out_infinite]" style={{animationDelay: '3s'}}></div>
          </div>
        </div>
        <div className="grid grid-cols-3 text-center text-xs text-slate-600" aria-hidden>
          <span>In</span><span>Hold</span><span>Out</span>
        </div>
      </div>
    );
  }

  function TreeGrow({ pct = 0 }){
    const stemH = 20 + Math.round((pct/100) * 80); // 20 -> 100
    const leafR = 8 + Math.round((pct/100) * 16);  // 8 -> 24
    return (
      <div className="w-full grid place-items-center" aria-label={`Focus growth visual ${pct}% complete`}>
        <svg width="220" height="140" viewBox="0 0 220 140" role="img">
          <rect x="80" y="108" width="60" height="18" rx="6" fill="#A78BFA" opacity="0.35"/>
          <rect x="86" y="104" width="48" height="6" rx="3" fill="#7C3AED" opacity="0.25"/>
          <rect x="109" y={104 - stemH} width="2" height={stemH} fill="#4F46E5"/>
          <circle cx="110" cy={104 - stemH} r={leafR} fill="#8B5CF6" opacity="0.35"/>
          <circle cx={110 - Math.max(6, leafR/2)} cy={104 - stemH + 6} r={Math.max(leafR-4, 6)} fill="#A78BFA" opacity="0.30"/>
          <circle cx={110 + Math.max(6, leafR/2)} cy={104 - stemH + 6} r={Math.max(leafR-6, 5)} fill="#C4B5FD" opacity="0.30"/>
        </svg>
      </div>
    );
  }

  const FocusStart = ({ digestTime, room, preset, focusOn, setFocusOn, focusMinutes }) => {
    const [treePct, setTreePct] = useState(0);
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3"><MapPin className="w-4 h-4 opacity-70" aria-hidden /><div className="text-sm">{room} • {preset}</div></div>
        <div className="flex items-center gap-3"><Clock className="w-4 h-4 opacity-70" aria-hidden /><div className="text-sm">{focusMinutes} minutes • Digest at {digestTime}</div></div>
        <Breathing />
        <TreeGrow pct={treePct} />
        <FocusTimer minutes={focusMinutes} isRunning={focusOn} onComplete={() => setFocusOn(false)} onTick={({ pct }) => setTreePct(pct)} />
        <button onClick={() => setFocusOn(!focusOn)} className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold bg-indigo-900 text-white focus:ring-2 focus:ring-indigo-200">
          {focusOn ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />} {focusOn ? "Pause / End Focus" : "Start Focus"}
        </button>
        <p className="text-xs text-slate-600">During focus: notifications pause, status set to Focus, room preset applies, digests queue.</p>
      </div>
    );
  };

  const FocusSetup = ({ digestTime, setDigestTime, room, setRoom, preset, setPreset, urgentLane, setUrgentLane, focusMinutes, setFocusMinutes, beginFocus }) => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Setup" right={<Pill>Neuro-twin presets</Pill>}>
        <div className="grid gap-4 text-sm">
          <label className="grid gap-1"><span className="text-xs text-slate-600">Duration</span>
            <select className="border rounded-xl px-3 py-2" value={focusMinutes} onChange={(e)=>setFocusMinutes(parseInt(e.target.value))}>
              <option value={25}>25 minutes (default)</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </label>
          <label className="grid gap-1"><span className="text-xs text-slate-600">Room</span><select className="border rounded-xl px-3 py-2" value={room} onChange={(e)=>setRoom(e.target.value)}><option>Quiet Pod A</option><option>Quiet Pod B</option><option>Library Desk 3F</option></select></label>
          <label className="grid gap-1"><span className="text-xs text-slate-600">Preset</span><select className="border rounded-xl px-3 py-2" value={preset} onChange={(e)=>setPreset(e.target.value)}><option>Low light • 20°C • Noise mask</option><option>Daylight • 21°C • No audio</option><option>Warm • 22°C • Brown noise</option></select></label>
          <label className="grid gap-1"><span className="text-xs text-slate-600">Next digest</span><select className="border rounded-xl px-3 py-2" value={digestTime} onChange={(e)=>setDigestTime(e.target.value)}><option>10:00</option><option>10:30</option><option>11:00</option></select></label>
          <label className="inline-flex items-center gap-2"><input id="urgent" type="checkbox" checked={urgentLane} onChange={()=>setUrgentLane(!urgentLane)} /><span className="text-sm">Allow priority lane (@mentions, deadlines)</span></label>
          <button onClick={beginFocus} className="bg-indigo-900 text-white rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 w-full"><PlayCircle className="w-4 h-4"/> Start Focus</button>
        </div>
      </Section>
      <Section title="During focus" right={<Pill>Calm view</Pill>}>
        <div className="text-sm space-y-3">
          <div className="rounded-xl p-3 bg-indigo-50/70 border border-indigo-100">Status set to <b>Focus</b>; messages queued.</div>
          <div className="rounded-xl p-3 bg-purple-50/70 border border-purple-100">Room preset applied: {preset}.</div>
          <div className="rounded-xl p-3 bg-rose-50/70 border border-rose-100">12:00 stand-up switched to async; draft reply ready.</div>
          <Breathing />
        </div>
      </Section>
    </div>
  );

  const Digests = () => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Digest settings" right={<Pill>Less noise</Pill>}>
        <div className="grid gap-4 text-sm">
          <div><div className="text-xs text-slate-600 mb-1">Times</div><div className="flex gap-2"><button className="px-3 py-2 border rounded-xl">10:30</button><button className="px-3 py-2 border rounded-xl">14:30</button><button className="px-3 py-2 border rounded-xl">16:30</button></div></div>
          <div><div className="text-xs text-slate-600 mb-1">Always allow</div><div className="flex flex-wrap gap-2"><Pill>@manager</Pill><Pill>#incident</Pill><Pill>Calendar invites</Pill></div></div>
          <div><div className="text-xs text-slate-600 mb-1">Format</div><div className="flex gap-2"><Pill>Bullets</Pill><Pill>Checklist</Pill><Pill>Audio</Pill></div></div>
        </div>
      </Section>
      <Section title="Sample digest (10:30)" right={<Pill>Preview</Pill>}>
        <div className="text-sm space-y-3"><div className="font-semibold">Urgent</div><div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 mb-2">@you: approve PRD by 12:00</div><div className="font-semibold">Decisions</div><div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3 mb-2">Choose option B for onboarding copy</div><div className="font-semibold">FYI (7)</div><div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">Collapsed • tap to expand</div></div>
      </Section>
    </div>
  );

  const Recap = () => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Meeting recap" right={<Pill>RAG-backed</Pill>}>
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2"><Mic className="w-4 h-4 opacity-70" aria-hidden/> Transcript processed</div>
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3"><div className="text-xs text-slate-600 mb-1">Decisions</div><ul className="list-disc ml-5"><li>Adopt onboarding copy option B</li><li>Move Wed stand-up to async for trial</li></ul></div>
          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3"><div className="text-xs text-slate-600 mb-1">Actions</div><ul className="list-disc ml-5"><li>Design team to update mockups (owner: Aisha, due: Thu)</li><li>Ops to draft async stand-up template (owner: Ben, due: Fri)</li></ul></div>
          <button className="bg-indigo-900 text-white rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 w-full"><Sparkles className="w-4 h-4"/> Post recap to Teams</button>
        </div>
      </Section>
      <Section title="Sources & policy" right={<Pill>Citations</Pill>}>
        <div className="text-sm space-y-2"><div className="bg-white border border-indigo-100 rounded-xl p-3">Link: <span className="underline">HR Policy → Meetings & Notes</span></div><div className="bg-white border border-indigo-100 rounded-xl p-3">Link: <span className="underline">Team Wiki → Async Templates</span></div><div className="text-xs text-slate-600">Answers are grounded via Retrieval; sources attached.</div></div>
      </Section>
    </div>
  );

  const Adjustments = () => (
    <div className="grid md:grid-cols-3 gap-5">
      <Section title="Request an adjustment" right={<Pill>Self-serve</Pill>}>
        <div className="grid gap-4 text-sm">
          <label className="grid gap-1"><span className="text-xs text-slate-600">Need</span><select className="border rounded-xl px-3 py-2"><option>Noise reduction headset</option><option>Screen filter</option><option>Quiet workspace allocation</option></select></label>
          <label className="grid gap-1"><span className="text-xs text-slate-600">Reason (plain language)</span><textarea className="border rounded-xl px-3 py-2" rows={3} placeholder="Helps with sensory overload during analysis"></textarea></label>
          <button className="bg-indigo-900 text-white rounded-2xl px-4 py-3 text-sm font-semibold w-full">Submit request</button>
          <p className="text-xs text-slate-600">Policy-backed guidance with citations; typical SLA 5–10 business days.</p>
        </div>
      </Section>
      <Section title="Track approvals" right={<Pill>Status</Pill>}>
        <ul className="text-sm space-y-3"><li className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100">Noise reduction headset • <b>Pending manager</b></li><li className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100">Quiet workspace allocation • <b>Approved</b></li></ul>
      </Section>
      <Section title="What’s offered" right={<Pill>Catalogue</Pill>}>
        <ul className="text-sm space-y-2"><li>Assistive tech stipend • up to £300</li><li>Quiet Pods & Library zones</li><li>Adjusted hours & meeting-free blocks</li></ul>
        <p className="text-xs text-slate-600 mt-2">Powered by Retrieval (RAG); exact policy snippets shown.</p>
      </Section>
    </div>
  );

  // Restored Wellbeing provider block used by AppSettings
  const Wellbeing = ({ room }) => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Early warning" right={<Pill>Private</Pill>}>
        <div className="text-sm space-y-3">
          <div className="rounded-xl p-3 bg-amber-50/70 border border-amber-100">Signals: 7h meetings • 3 focus blocks missed • energy down</div>
          <div className="rounded-xl p-3 bg-orange-50/70 border border-orange-100">Plan: move Fri stand-up to async; book {room}; start 5-min reset.</div>
          <div className="flex gap-2">
            <button className="bg-indigo-900 text-white rounded-xl px-3 py-2 text-sm">Apply plan</button>
            <button className="bg-white border border-indigo-100 rounded-xl px-3 py-2 text-sm">Review options</button>
          </div>
        </div>
      </Section>
      <Section title="Micro-supports" right={<Pill>Neuro-inclusive</Pill>}>
        <div className="grid gap-2 text-sm">
          <button className="bg-white border border-indigo-100 rounded-xl p-3 flex items-center justify-between"><span>Initiation prompt (2 min)</span><ChevronRight className="w-4 h-4 opacity-70" aria-hidden/></button>
          <button className="bg-white border border-indigo-100 rounded-xl p-3 flex items-center justify-between"><span>Noise coping card</span><ChevronRight className="w-4 h-4 opacity-70" aria-hidden/></button>
          <button className="bg-white border border-indigo-100 rounded-xl p-3 flex items-center justify-between"><span>Plain-language script: ask for quiet room</span><ChevronRight className="w-4 h-4 opacity-70" aria-hidden/></button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Agent acts only with your approval; routes to EAP/HR when needed.</p>
      </Section>
    </div>
  );

  // Settings view (renamed to avoid clashing with lucide-react Settings icon)
  const AppSettings = ({
    digestTime, setDigestTime,
    room, setRoom,
    preset, setPreset,
    urgentLane, setUrgentLane,
    focusMinutes, setFocusMinutes,
    beginFocus
  }) => (
    <div className="grid gap-5">
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Settings</h2>
      <p className="text-slate-700">Configure focus, communication digests, meeting recaps, adjustments, and wellbeing—all in one calm place.</p>
      <FocusSetup
        digestTime={digestTime}
        setDigestTime={setDigestTime}
        room={room}
        setRoom={setRoom}
        preset={preset}
        setPreset={setPreset}
        urgentLane={urgentLane}
        setUrgentLane={setUrgentLane}
        focusMinutes={focusMinutes}
        setFocusMinutes={setFocusMinutes}
        beginFocus={beginFocus}
      />
      <Digests />
      <Recap />
      <Adjustments />
      <Wellbeing room={room} />
    </div>
  );

  // Welcome (main surface)
  const Welcome = ({ calm, beginFocus, goSettings, focusOn, setFocusOn, focusMinutes, digestTime, room, preset }) => {
    const [messages, setMessages] = useState([
      { role: "assistant", text: "Hi Ava — I’m your agentic assistant. Use any words, formats, or languages that work for you — I’ll adapt." }
    ]);
    const [input, setInput] = useState("");
    const [askBeforeAct, setAskBeforeAct] = useState(true);
    const [listening, setListening] = useState(false);
    const prompts = [
      "Plan my day",
      "Start 25‑min focus",
      "Summarise my morning",
      "Request a quiet workspace",
      "Draft a message to my manager"
    ];

    const send = () => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const userMsg = { role: "user", text: trimmed };
      const lower = trimmed.toLowerCase();
      let reply: string;
      if (lower.includes("plan my day")) {
        reply = draftDayPlan();
      } else {
        reply = askBeforeAct
          ? "Got it. I’ll prepare a calm plan and ask before taking any steps."
          : "Understood. I’ll proceed with a calm plan and auto‑act on low‑risk steps (you can undo).";
      }
      setMessages([...messages, userMsg, { role: "assistant", text: reply }]);
      setInput("");
    };

    return (
      <div className="grid gap-6">
        {/* Centered welcome card */}
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm max-w-3xl mx-auto p-6 md:p-8 text-center">
          <div className="mb-2 inline-flex items-center justify-center gap-3">
            <Logo />
            <span className="text-sm text-slate-600">Powered by <b>GPT‑5 Agentic</b></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome, Ava</h2>
          <p className="text-slate-700 max-w-2xl mx-auto">Use any words, formats, or languages that work for you—I'll adapt. I can plan your day, cite policy, and take safe actions with your approval.</p>

          {/* Chat area */}
          <div role="log" aria-live="polite" className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 max-h-72 overflow-auto mt-5 text-left">
            {messages.map((m, idx) => (
              <div key={idx} className={`mb-3 ${m.role === "assistant" ? "" : "text-right"}`}>
                <div className={`inline-block rounded-2xl px-3 py-2 ${m.role === "assistant" ? "bg-white border border-indigo-100" : "bg-amber-50 border border-amber-100"}`}>{m.text}</div>
              </div>
            ))}
          </div>

          {/* Prompt chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {prompts.map((p) => (
              <button key={p} onClick={() => setInput(p)} className="px-3 py-2 rounded-xl border text-sm">
                {p}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex flex-col md:flex-row gap-2 mt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              aria-label="Type a request"
              placeholder="Type a request… e.g., Plan my day"
              className="flex-1 border rounded-2xl px-4 py-3 text-base"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setListening(!listening)}
                aria-pressed={listening}
                className={`px-4 py-3 rounded-2xl border text-sm inline-flex items-center gap-2 ${listening ? "bg-amber-50 border-amber-200" : "bg-white"}`}
              >
                <Mic className="w-4 h-4"/> {listening ? "Listening…" : "Mic"}
              </button>
              <button onClick={send} className="px-5 py-3 rounded-2xl bg-indigo-900 text-white text-sm font-semibold">
                Send
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm mt-3 justify-center">
            <input type="checkbox" checked={askBeforeAct} onChange={() => setAskBeforeAct(!askBeforeAct)} />
            Ask before taking actions
          </label>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <button onClick={beginFocus} className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-center hover:shadow-sm">
            <Clock className="w-5 h-5 mx-auto mb-2"/><div className="font-medium">Start Focus</div><div className="text-xs text-slate-600">25–90 min</div>
          </button>
          <button onClick={goSettings} className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center hover:shadow-sm">
            <Bell className="w-5 h-5 mx-auto mb-2"/><div className="font-medium">Digests</div><div className="text-xs text-slate-600">Batch comms</div>
          </button>
          <button onClick={goSettings} className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center hover:shadow-sm">
            <SettingsIcon className="w-5 h-5 mx-auto mb-2"/><div className="font-medium">Adjustments</div><div className="text-xs text-slate-600">Request & track</div>
          </button>
          <button onClick={goSettings} className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-center hover:shadow-sm">
            <FileText className="w-5 h-5 mx-auto mb-2"/><div className="font-medium">Meeting Recap</div><div className="text-xs text-slate-600">Decisions & actions</div>
          </button>
        </div>

        {/* Live Focus HUD on Welcome */}
        {focusOn && (
          <div className="max-w-3xl mx-auto w-full">
            <Section title="Focus session" right={<Pill>Live</Pill>}>
              <FocusStart digestTime={digestTime} room={room} preset={preset} focusOn={focusOn} setFocusOn={setFocusOn} focusMinutes={focusMinutes} />
              <p className="text-xs text-slate-600 mt-2">To change duration or room, go to Settings.</p>
            </Section>
          </div>
        )}
      </div>
    );
  };

  // --- Minimal runtime test panel ---
  const TestPanel = () => {
    const tests = [
      { name: "Logo renders element", pass: isValidElement(<Logo />) },
      { name: "Welcome is a function", pass: typeof Welcome === 'function' },
      { name: "FocusTimer is a function", pass: typeof FocusTimer === 'function' },
      { name: "Breathing is a function", pass: typeof Breathing === 'function' },
      { name: "TreeGrow is a function", pass: typeof TreeGrow === 'function' },
      { name: "Default tab is welcome", pass: tab === 'welcome' },
      { name: "Default focusMinutes is 25", pass: focusMinutes === 25 },
      { name: "draftDayPlan() has >= 10 lines", pass: draftDayPlan().split('\n').length >= 10 },
      { name: "draftDayPlan() mentions 25m", pass: /25m/.test(draftDayPlan()) },
      { name: "AppSettings is a function", pass: typeof AppSettings === 'function' },
      { name: "Calm mode default is On", pass: calm === true },
      // New tests for the time formatter helper
      { name: "formatMMSS pads seconds (5s)", pass: (()=>{ const {mm,ss}=formatMMSS(5); return mm==='00' && ss==='05'; })() },
      { name: "formatMMSS handles minutes (65s)", pass: (()=>{ const {mm,ss}=formatMMSS(65); return mm==='01' && ss==='05'; })() }
    ];
    return (
      <Section title="Developer Smoke Tests" right={<Pill>Runtime</Pill>}>
        <ul className="text-sm space-y-2">
          {tests.map((t, i) => (
            <li key={i} className={`flex items-center gap-2 ${t.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
              <CheckCircle2 className={`w-4 h-4 ${t.pass ? 'opacity-100' : 'opacity-40'}`} /> {t.name} — {t.pass ? 'PASS' : 'FAIL'}
            </li>
          ))}
        </ul>
      </Section>
    );
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-indigo-50 text-slate-900 leading-relaxed">
      <header className="sticky top-0 z-10 bg-white/95 border-b border-indigo-100 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NeuroWorkMate AI</h1>
              <p className="text-[13px] text-slate-600">Powered by <b>GPT‑5 Agentic</b> • personalises time, space & signals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalm(!calm)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-100 bg-white text-sm focus:ring-2 focus:ring-indigo-200"
              aria-pressed={calm}
            >
              <Eye className="w-4 h-4" aria-hidden /> {calm ? "Calm Mode: On" : "Calm Mode: Off"}
            </button>
            <button
              onClick={() => setShowTests(!showTests)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-100 bg-white text-sm focus:ring-2 focus:ring-indigo-200"
              aria-pressed={showTests}
            >
              <ShieldCheck className="w-4 h-4" aria-hidden /> {showTests ? "Hide Tests" : "Show Tests"}
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
          <TabButton id="welcome" icon={MessageSquare} label="Welcome" />
          <TabButton id="settings" icon={SettingsIcon} label="Settings" />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-5 text-[16px]">
        {tab === "welcome" && (
          <Welcome calm={calm} beginFocus={beginFocus} goSettings={goSettings} focusOn={focusOn} setFocusOn={setFocusOn} focusMinutes={focusMinutes} digestTime={digestTime} room={room} preset={preset} />
        )}

        {tab === "settings" && (
          <AppSettings
            digestTime={digestTime}
            setDigestTime={setDigestTime}
            room={room}
            setRoom={setRoom}
            preset={preset}
            setPreset={setPreset}
            urgentLane={urgentLane}
            setUrgentLane={setUrgentLane}
            focusMinutes={focusMinutes}
            setFocusMinutes={setFocusMinutes}
            beginFocus={beginFocus}
          />
        )}

        {showTests && (
          <TestPanel />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-xs text-slate-600 grid md:grid-cols-3 gap-2">
        <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" aria-hidden/> Privacy‑first • Opt‑in • Citations • Audit trail</div>
        <div className="flex items-center gap-2"><MessageSquare className="w-3 h-3" aria-hidden/> Works with Teams/Slack • Outlook/Google Calendar</div>
        <div className="flex items-center gap-2"><Smartphone className="w-3 h-3" aria-hidden/> Web now • Mobile later • Spaces optional</div>
      </footer>
    </div>
  );
}
