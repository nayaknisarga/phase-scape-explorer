import { createFileRoute, ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowUpRight, BarChart3, Bookmark, CalendarDays, Check, Heart, House, Leaf, Plus, ShoppingBag, Sparkles, Sun, User, X, Zap, Loader2, Moon, Wind, Smile, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { phases } from '@/lib/phases';
import { searchProducts, type ProductOffer } from '@/lib/products.functions';
import { isClinicalQuery } from '@/lib/product-guard';
import { askRitu } from '@/lib/ai.functions';
import { Onboarding, type Profile } from '@/components/onboarding';
import teaImage from '@/assets/tea.jpg';
const CycleScene = lazy(() => import('@/components/cycle-scene'));

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Ritu — Your cycle, understood' }, { name: 'description', content: 'Ritu: honest period predictions, daily check-ins, phase insights and gentle self-care in a calm mobile app.' }, { property: 'og:title', content: 'Ritu — Your cycle, understood' }, { property: 'og:description', content: 'A personal, honest approach to period and wellness tracking.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Index,
});

const TODAY = new Date('2026-10-12T00:00:00');
const DAY = 86400000;
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-IN', o);
const TOP = [{ t: 'Tender breasts', i: Zap }, { t: 'Cramps', i: Wind }, { t: 'Everything is fine', i: Moon }, { t: 'Backache', i: Smile }];
const SELF = ['💬 Deep Chat', '🧠 Mindfulness', '🥦 Nutrition', '💤 Sleeping Well', '💛 Therapy', '💼 Time Off'];
const MOODS = ['☕ Calm', '😊 Happy', '⚡ Energetic', '🎢 Mood Swings', '😤 Irritated', '😔 Sad', '😰 Anxious', '🌧️ Low', '🏚️ Feeling guilty'];
const PICKS = [
  { id: 'tea', title: 'A warm cup of calm', desc: 'Caffeine-free chamomile for a softer evening.', tag: 'NOURISH', query: 'chamomile tea India', bg: 'bg-sage' },
  { id: 'heat', title: 'Heat for cramps', desc: 'A reusable heat patch for tender days.', tag: 'COMFORT', query: 'heat patch period cramps India', bg: 'bg-peach' },
  { id: 'yoga', title: 'Move gently', desc: 'A soft yoga mat for low-impact stretches.', tag: 'MOVEMENT', query: 'yoga mat India', bg: 'bg-lavender' },
  { id: 'journal', title: 'Make room for feelings', desc: 'A guided journal for quiet check-ins.', tag: 'MINDFULNESS', query: 'guided journal notebook India', bg: 'bg-rose' },
];
type Tab = 'home' | 'cycle' | 'journal' | 'shop';
type Sheet = 'feel' | 'period' | 'why' | 'chat' | null;

