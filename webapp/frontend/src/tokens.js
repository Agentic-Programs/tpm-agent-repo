import { Eye, Cog, Zap } from "lucide-react";

export const TONE = {
  critical: { border: "#c2483d", chip: "#fbeae8", chipText: "#a83a30", label: "Needs response" },
  warn: { border: "#c98a2c", chip: "#fbf1de", chipText: "#96661c", label: "Prep needed" },
  info: { border: "#3d6fc9", chip: "#e9f0fb", chipText: "#2c53a0", label: "FYI" },
  good: { border: "#3f9d6f", chip: "#e7f6ee", chipText: "#2c7a52", label: "On track" },
};

export const MODES = {
  Observe: { icon: Eye, color: "#3d6fc9", desc: "Gathering & reading — inputs in" },
  Manage: { icon: Cog, color: "#c98a2c", desc: "Synthesis & status — outputs out" },
  React: { icon: Zap, color: "#c2483d", desc: "Escalation & decisions — human required" },
};

export const iconBtnStyle = {
  background: "#fffdf7",
  border: "1px solid #e3ddcb",
  borderRadius: 6,
  width: 26,
  height: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#6b6248",
};
