# Project Worklog

Maintain a concise shared project worklog for human and multi-agent software work. Use when Claude starts, changes, reviews, hands off, resumes, or coordinates work in this repository; when a user asks for collaboration records, task state, handoff notes, project memory, or multi-agent bookkeeping; and whenever edits should be reflected in a persistent project record.

## Primary File

- Worklog: `work_doc/agent_worklog.md`

If the repository already has an equivalent collaboration log, use that file instead and mention the path.

## Workflow

1. At the start of a task, read the latest entries in the primary worklog if it exists.
2. Preserve existing user or agent entries. Do not rewrite history unless the user explicitly asks.
3. Before finishing any code, config, documentation, or build-system change, append a short entry to the worklog.
4. Keep each entry factual and compact: intent, files touched, verification, decisions, blockers, and exact next step.
5. Use absolute dates with local timezone if known. Avoid vague dates like "today" or "yesterday".
6. If multiple agents are working, state ownership boundaries and avoid claiming work performed by another agent.
7. If no file changes were made, still append an entry when the task produced a decision, analysis result, or handoff state.

## Entry Format

Append entries newest-last using this structure:

```markdown
## YYYY-MM-DD HH:MM TZ - <actor>

- Context: <why this entry exists>
- Changes: <files or areas changed; use "none" if analysis only>
- Verification: <commands, build/test result, or "not run: reason">
- Decisions: <important assumptions or confirmed facts>
- Next: <single most useful next action>
```

Use `Claude` as the actor unless the user gives a more specific agent name.

## Quality Rules

- Keep one entry under about 12 lines unless a failure needs exact details.
- Prefer links or paths over prose summaries of large diffs.
- Record blockers explicitly, especially missing hardware pins, unavailable tools, failed builds, or unverified timing.
- For hardware/firmware work, include the board target and build command when relevant.
- For multi-agent work, record which files or subsystem each agent owns.
- Do not store secrets, private keys, tokens, serial numbers, or personal data in the worklog.

## Final Response Checklist

Before responding to the user:

- Confirm the worklog was updated, or state why it was not.
- Mention any verification that was not possible.
- Identify the next concrete milestone when the project is staged.
