# Distribution playbook — Gate 0

Практический план для основателя без собственной аудитории. Цель Gate 0 не
«собрать охваты», а проверить петлю: незнакомый разработчик создаёт свою
карточку и добровольно ею делится. Голос во всех публичных постах — спокойный,
инженерный и проверяемый: это self-reported usage card, а не рейтинг,
сертификация или точное измерение расходов.

Публичные посты ниже написаны на английском: основная аудитория Show HN,
Reddit и X находится там.

## Status — 2026-07-23

- ✅ Локальный пакет уже имеет версию `aieracard@0.1.4` и успешно собирается.
- ✅ Landing и обе example-карточки отвечают с `200`:
  `https://ai-era-card.vercel.app/`,
  `/s/8xaovhQME9` и `/s/mmi5GrqvJt`.
- ✅ `aieracard@0.1.4` опубликован в npm и доступен через `npm view
  aieracard version`.
- ✅ Реальные Windows dry-run'ы на данных основателя прошли для Claude Code,
  Cursor API, их комбинации и отдельного Cursor CSV fallback. Экспорт CSV
  обработан напрямую: 169.6M токенов, 368 запросов, $0; предупреждений парсера
  нет. Напечатанный upload JSON содержит только агрегаты.
- ✅ Свежая полная founder-карточка создана опубликованным
  `aieracard@0.1.4`: https://ai-era-card.vercel.app/s/WvGKItZ0gW
  (Claude Code + Cursor; 1.6B tokens, ранг `L4 · TOWER`). Страница и
  `/opengraph-image` отвечают с `200`.
- [x] Отдельно проверить Cursor CSV fallback с настоящим экспортом CSV:
  опубликованный `aieracard@0.1.4` с `--cursor-csv` обработал CSV напрямую,
  без Cursor API.
- ⚠️ `GET /api/stats` без Bearer-секрета возвращает `401`. В Vercel есть
  `SNAPSHOT_IP_SALT`, но проверка с его production-значением тоже вернула
  `401`; baseline пока не записан. Основателю нужно подтвердить, что текущий
  production deployment видит переменную (или задать `STATS_SECRET` и
  redeploy), не раскрывая значение секрета.

**Следующие действия основателя:** устранить доступ к stats и записать
начальные значения, затем лично отправить готовый DM 5–10 подходящим
знакомым разработчикам. Не переходить к публичным постам до этих шагов.

## До первого поста

- [x] Убедиться, что в npm опубликован именно `aieracard@0.1.4`, а
  `npx aieracard --version` с чистой машины показывает 0.1.4. Большие посты
  не публиковать до этого.
- [x] Прогнать `npx aieracard@0.1.4 --dry-run` на Windows: Claude Code,
  Cursor API и их комбинацию. CLI показывает агрегированный JSON до загрузки;
  в JSON нет содержимого, путей или имён проектов.
- [x] Проверить отдельный Cursor CSV fallback с настоящим экспортом CSV.
- [x] Создать свежую полную founder-карточку:
  https://ai-era-card.vercel.app/s/WvGKItZ0gW (Claude Code + Cursor).
  Page и OG image проверены с `200`; metadata: `L4 · TOWER · 1.6B tokens`.
- [ ] Открыть свежую founder-карточку в инкогнито и вручную проверить
  мобильный вид и ссылку на GitHub.
- [ ] Открыть landing page как новый пользователь: за 30 секунд должно быть
  понятно, что запускать, какие источники поддерживаются, какие данные
  остаются локальными и что URL постоянный.
- [ ] Подготовить одно предложение: “AI Era Card turns your local AI coding
  usage into a self-reported, permanent share card; it shows the aggregate
  payload before upload.”
- [ ] **Blocked:** настроить production-доступ к `/api/stats` и записать
  начальные значения: `totalCards`, последние slugs и referer hosts.
  `SNAPSHOT_IP_SALT` есть в Vercel, но текущий endpoint вернул `401` и с
  этим Bearer-значением. Не публиковать секрет авторизации и не вставлять его
  в скриншоты.

## Последовательность с нуля

### День 0 — закрытый soft launch

Написать лично 5–10 знакомым разработчикам, которые действительно пользуются
Claude Code, Cursor или Codex. Цель — не попросить лайк, а увидеть полный
путь на чужой машине. Попросить разрешение использовать их обратную связь,
но не просить обязательный публичный пост.

Собрать в один список: OS, источник данных, где остановились, что было
непонятно, создалась ли карточка, захотели ли ею поделиться. Исправить
повторяющуюся проблему до внешнего запуска. Если меньше трёх человек прошли
flow без помощи, не переходить к HN.