function Index() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selDay, setSelDay] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [logs, setLogs] = useState<Record<number, string[]>>({});
  const [lastStart, setLastStart] = useState<string | null>(null);
  const [periodInput, setPeriodInput] = useState('2026-10-12');
  const [entry, setEntry] = useState(''); const [journal, setJournal] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [q, setQ] = useState(''); const [chat, setChat] = useState<{ role: 'you' | 'ritu'; text: string }[]>([]); const [thinking, setThinking] = useState(false);
  const runAsk = useServerFn(askRitu);
  const runSearch = useServerFn(searchProducts);
  const [shop, setShop] = useState<{ label: string; status: 'loading' | 'done'; offers: ProductOffer[]; blocked?: boolean; error?: string } | null>(null);

  const cycle = useMemo(() => {
    const len = Number(profile?.length ?? 28);
    const start = new Date((lastStart ?? profile?.last ?? '2026-09-24') + 'T00:00:00');
    const dayOf = Math.floor((TODAY.getTime() - start.getTime()) / DAY) % len + 1;
    const next = new Date(start.getTime() + Math.ceil((TODAY.getTime() - start.getTime() + 1) / (len * DAY)) * len * DAY);
    const daysTo = Math.max(0, Math.round((next.getTime() - TODAY.getTime()) / DAY));
    const phase = dayOf <= 5 ? phases[0]! : dayOf <= 11 ? phases[1]! : dayOf <= 14 ? phases[2]! : phases[3]!;
    return { len, dayOf, daysTo, phase, from: new Date(next.getTime() - 3 * DAY), to: new Date(next.getTime() + 3 * DAY) };
  }, [profile, lastStart]);

  if (!profile) return <Onboarding onDone={(p) => { setProfile(p); window.scrollTo(0, 0); }} />;

  const viewProduct = async (label: string, query: string) => {
    setSheet('chat');
    if (isClinicalQuery(query)) { setShop({ label, status: 'done', offers: [], blocked: true }); return; }
    setShop({ label, status: 'loading', offers: [] });
    try { const r = await runSearch({ data: { query } }); setShop({ label, status: 'done', ...r }); }
    catch { setShop({ label, status: 'done', offers: [], error: 'Couldn’t reach the shops right now.' }); }
  };
  const send = async (text: string) => {
    const t = text.trim(); if (!t || thinking) return;
    setQ(''); setChat((c) => [...c, { role: 'you', text: t }]); setThinking(true);
    try { const r = await runAsk({ data: { question: t, context: { day: cycle.dayOf, length: cycle.len, phase: cycle.phase.name, daysToPeriod: cycle.daysTo, symptoms: logs[0] ?? [], goal: String((profile as Record<string, unknown>)['goal'] ?? '') || undefined } } });
      setChat((c) => [...c, { role: 'ritu', text: r.ok ? r.answer : r.error }]); }
    catch { setChat((c) => [...c, { role: 'ritu', text: 'Couldn’t reach Ritu right now.' }]); }
    finally { setThinking(false); }
  };
  const toggle = (v: string) => setPicked((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const days = Array.from({ length: 9 }, (_, i) => new Date(TODAY.getTime() + (i - 4) * DAY));
  const sel = new Date(TODAY.getTime() + selDay * DAY);

  const chip = (v: string) => <Button key={v} variant="outline" size="sm" className="h-9 rounded-full px-4" data-active={picked.includes(v)} onClick={() => (v.includes('Deep Chat') ? setSheet('chat') : toggle(v))}>{v}</Button>;

  const home = <>
    <section className="relative overflow-hidden rounded-b-[48px] bg-rose pb-10">
      <header className="flex items-center justify-between px-5 pt-5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-card font-semibold text-primary">{profile.name.charAt(0).toUpperCase()}</span>
        <h1 className="display text-xl">{fmt(sel, { day: 'numeric', month: 'long' })}</h1>
        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-card" aria-label="Open calendar" onClick={() => setTab('cycle')}><CalendarDays className="text-primary" /></Button>
      </header>
      <div className="mt-5 flex justify-center gap-1.5 px-2" role="tablist" aria-label="Choose day">
        {days.map((d, i) => { const off = i - 4; const a = off === selDay; return (
          <button key={off} role="tab" aria-selected={a} onClick={() => setSelDay(off)} style={{ transform: `translateY(${Math.abs(off) * 5}px)` }} className={`flex w-11 flex-col items-center rounded-2xl py-2 transition ${a ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'} ${Math.abs(off) > 3 ? 'opacity-40' : ''}`}>
            <span className="text-[10px] uppercase">{fmt(d, { weekday: 'short' })}</span><span className="text-lg font-semibold">{d.getDate()}</span>{logs[off]?.length ? <i className={`mt-0.5 h-1 w-1 rounded-full ${a ? 'bg-primary-foreground' : 'bg-primary'}`} /> : <i className="mt-0.5 h-1 w-1" />}
          </button>); })}
      </div>
      <div className="relative mx-auto mt-4 h-[280px] w-full">
        <ClientOnly fallback={<div className="cycle-canvas" />}><Suspense fallback={<div className="cycle-canvas" />}><CycleScene phase={cycle.phase.key} /></Suspense></ClientOnly>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="text-xs text-muted-foreground">Period in</p><p className="display text-4xl">{cycle.daysTo} <span className="text-2xl">days</span></p><p className="text-xs font-medium text-primary">{fmt(cycle.from, { day: 'numeric' })}–{fmt(cycle.to, { day: 'numeric', month: 'short' })}</p><p className="text-[11px] text-muted-foreground">Day {cycle.dayOf} · {cycle.phase.name}</p></div>
        </div>
      </div>
      <button onClick={() => setSheet('why')} className="mx-5 mt-6 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-md">
        <BarChart3 className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold">{lastStart ? 'Medium confidence' : 'Low confidence'}</span><span className="block truncate text-xs text-muted-foreground">Based on a ~{cycle.len}-day cycle · ±3 days</span></span><span className="text-sm font-semibold text-primary">Why?</span>
      </button>
    </section>
    <section className="px-5 pt-7">
      <h2 className="display text-2xl">My daily insights</h2>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[{ l: 'Log symptoms', i: Plus, bg: 'bg-lavender', s: 'feel' as Sheet }, { l: 'Ask Ritu AI', i: Sparkles, bg: 'bg-peach', s: 'chat' as Sheet }, { l: 'Log period', i: Heart, bg: 'bg-rose', s: 'period' as Sheet }].map((t) => (
          <button key={t.l} onClick={() => setSheet(t.s)} className={`flex aspect-square flex-col justify-between rounded-2xl p-3 text-left ${t.bg} transition active:scale-95`}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><t.i size={18} /></span><span className="text-xs font-medium leading-tight">{t.l}</span>
          </button>))}
      </div>
      {logs[selDay]?.length ? <div className="mt-5 rounded-2xl border border-border bg-card p-4"><p className="eyebrow">LOGGED · {fmt(sel, { day: 'numeric', month: 'short' }).toUpperCase()}</p><div className="mt-2 flex flex-wrap gap-1.5">{logs[selDay]!.map((l) => <span key={l} className="rounded-full bg-accent px-3 py-1 text-xs">{l}</span>)}</div></div> : null}
      <div className="mt-5 rounded-3xl bg-secondary p-5">
        <p className="eyebrow">YOUR {cycle.phase.name.toUpperCase()} PHASE</p>
        <h3 className="display mt-1 text-xl">{cycle.phase.label}</h3>
        <div className="mt-4 flex flex-col gap-3">{[{ i: Zap, t: cycle.phase.energy }, { i: Sun, t: cycle.phase.movement }, { i: Leaf, t: cycle.phase.nutrition }].map((x) => <div key={x.t} className="flex items-center gap-3 text-sm"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary"><x.i size={15} /></span>{x.t}</div>)}</div>
      </div>
    </section>
  </>;

  const cycleTab = <section className="px-5 pt-6">
    <h1 className="display text-3xl">Your four phases</h1><p className="text-sm text-muted-foreground">You are on day {cycle.dayOf} of ~{cycle.len}</p>
    <div className="mt-5 flex flex-col gap-3">{phases.map((p) => <div key={p.key} className={`rounded-2xl border p-4 ${p.key === cycle.phase.key ? 'border-primary bg-card' : 'border-border bg-card/60'}`}><div className="flex items-center gap-2"><span className={`phase-dot ${p.key}`} /><b className="text-sm">{p.name}</b><span className="ml-auto text-xs text-muted-foreground">{p.days}</span></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p></div>)}</div>
    <p className="mt-4 text-[11px] text-muted-foreground">Calendar estimates can’t confirm ovulation and aren’t contraception.</p>
  </section>;

  const journalTab = <section className="px-5 pt-6">
    <h1 className="display text-3xl">Your journal</h1><p className="text-sm text-muted-foreground">Today, in your own words.</p>
    <textarea aria-label="Journal entry" className="field-input mt-4 h-32 rounded-2xl py-3" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Today I feel…" />
    <Button className="mt-3 h-12 w-full rounded-full" disabled={!entry.trim()} onClick={() => { setJournal((s) => [entry, ...s]); setEntry(''); }}><Plus />Add entry</Button>
    {journal.map((j, i) => <div key={i} className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm">{j}</div>)}
    <p className="mt-4 text-[11px] text-muted-foreground">Preview entries stay only during this visit.</p>
  </section>;

  const shopTab = <section className="px-5 pt-6">
    <h1 className="display text-3xl">A little care</h1><p className="text-sm text-muted-foreground">Picks for your {cycle.phase.name.toLowerCase()} phase · best prices in India</p>
    <div className="mt-4 grid grid-cols-2 gap-3">{PICKS.map((p) => <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className={`relative h-28 ${p.bg}`}>{p.id === 'tea' ? <img src={teaImage} alt="Chamomile tea" className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-primary">{p.id === 'yoga' ? <Sun size={40} strokeWidth={1.2} /> : p.id === 'heat' ? <Heart size={40} strokeWidth={1.2} /> : <BookOpen size={40} strokeWidth={1.2} />}</div>}<span className="tag">{p.tag}</span>
        <Button variant="ghost" size="icon" className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-card" aria-label={`Save ${p.title}`} onClick={() => setSaved((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}>{saved.includes(p.id) ? <Check /> : <Bookmark />}</Button></div>
      <div className="p-3"><h3 className="display text-base leading-tight">{p.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{p.desc}</p><Button size="sm" className="mt-3 w-full rounded-full" onClick={() => viewProduct(p.title, p.query)}><ShoppingBag />Compare prices</Button></div>
    </article>)}</div>
    <p className="mt-4 text-[11px] text-muted-foreground">Ritu never sells contraceptives or prescription medicine.</p>
  </section>;

  const shopResult = shop && <div className="mt-4 flex flex-col gap-2" aria-live="polite"><span className="eyebrow">WHERE TO BUY · {shop.label.toUpperCase()}</span>{shop.status === 'loading' ? <p className="text-sm text-muted-foreground"><Loader2 className="inline animate-spin" size={14} /> Finding the best prices…</p> : shop.blocked ? <p className="text-sm">Ritu doesn’t list clinical products.</p> : shop.offers.length === 0 ? <p className="text-sm text-muted-foreground">{shop.error ?? 'No offers found right now.'} Try again a little later.</p> : <>{shop.offers.map((o, i) => <a key={o.link + i} href={o.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 hover:bg-accent">{o.thumbnail && <img src={o.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{o.title}</p><p className="text-xs text-muted-foreground">{o.source}</p></div><div className="text-right"><p className="text-sm font-semibold">{o.price}</p>{i === 0 && <span className="rounded bg-primary px-1.5 text-[10px] text-primary-foreground">Best price</span>}</div><ArrowUpRight size={14} /></a>)}<p className="text-[10px] text-muted-foreground">You buy directly from the store — Ritu never handles payments.</p></>}</div>;

  const sheetTitle: Record<Exclude<Sheet, null>, string> = { feel: 'What are you feeling today?', period: 'Log your period', why: 'Why this confidence?', chat: 'Ask Ritu AI' };
  const sheetBody = sheet === 'feel' ? <>
    <div className="grid grid-cols-2 gap-3">{TOP.map((s) => <button key={s.t} onClick={() => toggle(s.t)} className={`flex flex-col items-center gap-2 rounded-2xl p-5 text-sm transition ${picked.includes(s.t) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><s.i className={picked.includes(s.t) ? '' : 'text-primary'} />{s.t}</button>)}</div>
    <h3 className="pb-2 pt-6 font-semibold">Self care</h3><div className="mt-2 flex flex-wrap gap-2">{SELF.map(chip)}</div>
    <h3 className="pb-2 pt-6 font-semibold">Mood</h3><div className="mt-2 flex flex-wrap gap-2">{MOODS.map(chip)}</div>
    <Button className="sticky bottom-0 mt-6 h-14 w-full rounded-full text-base shadow-lg" disabled={!picked.length} onClick={() => { setLogs((l) => ({ ...l, [selDay]: picked })); setPicked([]); setSheet(null); }}>Apply</Button>
  </> : sheet === 'period' ? <>
    <p className="text-sm text-muted-foreground">Your prediction updates right away.</p>
    <label className="field-label mt-4" htmlFor="ps">Period started on</label><input id="ps" type="date" max="2026-10-12" className="field-input" value={periodInput} onChange={(e) => setPeriodInput(e.target.value)} />
    <Button className="mt-6 h-14 w-full rounded-full" disabled={!periodInput || periodInput > '2026-10-12'} onClick={() => { setLastStart(periodInput); setSheet(null); }}>Save period</Button>
  </> : sheet === 'why' ? <>
    <p className="text-sm leading-relaxed">Ritu shows a window, never a fake exact date. Right now it’s based on {lastStart ? 'your logged period' : 'your setup answers'} and a ~{cycle.len}-day cycle.</p>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Log 3 or more periods and the window gets narrower and more personal.</p>
  </> : sheet === 'chat' ? <>
    <details className="rounded-2xl bg-secondary p-3 text-xs"><summary className="cursor-pointer font-semibold">How the AI works</summary>
      <ol className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
        <li><b className="text-foreground">1 · Context:</b> your cycle day, phase, predicted window and today’s logs are turned into a short prompt.</li>
        <li><b className="text-foreground">2 · Model:</b> a language model answers on a private server — your phone never holds the key.</li>
        <li><b className="text-foreground">3 · Guardrails:</b> rules stop exact dates, diagnoses and medicine advice; shopping skips clinical items.</li>
      </ol></details>
    <div className="mt-4 flex flex-col gap-2" aria-live="polite">
      {chat.length === 0 && <p className="text-sm text-muted-foreground">Ask anything about how you feel in your {cycle.phase.name.toLowerCase()} phase.</p>}
      {chat.map((m, i) => <p key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'you' ? 'self-end bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.text}</p>)}
      {thinking && <p className="text-sm text-muted-foreground"><Loader2 className="inline animate-spin" size={14} /> Thinking…</p>}
    </div>
    {chat.length === 0 && <div className="mt-3 flex flex-wrap gap-2">{['What should I eat today?', 'Why am I so tired?', 'Best workout for this phase?'].map((x) => <Button key={x} variant="outline" size="sm" className="rounded-full" onClick={() => send(x)}>{x}</Button>)}</div>}
    <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(q); }}>
      <input aria-label="Your question" className="field-input flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question…" />
      <Button type="submit" className="h-12 rounded-full" disabled={!q.trim() || thinking}>Send</Button>
    </form>
    {shopResult}
  </> : null;

  const navItems: { k: Tab; i: typeof House; l: string }[] = [{ k: 'home', i: House, l: 'Home' }, { k: 'cycle', i: Heart, l: 'Cycle' }, { k: 'journal', i: User, l: 'Journal' }, { k: 'shop', i: ShoppingBag, l: 'Shop' }];

  return <div className="min-h-screen bg-muted/40">
    <div className="relative mx-auto min-h-screen max-w-md bg-background pb-32 shadow-xl">
      {tab === 'home' ? home : tab === 'cycle' ? cycleTab : tab === 'journal' ? journalTab : shopTab}
      <Button size="icon" aria-label="Ask Ritu" className="fixed bottom-28 right-[max(1.25rem,calc(50%-14rem+1.25rem))] z-20 h-12 w-12 rounded-full shadow-lg" onClick={() => setSheet('chat')}><Sparkles /></Button>
      <nav aria-label="Main" className="fixed bottom-5 left-1/2 z-20 flex w-[calc(100%-2.5rem)] max-w-[24rem] -translate-x-1/2 justify-around rounded-full bg-primary p-2 shadow-2xl">
        {navItems.map((n) => <button key={n.k} aria-label={n.l} aria-current={tab === n.k} onClick={() => { setTab(n.k); window.scrollTo(0, 0); }} className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm text-primary-foreground transition ${tab === n.k ? 'bg-primary-foreground/20 font-medium' : 'opacity-70'}`}><n.i size={20} />{tab === n.k && n.l}</button>)}
      </nav>
      {sheet && <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30" onClick={() => setSheet(null)}>
        <section role="dialog" aria-modal="true" aria-label={sheetTitle[sheet]} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <div className="mb-5 flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" onClick={() => setSheet(null)}><ArrowLeft /></Button><h2 className="display flex-1 text-xl">{sheetTitle[sheet]}</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setSheet(null)}><X /></Button></div>
          {sheetBody}
        </section>
      </div>}
    </div>
  </div>;
}
