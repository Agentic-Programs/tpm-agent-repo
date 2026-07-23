const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function post(url, body = {}) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(json);
}

function patch(url, body = {}) {
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(json);
}

export const api = {
  health: () => fetch(`${BASE}/api/health`).then(json),

  // Programs
  listPrograms: () => fetch(`${BASE}/api/programs`).then(json),
  getProgram: (pid) => fetch(`${BASE}/api/programs/${pid}`).then(json),
  createProgram: (body) => post(`${BASE}/api/programs`, body),
  updateProgram: (pid, body) => patch(`${BASE}/api/programs/${pid}`, body),
  deleteProgram: (pid) => fetch(`${BASE}/api/programs/${pid}`, { method: "DELETE" }).then(json),

  // Stakeholders
  listStakeholders: (pid) => fetch(`${BASE}/api/programs/${pid}/stakeholders`).then(json),
  addStakeholder: (pid, body) => post(`${BASE}/api/programs/${pid}/stakeholders`, body),
  updateStakeholder: (pid, sid, body) => patch(`${BASE}/api/programs/${pid}/stakeholders/${sid}`, body),
  deleteStakeholder: (pid, sid) =>
    fetch(`${BASE}/api/programs/${pid}/stakeholders/${sid}`, { method: "DELETE" }).then(json),

  // Communication actions (all draft-only)
  draftMeeting: (pid, sid) => post(`${BASE}/api/programs/${pid}/stakeholders/${sid}/draft-meeting`),
  draftEmail: (pid, sid) => post(`${BASE}/api/programs/${pid}/stakeholders/${sid}/draft-email`),
  captureNotes: (pid, sid, notes) =>
    post(`${BASE}/api/programs/${pid}/stakeholders/${sid}/capture-notes`, { notes }),

  // Skills (program-scoped)
  listSkills: (pid) => fetch(`${BASE}/api/programs/${pid}/skills`).then(json),
  runSkill: (pid, id, body = {}) => post(`${BASE}/api/programs/${pid}/skills/${id}/run`, body),
  getHistory: (pid) => fetch(`${BASE}/api/programs/${pid}/history`).then(json),
  chat: (pid, message) => post(`${BASE}/api/programs/${pid}/chat`, { message }),
};
