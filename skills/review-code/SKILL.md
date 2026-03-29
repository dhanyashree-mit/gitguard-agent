---
name: review-code
description: "Reviews staged code changes for bugs, console.logs, API keys and security issues"
allowed-tools: Bash Read
---

# Review Code

Get the staged code changes using git diff --cached.

Check for these issues:
1. 🔴 Critical: hardcoded API keys, passwords, tokens, secrets
2. 🔴 Critical: obvious bugs like unhandled errors, undefined variables
3. 🟡 Warning: console.log or print debug statements left in code
4. 🟡 Warning: empty catch blocks that swallow errors
5. 🟢 Tip: missing comments on complex logic

Output a clean report:
- List each issue with filename and line number
- Show severity level for each issue
- End with VERDICT: PASS ✅ or VERDICT: BLOCK 🚫
- Only block for Critical issues