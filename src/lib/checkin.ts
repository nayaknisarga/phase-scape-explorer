import type { PhaseKey } from "./phases";

export type CheckinQuestion = { id: string; title: string; multi: boolean; opts: string[] };
const mood = (opts: string[]): CheckinQuestion => ({
  id: "mood",
  title: "How is your mood?",
  multi: true,
  opts,
});
export const phaseQuestions: Record<PhaseKey, CheckinQuestion[]> = {
  menstrual: [
    mood([
      "Calm",
      "Happy",
      "Energetic",
      "Irritated",
      "Mood swings",
      "Sad",
      "Anxious",
      "Feeling low",
    ]),
    {
      id: "sym",
      title: "What are you feeling in your body?",
      multi: true,
      opts: [
        "Cramps",
        "Backache",
        "Headache",
        "Bloating",
        "Breast tenderness",
        "Clots",
        "Tiredness",
        "Nausea",
        "Digestive issues",
      ],
    },
    {
      id: "flow",
      title: "Flow today",
      multi: false,
      opts: ["Spotting", "Light", "Medium", "Heavy", "Very heavy"],
    },
    { id: "pain", title: "Pain level", multi: false, opts: ["None", "Mild", "Moderate", "Severe"] },
    {
      id: "care",
      title: "What care did you make time for?",
      multi: true,
      opts: ["Rest", "Warm drink", "Good food", "Gentle movement", "Sleep", "Time for myself"],
    },
  ],
  follicular: [
    mood([
      "Calm",
      "Happy",
      "Focused",
      "Energetic",
      "Playful",
      "Irritated",
      "Anxious",
      "Sad",
      "Low",
    ]),
    {
      id: "sym",
      title: "Any changes as your energy returns?",
      multi: true,
      opts: ["Acne", "Bloating", "Headache", "Tiredness", "Digestive issues", "None"],
    },
    {
      id: "life",
      title: "What felt good today?",
      multi: true,
      opts: [
        "Slept well",
        "Exercised",
        "Healthy food",
        "Good hydration",
        "Productive",
        "Relaxation",
      ],
    },
  ],
  ovulation: [
    mood(["Confident", "Happy", "Energetic", "Playful", "Irritated", "Anxious", "Calm", "Low"]),
    {
      id: "mucus",
      title: "Discharge",
      multi: false,
      opts: ["Dry", "Sticky", "Creamy", "Egg white", "Watery"],
    },
    {
      id: "care",
      title: "How did you support yourself today?",
      multi: true,
      opts: [
        "Hydrate",
        "Light exercise",
        "Good nutrition",
        "Rest",
        "Stress relief",
        "Time for myself",
      ],
    },
  ],
  luteal: [
    mood([
      "Calm",
      "Happy",
      "Irritated",
      "Anxious",
      "Mood swings",
      "Sad",
      "Feeling low",
      "Energetic",
    ]),
    {
      id: "sym",
      title: "Any changes before your period?",
      multi: true,
      opts: [
        "Bloating",
        "Breast tenderness",
        "Cramps",
        "Headache",
        "Acne",
        "Tiredness",
        "Cravings",
        "Poor sleep",
        "None",
      ],
    },
    {
      id: "sleep",
      title: "Sleep quality",
      multi: false,
      opts: ["Poor", "Okay", "Good", "Very good"],
    },
    {
      id: "care",
      title: "What helped you slow down?",
      multi: true,
      opts: [
        "Rest",
        "Warm bath",
        "Magnesium-rich food",
        "Early sleep",
        "Healthy food",
        "Relaxation",
      ],
    },
  ],
};

export function selectAnswer(current: string[], value: string, multi: boolean) {
  if (current.includes(value)) return current.filter((v) => v !== value);
  return multi
    ? [...current.filter((v) => v !== "None"), value].filter(
        (v) => value !== "None" || v === "None",
      )
    : [value];
}

/** Only actual check-in flow can select period protection. */
export function checkinProductQuery(answers: Record<string, string[]>, aiQuery?: string) {
  if (answers["flow"]?.includes("Very heavy") || answers["pain"]?.includes("Severe"))
    return undefined;
  const flow = answers["flow"]?.[0];
  if (flow === "Heavy") return "XL overnight sanitary pads heavy flow India";
  if (flow === "Medium") return "regular sanitary pads with wings India";
  if (flow === "Light") return "light flow sanitary pads India";
  if (flow === "Spotting") return "panty liners India";
  return aiQuery && !/face\s*wash|facial\s*cleanser/i.test(aiQuery) ? aiQuery : undefined;
}
