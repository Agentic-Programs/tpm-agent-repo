/**
 * Skill: communication-strategy
 * Mirrors skills/communication-strategy/SKILL.md.
 *
 * Unlike the other five skills, this one is NOT a MOCK_MODE stand-in —
 * it computes real output from real stakeholder data the human entered
 * in the Stakeholders tab. There's no "runReal()" to port later; the
 * only thing that changes when other skills go live is that `lastContact`
 * could additionally be inferred from real Slack/email history instead
 * of relying solely on what capture-notes or the human recorded.
 */

export const meta = {
  id: "communication-strategy",
  mode: "Manage",
  name: "Communication Strategy",
  tagline: "Who do I need to reach out to?",
  desc: "Reviews stakeholder cadence by influence and last contact, flags overdue check-ins, and points to next actions.",
  triggers: ["communication strategy", "who do i need to reach", "reach out", "overdue", "stakeholder"],
};

// Days-since-contact threshold before a stakeholder counts as overdue,
// scaled by influence — a high-influence stakeholder going quiet matters
// faster than a low-influence one.
const INFLUENCE_THRESHOLD_DAYS = { high: 5, medium: 10, low: 20 };

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export async function run({ stakeholders = [] } = {}) {
  const overdue = [];
  const dueSoon = [];
  const onCadence = [];

  for (const s of stakeholders) {
    const days = daysSince(s.lastContact);
    const threshold = INFLUENCE_THRESHOLD_DAYS[s.influence] ?? 10;
    const item = {
      text: `${s.name} (${s.role || "no role set"}) — ${
        s.lastContact ? `last contact ${days}d ago` : "no contact logged yet"
      } · influence: ${s.influence} · preferred: ${s.preferredChannel}`,
    };
    if (days >= threshold) overdue.push(item);
    else if (days >= threshold * 0.6) dueSoon.push(item);
    else onCadence.push(item);
  }

  const sections = [];
  if (overdue.length) sections.push({ heading: "Overdue — reach out now", tone: "critical", items: overdue });
  if (dueSoon.length) sections.push({ heading: "Due soon", tone: "warn", items: dueSoon });
  if (onCadence.length) sections.push({ heading: "On cadence", tone: "good", items: onCadence });
  if (!stakeholders.length) {
    sections.push({
      heading: "No stakeholders yet",
      tone: "info",
      items: [{ text: "Add stakeholders in the Stakeholders tab to get suggested outreach here." }],
    });
  }

  return {
    title: "Communication Strategy",
    meta: `Snapshot ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${stakeholders.length} stakeholder${stakeholders.length === 1 ? "" : "s"} tracked`,
    sections,
    footer: overdue.length
      ? `${overdue.length} overdue — use the Stakeholders tab to draft a meeting, draft an email, or capture notes for any of them.`
      : stakeholders.length
      ? "Everyone's on cadence."
      : "",
  };
}
