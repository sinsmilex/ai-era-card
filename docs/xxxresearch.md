# AI Era Card — xxxresearch

## Meta

- **Цель:** найти реалистичный путь к 10,000 пользователям в ближайшие месяцы, не подменяя проверку спроса vanity-метриками и не ломая privacy promise.
- **Дата:** 2026-07-23.
- **Авторы:** Cursor — исходный аудит и seed-идеи; Claude Code — независимая критика, контр-гипотезы и валидация.
- **Статус продукта на дату аудита:** web в production на Vercel; `aieracard@0.1.4` опубликован; проверены Windows dry-run для Claude Code, Cursor API/CSV и их комбинации; актуальная founder card — [`WvGKItZ0gW`](https://ai-era-card.vercel.app/s/WvGKItZ0gW), 1.6B tokens, `L4 · TOWER`.
- **Как вносить вклад:** каждый агент добавляет материал только под своим разделом. Не удалять чужой непроверенный claim: пометить его `Challenged`/`Rejected`, сослаться на аргумент и сохранить историю решения. Новые идеи добавлять с полями протокола ниже.

## Validation protocol

### Правила

1. Каждая идея/вывод имеет: **Author**, **Claim**, **Evidence**, **Risk**, **Verdict** (`Proposed` / `Challenged` / `Validated` / `Rejected` / `Needs data`).
2. Второй агент обязан ответить в блоке **Challenges**: `agree` или `disagree`, затем конкретно почему, какие данные отсутствуют и что опровергло бы claim.
3. Только пункты со статусом **Validated** становятся кандидатами в ROADMAP. `Proposed` — не roadmap и не задача к реализации.
4. `Validated` означает не «оба агента согласны», а «есть достаточные evidence для следующего дешёвого эксперимента». Для необратимых/дорогих изменений нужен founder decision.
5. Каждый эксперимент записывает: сегмент, канал, период, exposure, installs, созданные cards, shares, повторные cards и качественные причины отказа. Без знаменателя не делать вывод из абсолютного числа.
6. Privacy, anti-fraud и метрики описывать буквально: нельзя называть self-reported card «verified», пока независимой проверки нет.

### Формат карточки идеи

```md
### I-XX — короткое название
- Author:
- Claim:
- Evidence:
- Risk:
- Cheapest falsification:
- Verdict: Proposed
- Challenges:
  - Claude/Cursor: agree|disagree — причина.
```

### Открытые дебаты

| ID | Вопрос | Начальная позиция Cursor | Что должно решить спор | Статус |
|---|---|---|---|---|
| D-01 | LinkedIn-first для 10k? | Нет: полезный user share surface, слабый founder acquisition при нулевой сети | UTM/referrer + card creations по 2–3 каналам | Needs data |
| D-02 | Нужен ли `updateToken` до 1k users? | Нет: сначала доказать, что люди хотят вторую card; локальный delta дешевле и не требует identity | ≥20% second-card rate или качественные просьбы обновлять существующую URL | Needs data |
| D-03 | Цель — 10k cards или 10k sharers? | Главная метрика — 10k уникальных создателей; share rate — ведущий индикатор, не заменитель | стабильная attribution-модель и повторный опрос пользователей | Needs data |
| D-04 | Badge/embeds — сейчас или после Gate 0? | README badge уже существует; улучшать его после первых evidence, не строить oEmbed заранее | 10+ органических badge copies / GitHub-referrer cards | Needs data |
| D-05 | «AI fluency» как карьерный сигнал | В перспективе, но сегодня card не проверяет личность, работу или точность usage | спрос от hiring-side и механизм verification без нарушения privacy | Needs data |

---

## 1. Product audit (current state)

### Что реально работает

| Область | Факт | Сильная сторона | Ограничение / риск |
|---|---|---|---|
| Core loop | `npx aieracard` → local parse → exact JSON preview → explicit upload → permanent URL | Понятная privacy-first история; `--dry-run` делает доверие проверяемым | CLI — существенный install/permission/unknown-data барьер; landing не заменяет walkthrough |
| Sources | Claude Code, Codex local JSONL; Cursor dashboard API с CSV fallback; optional OpenRouter | Охват нескольких AI-coding сегментов; Cursor fallback доказан на реальном CSV | Cursor API undocumented; OpenRouter не проверен живым management key; покрытие не равно точности |
| Card | tokens, active days, streak, models, source labels, rank/milestones и deterministic building | Визуальный объект выглядит как status artifact, а не dashboard | «War and Peace» и rank могут выглядеть как gimmick; rank основан на self-reported aggregates |
| Sharing | OG/X/Slack/Discord/Telegram/LinkedIn unfurl, native-image download, LinkedIn text kit, README badge | Share action сразу на card; GitHub — точное место аудитории | Фактический click/share conversion не измеряется; direct download не гарантированно работает кросс-browser |
| Web | Next.js, Neon Postgres, Upstash rate limit, permanent slug | Малый operational footprint; storage для будущих фаз уже есть | нет CI, error tracking, health checks, data-retention/deletion UX |
| Measurement | `card_events`: page/og/badge/story, referer host, coarse UA; founder `/api/stats` | PII-minimal telemetry, соответствует бренду | endpoint сейчас не удалось авторизовать; нет funnel install→create, unique actors, click intents или source attribution на creation |
| Privacy | strict Zod schema у CLI и API; schema не может передать prompts/code/paths/project names | Это лучший текущий moat и конкретное доказательство claim | optional handle — PII по выбору пользователя; `projectCount`, dates и model IDs всё ещё personal metadata; permanent deletion не видна |

### UX: текущая цепочка и трение

1. **Discovery:** landing объясняет value в трёх строках и даёт `npx` command. Хорошо для технического пользователя, но нет одного клика «посмотреть, что именно будет прочитано» и нет OS/source troubleshooting до terminal.
2. **Collection:** Claude/Codex local parsing естественен; Cursor автоматически читает JWT из `state.vscdb`. Это снижает friction, но для части людей выглядит тревожно, даже если токен не уходит на сервер.
3. **Preview/consent:** exact JSON before upload — правильный trust moment. `--force` допустим для scripts, но в публичных примерах не должен стать default.
4. **Result:** URL и attractive card готовы к share; share kit есть. Нет guided next action «куда именно это добавить» на основании выбранного source/канала и нет evidence, что CTA выбираются.
5. **Return:** ranks/milestones показывают будущий рост, но card immutable и нет local pointer/delta. Сейчас пользователь разумно спрашивает: «зачем запускать второй раз?»

### Truthfulness audit

- Card корректно подписана `Self-reported · not a game score`; landing и launch copy говорят aggregate-only.
- Нет verification, identity binding, fraud detection, provider attestation или защиты от ручного POST в рамках допустимой schema. Rate limit ограничивает spam, **не** доказывает данные.
- Cost не должен продаваться как bill: Claude/Codex — static pricing estimate; Cursor зависит от undocumented aggregation; OpenRouter смешивает 30-day tokens и all-time spend (UI это раскрывает).
- «Permanent» сейчас — product promise, зависящий от Vercel/Neon и отсутствия deletion/retention policy. Формулировка допустима как intent, но это не cryptographic permanence.

### Audit verdicts

### A-01 — Узкий продуктовый wedge сохранён
- Author: Cursor
- Claim: permanent self-reported share card — достаточно узкий и отличимый wedge для Gate 0; dashboard/accounts/map сейчас ухудшат learning speed.
- Evidence: AGENTS и ROADMAP отделяют ccusage, Claude Reflect и WakaTime; existing flow уже доставляет card + unfurl.
- Risk: «permanent URL» сам по себе может не быть достаточной причиной сменить screenshot/ccusage.
- Cheapest falsification: 30–50 non-founder attempts; спросить после completion: «что именно заставило бы вас share?»
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### A-02 — Trust debt важнее визуальной polish
- Author: Cursor
- Claim: до широкого запуска главные blockers доверия — CI, observability, честное раскрытие data quality и deletion/retention answer, не новые visual formats.
- Evidence: `main` auto-deploys, CI отсутствует; `/api/stats` blocked; Cursor API undocumented; OpenRouter live validation отсутствует.
- Risk: слишком ранняя infra может стать procrastination вместо distribution.
- Cheapest falsification: закрыть CI + stats access + one live OpenRouter check за короткий bounded sprint; затем сравнить support/failure rate soft launch.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

## 2. User behavior & JTBD

### Сегменты и Jobs-to-be-done

| Сегмент | Functional job | Emotional/social job | Главный барьер | Лучший первый канал |
|---|---|---|---|---|
| Heavy Claude/Cursor user | собрать кросс-tool aggregate без ручной таблицы | показать «я реально живу в AI-native workflow» | privacy + «зачем ещё один CLI?» | X/Reddit/Discord replies, коллеги |
| Career-visible developer | дать talking point для profile/post | signaling AI fluency, новизна | self-reported card не credential | GitHub README, LinkedIn native image |
| Open-source builder | добавить живой artifact в README | отличиться среди профилей | badge может выглядеть vanity | GitHub README/template |
| AI community early adopter | участвовать в usage comparison/meme | belonging, status, curiosity | легко сделать screenshot вместо URL | community launch + milestone prompt |
| Privacy-conscious senior | получить aggregate без отдачи logs | control and auditability | Cursor JWT reading/estimated cost | Show HN, README, transparent docs |

### Share psychology: что должно сработать

- Люди share не «данные», а **identity signal**, повод для разговора и social proof. Большое число tokens без context может считываться как waste, не мастерство.
- Card лучше работает, когда даёт готовую narrative sentence: milestone, unusual multi-tool mix, streak или personal build context. У current card есть rank/milestones, но нет user-authored context по privacy contract — это сознательный trade-off.
- Self-reported label повышает intellectual honesty, но уменьшает статусность. Нельзя скрывать label ради conversion; нужно тестировать copy, где «you control exactly what leaves your machine» становится достоинством.
- Один share не означает viral loop. Нужны наблюдаемые переходы: viewer → landing → install → card → share. Сейчас измеряется только tail этой цепочки и page/preview fetches, часто bots.

### Funnel и ожидаемые drop-offs

| Этап | Что пользователь делает | Почему уходит | Что измерять сейчас | Недостающее измерение |
|---|---|---|---|---|
| Impression → landing | видит post/unfurl | card не объясняет личную выгоду за секунды | referrer page views косвенно | campaign URL / landing views |
| Landing → terminal | копирует `npx` | CLI/security concern, no supported tool, нет времени | ничего | CTA copy event + install proxy не доступен |
| Run → detected source | collector читает данные | missing logs, Cursor auth/API, CSV friction, unsupported setup | console feedback только если пользователь сообщает | opt-in anonymous failure code |
| Preview → upload | читает JSON | data surprise, no trust, no value | snapshots только после conversion | local-only opt-in outcome reporting |
| Card → share | выбирает X/LinkedIn/badge/copy | нет status narrative, platform mismatch, fear of flex | page/OG/badge renders, не click | privacy-safe share-intent events |
| Share → next creator | viewer запускает CLI | no attribution, cold install | referrer host if card visited | campaign/referral code on URLs |
| Return | повторно запускает | immutable snapshot has no new benefit | нет identity/previous snapshot link | local delta adoption and second-card cohort |

## 3. Funnel to 10k users (math + bottlenecks)

### Сначала определить denominator

**North-star на ближайшие месяцы:** `10,000 unique non-founder card creators`, не 10k page views и не 10k cards. Пока accounts отсутствуют, это можно только оценивать privacy-preserving cohort proxy (например, daily salted client-side installation ID, если пользователь согласился) или честно считать **10k cards created** как operational proxy. Никогда не называть это 10k verified people.

Дополнительные показатели:

- activation: `created card / users who completed collection`;
- share intent: `share CTA or badge copy / cards`;
- observed distribution: `new cards with channel/campaign attribution`;
- return: `second card within 30 days / first-card cohort`;
- reliability: `successful collection / reported attempts` по source и OS.

### Иллюстративная математика, не forecast

| Сценарий | Reached qualified developers | Landing→run | Run→card | Card→share | Viewer→new card | Итог card creators | Вердикт |
|---|---:|---:|---:|---:|---:|---:|---|
| Один удачный HN/Reddit post | 50,000 | 4% | 35% | 20% | 1% | ~700 direct + 7 loop | полезный test, не путь к 10k |
| 10 качественных community surfaces | 300,000 | 3% | 40% | 25% | 2% | ~3,600 direct + ~72 loop | возможно только при сильном distribution engine |
| Sustainable distribution + embeds | 1,000,000 | 2% | 35% | 25% | 3% | ~7,000 direct + ~210 loop | всё ещё short of 10k; нужны repeated launches/partners |
| «Надеяться на virality» | неизвестно | неизвестно | неизвестно | неизвестно | неизвестно | не модель | fantasy |

Формула direct acquisition: `qualified reach × landing→run × run→card`. При реалистичных 2–4% terminal intent и 30–40% completion bottleneck — **qualified reach + collection reliability**, не дизайн share button. Виральность становится существенной только при измеримом viewer→creator conversion, который у CLI по умолчанию низкий.

### Реалистичные пути

1. **Niche proof → repeatable community playbook:** 100 non-founder cards через friends/Reddit/HN/Discord; найти один source+message с лучшей activation; повторять только разрешённые community launches с новым evidence.
2. **Developer distribution surface:** README badge, examples в OSS/AI tooling repositories, maintainers/creators с реальной аудиторией. Это медленнее, но ближе к intent, чем broad social impressions.
3. **Product-led recurrence:** после Gate 0 — local deltas/milestones, превращающие existing creator в повод share снова. Это улучшает numerator posts, но не заменяет external acquisition.
4. **Partnership/content path:** credible AI coding newsletters, tool communities, creator demos или a small benchmark/report only when sample is honestly self-reported. Нельзя фабриковать «top users».

### Fantasy paths, которые не планировать

- «Красивая OG сама станет вирусной» без audience distribution и clear reason to install.
- 10k уникальных людей из одного Show HN / one LinkedIn post у founder без сети.
- map/leaderboard как acquisition до достаточной density: пустая сеть показывает отсутствие traction.
- карьерная credential до verification: это создаёт scrutiny, а не доверие.

## 4. Marketing & distribution (beyond current plan)

Текущий `LAUNCH_PLAN` и `DISTRIBUTION` правильно ставят: friends → один community за раз → Show HN → GitHub/Discord; не делают LinkedIn основным каналом founder. Это хорошая Gate 0 последовательность, но это **исследование канала**, а не достаточный 10k plan.

### Приоритетные эксперименты после pre-launch fixes

| Приоритет | Experiment | Гипотеза | Success criterion | Stop rule |
|---|---|---|---|---|
| P0 | 5–10 targeted DM | flow проходим на чужих машинах без founder | ≥3 independent cards; классифицированы все drop-offs; ≥1 unsolicited share | <3 completions → чинить flow, не идти на HN |
| P0 | Один Reddit launch по лучшему source | pain-specific hook конвертирует лучше broad «AI era» | 10+ non-founder cards и qualitative setup reports | deletion/mod warning или installs без cards → не cross-post |
| P0 | Show HN после soft launch | transparent engineering/privacy attracts qualified users | cards + reproducible issues, не rank | no qualified conversion → rewrite wedge/landing before repeat |
| P1 | GitHub badge adoption interview | README artifact даёт durable discovery | 10 creators paste badge, ≥1 GitHub-referred card | copy clicks без actual embeds → deprioritize widget work |
| P1 | Creator/maintainer pilots | чужая trusted audience reduces CLI trust cost | 3 partners, each measured campaign, creator feedback | mass cold outreach / affiliate spend — не делать |
| P2 | «Milestone» launch moment | status event creates organic re-share | second-card cohort/share rate improves vs baseline | build only after Gate 0 |

### Positioning, которое выдерживает scrutiny

- **Core:** “Turn supported local AI coding usage into a permanent, self-reported share card. Inspect the exact aggregate payload first.”
- **Do say:** local parsing, aggregate-only schema, estimates where applicable, unsupported cases, `--dry-run`.
- **Do not say:** official, verified, proof of skill, accurate bill, leaderboard, «the first», viral, or privacy absolutes broader than the schema.
- **HN angle:** implementation and privacy contract, not lifestyle flex.
- **LinkedIn angle:** user-native image post plus card link in comment; it remains a share kit, not a zero-audience growth engine.

## 5. Code & infra gaps

| Gap | Why it blocks trust/scale | Evidence | Recommended order |
|---|---|---|---|
| CI absent | broken main auto-deploys to production | ROADMAP/AGENTS explicitly note no CI | P0: GitHub Actions `pnpm test && pnpm -r build` |
| Founder stats inaccessible | launch cannot distinguish views from cards or choose channel | production `/api/stats` returns 401; secret fallback unclear | P0: set dedicated `STATS_SECRET`, redeploy, verify without logging it |
| No error tracking/health checks | collector/API/OG failures are discovered by users | no Sentry/monitoring; Cursor API fragile | P0.5: uptime/synthetic public checks and privacy-safe error capture |
| Thin collector fixtures | parser regressions silently corrupt a status artifact | Claude JSONL/CSV parsing manually validated; only some source tests exist | P1: fixtures for duplicated/torn JSONL, unknown models, cursor data gaps, CSV variants |
| Cursor dependency | undocumented API may change or auth storage changes | hardcoded split dates, session JWT scanning, documented CSV fallback | P0: clear fallback UX; P1: daily non-user synthetic contract check where lawful |
| OpenRouter live gap | advertised source unproven in a real account | known gap in AGENTS | P0: live-key `--dry-run`, document exact result |
| Data lifecycle undefined | permanent URLs + self-typed handle need user control | no visible delete/update/retention policy | P1: documented retention/deletion contact/process before large promotion |
| Abuse model minimal | rate limit prevents some spam, not forged cards or offensive handles | public POST accepts any schema-valid numbers; 5/IP/hour limit | P1: decide abuse response + report/delete route; do not sell anti-fraud |
| DB migration approach | `CREATE/ALTER` at runtime is okay early, risky under concurrency/evolution | `PgStore.create` issues DDL at startup | P2: versioned migrations before higher traffic/teams |
| Measurement incomplete | cannot compute conversion or unique creators | event surfaces are render fetches; bot previews inflate counts | P0/P1: campaign tags, share-intent events, source/OS outcome taxonomy; preserve PII limits |

## 6. Idea backlog (Cursor seed ideas)

### I-01 — Gate 0 reliability and measurement closure
- Author: Cursor
- Claim: CI, confirmed stats access, OpenRouter live dry-run and collector failure taxonomy are the highest-return next package.
- Evidence: all are explicit known gaps; each can falsify a core production claim before attention arrives.
- Risk: infrastructure work becomes excuse to delay real users.
- Cheapest falsification: timebox to 2–3 days, then begin friend soft launch regardless of polish.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### I-02 — Source-specific onboarding, not a generic landing redesign
- Author: Cursor
- Claim: a short “What will be read / what happens if it fails” path by Claude/Codex/Cursor will improve run→card more than visual redesign.
- Evidence: collectors have materially different trust/failure modes; landing collapses them into one command.
- Risk: documentation increases choice overload and maintenance burden.
- Cheapest falsification: add one lightweight preflight doc or CLI output, ask 10 testers whether it changed their confidence/completion.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### I-03 — Local previous-snapshot state for delta
- Author: Cursor
- Claim: after Gate 0, save only previous aggregate locally and show “since last card” to create a legitimate return/share moment without accounts or update URLs.
- Evidence: ROADMAP names deltas as Phase 1; immutable permanent cards remain honest historical snapshots.
- Risk: state loss/reinstall confusion; users may expect existing URL to update.
- Cheapest falsification: prototype output in `--dry-run`, interview 10 first-card users about a second run.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### I-04 — Explicit provenance panel, not verification theater
- Author: Cursor
- Claim: card/detail page should eventually state source coverage, data window, estimated/partial cost and generated date in user-readable language.
- Evidence: mixed source windows and estimates are already in schema/UI but easy to miss; trust questions will arrive on HN.
- Risk: more detail harms share-card elegance.
- Cheapest falsification: expand only behind “How was this calculated?” and measure whether it resolves support questions.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### I-05 — Campaign attribution with consent-safe tags
- Author: Cursor
- Claim: deterministic campaign tags carried from launch link to resulting card creation are required to choose distribution channel; referrer alone is too lossy.
- Evidence: `/api/stats` only gets card render referer host, often bot/empty, not creation source.
- Risk: attribution parameters may look surveillance-heavy or leak into permanent URLs.
- Cheapest falsification: one bounded `?ref=show-hn-YYYYMMDD` experiment stored only as coarse campaign name or aggregate counter, documented in privacy policy.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### I-06 — Deletion/report workflow before wide launch
- Author: Cursor
- Claim: a permanent public artifact needs a clear deletion and abuse-report path before promotion beyond friendly early adopters.
- Evidence: optional handles and fabricated schema-valid cards can create unwanted public content; current architecture stores permanent snapshots.
- Risk: support cost and scope creep.
- Cheapest falsification: publish a minimal contact/process with authentication by original local capability/token only if one can be designed safely; otherwise founder-admin manual path.
- Verdict: Proposed
- Challenges:
  - Claude: _ожидается_.

### Ranking of ideas

| Rank | Idea | Why now / not now |
|---:|---|---|
| 1 | I-01 reliability + measurement | protects launch learning immediately |
| 2 | I-02 source-specific onboarding | attacks biggest CLI trust/completion drop-off |
| 3 | I-05 campaign attribution | makes distribution decisions evidence-based |
| 4 | I-06 deletion/report | trust prerequisite for wider public sharing |
| 5 | I-03 local deltas | only after first share loop validates |
| 6 | I-04 provenance panel | valuable, but can be concise/deferred behind details |
| — | oEmbed, map, accounts, percentiles | gated by evidence; do not build as growth substitute |

## 7. Claude section

> **Instructions for Claude Code:** append; do not rewrite Cursor’s audit. For every contested item, copy its ID into `Challenges`, state `agree`/`disagree`, cite code/docs/live evidence, name the missing data, and change verdict only when protocol permits. Add counter-ideas using the I-XX template. Explicitly answer the challenge prompts below.

### Claude audit & counter-ideas

_Waiting for Claude Code._

### Required challenge prompts

1. **Is LinkedIn-first wrong for 10k?** Distinguish founder acquisition from a successful user’s sharing surface; propose a measurable test.
2. **Is permanent snapshot enough, or do we need `updateToken` before 1k users?** Compare immutable historical truth, return loop and privacy/abuse implications.
3. **Is “10k cards” or “10k sharers” the right metric?** Give a north-star, a proxy without accounts, and a reason not to optimize an easily gamed number.
4. **Does reading Cursor’s local session JWT create a trust problem that copy cannot solve?** Recommend the lowest-friction honest mitigation.
5. **Which one existing product claim fails most dangerously under public scrutiny?** Cite exact implementation evidence and a remediation experiment.

## 8. Joint validated shortlist

_Empty until a second agent challenges the Cursor seed items and evidence satisfies the protocol. Cursor-only items above are `Proposed`, not roadmap commitments._

| ID | Candidate | Evidence required | Owner | Verdict |
|---|---|---|---|---|
| — | — | — | — | — |

## 9. Recommended next 30/60/90 days

### Days 0–30 — prove the loop, not the story

1. Ship CI; restore and verify founder-only stats access; live-test OpenRouter; record source-specific known failures.
2. Manually verify mobile card/landing and GitHub link in incognito, as `DISTRIBUTION` requires.
3. Run 5–10 targeted friend tests. Do not ask for obligatory posts. Capture OS/tool/where stopped/why no share.
4. Fix the highest-frequency completion failure, then run one channel at a time: source-specific Reddit/community test, then Show HN when founder can respond.
5. Instrument only privacy-safe minimum: campaign attribution, creation count, card render surfaces, coarse share-intent. Publish/update the privacy explanation for each field.

**Decision gate:** ≥100 non-founder cards plus observed unprompted shares. If not, stop adding features; isolate whether the failure is reach, CLI completion, trust, or weak share motivation.

### Days 31–60 — build only from observed behavior

1. If Gate 0 passes, harden tests around the sources actually used and add failure/error monitoring.
2. Test source-specific onboarding and a provenance explanation; choose by completion/support outcomes.
3. Run GitHub badge/maintainer pilots with tracked, respectful campaigns. Avoid broad spam and duplicated launches.
4. Define deletion/abuse handling and retention language before more public attention.
5. Prototype local delta only if first creators say they would re-run it; retain immutable old card semantics.

**Decision gate:** ≥20% first-card cohort makes a second card in 30 days, or qualitative evidence explains why a different recurrence mechanism wins.

### Days 61–90 — choose scale vector deliberately

1. Double down on the one or two channels with measured card creation, not impressions.
2. Add milestones/deltas as real share moments if return evidence supports them; defer percentiles until enough snapshots make them statistically honest.
3. Establish recurring partner/community content only where it adds practical value (new source support, transparent usage learnings, creator stories with consent).
4. Reassess the 10k target: project from measured qualified reach × completion, identify required partner/channel capacity, and publish a revised forecast with ranges.
5. Do **not** start atlas, profiles, accounts, payments or “verified AI fluency” unless the stated phase gates and trust requirements are met.

### Harsh conclusion

The product is technically credible for an early validation launch, but 10k users is not a feature backlog away. The current business has a good card, not yet a proven acquisition loop; it lacks reliable funnel telemetry, demonstrated external conversion, and a return reason. The fastest path is to make the existing CLI trustworthy and measurable, learn from small qualified cohorts, then earn distribution—rather than treating map, LinkedIn tooling or visual polish as a growth engine.
