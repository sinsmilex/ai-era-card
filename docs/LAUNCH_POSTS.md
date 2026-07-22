# Launch playbook — from zero audience (Phase 0 distribution)

## The one principle that matters

With zero followers, **post only where the platform gives strangers
reach**. Reddit ranks posts by early engagement, not by who you are.
Hacker News is a pure meritocracy of the first hour. Telegram dev chats
read every message. X/Twitter is the opposite: a 0-follower thread
reaches ~nobody — it goes LAST, not first, and works differently (via
replies, not threads).

Channel order for us, by (audience fit × zero-follower reach):

| # | Channel | Why | When |
|---|---|---|---|
| 1 | r/ClaudeAI | They literally generate the logs we parse; ccusage screenshots are native content there | First |
| 2 | RU Telegram dev chats | Founder is native; TG chats have no follower gate at all | Day 2 |
| 3 | r/cursor | Same fit, second wave | Day 3–4 |
| 4 | Show HN | Big but brutal; go in after the pitch survived Reddit comments | Day 5–7 |
| 5 | Habr (RU, article) | Long-form; the "built by two AI agents" angle carries it | Week 2 |
| 6 | X/Twitter | Post the thread for linkability, but real X reach comes from **replying** with your card under big AI accounts' posts about usage/costs | Ongoing |
| 7 | Product Hunt | Only after social proof exists (quotes, cards count) | Later |

## Pre-flight checklist (do before any post)

- [ ] **Reddit account health**: posts from fresh/zero-karma accounts get
  auto-filtered. If your account is new: spend 2–3 days leaving normal,
  useful comments in r/ClaudeAI / r/cursor first (5–10 comments, no
  links). Check each sub's self-promo rules; "I made this" posts are
  usually fine if you engage in comments.
- [ ] Timing: Reddit/HN peak is US morning — **15:00–18:00 CET**,
  Tuesday–Thursday. Never Friday night / weekend.
- [ ] The first 2 hours decide everything: block that time, answer every
  single comment fast. Velocity → ranking → strangers.
- [ ] One channel per day. Referers in /api/stats stay readable, and a
  flop on one channel doesn't poison the next (iterate the hook instead).
- [ ] Have ready: card URL, repo URL, and the FAQ answers below.

---

## 1. r/ClaudeAI (fire first)

**Title (pick one):**

- I turned my Claude Code usage history into a shareable card — 1.4B
  tokens since 2024, apparently
- Made a CLI that turns your Claude Code / Cursor / Codex usage into a
  permanent share card (all parsing is local)

**Body:**

> Everyone here has seen (or posted) ccusage screenshots. I kept doing it
> too, so I built the prettier version: `npx aieracard` reads your local
> Claude Code JSONL logs (plus Cursor via your own session, Codex, and
> OpenRouter if you have it), and gives you a permanent link to a stats
> card — tokens, active days, streak, models, estimated compute.
>
> Mine came out to 1.4B tokens / 222 active days:
> https://ai-era-card.vercel.app/s/mmi5GrqvJt
>
> Privacy, since that's the obvious question: parsing happens entirely on
> your machine. The CLI prints the exact JSON payload and asks before
> uploading — it's aggregate numbers and model names only. The schema
> literally has no fields for prompts, code, or file paths (it's a zod
> schema, open source, so you can check). `--dry-run` never uploads
> anything.
>
> Free, no account. Would love to see what your numbers look like — and
> whether anyone here outranks Tower.

## 2. Telegram (RU dev chats: AI-кодинг, Claude/Cursor чаты, свои каналы)

> Сжёг 1.4 миллиарда токенов в Claude Code и Cursor с 2024 года — и
> написал тулзу, которая превращает это в карточку:
>
> `npx aieracard`
>
> Парсит логи локально (Claude Code, Codex, Cursor, опционально
> OpenRouter), показывает точный JSON перед отправкой — на сервер уходят
> только агрегаты: токены, активные дни, модели. Ни промптов, ни кода,
> ни путей к файлам — в схеме физически нет таких полей.
>
> На выходе — постоянная ссылка, которая разворачивается в карточку в
> любом чате: https://ai-era-card.vercel.app/s/mmi5GrqvJt
>
> Бесплатно, без регистрации, код открыт:
> https://github.com/sinsmilex/ai-era-card
>
> Интересно, у кого тут цифры больше — кидайте свои карточки.

Куда нести: профильные чаты по Claude Code / Cursor / вайб-кодингу,
каналы знакомых, свой канал если есть. В чатах — читать правила и не
спамить: одно сообщение, дальше отвечать на вопросы.

