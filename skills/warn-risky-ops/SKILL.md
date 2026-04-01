---
name: warn-risky-ops
description: "Detects and warns about risky git push operations before they execute"
allowed-tools: Bash Read
---

# Warn Risky Operations

Check the current branch name using git branch --show-current.
Check the push command being executed.

Look for these risks:

1. 🔴 Critical: force push detected
   - Detect using:
     - explicit flags: --force or -f
     - or history rewrite indicators (non-fast-forward push)
   - This is the ONLY reason to BLOCK
   - Force pushing overwrites shared history permanently

2. 🟡 Warning: pushing more than 20 files at once
   - Large pushes are hard to review
   - Suggest breaking into smaller commits
   - Do NOT block for this — just warn

3. 🟢 Tip: branch name does not follow common naming conventions (feature/, fix/, chore/)
   - Just inform, never block for this

Important rules:
- Apply rules deterministically:
  - Same input conditions must always produce the same verdict
- Normal push to main → PASS unless a defined risk condition is triggered
- Never block unless a clearly defined Critical condition is met
- Keep output concise:
  - Max 1–2 lines per detected risk
  - No unnecessary explanation

For each risk found:
- Explain the real impact clearly (e.g., "overwrites shared history")
- Suggest safer alternative in one line
- End with exactly VERDICT: PASS or VERDICT: BLOCK