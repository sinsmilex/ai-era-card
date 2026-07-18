export default function Privacy() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "80px 24px",
        lineHeight: 1.6,
      }}
    >
      <h1>The privacy contract</h1>
      <p style={{ color: "#c9d1d9" }}>
        The CLI parses your usage logs <b>on your machine</b>. What gets
        uploaded is exactly one JSON document, validated against a public
        schema, containing only:
      </p>
      <ul style={{ color: "#c9d1d9" }}>
        <li>token counts (input / output / cache)</li>
        <li>estimated or reported cost totals</li>
        <li>session, project and request <i>counts</i> (numbers, not names)</li>
        <li>active-day counts, streaks, first/last activity dates</li>
        <li>canonical model ids (e.g. <code>claude-opus-4-8</code>)</li>
        <li>an optional display name you type yourself</li>
      </ul>
      <p style={{ color: "#c9d1d9" }}>
        The schema cannot represent prompts, code, file paths, project names,
        or timestamps finer than a calendar date. The CLI shows you the full
        payload and asks for confirmation before uploading; <code>--dry-run</code>{" "}
        never uploads at all. Your IP is not stored — only a salted daily hash
        used for rate limiting. A Cursor session token, when used, is read
        locally and sent only to <code>cursor.com</code> — never to our API.
      </p>
      <p style={{ color: "#8b949e" }}>
        Cards are self-reported statistics, like any year-in-review.
      </p>
    </main>
  );
}
