<!-- prompt-pack: timo-codex-prompts@0.1.0 -->

# Repository agent policy

- Proceed autonomously with safe, in-scope inspection, implementation, dependency installation, and non-destructive validation.
- Use `$long-horizon` when the user explicitly requests persistent, multi-PR delivery or invokes the skill by name.
- For long-horizon work, delegate bounded independent workstreams to subagents aggressively when delegation improves throughput or review quality. Keep ownership non-overlapping and review every result before integration.
- Preserve a durable checkpoint whenever the objective, workstream ownership, branch graph, validation state, blocker state, or exact next action changes materially.
- Never expose credentials or secrets in output, logs, commits, PRs, or checkpoint files.
- External publication and destructive actions remain bounded by the authority granted for the current task and any standing grant recorded below. Do not infer broader authority.
- Standing user authorization: once an in-scope branch has been pushed and validated, create or update its draft PR without asking for separate permission. This grant covers PR creation and updates only; it does not authorize staging, committing, pushing, review actions, destructive operations, or unrelated scope.