## 3. r/cursor (адаптация №1)

Same body, swap the hook: lead with "Cursor's dashboard only shows you
usage per billing month — I wanted all-time," mention the session-API
trick (r/cursor loves internals): all-time usage via your own session,
CSV fallback if Cursor changes the endpoints.

## 4. Show HN (after Reddit survival)

**Title:**

> Show HN: Turn your AI coding usage into a permanent share card (local
> parsing)

**Text:**

> I noticed people keep screenshotting their ccusage output to flex token
> counts, so I built the shareable version.
>
> `npx aieracard` parses AI-tool usage locally — Claude Code and Codex
> from their JSONL logs, Cursor through your own cursor.com session
> (their dashboard API, since individual accounts have no public API),
> OpenRouter by key — and uploads only aggregate numbers after showing
> you the exact payload. You get a permanent URL with an OG image, a
> GitHub README badge (SVG), and a Stories-format export.
>
> The privacy contract is enforced structurally: the upload schema has no
> fields capable of carrying prompts, code, or paths, and the same zod
> schema validates on both the CLI and the API side.
>
> Interesting technical bits: Cursor's usage backend can't serve one
> query spanning their storage migrations, so all-time windows get split
> at two magic dates their error messages name; Codex logs cumulative
> token counters that need diffing; and the whole thing was built by two
> AI agents (Claude Code + Cursor) sharing one repo and a common
> AGENTS.md.
>
> My card: https://ai-era-card.vercel.app/s/mmi5GrqvJt

## 5. X/Twitter (linkability + reply strategy)

Post the 4-tweet thread (below) once — it's the canonical link to quote.
But actual zero-follower X reach comes from **replies**: when a big AI
account posts about token costs / usage / "how much do you spend on
Claude" — reply with your card + one line. 5–10 good replies a week beat
any cold thread.

Thread: (1) "I've burned 1.4 billion tokens building with AI since 2024.
Claude Code + Cursor + Codex, 222 active days, 20 models, $737 of
compute. One command turned all of it into a card: npx aieracard" + card
link → (2) local parsing + exact-JSON preview, aggregates only → (3)
permanent URL unfurls everywhere, README badge, Stories export, ranks
Foundation→Apex → (4) open source, free, "post your card below 👇" +
repo link.

## 6. Habr (week 2, RU long-form)

Working title: «Я сжёг 1,4 млрд токенов — и превратил их в карточку.
Продукт, который целиком построили два ИИ-агента». Angle: честный
билд-лог (два агента в одном репо, AGENTS.md как протокол координации,
реверс Cursor API, приватность через схему). Habr loves build stories
with warts. Draft on request.

---

## FAQ cheat sheet — заготовки ответов на предсказуемые вопросы

**"Почему вообще что-то загружается? Сделайте fully local."**
> It IS fully local until you decide otherwise: `--dry-run` / `--json-out`
> never upload. Upload exists only to mint the permanent shareable URL —
> that's the product. What leaves is the aggregate JSON you see printed,
> validated against an open schema that has no fields for content.

**"Это не нарушает ToS Cursor?"**
> It reads your own usage stats with your own session from your own
> machine — the same API your dashboard calls in the browser. If Cursor
> changes/blocks it, the CLI falls back to their official CSV export.

**"Цифры же можно накрутить."**
> Yep — self-reported, like every wrapped/year-in-review ever. The server
> does sanity bounds, but this is a flex card, not an audit. (If it ever
> matters: signed payloads are a known v2 path.)

**"Почему npx, а не сайт?"**
> The logs live on your machine; a website can't (and shouldn't) read
> them. The CLI is the only honest way to do local-first parsing.

**"Оценка стоимости точная?"**
> Claude Code/Codex: estimated from public per-model prices (same table
> ccusage uses). Cursor: their own cents from their API. It's labeled
> estimated where it's estimated.

**"Это скам/фишинг?"** (будет в той или иной форме)
> Fair. Code is open (github.com/sinsmilex/ai-era-card), schema is one
> file, `--dry-run` shows everything without sending a byte. Judge it.

---

## After each post

- `/api/stats` (Bearer): referers show which channel converts; totalCards
  shows whether views become cards. Gate 0: ≥100 non-founder cards +
  organic shares.
- Reply to every comment in the first 2 hours.
- A flop ≠ repost elsewhere same-day; iterate the hook, next channel
  tomorrow.