### Дни 1–2 — X и полезные ответы

Опубликовать один основательский пост с карточкой. Затем в течение пары дней
искать реальные разговоры о `ccusage`, Claude Code usage, Cursor usage или
«how many tokens» и оставлять только релевантные ответы с контекстом. Не
вставлять ссылку в каждый ответ. Отвечать на вопросы, особенно про
приватность, источники и точность стоимости.

### Дни 3–5 — один Reddit-сабреддит за раз

Сначала выбрать наиболее подходящий сабреддит по текущему обсуждению:
`r/ClaudeAI` для Claude Code, `r/cursor` для Cursor, `r/ChatGPTCoding` для
Codex/AI coding. Проверить rules и последние модераторские решения в каждом
непосредственно перед публикацией. Публиковать максимум в одном сообществе
за раз; следующий — только после того, как ясны комментарии и трение первого.

### Дни 6–8 — Show HN

Публиковать Show HN только когда 0.1.4 доступна, landing и CLI пережили soft
launch, а основатель может быть онлайн в день поста. Это технический запуск,
а не пресс-релиз: честно описать ограничения и отвечать на критические
вопросы. Не просить друзей голосовать.

### Неделя 2 — GitHub и осторожные сообщества

Добавить badge/пример карточки в README, выпустить нормальный GitHub Release
для 0.1.4 и, если вопросы уже повторяются, открыть GitHub Discussion с FAQ.
Затем можно попробовать 1–2 Discord-сообщества, где разрешено показать
готовый developer tool. LinkedIn — последним и только как необязательный
личный пост, а не как канал, от которого зависит запуск.

После каждого канала подождать хотя бы сутки, посмотреть конверсию и
комментарии, поправить трение или формулировку. Не запускать все каналы
одновременно: иначе нельзя понять, откуда пришли реальные создания карточек.

## Каналы: как действовать

### 1. Friends / личные DM — день 0

**Где и как.** Личные сообщения знакомым разработчикам в Telegram, Discord,
Slack или iMessage. Отбирать людей, у которых есть поддерживаемый tool; не
создавать массовую рассылку и не добавлять людей в группы ради запуска.

**Этикет.** Сообщение персональное, короткое, с явным правом отказаться.
Просить пройти flow и рассказать, где было непонятно. Публичный share — лишь
опциональный второй шаг после удачного опыта.

**Текст для копирования (English).**

> Hey — I’m testing a small CLI called AI Era Card. It reads your local AI
> coding usage and shows the aggregate payload before creating a permanent,
> self-reported share card. Would you be up for trying `npx aieracard` and
> telling me where the flow is confusing? No need to post it publicly. You
> can use `--dry-run` to inspect it without uploading anything.

**Успех.** 5–10 честных попыток, 3+ завершённых карточки, конкретные
сообщения о трении и хотя бы один добровольный share. Лайки и комплименты без
прогона CLI не считаются сигналом.

### 2. X / Twitter — дни 1–2

**Где и как.** Личный аккаунт основателя; один пост с настоящей свежей
карточкой. Допустим короткий follow-up с privacy details, если вопрос
возникает в ответах. Пинить пост не обязательно.

**Этикет.** Не tag-ать крупных авторов ради охвата, не писать «viral»,
«the first» или «the definitive AI usage tracker». Не приписывать точность
там, где данные self-reported или стоимость оценочная. Не просить взаимные
лайки/репосты.

**Текст для копирования (English).**

> I built a small CLI for turning local AI coding usage into a permanent
> share card.
>
> `npx aieracard`
>
> It parses supported local usage data, shows the exact aggregate payload
> before upload, and creates a self-reported card with an OG preview.
>
> My latest card: [PASTE_LATEST_FULL_CARD_URL]
>
> Prompts, code, file paths, and project names are not part of the upload
> schema. `--dry-run` does not upload anything.
>
> Source: https://github.com/sinsmilex/ai-era-card

**Успех.** Несколько осмысленных ответов от AI-coding пользователей,
переходы с `x.com`/`twitter.com` в `/api/stats`, и новые non-founder slugs.
Нулевые replies при показах — повод улучшить первый абзац или сам card flow,
а не повторять пост.

### 3. Reddit — дни 3–5

**Где и как.** Начать с одного из `r/ClaudeAI`, `r/cursor` или
`r/ChatGPTCoding`. Перед публикацией прочитать правила sidebar, pinned posts,
правила self-promotion и поискать, требуют ли одобрения модератора. Если
правила неясны — написать mods заранее или не публиковать.

