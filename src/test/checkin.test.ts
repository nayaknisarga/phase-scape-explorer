import { describe, expect, it } from "vitest";
import { phaseQuestions, selectAnswer } from "@/lib/checkin";

describe("Phase-specific check-ins", () => {
  it("asks period flow and pain only in the menstrual check-in", () => {
    expect(phaseQuestions.menstrual.map((q) => q.id)).toContain("flow");
    expect(phaseQuestions.menstrual.map((q) => q.id)).toContain("pain");
    for (const phase of ["follicular", "ovulation", "luteal"] as const)
      expect(phaseQuestions[phase].map((q) => q.id)).not.toContain("flow");
  });
  it("asks lifestyle in follicular, discharge in ovulation and sleep in luteal", () => {
    expect(phaseQuestions.follicular.map((q) => q.id)).toContain("life");
    expect(phaseQuestions.ovulation.map((q) => q.id)).toContain("mucus");
    expect(phaseQuestions.luteal.map((q) => q.id)).toContain("sleep");
  });
  it("allows multiple moods and symptoms without navigating away", () => {
    expect(selectAnswer(selectAnswer(["Calm"], "Happy", true), "Energetic", true)).toEqual([
      "Calm",
      "Happy",
      "Energetic",
    ]);
    expect(selectAnswer(["Cramps"], "Backache", true)).toEqual(["Cramps", "Backache"]);
  });
  it("keeps only one flow choice", () => {
    expect(selectAnswer(["Light"], "Heavy", false)).toEqual(["Heavy"]);
  });
});
