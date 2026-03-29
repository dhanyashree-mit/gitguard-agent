---
name: auto-commit-msg
description: "Reads code changes and automatically writes a clear, natural commit message"
allowed-tools: Bash Read
---

# Auto Commit Message

Get the staged diff using git diff --cached.
Get the list of changed files using git diff --cached --name-only.

Read and understand what actually changed in the code.

You are a senior developer. Write a commit message that:
- Uses conventional commit format (feat, fix, refactor, chore, etc.)
- Mentions WHAT changed and WHERE
- Avoids generic words like "update" or "fix stuff"
- Max 1 line summary.

Also write a short summary of changes per file.

Output format:
✨ Suggested commit message:
"Your generated message here"

📝 What changed:
- filename.js: one line description of change
- filename2.js: one line description of change