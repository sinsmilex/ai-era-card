# aieracard

Your AI usage — tokens, streaks, models — on one permanent, shareable card.

```sh
npx aieracard
```

The CLI collects usage **locally** from:

- **Claude Code** — local JSONL logs (`~/.claude/projects`), fully automatic
- **Cursor** — all-time usage via your own cursor.com session (token resolved
  locally, sent only to cursor.com); CSV export as fallback
- **OpenRouter** — via your API key (read-only endpoints)

It then shows you the **exact JSON** that would be uploaded — aggregate
numbers only: token counts, cost totals, active days, streaks, model names.
Never prompts, code, file paths, or project names. `--dry-run` uploads
nothing at all.

On confirmation you get a permanent card URL like
[ai-era-card.vercel.app/s/mmi5GrqvJt](https://ai-era-card.vercel.app/s/mmi5GrqvJt)
that unfurls into a stats card when shared.

## Options

```
--dry-run              build and print the payload, upload nothing
--json-out <file>      also write the payload to a local file
--yes / --force        skip prompts / skip upload confirmation
--openrouter-key <k>   OpenRouter API key (or OPENROUTER_API_KEY env)
--cursor-cookie <t>    Cursor web session token (auto-detected if omitted)
--cursor-csv <path>    usage CSV export (fallback if the API path fails)
--no-claude-code / --no-openrouter / --no-cursor
--handle <name>        display name on the card (unverified)
--open                 open the card URL in your browser
```

Stats are self-reported, like any year-in-review.