**Этикет.** Делать пост как build log с конкретной технической/приватностной
деталью, а не как рекламный анонс. Честно обозначить себя автором и отвечать
на скептические вопросы. Не cross-post-ить одинаковый текст в один день, не
создавать новые аккаунты, не голосовать своими альтами и не спорить с
модерацией.

**Текст для копирования (English).**

**Title:** I built a CLI that turns local AI coding usage into a share card

> I kept seeing people share terminal screenshots of their usage, so I made
> a small open-source alternative: `npx aieracard`.
>
> It reads supported local usage data, shows the exact aggregate JSON before
> upload, then creates a permanent self-reported card. The upload schema
> cannot contain prompts, code, file paths, or project names. `--dry-run`
> lets you inspect the result without uploading.
>
> My latest full card: [PASTE_LATEST_FULL_CARD_URL]
>
> Repo: https://github.com/sinsmilex/ai-era-card
>
> I’m the author. I’d especially value reports of where it fails or feels
> unclear on your setup.

**Успех.** Комментарии с реальными setups, первые сторонние карточки и
конструктивные bug reports. Удалённый пост или mod warning — принять, не
репостить, и записать правило для следующего канала.

### 4. Show HN — дни 6–8

**Где и как.** `news.ycombinator.com/submit` с заголовком, начинающимся
`Show HN:`. Публиковать в начале активного окна для североамериканской
аудитории, только если основатель может отвечать в течение дня. Ссылка может
вести на landing или GitHub; в первом комментарии дать и card, и source.

**Этикет.** Следовать HN guidelines: не просить votes, не организовывать
brigading, не делать несколько подач одного и того же запуска. Вынести
технические ограничения прямо в текст: local parsing, aggregate upload,
self-reported card; не делать заявление, будто это официальная статистика
Claude, Cursor или OpenAI.

**Текст для копирования (English).**

**Title:** Show HN: AI Era Card – a permanent share card for AI coding usage

> I built AI Era Card because people were already sharing screenshots of
> local AI coding usage, but those snapshots had no durable link or preview.
>
> `npx aieracard` parses supported local sources, displays the exact
> aggregate payload, and asks before uploading it. The result is a permanent
> self-reported card with an OG image. The schema deliberately has no fields
> for prompts, code, file paths, or project names.
>
> It currently supports Claude Code and Codex local logs, plus Cursor and
> optional OpenRouter data where available. Costs are estimates when a source
> does not provide an authoritative cost.
>
> The project is open source, free, and requires no account:
> https://github.com/sinsmilex/ai-era-card
>
> My latest full card: [PASTE_LATEST_FULL_CARD_URL]
>
> I would value failure reports and privacy questions most; this is an early
> validation of whether a shareable usage snapshot is useful.

**Успех.** Технические вопросы, independent installs/cards и actionable
feedback. Позиция в рейтинге HN сама по себе не является метрикой продукта.

### 5. GitHub — неделя 2

**Где и как.** Обновить root README: короткое объяснение, install command,
privacy note и один founder card/badge как пример. Создать GitHub Release
для `aieracard@0.1.4` с короткими, фактическими notes. Если есть
повторяющиеся вопросы, включить Discussions и открыть одну FAQ-тему; не
создавать пустое сообщество заранее.

**Этикет.** Badge — доказательство работающего артефакта, не рекламный
баннер. Не открывать issues в чужих репозиториях ради ссылки. В ответах
разделять verified bugs, estimates и roadmap ideas.

**Текст для Release / Discussion (English).**

> AI Era Card 0.1.4 is available on npm.
>
> Run `npx aieracard` to inspect aggregate AI coding usage locally before
> optionally creating a permanent, self-reported share card. Use `--dry-run`
> to inspect the payload without upload.
>
> Example card: [PASTE_LATEST_FULL_CARD_URL]
>
> Please report reproducible collector issues with OS, tool, and CLI version;
> never include logs containing personal content.

**Успех.** README installs, GitHub stars/watchers from relevant developers,
useful issues or Discussion questions, and cards whose referer is GitHub.

### 6. Discord — опционально, неделя 2+

**Где и как.** Только каналы, где self-promotion/tool-showcase явно
разрешены: например, официальный showcase/help channel продукта или
небольшое сообщество, участником которого основатель уже является. Сначала
прочитать правила и посмотреть формат последних tool posts.

**Этикет.** Один уместный пост, без массового кросспоста и без DM участникам
сервера. Если администратор попросил удалить — удалить и не спорить.
Прикрепить card preview, но не публиковать скриншоты чужих статистик без
согласия.

