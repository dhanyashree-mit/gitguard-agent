---
name: warn-risky-ops
description: "Detects and warns about risky git push operations before they execute"
allowed-tools: Bash Read
---

# Warn Risky Operations

Check the current branch name using git branch --show-current.
Check the push command being executed.

Look for these risks:

1. 🔴 Critical: force push detected (--force or -f flag)
   - This is the ONLY reason to BLOCK
   - Force pushing overwrites history permanently

2. 🟡 Warning: pushing more than 20 files at once
   - Large pushes are hard to review
   - Suggest breaking into smaller commits
   - Do NOT block for this — just warn

3. 🟢 Tip: branch name has no prefix like feature/ fix/ chore/
   - Just inform, never block for this

Important rules:
- Normal push to main → ALWAYS PASS, this is fine
- ONLY block if force push is detected
- Keep response under 5 lines

For each risk found:
- Explain what could go wrong in one line
- Suggest safer alternative in one line
- End with exactly VERDICT: PASS or VERDICT: BLOCK