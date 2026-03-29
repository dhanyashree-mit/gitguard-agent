---
name: warn-risky-ops
description: "Detects and warns about risky git push operations before they execute"
allowed-tools: Bash Read
---

# Warn Risky Operations

Check the current branch name using git branch --show-current.
Check the push command being executed.

Look for these risks:
1. 🔴 Critical: force push (--force or -f flag detected)
2. 🔴 Critical: pushing directly to main or master branch
3. 🟡 Warning: pushing more than 20 files at once
4. 🟡 Warning: branch name has no prefix like feature/ fix/ chore/

For each risk found:
- Explain exactly what could go wrong in simple words
- Suggest the safer alternative command
- End with VERDICT: PASS ✅ or VERDICT: BLOCK 🚫