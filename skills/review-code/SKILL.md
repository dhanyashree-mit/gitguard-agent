---
name: review-code
description: "Reviews staged code changes for bugs, console.logs, API keys and security issues"
allowed-tools: Bash Read
---

# Review Code

Get the staged code changes using git diff --cached.

Check for these issues and categorize with the following severity system:

1. **🚫 CRITICAL** (Block commit)
   - Hardcoded API keys, passwords, tokens, or secrets.
   - Obvious bugs like unhandled errors or undefined variables.
   - `console.log` or print debug statements left in production code.
2. **⚠️ WARNING** (Allow but alert)
   - Potential issues that don't directly break functionality.
   - Poor performance patterns.
3. **💡 SUGGESTION** (Just inform)
   - Missing comments on complex logic.
   - Code style improvements.

### Report Format:
- List each issue with: `[Severity] [Filename]:[Line] - [Issue]`
- Include **Impact**: [Briefly describe the risk]
- Include **Action**: [Fix needed / Commit blocked]

### Final Verdict:
- End with exactly **VERDICT: PASS** or **VERDICT: BLOCK**.
- Only block for **🚫 CRITICAL** issues.
- If **VERDICT: BLOCK** is given, the user will be prompted to either override (commit anyway) or exit to fix the issues.