**Текст для копирования (English).**

> I made a small open-source CLI for a problem I kept seeing here: sharing a
> local AI-usage snapshot without sharing logs. `npx aieracard` shows the
> aggregate payload first, then can create a permanent self-reported card.
>
> Example: [PASTE_LATEST_FULL_CARD_URL]
> Repo: https://github.com/sinsmilex/ai-era-card
>
> Happy to remove this if tool posts are not appropriate for this channel.

**Успех.** Несколько relevant conversations or installs without moderation
friction. Если канал не даёт ответов, не повторять сообщение.

### 7. LinkedIn — последним и по желанию

**Где и как.** Личный founder post после того, как есть реальные внешние
карточки или feedback. При нулевой аудитории это не основной acquisition
channel; полезнее как спокойный build note для существующих контактов.

**Этикет.** Не превращать пост в «AI revolution» story и не приписывать себе
рост без данных. Не закупать engagement. Один человеческий контекст плюс
card работает лучше, чем длинный продуктовый текст.

**Текст для копирования (English).**

> I’ve been building AI Era Card, a small open-source CLI that turns local
> AI coding usage into a permanent, self-reported share card.
>
> It shows the aggregate payload before upload; prompts, code, file paths,
> and project names are not part of that payload.
>
> My latest example: [PASTE_LATEST_FULL_CARD_URL]
> Try it: `npx aieracard`

**Успех.** Качественные developer introductions or a few relevant trials.
Не оценивать канал по impressions от людей, которые не относятся к целевой
аудитории.

## Чего не делать

- Не spam-ить одинаковой ссылкой в replies, сабреддитах и Discord-серверах.
- Не покупать followers, votes, likes, comments или «launch packages» и не
  просить друзей координировать голосование на HN/Reddit.
- Не создавать альт-аккаунты, не маскировать авторство и не выдавать
  self-reported card за официальные данные провайдера.
- Не обещать «точные расходы», если данные рассчитаны из pricing table, и не
  заявлять поддержку источника, пока реальный dry-run её не подтвердил.
- Не публиковать чужие карточки, usage numbers или screenshots без явного
  согласия.
- Не реагировать на слабый результат копированием того же текста в большее
  число мест. Сначала выяснить: люди не поняли ценность, не доверяют privacy
  или не могут пройти CLI?

## Измерение и рабочий журнал

После каждого поста записывать в простой журнал: дата/время, канал,
permalink, текст/hook, примерный охват, вопросы, bugs и следующий шаг.
Проверять `/api/stats` через 1 час, 24 часа и 72 часа:

- новые `totalCards` и новые slugs показывают, создают ли карточки, а не
  только открывают ссылку;
- referer hosts подсказывают, какой канал привёл визиты;
- руками открыть несколько новых slugs: это полезная проверка, что не
  произошёл технический сбой или очевидный мусор;
- replies и issues классифицировать как privacy concern, install failure,
  collector accuracy, missing source или product request.

Главная метрика Gate 0: non-founder люди создали карточки и хотя бы часть
решила ими поделиться без отдельного уговора. Вторичные показатели (views,
stars, impressions, upvotes) нужны только для выбора следующего
эксперимента.

## Быстрый pitch

**Короткий (English):**

> `npx aieracard` turns supported local AI coding usage into a permanent,
> self-reported share card. It shows the aggregate payload before upload;
> prompts, code, file paths, and project names are not included.

**Развёрнутый Show HN draft (English):**

> Show HN: I made AI Era Card, a small CLI for turning AI coding usage into a
> permanent shareable snapshot.
>
> I built it after seeing people share ccusage and terminal screenshots. A
> screenshot is useful, but it does not have a durable link or a preview
> when you share it. `npx aieracard` reads supported usage data locally,
> displays the exact aggregate payload, and only then asks whether to upload
> it. The resulting card is explicitly self-reported.
>
> Privacy was the main design constraint. The shared schema contains
> aggregate token counts, active days, model identifiers and optional handle;
> it has no fields for prompts, code, file paths or project names. `--dry-run`
> never uploads.
>
> Sources currently include Claude Code and Codex local logs, plus Cursor and
> optional OpenRouter data where available. Some costs are estimates rather
> than provider-authoritative numbers, so the card should be read as a
> personal snapshot, not billing data.
>
> The source is open: https://github.com/sinsmilex/ai-era-card
> My latest full example card: [PASTE_LATEST_FULL_CARD_URL]
>
> I’m testing one question: do developers want to create and share these
> snapshots? I would especially appreciate reproducible failure reports and
> privacy critique.
