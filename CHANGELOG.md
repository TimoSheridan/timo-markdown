# Prompt pack changelog

This project follows Semantic Versioning for prompt behavior:

- **MAJOR**: incompatible changes to authorization, safety, completion, or required workflow behavior.
- **MINOR**: backward-compatible capabilities, workflows, or supported task modes.
- **PATCH**: clarifications and corrections that preserve intended behavior.

Release tags use `prompts-vX.Y.Z`.

## 0.1.0 - 2026-08-20

- Add the initial repository-level agent policy.
- Record standing authorization to create and update draft PRs without repeated confirmation while preserving separate Git and review-action boundaries.
- Add the `long-horizon` skill for persistent multi-agent, multi-PR delivery.
- Add a versioned prompt-pack manifest and skill discovery metadata.
