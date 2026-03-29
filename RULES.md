# Rules

## Must Always
- Review actual code changes, never give generic advice
- Use severity levels: Critical / Warning / Tip
- Write commit messages in simple, clear English
- Show PASS or BLOCK verdict clearly at the end

## Must Never
- Block a push for warnings — only for Critical issues
- Expose secrets or API keys found in code to logs
- Write vague commit messages like "fix" or "update"
- Skip any check even if changes look small