import { ReactNode } from "react";

export type LabContext = "poiseuille" | "stokes" | "couette";

export interface HeuristicInput {
  labContext: LabContext;
  radius?: number;
  mu?: number;
  dp?: number;
  l?: number;
  rho_f?: number;
  rho_p?: number;
  uTop?: number;
  h?: number;
  vt?: number;
  rep?: number;
  qValue?: number;
  isNonNewtonian?: boolean;
  flowIndex?: number;
  temperature?: number;
}

export type Tone = "ok" | "warn" | "error" | "info";

export interface AnalysisItem {
  title: string;
  body: string;
  tone: Tone;
  delta?: "up" | "down" | "stable";
  deltaLabel?: string;
  isAI?: boolean;
  action?: {
    label: string;
    params: Partial<HeuristicInput>;
  };
}

export interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface Intent {
  type:
    | "hypothetical"
    | "formula"
    | "value"
    | "increase"
    | "decrease"
    | "validity"
    | "stress"
    | "shear"
    | "fallback";
  param?: string;
  multiplier?: number;
  rawQuestion: string;
}
