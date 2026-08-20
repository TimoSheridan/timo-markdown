---
name: long-horizon
description: Run substantial engineering objectives persistently through multiple substantive pull requests, using parallel subagents for independent workstreams. Use when the user explicitly requests long-running, multi-PR delivery; do not use for atomic fixes, ordinary single-PR work, or planning-only requests.
---

# Long-horizon delivery

## Establish the contract

- Treat invocation of this skill as an explicit request to create and follow a durable goal for the stated objective.
- Define observable acceptance criteria and a graph of reviewable change sets before implementation. Fix the intended PR count at two or a higher user-requested number.
- Confirm that the current task grants the necessary, repository-scoped authority for staging, committing, pushing, creating that number of draft PRs, and updating their named branches for validation or CI fixes. Honor standing grants recorded in applicable `AGENTS.md` files and do not reconfirm covered actions. Ask once for a bounded bundle of only the missing authority; this skill does not expand it.
- Continue making useful in-scope progress through recoverable failures. Do not end the run after planning, after one workstream, or after the first PR.

## Deliver multiple meaningful PRs

- Continue until the requested outcome is complete and at least two substantive draft PRs are open and ready for review. Ready means local validation is complete, the diff and description are reviewable, and no avoidable failure is known; remote checks may still be running but must be monitored.
- Give each PR one coherent purpose, an accurate description, proportionate validation evidence, and reviewer guidance.
- Prefer independent PRs. Use stacked PRs only when a real dependency requires them, and document the dependency and review order.
- Never split mechanical fragments, tests from the behavior they protect, or arbitrary files merely to increase the PR count.
- If the objective is genuinely atomic, do not manufacture a second PR. Treat the mismatch as a required user choice: expand the useful scope or explicitly accept a single PR.
- Publish PRs one at a time and verify remote state before attempting another. Never blindly retry uncertain external writes.

## Delegate aggressively and deliberately

- Keep available agent capacity busy with bounded, independent work whenever doing so improves speed or confidence.
- Good delegation targets include repository analysis, implementation slices, tests, documentation, visual validation, and adversarial review.
- Give every subagent a concrete deliverable, acceptance criteria, relevant repository instructions, and non-overlapping ownership.
- Use separate branches or worktrees for parallel implementation. Do not allow concurrent edits to the same files or shared working tree.
- Retain integration ownership. Inspect diffs and independently verify subagent results; a completion report is not proof.
- Reassign failed or stalled work when a safe alternative exists. Do not delegate merely to maximize agent count.

## Checkpoint and resume

Maintain a durable checkpoint after planning, after each workstream, before context compaction, and whenever branch or PR state changes. Use the active goal state as the canonical checkpoint when available. If a file is needed, use `SESSION_CONTEXT.md` in the workspace root and keep it out of commits unless the user asks to version it. Record:

- objective and acceptance criteria;
- workstream and PR dependency graph;
- agent ownership and status;
- branches, worktrees, commits, and PR URLs;
- validation completed and outstanding;
- decisions, blockers, and the exact next action.

Resume from the checkpoint instead of rediscovering completed work.

## Validate and review

For every PR:

- run focused checks during development and proportionate full validation before review;
- include tests with the behavior they protect;
- inspect the final diff for accidental changes, secrets, generated artifacts, and scope creep;
- include screenshots or browser comparisons when presentation is relevant;
- inspect remote checks after publication and fix actionable in-scope failures on the existing PR.

## Stop only at a terminal condition

Stop when one of these conditions is true:

1. The objective is complete and at least two meaningful, validated draft PRs are open and ready for review.
2. A required permission, credential, material user decision, or external dependency prevents further useful in-scope progress after safe alternatives are exhausted.
3. Continuing would be unsafe or materially outside the requested scope.

When blocked or interrupted, checkpoint completed work, validation, blockers, PR dependencies, and the exact next action. Difficulty, context length, a failed subagent, or completion of only one PR is not a stopping condition.
