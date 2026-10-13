import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const Input = z.object({
  question: z.string().min(1).max(600),
  context: z.object({
    day: z.number(), length: z.number(), phase: z.string(), daysToPeriod: z.number(),
    symptoms: z.array(z.string().max(60)).max(30), goal: z.string().max(80).optional(),
  }),
});

const SYSTEM = `You are Ritu, a warm menstrual-wellness guide for users in India.
Use the cycle context given. Answer in 2-4 short sentences, plain language.
Rules: never give exact period or ovulation dates (only ranges); never recommend or dose prescription medicine, hormones or contraceptives; never diagnose. Suggest food, movement, sleep and self-care tied to the phase.
If the question is about buying or choosing a non-clinical product (pads, tampons, cups, heat patch, tea, etc.), or the user logged heavy flow and asks about protection, end with a final line exactly: SEARCH: <short Google Shopping query for India>. Otherwise do not add that line.`;

export const askRitu = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false as const, error: 'AI is not configured.' };
    const c = data.context;
    const ctx = `Cycle day ${c.day} of ~${c.length}. Phase: ${c.phase}. Period expected in ~${c.daysToPeriod} days (±3). Logged today: ${c.symptoms.join(', ') || 'nothing'}. Goal: ${c.goal ?? 'not set'}.`;
    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' },
        instructions: SYSTEM,
        input: [{ role: 'user', content: `${ctx}\n\nQuestion: ${data.question}` }],
      }),
    });
    if (!res.ok || !res.body) {
      const msg = res.status === 429 ? 'Too many requests, try again shortly.' : res.status === 402 ? 'AI credits ran out.' : `AI error (${res.status}).`;
      return { ok: false as const, error: msg };
    }
    const reader = res.body.getReader(); const dec = new TextDecoder();
    let buf = '', text = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const l of lines) {
        if (!l.startsWith('data:')) continue;
        try { const e = JSON.parse(l.slice(5).trim()); if (e.type === 'response.output_text.delta') text += e.delta; } catch { /* skip */ }
      }
    }
    const m = text.match(/\n?SEARCH:\s*(.+)\s*$/i); const search = m?.[1]?.trim().slice(0, 100); const answer = text.replace(/\n?SEARCH:.*$/i, '').trim();
    return answer ? { ok: true as const, answer, search: search && search.length >= 2 ? search : undefined, context: ctx } : { ok: false as const, error: 'No answer this time.' };
  });
