import { useState, useEffect, useCallback } from "react";
import { History, WifiOff, LayoutGrid, Users } from "lucide-react";
import { MODES } from "./tokens.js";
import { api } from "./api.js";
import AgentChat from "./components/AgentChat.jsx";
import SkillCard from "./components/SkillCard.jsx";
import HistoryDrawer from "./components/HistoryDrawer.jsx";
import ProgramSwitcher from "./components/ProgramSwitcher.jsx";
import StakeholdersPanel from "./components/StakeholdersPanel.jsx";

const LAST_PROGRAM_KEY = "tpm-agent:last-program-id";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking"); // checking | ok | down
  const [mockMode, setMockMode] = useState(true);

  const [programs, setPrograms] = useState([]);
  const [activeProgramId, setActiveProgramId] = useState(null);

  const [tab, setTab] = useState("skills"); // 'skills' | 'stakeholders'

  const [skills, setSkills] = useState([]);
  const [filter, setFilter] = useState("All");
  const [runningId, setRunningId] = useState(null);
  const [outputs, setOutputs] = useState({});
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const activeProgram = programs.find((p) => p.id === activeProgramId) || null;

  const refreshHistory = useCallback(async (pid) => {
    if (!pid) return;
    try {
      setHistory(await api.getHistory(pid));
    } catch {
      /* backend status already surfaced elsewhere */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadProgramData = useCallback(async (pid) => {
    if (!pid) return;
    setOutputs({});
    setHistoryLoading(true);
    try {
      setSkills(await api.listSkills(pid));
      await refreshHistory(pid);
    } catch {
      /* surfaced via backendStatus */
    }
  }, [refreshHistory]);

  // Initial boot: health check, then load programs, then pick an active one.
  useEffect(() => {
    (async () => {
      try {
        const health = await api.health();
        setBackendStatus("ok");
        setMockMode(health.mockMode);

        const list = await api.listPrograms();
        setPrograms(list);

        const saved = localStorage.getItem(LAST_PROGRAM_KEY);
        const initial = list.find((p) => p.id === saved)?.id || list[0]?.id || null;
        setActiveProgramId(initial);
      } catch {
        setBackendStatus("down");
        setHistoryLoading(false);
      }
    })();
  }, []);

  // Whenever the active program changes, reload skills/history for it.
  useEffect(() => {
    if (activeProgramId) {
      localStorage.setItem(LAST_PROGRAM_KEY, activeProgramId);
      loadProgramData(activeProgramId);
    }
  }, [activeProgramId, loadProgramData]);

  const switchProgram = (pid) => setActiveProgramId(pid);

  const createProgram = async ({ name, description }) => {
    const program = await api.createProgram({ name, description });
    setPrograms(await api.listPrograms());
    setActiveProgramId(program.id);
    return program;
  };

  const triggerSkill = async (skill, source = "dashboard") => {
    setRunningId(skill.id);
    try {
      const { output } = await api.runSkill(activeProgramId, skill.id, { source });
      setOutputs((o) => ({ ...o, [skill.id]: output }));
      await refreshHistory(activeProgramId);
    } catch (err) {
      setOutputs((o) => ({
        ...o,
        [skill.id]: { title: "Run failed", meta: err.message, sections: [], footer: "" },
      }));
    } finally {
      setRunningId(null);
    }
  };

  const handleChatSkillRan = async (skillId, output) => {
    setOutputs((o) => ({ ...o, [skillId]: output }));
    await refreshHistory(activeProgramId);
    // Refresh program list too — stakeholder-driven skills don't change
    // stakeholder counts, but keeping this cheap call here means any
    // future skill that does won't need another wiring pass.
    setPrograms(await api.listPrograms().catch(() => programs));
  };

  const dismissOutput = (id) => {
    setOutputs((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
  };

  const visibleSkills = skills.filter((s) => filter === "All" || s.mode === filter);

  if (backendStatus === "down") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 20, textAlign: "center" }}>
        <WifiOff size={28} color="#c2483d" />
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16 }}>Can't reach the backend</div>
        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#9aa2ba", maxWidth: 420 }}>
          Start it with <code style={{ background: "#161c2e", padding: "2px 6px", borderRadius: 4 }}>cd webapp/backend && npm install && npm run dev</code>,
          then reload. Check <code style={{ background: "#161c2e", padding: "2px 6px", borderRadius: 4 }}>VITE_API_BASE_URL</code> in frontend/.env if it's running elsewhere.
        </div>
      </div>
    );
  }

  if (backendStatus === "checking" || !activeProgramId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#5d6785" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: mockMode ? "#c98a2c" : "#3f9d6f" }} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#5d6785", letterSpacing: 0.5 }}>
              TPM AGENT CONSOLE · {mockMode ? "MOCK MODE" : "LIVE"}
            </span>
          </div>
          <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 22, margin: "4px 0 0" }}>Observe → Manage → React</h1>
          {activeProgram?.description && (
            <p style={{ fontFamily: "Inter", fontSize: 12.5, color: "#8b93ab", margin: "3px 0 0" }}>{activeProgram.description}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ProgramSwitcher programs={programs} activeProgram={activeProgram} onSwitch={switchProgram} onCreate={createProgram} />
          <button onClick={() => setShowHistory((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 7, background: "#161c2e", border: "1px solid #262f47", borderRadius: 8, padding: "8px 13px", color: "#d7dbec", fontFamily: "Inter", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <History size={14} /> History ({history.length})
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab("skills")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: tab === "skills" ? "#e0a444" : "#161c2e",
            color: tab === "skills" ? "#191305" : "#9aa2ba",
            border: `1px solid ${tab === "skills" ? "#e0a444" : "#262f47"}`,
            borderRadius: 8, padding: "8px 14px", fontFamily: "Inter", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
          }}
        >
          <LayoutGrid size={13} /> Skills
        </button>
        <button
          onClick={() => setTab("stakeholders")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: tab === "stakeholders" ? "#e0a444" : "#161c2e",
            color: tab === "stakeholders" ? "#191305" : "#9aa2ba",
            border: `1px solid ${tab === "stakeholders" ? "#e0a444" : "#262f47"}`,
            borderRadius: 8, padding: "8px 14px", fontFamily: "Inter", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
          }}
        >
          <Users size={13} /> Stakeholders
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ height: "calc(100vh - 190px)", minHeight: 440, position: "sticky", top: 20 }}>
          <AgentChat programId={activeProgramId} onSkillRan={handleChatSkillRan} />
        </div>

        <div>
          {tab === "skills" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {["All", "Observe", "Manage", "React"].map((m) => {
                  const active = filter === m;
                  const modeInfo = MODES[m];
                  return (
                    <button key={m} onClick={() => setFilter(m)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: active ? "#e0a444" : "#161c2e",
                      color: active ? "#191305" : "#9aa2ba",
                      border: `1px solid ${active ? "#e0a444" : "#262f47"}`,
                      borderRadius: 20, padding: "7px 14px",
                      fontFamily: "Inter", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                    }}>
                      {modeInfo && <modeInfo.icon size={12} />}
                      {m}
                    </button>
                  );
                })}
                <div style={{ fontFamily: "Inter", fontSize: 11.5, color: "#5d6785", alignSelf: "center", marginLeft: 4 }}>
                  {filter !== "All" ? MODES[filter].desc : `${skills.length} skills across the full weekly rhythm`}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
                {visibleSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onRun={(s) => triggerSkill(s, "dashboard")}
                    running={runningId === skill.id}
                    output={outputs[skill.id]}
                    onDismiss={dismissOutput}
                  />
                ))}
              </div>
            </>
          )}

          {tab === "stakeholders" && <StakeholdersPanel programId={activeProgramId} />}
        </div>
      </div>

      {showHistory && (
        <HistoryDrawer history={history} loading={historyLoading} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
