import { useState } from "react";
import { ArrowLeft, Check, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import portraitImage from "@/assets/wellness-portrait.jpg";

export type Profile = {
  name: string;
  age: string;
  sleep: string;
  energy: string;
  last: string;
  length: string;
  duration: string;
  flow: string;
  pain: string;
  symptoms: string[];
  goal: string;
};

const SYMPTOMS = [
  "Cramps",
  "Bloating",
  "Fatigue",
  "Acne",
  "Headache",
  "Low mood",
  "Cravings",
  "Poor sleep",
];
const opt = (v: string, t: string, s: string) => ({ v, t, s });

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({
    name: "",
    age: "",
    sleep: "ok",
    energy: "ok",
    last: "",
    length: "28",
    duration: "5",
    flow: "moderate",
    pain: "mild",
    symptoms: [],
    goal: "wellbeing",
  });
  const set = (k: keyof Profile, v: string) => setP((s) => ({ ...s, [k]: v }));
  const choices = (k: keyof Profile, list: ReturnType<typeof opt>[]) => (
    <div className="flex flex-col gap-2">
      {list.map((o) => (
        <Button
          key={o.v}
          variant="outline"
          className="h-auto justify-between whitespace-normal p-4 text-left"
          data-active={p[k] === o.v}
          onClick={() => set(k, o.v)}
        >
          <span>
            <span className="block font-semibold">{o.t}</span>
            <span className="block text-xs text-muted-foreground">{o.s}</span>
          </span>
          {p[k] === o.v && <Check className="text-primary" />}
        </Button>
      ))}
    </div>
  );
  const seg = (k: keyof Profile, label: string, vals: string[]) => (
    <div className="mb-5">
      <span className="field-label">{label}</span>
      <div className="choice-row">
        {vals.map((v) => (
          <Button
            key={v}
            variant="outline"
            className="flex-1 capitalize"
            data-active={p[k] === v}
            onClick={() => set(k, v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
  const steps = [
    {
      eyebrow: "WELCOME TO RITU",
      q: "The calm, honest period companion",
      hint: "A minute of setup. Ritu predicts your cycle as a real range — never a fake exact date.",
      body: (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <Flower2 className="mx-auto h-20 w-20 text-primary" strokeWidth={1} />
            <p className="mx-auto mt-4 max-w-[26ch] text-sm text-muted-foreground">
              Private by design. Your answers stay only on this visit.
            </p>
          </div>
        </div>
      ),
    },
    {
      eyebrow: "ABOUT YOU",
      q: "First, what should we call you?",
      body: (
        <>
          <label className="field-label" htmlFor="ob-name">
            Your name
          </label>
          <input
            id="ob-name"
            autoFocus
            className="field-input"
            value={p.name}
            placeholder="e.g. Aditi"
            onChange={(e) => set("name", e.target.value)}
          />
          <label className="field-label" htmlFor="ob-age">
            Your age
          </label>
          <input
            id="ob-age"
            inputMode="numeric"
            className="field-input"
            value={p.age}
            placeholder="e.g. 26"
            onChange={(e) => set("age", e.target.value)}
          />
        </>
      ),
      valid: p.name.trim().length > 0,
    },
    {
      eyebrow: "LATELY",
      q: "How have you been feeling?",
      hint: "A quick baseline.",
      body: (
        <>
          {seg("sleep", "Sleep", ["poor", "ok", "good"])}
          {seg("energy", "Energy", ["low", "ok", "high"])}
        </>
      ),
    },
    {
      eyebrow: "YOUR CYCLE",
      q: "When did your last period start?",
      hint: "Pick the first day of bleeding.",
      body: (
        <>
          <label className="field-label" htmlFor="ob-last">
            Last period start
          </label>
          <input
            id="ob-last"
            type="date"
            max={new Date().toLocaleDateString("en-CA")}
            className="field-input"
            value={p.last}
            onChange={(e) => set("last", e.target.value)}
          />
        </>
      ),
      valid: !!p.last && p.last <= new Date().toLocaleDateString("en-CA"),
    },
    {
      eyebrow: "YOUR CYCLE",
      q: "How long is your cycle, usually?",
      hint: "Not sure? Tap the closest.",
      body: (
        <div className="choice-row">
          {["21", "25", "28", "30", "35"].map((v) => (
            <Button
              key={v}
              variant="outline"
              data-active={p.length === v}
              onClick={() => set("length", v)}
            >
              ~{v} days
            </Button>
          ))}
        </div>
      ),
    },
    {
      eyebrow: "YOUR CYCLE",
      q: "How many days does your period usually last?",
      hint: "Count the days you bleed. Type it in or tap one.",
      body: (
        <>
          <label className="field-label" htmlFor="ob-duration">
            Period length (days)
          </label>
          <input
            id="ob-duration"
            inputMode="numeric"
            autoFocus
            className="field-input"
            value={p.duration}
            placeholder="e.g. 5"
            onChange={(e) => set("duration", e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          />
          <div className="choice-row mt-4">
            {["3", "4", "5", "6", "7"].map((v) => (
              <Button
                key={v}
                variant="outline"
                data-active={p.duration === v}
                onClick={() => set("duration", v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </>
      ),
      valid: Number(p.duration) >= 1 && Number(p.duration) <= 10,
    },
    {
      eyebrow: "YOUR CYCLE",
      q: "How is your flow, usually?",
      body: choices("flow", [
        opt("light", "Light", "Liners are enough"),
        opt("moderate", "Moderate", "A typical flow"),
        opt("heavy", "Heavy", "You want reliable cover"),
      ]),
    },
    {
      eyebrow: "YOUR CYCLE",
      q: "Do you usually get period pain?",
      body: choices("pain", [
        opt("none", "No pain", "Generally comfortable"),
        opt("mild", "Mild", "Some cramps, manageable"),
        opt("strong", "Strong", "Slows me down"),
      ]),
    },
    {
      eyebrow: "TODAY",
      q: "Anything you’re feeling today?",
      hint: "Pick any — or none.",
      body: (
        <div className="choice-row">
          {SYMPTOMS.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              data-active={p.symptoms.includes(s)}
              onClick={() =>
                setP((x) => ({
                  ...x,
                  symptoms: x.symptoms.includes(s)
                    ? x.symptoms.filter((i) => i !== s)
                    : [...x.symptoms, s],
                }))
              }
            >
              {s}
            </Button>
          ))}
        </div>
      ),
    },
    {
      eyebrow: "LAST ONE",
      q: "What matters most to you?",
      body: choices("goal", [
        opt("track", "Track my period", "Know when it’s coming"),
        opt("pain", "Ease period pain", "Cramps & discomfort"),
        opt("wellbeing", "Feel good daily", "Energy, mood & wellbeing"),
        opt("pcos", "Manage PCOS", "Irregular cycles"),
      ]),
    },
  ];
  const s = steps[step];
  if (!s) return null;
  const last = step === steps.length - 1;
  const ok = s.valid ?? true;
  return (
    <main className="onboarding-surround flex min-h-screen items-center justify-center">
      <section
        className="onboarding-surface flex w-full max-w-md flex-col bg-background p-6"
        aria-label="Set up Ritu"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="ritu-wordmark">
            ritu<span>.</span>
          </span>
          <span className="eyebrow">
            {step + 1} / {steps.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <i
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        {step === 0 && (
          <img
            className="onboarding-photo"
            src={portraitImage}
            width={1440}
            height={1024}
            alt="A peaceful moment, just for you"
          />
        )}
        <span className="eyebrow mt-8">{s.eyebrow}</span>
        <h1 className="display mt-2 text-3xl">{s.q}</h1>
        {s.hint && <p className="mt-2 text-sm text-muted-foreground">{s.hint}</p>}
        <div className="mt-6 flex flex-1 flex-col">{s.body}</div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            className={step === 0 ? "invisible" : ""}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            className="h-12 flex-1"
            disabled={!ok}
            onClick={() => (last ? onDone(p) : setStep(step + 1))}
          >
            {step === 0 ? "Get started" : last ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </section>
    </main>
  );
}
