---
name: review-code
description: "Reviews staged code changes for bugs, console.logs, API keys and security issues"
allowed-tools: Bash Read
---

# Review Code

Get the staged code changes using git diff --cached.

### Code Review Steps:

1. **DIFF Awareness**: Start your report with a section titled "📌 Change detected:".
   - List modified files.
   - Highlight specific logic changes (e.g., "Added flag: --no-verify", "Removed authentication check", "Modified API endpoint").
   - Be concise but specific about WHAT actually changed in the code logic.

2. **Issue Categorization**: Check for these issues with the following severity system:

1. **🚫 CRITICAL** (Block commit)
   - Hardcoded API keys, passwords, tokens, or secrets.
   - Obvious bugs like unhandled errors or undefined variables.
   - `console.log` or print debug statements in production-level application code (NOT terminal scripts like `scripts/gitguard.js` where `console.log` is the UI).
2. **⚠️ WARNING** (Allow but alert)
   - Potential issues that don't directly break functionality.
   - Bypassing safety checks (e.g., using --no-verify).
   - Poor performance patterns.
3. **💡 SUGGESTION** (Just inform)
   - Missing comments on complex logic.
   - Code style improvements.

### Report Format:
- Start with the `📌 Change detected:` block.
- List each issue with: `[Severity] [Filename]:[Line] - [Issue]`
- Include **Impact**: [Briefly describe the risk]
- Include **Action**: [Fix needed / Commit blocked]

### Final Verdict:
- End with exactly **VERDICT: PASS** or **VERDICT: BLOCK**.
- Only block for **🚫 CRITICAL** issues.
- If **VERDICT: BLOCK** is given, the user will be prompted to either override (commit anyway) or exit to fix the issues.