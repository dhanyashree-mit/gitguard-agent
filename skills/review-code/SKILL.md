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
   - Highlight specific logic changes.
   - Be concise but specific about WHAT actually changed in the code logic.

2. **Issue Categorization**: Check for these issues with the following severity system:
   - **🚫 CRITICAL** (Block commit): Hardcoded API keys, passwords, tokens, secrets, or obvious bugs. 
   - **⚠️ WARNING** (Allow but alert): `console.log` usage, safety check bypasses (e.g., --no-verify).
   - **💡 SUGGESTION** (Just inform): Missing comments or style improvements.

3. **Interactive Auto-Fix**: For identified issues, GitGuard will offer an interactive fix preview using **In-File Markers** (`<<<<<<< HEAD` vs `>>>>>>> SUGGESTION`).
   - If the user accepts a fix for a **🚫 CRITICAL** issue, it is marked as resolved.

### Report Format:
- Start with the `📌 Change detected:` block.
- List each issue with: `[Severity] [Filename]:[Line] - [Issue]`
- Include **Impact**: [Briefly describe the risk]
- Include **Action**: [Fix needed / Commit blocked]

### Final Verdict:
- End with exactly **VERDICT: PASS** or **VERDICT: BLOCK**.
- Only block for **🚫 CRITICAL** issues.
- **Smart Override**: If the user fixes all critical issues via the interactive prompt, the commit will proceed automatically.