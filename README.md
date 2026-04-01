# 🛡️ GitGuard Agent

> An AI-powered Git assistant that lives inside your repository — reviewing code, writing commit messages, and blocking risky operations automatically.

[![gitagent](https://img.shields.io/badge/gitagent-0.1.0-blue)](https://gitagent.sh)
[![model](https://img.shields.io/badge/model-llama--3.3--70b--versatile-orange)](https://groq.com)


---

## 🤔 What is GitGuard?

GitGuard is a **gitagent-standard AI agent** that hooks directly into your Git workflow. Every time you commit or push, GitGuard automatically:

- 🔍 **Reviews your code** for bugs, secrets, and security issues
- ✨ **Interactive Auto-Fix**: Previews and applies code fixes directly in your editor
- ✍️ **Writes your commit message** based on what actually changed
- 🛡️ **Warns you** before risky operations like force pushes reach your repo
- 🧠 **Smart Block**: Automatically clears commit blocks once you fix critical issues

No extra commands. No extra steps. Just `git commit` and `git push` — GitGuard does the rest.

---

## 🎬 Demo
[**Watch the Demo Video**](https://youtu.be/09re78W3DK0)

### Skill 1 — Code Review & Interactive Auto-Fix:
```bash
$ git commit

🛡️  GitGuard is checking your code...

Issue Review:
🚫 badcode.js:1 - Hardcoded password 'supersecret123' detected
Impact: Credential exposure if pushed to public repository
Action: Use environment variables instead

💡 AI Suggestion for badcode.js:1
Issue: Hardcoded password detected
Fix:   Use process.env.API_PASSWORD instead.

✨ Generating fix for badcode.js...
📄 Markers injected: Check badcode.js in your editor.

Apply this fix? (y/N): y
✅ Fix applied and re-staged.

✨ All fixes applied. Proceeding...
```
> [!TIP]
> **Smart Block**: Notice how the "Critical issues" override prompt is skipped because you already fixed them!

### Skill 2 — Auto writes your commit message:
```bash
$ git commit

✨ Skill 2: Commit Message...

✨ Suggested commit message:
"feat(auth): add email validation for user registration"

📝 What changed:
- auth.js: added email format validation using regex
- utils.js: added helper function for input sanitization

👉 Use this commit message? (Y/n): y

✅ Using AI message: "feat(auth): add email validation for user registration"
```

### Skill 3 — Blocks a force push:
```bash
$ git commit --amend -m "Changes "
$ git push --force

🛡️  GitGuard is checking your push...

📍 Branch: main
📁 Files:  3

🛰️ Skill 3: Risk Analysis...

🔴 Critical: Force push detected to main branch!
This will overwrite existing commits permanently.
Safer alternative: git push origin feature/your-branch

VERDICT: BLOCK

⚠️  Risky operation detected! Push anyway? (y/N): n

🚫 Push cancelled. Stay safe! 🛡️
```

---

## 🧩 Agent Structure (gitagent standard)

```
gitguard-agent/
├── agent.yaml                  ← Agent identity & skills manifest
├── SOUL.md                     ← Agent personality & values
├── RULES.md                    ← Hard boundaries & behaviors
├── skills/
│   ├── review-code/
│   │   └── SKILL.md            ← Code review capability
│   ├── auto-commit-msg/
│   │   └── SKILL.md            ← Commit message generation
│   └── warn-risky-ops/
│       └── SKILL.md            ← Risky operation detection
├── hooks/
│   ├── pre-commit              ← Triggers Skill 1
│   ├── prepare-commit-msg      ← Triggers Skill 2
│   └── pre-push                ← Triggers Skill 3
├── scripts/
│   ├── gitguard.js             ← Main agent runtime
│   └── setup.js                ← One-command setup script
└── package.json
```

---
## ⚙️ Runtime

GitGuard follows the gitagent standard and is implemented using a custom Node.js runtime for seamless integration with Git hooks.

While gitclaw is included as a dependency, GitGuard directly executes its skills through Git hooks (`pre-commit`, `prepare-commit-msg`, `pre-push`) for real-time interaction inside the developer workflow.

The architecture remains fully compatible with gitclaw and can be adapted to run using the gitclaw SDK.

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Git
- Free [Groq API key](https://console.groq.com)

### Installation

**Step 1 — Clone the repo:**
```bash
git clone https://github.com/dhanyashree-mit/gitguard-agent.git
cd gitguard-agent
```

**Step 2 — Install dependencies:**
```bash
npm install
```

**Step 3 — Set your Groq API key:**

**Windows (PowerShell/CMD):**
```bash
setx GROQ_API_KEY "your-groq-api-key-here"
# Note: Restart your terminal/IDE for this to take effect!
```

**Mac/Linux:**
```bash
export GROQ_API_KEY="your-groq-api-key-here"
# Tip: Add this line to your ~/.zshrc or ~/.bashrc to make it permanent.
```
> Get your free API key at [console.groq.com](https://console.groq.com)

**Step 4 — Run setup:**
```bash
npm run setup
```

**That's it! GitGuard is now protecting your repository. 🎉**

---

## 🔍 How Each Skill Works

### Skill 1 — Review Code (`pre-commit`)
Runs automatically when you type `git commit`.

Checks for:
- 🚫 **Critical:** Hardcoded API keys, passwords, tokens
- 🚫 **Critical:** Obvious bugs — undefined variables, unhandled errors
- ⚠️ **Warning:** Safety check bypasses
- 💡 **Suggestion:** Code style improvements

If Critical issues are found → GitGuard identifies the line and offers an **Interactive Auto-Fix**.

#### ✨ Interactive Auto-Fix
- **Pattern Match**: Instantly removes `console.log` and `debugger`.
- **AI-Powered**: Uses Llama 3.3 to refactor logic bugs (e.g., constant reassignment).
- **In-File Markers**: Injects `<<<<<<< HEAD` and `>>>>>>> SUGGESTION` markers directly into your file for a red/green preview in your editor.
- **Smart Block**: Once you apply the suggested fixes, GitGuard automatically clears the "BLOCK" verdict, letting you proceed with the commit seamlessly.

---

### Skill 2 — Auto Commit Message (`prepare-commit-msg`)
Runs automatically after code review passes.

- Reads your actual code changes
- Writes a professional commit message using **conventional commits format**
- Shows you the suggested message
- You press **Y** to use it or **N** to write your own

Example output:
```
"feat(api): add rate limiting to user authentication endpoint"
"fix(db): handle null response from connection pool"
"refactor(hooks): simplify pre-commit validation logic"
```

---

### Skill 3 — Warn Risky Operations (`pre-push`)
Runs automatically when you type `git push`.

Detects:
- 🔴 **Force push** to protected branches (main/master) → **BLOCKED**
- 🟡 **20+ files** pushed at once → **Warning** (not blocked)
- 🟢 **Branch naming** suggestions → **Tip** (not blocked)

Uses `git merge-base` to detect history overwrites reliably even without the `--force` flag.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Agent Standard | [gitagent](https://gitagent.sh) |
| Runtime | Custom Node.js (Git hooks), gitclaw-compatible |
| AI Model | Llama 3.3 70B Versatile via [Groq](https://groq.com) |
| Trigger Mechanism | Git Hooks (`pre-commit`, `prepare-commit-msg`, `pre-push`) |
| Language | Node.js |

---

## 🏃 Usage

Once set up, just use Git normally:

```bash
# Make changes to your code
git add .

# GitGuard automatically reviews + writes commit message
git commit

# GitGuard automatically checks for risky operations
git push
```

### Override GitGuard (use sparingly!):
```bash
git commit --no-verify   # Skip hooks for this commit
git push --no-verify     # Skip hooks for this push
```

---

## 🤝 Built With

- [gitagent standard](https://gitagent.sh) — Agent definition format
- [Groq](https://groq.com) — Fast AI inference
- [Llama 3.3 70B Versatile](https://groq.com) — The AI model powering GitGuard

---

## 📄 License

MIT © Dhanyashree

---

> *"I live inside your repository and watch every commit and push — giving you instant feedback before mistakes reach production."*
> — GitGuard 🛡️
