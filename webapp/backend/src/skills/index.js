import * as dailyFocusDigest from "./dailyFocusDigest.js";
import * as meetingPrep from "./meetingPrep.js";
import * as weeklyStatusReport from "./weeklyStatusReport.js";
import * as riskActionTracker from "./riskActionTracker.js";
import * as prReviewDigest from "./prReviewDigest.js";
import * as communicationStrategy from "./communicationStrategy.js";

const modules = [
  dailyFocusDigest,
  meetingPrep,
  weeklyStatusReport,
  riskActionTracker,
  prReviewDigest,
  communicationStrategy,
];

export const skillRegistry = modules.map((m) => ({ ...m.meta, run: m.run }));

export function findSkillById(id) {
  return skillRegistry.find((s) => s.id === id);
}

export function routeMessageToSkill(message) {
  const lower = message.toLowerCase();
  return skillRegistry.find((s) => s.triggers.some((t) => lower.includes(t)));
}
