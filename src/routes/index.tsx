import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  CalendarDays,
  Check,
  Heart,
  House,
  Leaf,
  Plus,
  ShoppingBag,
  Flower2,
  Sun,
  User,
  X,
  Zap,
  Loader2,
  Moon,
  Wind,
  Smile,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { phases } from "@/lib/phases";
import { searchProducts, type ProductOffer } from "@/lib/products.functions";
import { isClinicalQuery } from "@/lib/product-guard";
import { askRitu } from "@/lib/ai.functions";
import { Onboarding, type Profile } from "@/components/onboarding";
import teaImage from "@/assets/tea.jpg";
import portraitImage from "@/assets/wellness-portrait.jpg";
import periodImage from "@/assets/period-care.jpg";
import heatImage from "@/assets/heat-care.jpg";
import yogaImage from "@/assets/yoga-care.jpg";
import journalImage from "@/assets/journal-care.jpg";
import { phaseQuestions as CHECKIN, selectAnswer } from "@/lib/checkin";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolHeader, ToolContent } from "@/components/ai-elements/tool";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ritu — Your cycle, understood" },
      {
        name: "description",
        content:
          "Ritu: honest period predictions, daily check-ins, phase insights and gentle self-care in a calm mobile app.",
      },
      { property: "og:title", content: "Ritu — Your cycle, understood" },
      {
        property: "og:description",
        content: "A personal, honest approach to period and wellness tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const _n = new Date();
const TODAY = new Date(_n.getFullYear(), _n.getMonth(), _n.getDate());
const DAY = 86400000;
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", o);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => new Date(s + "T00:00:00");
const PHASE_SYMPTOMS: Record<string, { t: string; i: typeof Zap }[]> = {
  menstrual: [
    { t: "Cramps", i: Wind },
    { t: "Heavy flow", i: Heart },
    { t: "Backache", i: Smile },
    { t: "Fatigue", i: Moon },
    { t: "Headache", i: Zap },
    { t: "Bloating", i: Leaf },
  ],
  follicular: [
    { t: "More energy", i: Zap },
    { t: "Clear skin", i: Sun },
    { t: "Feeling motivated", i: Smile },
    { t: "Light spotting", i: Heart },
    { t: "Everything is fine", i: Moon },
    { t: "Better sleep", i: Leaf },
  ],
  ovulation: [
    { t: "Mild pelvic twinge", i: Wind },
    { t: "Clear discharge", i: Leaf },
    { t: "High libido", i: Heart },
    { t: "Feeling social", i: Smile },
    { t: "Bloating", i: Moon },
    { t: "Peak energy", i: Zap },
  ],
  luteal: [
    { t: "Tender breasts", i: Heart },
    { t: "Cravings", i: Leaf },
    { t: "Acne", i: Sun },
    { t: "Mood shifts", i: Smile },
    { t: "Bloating", i: Wind },
    { t: "Trouble sleeping", i: Moon },
  ],
};
const WHY: Record<string, string> = {
  Cramps: "Your uterus contracts to shed its lining — warmth and gentle stretches can ease it.",
  "Heavy flow":
    "Heavier bleeding is common on days 1–3. Use high-absorbency or overnight protection and eat iron-rich food.",
  Backache: "The same prostaglandins behind cramps can radiate to your lower back.",
  Fatigue: "Low hormones and blood loss can drain energy — rest is fine.",
  Headache: "Falling estrogen can trigger headaches; hydrate and rest your eyes.",
  Bloating: "Hormone shifts make your body hold more water; less salt and more water help.",
  "Tender breasts": "Progesterone rises after ovulation and can make breasts feel sore.",
  Cravings: "Your body uses a little more energy now — choose regular, filling meals.",
  Acne: "Hormone changes can increase skin oil before your period.",
  "Mood shifts": "Hormones dipping before your period can affect mood — be gentle with yourself.",
  "Trouble sleeping": "Progesterone and body temperature changes can disturb sleep.",
  "More energy": "Rising estrogen often lifts energy in this phase.",
  "Mild pelvic twinge": "Some feel a small one-sided twinge around ovulation.",
  "Clear discharge": "Stretchy, clear discharge is normal near ovulation.",
};
const SUGGEST: Record<string, { title: string; query: string }> = {
  "Heavy flow": {
    title: "XL overnight pads for heavy flow",
    query: "XL overnight sanitary pads heavy flow",
  },
  Cramps: { title: "Heat patch for cramps", query: "heat patch period cramps" },
  Backache: { title: "Hot water bag", query: "hot water bag" },
  Bloating: { title: "Ginger tea", query: "ginger tea" },
  Acne: { title: "Gentle face wash", query: "gentle face wash acne" },
  "Trouble sleeping": { title: "Chamomile tea", query: "chamomile tea" },
  Cravings: { title: "Dark chocolate", query: "dark chocolate 70 percent" },
  "Tender breasts": { title: "Soft cotton bra", query: "soft non-wired cotton bra" },
};
const RULES: Record<string, { title: string; query: string }> = {
  Heavy: {
    title: "XL overnight pads (heavy flow)",
    query: "XL overnight sanitary pads heavy flow",
  },
  "Very heavy": {
    title: "XXL overnight pads + period underwear",
    query: "XXL overnight sanitary pads extra heavy flow",
  },
  Medium: { title: "Regular pads with wings", query: "regular sanitary pads with wings" },
  Light: { title: "Panty liners", query: "panty liners" },
  Spotting: { title: "Panty liners", query: "panty liners" },
  Severe: { title: "Heat patch for cramps", query: "heat patch period cramps" },
  Cramps: { title: "Hot water bag", query: "hot water bag" },
  Bloating: { title: "Ginger tea", query: "ginger tea" },
  "Poor sleep": { title: "Chamomile tea", query: "chamomile tea" },
  Acne: { title: "Gentle face wash", query: "gentle face wash acne" },
};
const SELF = [
  "💬 Deep Chat",
  "🧠 Mindfulness",
  "🥦 Nutrition",
  "💤 Sleeping Well",
  "💛 Therapy",
  "💼 Time Off",
];
const MOODS = [
  "☕ Calm",
  "😊 Happy",
  "⚡ Energetic",
  "🎢 Mood Swings",
  "😤 Irritated",
  "😔 Sad",
  "😰 Anxious",
  "🌧️ Low",
  "🏚️ Feeling guilty",
];
const PICKS = [
  {
    id: "tea",
    title: "A warm cup of calm",
    desc: "Caffeine-free chamomile for a softer evening.",
    tag: "NOURISH",
    query: "chamomile tea India",
    bg: "bg-sage",
  },
  {
    id: "heat",
    title: "Heat for cramps",
    desc: "A reusable heat patch for tender days.",
    tag: "COMFORT",
    query: "heat patch period cramps India",
    bg: "bg-peach",
  },
  {
    id: "yoga",
    title: "Move gently",
    desc: "A soft yoga mat for low-impact stretches.",
    tag: "MOVEMENT",
    query: "yoga mat India",
    bg: "bg-lavender",
  },
  {
    id: "journal",
    title: "Make room for feelings",
    desc: "A guided journal for quiet check-ins.",
    tag: "MINDFULNESS",
    query: "guided journal notebook India",
    bg: "bg-rose",
  },
];
type Tab = "home" | "journal" | "shop";
type Sheet = "feel" | "period" | "why" | "chat" | null;

function Index() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selDay, setSelDay] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[] | null>(null);
  const [ans, setAns] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [ciReply, setCiReply] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<number, string[]>>({});
  const [periodDays, setPeriodDays] = useState<string[]>([]);
  const [draftDays, setDraftDays] = useState<string[]>([]);
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [entry, setEntry] = useState("");
  const [journal, setJournal] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [chat, setChat] = useState<{ role: "you" | "ritu"; text: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const runAsk = useServerFn(askRitu);
  const runSearch = useServerFn(searchProducts);
  const [shop, setShop] = useState<{
    label: string;
    query: string;
    status: "loading" | "done";
    offers: ProductOffer[];
    blocked?: boolean;
    error?: string;
  } | null>(null);

  const lastStart = useMemo(() => {
    const sorted = [...periodDays].sort();
    if (!sorted.length) return null;
    let start = sorted[sorted.length - 1] ?? "";
    for (let i = sorted.length - 2; i >= 0; i--) {
      if ((parse(start).getTime() - parse(sorted[i] ?? "").getTime()) / DAY <= 2)
        start = sorted[i] ?? start;
      else break;
    }
    return start;
  }, [periodDays]);
  const cycle = useMemo(() => {
    const REF = new Date(TODAY.getTime() + selDay * DAY);
    const len = Number(profile?.length ?? 28);
    const start = parse(lastStart ?? profile?.last ?? "2026-09-24");
    const dayFor = (d: Date) =>
      (((Math.round((d.getTime() - start.getTime()) / DAY) % len) + len) % len) + 1;
    const phaseFor = (d: Date) => {
      const n = dayFor(d);
      const phase = phases[n <= 5 ? 0 : n <= 11 ? 1 : n <= 14 ? 2 : 3];
      if (!phase) throw new Error("Missing cycle phase");
      return phase;
    };
    const dayOf = dayFor(REF);
    const diff = Math.round((REF.getTime() - start.getTime()) / DAY);
    const next = new Date(start.getTime() + Math.max(1, Math.ceil(diff / len)) * len * DAY);
    const onPeriod = diff >= 0 && dayOf <= 5 && diff < len;
    const ovuRaw = new Date(next.getTime() - 14 * DAY);
    const daysTo = Math.max(0, Math.round((next.getTime() - REF.getTime()) / DAY));
    const predicted = new Set<string>();
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 5; k++)
        predicted.add(iso(new Date(next.getTime() + (c * len + k) * DAY)));
    return {
      len,
      dayOf,
      daysTo,
      phase: phaseFor(REF),
      phaseFor,
      dayFor,
      predicted,
      next,
      from: new Date(next.getTime() - 3 * DAY),
      to: new Date(next.getTime() + 3 * DAY),
      ovu: ovuRaw < REF ? new Date(ovuRaw.getTime() + len * DAY) : ovuRaw,
      onPeriod,
    };
  }, [profile, lastStart, selDay]);

  if (!profile)
    return (
      <Onboarding
        onDone={(p) => {
          setProfile(p);
          window.scrollTo(0, 0);
        }}
      />
    );

  const viewProduct = async (label: string, query: string, inChat = false) => {
    if (!inChat) setTab("shop");
    if (isClinicalQuery(query)) {
      setShop({ label, query, status: "done", offers: [], blocked: true });
      return;
    }
    setShop({ label, query, status: "loading", offers: [] });
    try {
      const r = await runSearch({ data: { query } });
      setShop({ label, query, status: "done", ...r });
    } catch {
      setShop({
        label,
        query,
        status: "done",
        offers: [],
        error: "Couldn’t reach the shops right now.",
      });
    }
  };
  const send = async (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setQ("");
    setChat((c) => [...c, { role: "you", text: t }]);
    setThinking(true);
    try {
      const r = await runAsk({
        data: {
          question: t,
          context: {
            day: cycle.dayOf,
            length: cycle.len,
            phase: cycle.phase.name,
            daysToPeriod: cycle.daysTo,
            symptoms: [
              ...(logs[selDay] ?? []),
              ...(profile.flow === "heavy" ? ["usually heavy flow"] : []),
            ],
            goal: String((profile as Record<string, unknown>)["goal"] ?? "") || undefined,
          },
        },
      });
      setChat((c) => [...c, { role: "ritu", text: r.ok ? r.answer : r.error }]);
      if (r.ok && r.search) void viewProduct(r.search, r.search, true);
    } catch {
      setChat((c) => [...c, { role: "ritu", text: "Couldn’t reach Ritu right now." }]);
    } finally {
      setThinking(false);
    }
  };
  const saveCheckin = async () => {
    const qs = CHECKIN[selPhase.key] ?? [];
    const flat = qs.flatMap((q) =>
      (ans[q.id] ?? []).map((v) => (q.multi ? v : `${q.title}: ${v}`)),
    );
    const items = [...flat, ...(note.trim() ? [`Note: ${note.trim()}`] : [])];
    setLogs((l) => ({ ...l, [selDay]: items }));
    setApplied(Object.values(ans).flat());
    setCiReply(null);
    setShop(null);
    const summary = qs
      .map((q) => (ans[q.id]?.length ? `${q.title}: ${ans[q.id]?.join(", ")}` : ""))
      .filter(Boolean)
      .join("; ");
    try {
      const r = await runAsk({
        data: {
          question: `My check-in today (${selPhase.name} phase): ${summary}${note.trim() ? `. Note: ${note.trim().slice(0, 200)}` : ""}. Explain briefly what is happening in my body and what can help. If my flow is logged, suggest the right pad type.`,
          context: {
            day: cycle.dayFor(sel),
            length: cycle.len,
            phase: selPhase.name,
            daysToPeriod: cycle.daysTo,
            symptoms: items.slice(0, 30).map((x) => x.slice(0, 60)),
            goal: profile.goal || undefined,
          },
        },
      });
      setCiReply(r.ok ? r.answer : r.error);
      const flow = ans["flow"]?.[0];
      const recommendation = flow ? RULES[flow] : undefined;
      const q = recommendation?.query ?? (r.ok ? r.search : null);
      if (q) void viewProduct(recommendation?.title ?? q, q, true);
    } catch {
      setCiReply("Couldn’t reach Ritu right now.");
    }
  };
  const toggle = (v: string) =>
    setPicked((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const days = Array.from({ length: 14 }, (_, i) => new Date(TODAY.getTime() + (i - 3) * DAY));
  const sel = new Date(TODAY.getTime() + selDay * DAY);
  const selPhase = cycle.phaseFor(sel);
  const logged = new Set(periodDays);

  const chip = (v: string) => (
    <Button
      key={v}
      variant="outline"
      size="sm"
      className={`h-9 rounded-full px-4 ${picked.includes(v) ? "border-primary bg-primary text-primary-foreground" : ""}`}
      data-active={picked.includes(v)}
      onClick={() => toggle(v)}
    >
      {v}
    </Button>
  );

  const home = (
    <>
      <section className="home-top px-5 pb-6">
        <header className="ritu-header">
          <div>
            <span className="ritu-wordmark">
              ritu<span>.</span>
            </span>
            <span className="brand-caption">IN YOUR RHYTHM</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Shop care"
              onClick={() => setTab("shop")}
            >
              <ShoppingBag />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log period"
              onClick={() => {
                setDraftDays(periodDays);
                setSheet("period");
              }}
            >
              <CalendarDays />
            </Button>
          </div>
        </header>
        <div className="welcome-line">
          <div>
            <p className="eyebrow">
              {fmt(sel, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="display">A little care, {profile.name}.</h1>
          </div>
          <span className="profile-initial">{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="wellness-banner">
          <img src={portraitImage} width={1440} height={1024} alt="A quiet moment of self-care" />
          <div className="banner-copy">
            <p className="eyebrow">EVERY PHASE. EVERY YOU.</p>
            <h2 className="display">
              Care that
              <br />
              understands you.
            </h2>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                setApplied(null);
                setSheet("feel");
              }}
            >
              Your daily check-in <ArrowUpRight />
            </Button>
          </div>
        </div>
        <div className="prediction-summary mt-5">
          <p className="eyebrow">
            {cycle.onPeriod ? "ON YOUR PERIOD" : "NEXT PERIOD"}
            {selDay !== 0
              ? ` · AS OF ${fmt(sel, { day: "numeric", month: "short" }).toUpperCase()}`
              : ""}
          </p>
          <p className="display mt-1 text-3xl">
            {cycle.onPeriod ? (
              <>Period day {cycle.dayOf}</>
            ) : cycle.daysTo === 0 ? (
              <>
                Expected <span className="text-2xl">today</span>
              </>
            ) : (
              <>
                In {cycle.daysTo} <span className="text-2xl">days</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm font-medium text-primary">
            {cycle.onPeriod ? "Next likely" : "Likely"}{" "}
            {fmt(cycle.from, { day: "numeric", month: "short" })} –{" "}
            {fmt(cycle.to, { day: "numeric", month: "short" })}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-secondary p-2">
              <p className="text-[10px] text-muted-foreground">Cycle day</p>
              <p className="font-semibold">{cycle.dayOf}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-2">
              <p className="text-[10px] text-muted-foreground">Phase</p>
              <p className="font-semibold">{cycle.phase.name}</p>
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <p className="text-[10px] text-muted-foreground">Ovulation estimate</p>
              <p className="font-semibold">
                {fmt(new Date(cycle.ovu.getTime() - 2 * DAY), { day: "numeric", month: "short" })}–
                {fmt(new Date(cycle.ovu.getTime() + 2 * DAY), { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setSheet("why")}
            className="mt-3 flex h-auto w-full items-center gap-2 whitespace-normal p-0 text-left text-xs"
          >
            <BarChart3 size={16} className="text-primary" />
            <span className="flex-1 text-muted-foreground">
              {lastStart
                ? "Medium confidence · from your logged period"
                : "Low confidence · from your setup"}{" "}
              · ±3 days
            </span>
            <span className="font-semibold text-primary">Why?</span>
          </Button>
        </div>
        <div
          className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1"
          role="tablist"
          aria-label="Choose day"
        >
          {days.map((d, i) => {
            const off = i - 3;
            const a = off === selDay;
            const k = iso(d);
            const per = logged.has(k) || cycle.predicted.has(k);
            return (
              <Button
                variant="ghost"
                key={off}
                role="tab"
                aria-selected={a}
                onClick={() => {
                  setSelDay(off);
                  setAns({});
                  setApplied(null);
                  setNote("");
                }}
                className={`flex w-12 shrink-0 flex-col items-center rounded-2xl py-2 transition ${a ? "bg-primary text-primary-foreground shadow-lg" : per ? "bg-card text-primary" : "text-muted-foreground"}`}
              >
                <span className="text-[10px] uppercase">{fmt(d, { weekday: "short" })}</span>
                <span className="text-lg font-semibold">{d.getDate()}</span>
                <i
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${logged.has(k) ? "bg-primary" : cycle.predicted.has(k) ? "border border-primary" : logs[off]?.length ? "bg-sage-ink" : ""}`}
                />
              </Button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {fmt(sel, { weekday: "long", day: "numeric", month: "short" })} · Day {cycle.dayFor(sel)}{" "}
          · {selPhase.name}
          {cycle.predicted.has(iso(sel)) ? " · predicted period" : ""}
        </p>
      </section>
      <section className="px-5 pt-2">
        <h2 className="display text-2xl">Your daily rituals</h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { l: "Log symptoms", i: Plus, bg: "bg-lavender", s: "feel" as Sheet },
            { l: "Ask Ritu AI", i: Flower2, bg: "bg-peach", s: "chat" as Sheet },
            { l: "Log period", i: Heart, bg: "bg-rose", s: "period" as Sheet },
          ].map((t) => (
            <Button
              variant="ghost"
              key={t.l}
              onClick={() => {
                if (t.s === "period") setDraftDays(periodDays);
                if (t.s === "feel") {
                  setApplied(null);
                  setAns({});
                  setNote("");
                }
                setSheet(t.s);
              }}
              className={`flex h-28 flex-col items-start justify-between whitespace-normal rounded-lg p-3 text-left ${t.bg} transition active:scale-95`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <t.i size={18} />
              </span>
              <span className="text-xs font-medium leading-tight">{t.l}</span>
            </Button>
          ))}
        </div>
        {logs[selDay]?.length ? (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <p className="eyebrow">
              LOGGED · {fmt(sel, { day: "numeric", month: "short" }).toUpperCase()}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {logs[selDay]?.map((l) => (
                <span key={l} className="rounded-full bg-accent px-3 py-1 text-xs">
                  {l}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="phase-note mt-6">
          <p className="eyebrow">YOUR {cycle.phase.name.toUpperCase()} PHASE</p>
          <h3 className="display mt-1 text-xl">{cycle.phase.label}</h3>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { i: Zap, t: cycle.phase.energy },
              { i: Sun, t: cycle.phase.movement },
              { i: Leaf, t: cycle.phase.nutrition },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary">
                  <x.i size={15} />
                </span>
                {x.t}
              </div>
            ))}
          </div>
        </div>
        <div className="section-heading mt-7">
          <h2 className="display text-2xl">Just for you</h2>
          <Button variant="link" size="sm" onClick={() => setTab("shop")}>
            View all <ArrowUpRight />
          </Button>
        </div>
        <div className="home-care-grid">
          {[
            { title: "Comfort for tender days", image: heatImage, query: "hot water bag" },
            { title: "A softer evening", image: teaImage, query: "chamomile tea India" },
          ].map((p) => (
            <article key={p.title}>
              <img src={p.image} alt={p.title} loading="lazy" />
              <h3 className="display">{p.title}</h3>
              <Button variant="link" size="sm" onClick={() => void viewProduct(p.title, p.query)}>
                Compare prices <ArrowUpRight />
              </Button>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const journalTab = (
    <section className="px-5 pt-6">
      <h1 className="display text-3xl">Your journal</h1>
      <p className="text-sm text-muted-foreground">Today, in your own words.</p>
      <textarea
        aria-label="Journal entry"
        className="field-input mt-4 h-32 rounded-2xl py-3"
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="Today I feel…"
      />
      <Button
        className="mt-3 h-12 w-full rounded-full"
        disabled={!entry.trim()}
        onClick={() => {
          setJournal((s) => [entry, ...s]);
          setEntry("");
        }}
      >
        <Plus />
        Add entry
      </Button>
      {journal.map((j, i) => (
        <div key={i} className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm">
          {j}
        </div>
      ))}
      <p className="mt-4 text-[11px] text-muted-foreground">
        Preview entries stay only during this visit.
      </p>
    </section>
  );

  const shopResult = shop && (
    <div className="mt-4 flex flex-col gap-2" aria-live="polite">
      <span className="eyebrow">WHERE TO BUY · {shop.label.toUpperCase()}</span>
      {shop.status === "loading" ? (
        <p className="text-sm text-muted-foreground">
          <Loader2 className="inline animate-spin" size={14} /> Finding the best prices…
        </p>
      ) : shop.blocked ? (
        <p className="text-sm">Ritu doesn’t list clinical products.</p>
      ) : shop.offers.length === 0 ? (
        <a
          href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(shop.query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm hover:bg-accent"
        >
          <span>Open {shop.label} in Google Shopping</span>
          <ArrowUpRight size={14} />
        </a>
      ) : (
        <>
          {shop.offers.map((o, i) => (
            <a
              key={o.link + i}
              href={o.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 hover:bg-accent"
            >
              {o.thumbnail && (
                <img
                  src={o.thumbnail}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.source}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{o.price}</p>
                {i === 0 && (
                  <span className="rounded bg-primary px-1.5 text-[10px] text-primary-foreground">
                    Best price
                  </span>
                )}
              </div>
              <ArrowUpRight size={14} />
            </a>
          ))}
          <p className="text-[10px] text-muted-foreground">
            You buy directly from the store — Ritu never handles payments.
          </p>
        </>
      )}
    </div>
  );
  const shopTab = (
    <section className="px-5 pt-6">
      <div className="shop-heading">
        <span className="ritu-wordmark">
          ritu<span>.</span>
        </span>
        <p className="eyebrow">THE CARE EDIT</p>
      </div>
      <div className="care-banner">
        <img
          src={periodImage}
          width={1440}
          height={768}
          alt="Pads, period underwear and comforting self-care essentials"
        />
        <div>
          <p className="eyebrow">THOUGHTFULLY CHOSEN</p>
          <h1 className="display">
            Care for
            <br />
            every phase.
          </h1>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        For your {cycle.phase.name.toLowerCase()} phase · compare prices in India
      </p>
      <div className="mt-4">
        {[
          ...new Set([
            ...(profile.flow === "heavy" ? ["Heavy flow"] : []),
            ...Object.values(logs).flat(),
          ]),
        ].filter((a) => SUGGEST[a]).length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            <p className="eyebrow">BASED ON WHAT YOU LOGGED</p>
            {[
              ...new Set([
                ...(profile.flow === "heavy" ? ["Heavy flow"] : []),
                ...Object.values(logs).flat(),
              ]),
            ]
              .filter((a) => SUGGEST[a])
              .map((a) => {
                const pick = SUGGEST[a];
                return pick ? (
                  <Button
                    key={a}
                    variant="outline"
                    className="justify-between"
                    onClick={() => viewProduct(pick.title, pick.query)}
                  >
                    {pick.title}
                    <ShoppingBag />
                  </Button>
                ) : null;
              })}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PICKS.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className={`relative h-40 ${p.bg}`}>
              <img
                src={
                  p.id === "tea"
                    ? teaImage
                    : p.id === "heat"
                      ? heatImage
                      : p.id === "yoga"
                        ? yogaImage
                        : journalImage
                }
                alt={p.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="tag">{p.tag}</span>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-card"
                aria-label={`Save ${p.title}`}
                onClick={() =>
                  setSaved((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))
                }
              >
                {saved.includes(p.id) ? <Check /> : <Bookmark />}
              </Button>
            </div>
            <div className="p-3">
              <h3 className="display text-base leading-tight">{p.title}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.desc}</p>
              <Button
                size="sm"
                className="mt-3 w-full rounded-full"
                onClick={() => viewProduct(p.title, p.query)}
              >
                <ShoppingBag />
                Compare prices
              </Button>
            </div>
          </article>
        ))}
      </div>
      {shopResult}
      <p className="mt-4 text-[11px] text-muted-foreground">
        Ritu never sells contraceptives or prescription medicine.
      </p>
    </section>
  );

  const sheetTitle: Record<Exclude<Sheet, null>, string> = {
    feel: "What are you feeling today?",
    period: "Log your period",
    why: "Why this confidence?",
    chat: "Ask Ritu AI",
  };
  const sheetBody =
    sheet === "feel" && applied ? (
      <>
        <p className="eyebrow">WHAT’S HAPPENING · {selPhase.name.toUpperCase()} PHASE</p>
        <div className="mt-3 rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
          {ciReply === null ? (
            <span className="text-muted-foreground">
              <Loader2 className="inline animate-spin" size={14} /> Ritu is reading your check-in…
            </span>
          ) : (
            ciReply.split("**").map((part, j) => (j % 2 ? <b key={j}>{part}</b> : part))
          )}
        </div>
        {shopResult}
        {applied.filter((a) => RULES[a]).length > 0 && (
          <>
            <p className="eyebrow mt-5">MORE FOR WHAT YOU LOGGED</p>
            <div className="mt-2 flex flex-col gap-2">
              {[...new Set(applied.filter((a) => RULES[a]))].map((a) => {
                const pick = RULES[a];
                return pick ? (
                  <Button
                    key={a}
                    variant="outline"
                    className="justify-between rounded-full"
                    onClick={() => void viewProduct(pick.title, pick.query, true)}
                  >
                    {pick.title}
                    <ShoppingBag />
                  </Button>
                ) : null;
              })}
            </div>
          </>
        )}
        <Button
          className="mt-6 h-12 w-full rounded-full"
          onClick={() => {
            setApplied(null);
            setSheet(null);
            setAns({});
            setNote("");
          }}
        >
          Done
        </Button>
      </>
    ) : sheet === "feel" ? (
      <>
        <p className="mb-1 text-xs text-muted-foreground">
          {fmt(sel, { day: "numeric", month: "short" })} · Cycle day {cycle.dayFor(sel)} ·{" "}
          <b className="text-primary">{selPhase.name}</b>
        </p>
        {(CHECKIN[selPhase.key] ?? []).map((q) => (
          <div key={q.id} className="mt-5">
            <h3 className="font-semibold">
              {q.title}
              {!q.multi && (
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">pick one</span>
              )}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.opts.map((o) => {
                const on = (ans[q.id] ?? []).includes(o);
                return (
                  <Button
                    variant="ghost"
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAns((s) => {
                        const cur = s[q.id] ?? [];
                        return { ...s, [q.id]: selectAnswer(cur, o, q.multi) };
                      })
                    }
                    className={`flex h-10 items-center gap-1 rounded-full border px-4 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
                  >
                    {on && <Check size={14} />}
                    {o}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        <h3 className="mt-5 font-semibold">
          Notes <span className="text-[10px] font-normal text-muted-foreground">optional</span>
        </h3>
        <textarea
          aria-label="Notes"
          className="field-input mt-2 h-20 rounded-2xl py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write anything you want to remember…"
        />
        <Button
          className="mt-6 h-14 w-full rounded-full text-base shadow-lg"
          disabled={!Object.values(ans).some((v) => v.length) && !note.trim()}
          onClick={() => void saveCheckin()}
        >
          Save check-in
        </Button>
      </>
    ) : sheet === "period" ? (
      <>
        <p className="text-sm text-muted-foreground">
          Tap each day you bled. Dotted days are predicted.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ArrowLeft />
          </Button>
          <b>{fmt(month, { month: "long", year: "numeric" })}</b>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ArrowLeft className="rotate-180" />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">
              {w}
            </span>
          ))}
          {Array.from({ length: month.getDay() }, (_, i) => (
            <span key={"e" + i} />
          ))}
          {Array.from(
            { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
            (_, i) => {
              const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
              const k = iso(d);
              const on = draftDays.includes(k);
              const future = d > TODAY;
              const pred = cycle.predicted.has(k);
              return (
                <Button
                  variant="ghost"
                  key={k}
                  disabled={future}
                  aria-pressed={on}
                  aria-label={fmt(d, { day: "numeric", month: "long" })}
                  onClick={() =>
                    !future &&
                    setDraftDays((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))
                  }
                  className={`aspect-square rounded-full text-sm transition ${on ? "bg-primary text-primary-foreground" : pred ? "border border-dashed border-primary text-primary" : future ? "text-muted-foreground/40" : "hover:bg-accent"} ${k === iso(TODAY) ? "font-bold underline" : ""}`}
                >
                  {i + 1}
                </Button>
              );
            },
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {draftDays.length} day{draftDays.length === 1 ? "" : "s"} selected
        </p>
        <Button
          className="mt-4 h-14 w-full rounded-full"
          onClick={() => {
            setPeriodDays(draftDays);
            setSheet(null);
          }}
        >
          Save period days
        </Button>
      </>
    ) : sheet === "why" ? (
      <>
        <p className="text-sm leading-relaxed">
          Ritu shows a window, never a fake exact date. Right now it’s based on{" "}
          {lastStart ? "your logged period" : "your setup answers"} and a ~{cycle.len}-day cycle.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This is a calendar estimate, not a diagnosis or confirmed ovulation date. Keep logging to
          track your own patterns.
        </p>
      </>
    ) : sheet === "chat" ? (
      <>
        <details className="rounded-2xl bg-secondary p-3 text-xs">
          <summary className="cursor-pointer font-semibold">How the AI works</summary>
          <ol className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
            <li>
              <b className="text-foreground">1 · Context:</b> your cycle day, phase, predicted
              window and today’s logs are turned into a short prompt.
            </li>
            <li>
              <b className="text-foreground">2 · Model:</b> a language model answers on a private
              server — your phone never holds the key.
            </li>
            <li>
              <b className="text-foreground">3 · Guardrails:</b> rules stop exact dates, diagnoses
              and medicine advice; shopping skips clinical items.
            </li>
          </ol>
        </details>
        <Conversation className="mt-4 h-72 flex-none">
          <ConversationContent className="gap-4 p-0">
            {chat.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask anything about how you feel in your {cycle.phase.name.toLowerCase()} phase.
              </p>
            )}
            {chat.map((m, i) => (
              <Message key={i} from={m.role === "you" ? "user" : "assistant"}>
                <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  <MessageResponse>{m.text}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
            {shop && (
              <Message from="assistant">
                <Tool defaultOpen={false}>
                  <ToolHeader
                    type="tool-product-search"
                    title="Compare care products"
                    state={
                      shop.status === "loading"
                        ? "input-available"
                        : shop.error
                          ? "output-error"
                          : "output-available"
                    }
                  />
                  <ToolContent>{shopResult}</ToolContent>
                </Tool>
              </Message>
            )}
            {thinking && <Shimmer className="text-sm">Thinking…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {chat.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {["What should I eat today?", "Why am I so tired?", "Best workout for this phase?"].map(
              (x) => (
                <Button
                  key={x}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => send(x)}
                >
                  {x}
                </Button>
              ),
            )}
          </div>
        )}
        <PromptInput className="mt-4" onSubmit={({ text }) => send(text)}>
          <PromptInputTextarea
            aria-label="Your question"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a question…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              aria-label="Send question"
              status={thinking ? "submitted" : "ready"}
              disabled={!q.trim() || thinking}
            />
          </PromptInputFooter>
        </PromptInput>
      </>
    ) : null;

  const navItems: { k: Tab; i: typeof House; l: string }[] = [
    { k: "home", i: House, l: "Home" },
    { k: "journal", i: User, l: "Journal" },
    { k: "shop", i: ShoppingBag, l: "Shop" },
  ];

  return (
    <div className="ritu-surround min-h-screen">
      <div className="ritu-app relative mx-auto min-h-screen max-w-md bg-background pb-32">
        {tab === "home" ? home : tab === "journal" ? journalTab : shopTab}
        <Button
          size="icon"
          aria-label="Ask Ritu"
          className="fixed bottom-28 right-[max(1.25rem,calc(50%-14rem+1.25rem))] z-20 h-12 w-12 rounded-full shadow-lg"
          onClick={() => {
            setShop(null);
            setSheet("chat");
          }}
        >
          <Flower2 />
        </Button>
        <p className="preview-status">Frontend preview · entries stay during this visit</p>
        <nav
          aria-label="Main"
          className="fixed bottom-5 left-1/2 z-20 flex w-[calc(100%-2.5rem)] max-w-[24rem] -translate-x-1/2 justify-around rounded-full bg-primary p-2 shadow-2xl"
        >
          {navItems.map((n) => (
            <Button
              variant="ghost"
              key={n.k}
              aria-label={n.l}
              aria-current={tab === n.k}
              onClick={() => {
                setTab(n.k);
                window.scrollTo(0, 0);
              }}
              className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm text-primary-foreground transition ${tab === n.k ? "bg-primary-foreground/20 font-medium" : "opacity-70"}`}
            >
              <n.i size={20} />
              {tab === n.k && n.l}
            </Button>
          ))}
        </nav>
        {sheet && (
          <div
            className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30"
            onClick={() => {
              setSheet(null);
              setApplied(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label={sheetTitle[sheet]}
              className="ritu-sheet max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-background p-5 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <div className="mb-5 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Back"
                  onClick={() => setSheet(null)}
                >
                  <ArrowLeft />
                </Button>
                <h2 className="display flex-1 text-xl">{sheetTitle[sheet]}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  onClick={() => setSheet(null)}
                >
                  <X />
                </Button>
              </div>
              {sheetBody}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
