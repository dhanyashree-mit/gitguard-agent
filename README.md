# 🛡️ GitGuard Agent

> An AI-powered Git assistant that lives inside your repository — reviewing code, writing commit messages, and blocking risky operations automatically.

![gitagent](https://img.shields.io/badge/gitagent-0.1.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![model](https://img.shields.io/badge/model-llama--3.3--70b--versatile-orange)
![platform](https://img.shields.io/badge/platform-Windows%20%7C%20Mac%20%7C%20Linux-lightgrey)

---

## 🤔 What is GitGuard?

GitGuard is a **gitagent-standard AI agent** that hooks directly into your Git workflow. Every time you commit or push, GitGuard automatically:

- 🔍 **Reviews your code** for bugs, secrets, and security issues
- ✨ **Writes your commit message** based on what actually changed
- 🛡️ **Warns you** before risky operations like force pushes reach your repo

No extra commands. No extra steps. Just `git commit` and `git push` — GitGuard does the rest.

---

## 🎬 Demo

### Skill 1 — Code Review catches a hardcoded password:
```
🛡️  GitGuard is checking your code...

🔍 Skill 1: Code Review...

📌 Change detected:
badcode.js has been added with a hardcoded password variable.

🚫 CRITICAL badcode.js:1 - Hardcoded password 'supersecret123' detected
Impact: Credential exposure if pushed to public repository
Action: Use environment variables instead

VERDICT: BLOCK

🚫 Commit cancelled. Please fix the issues above.
```

### Skill 2 — Auto writes your commit message:
```
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
```
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

*Note for Mac/Linux: You may need to make the hooks executable:*
```bash
chmod +x .git/hooks/*
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

If Critical issues are found → commit is **BLOCKED** unless you choose to override.

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
| Agent Standard | [gitagent](https://github.com/open-gitagent/gitagent) |
| Runtime | [gitclaw](https://github.com/open-gitagent/gitclaw) |
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

- [gitagent standard](https://github.com/open-gitagent/gitagent) — Agent definition format
- [Groq](https://groq.com) — Fast AI inference
- [Llama 3.3 70B Versatile](https://groq.com) — The AI model powering GitGuard

---

## 📄 License

MIT © Dhanyashree

---

> *"I live inside your repository and watch every commit and push — giving you instant feedback before mistakes reach production."*
> — GitGuard 🛡️
(https://groq.com) — Free, fast AI inference
- [Llama 3.3 70B](https://groq.com) — The AI model powering GitGuard

---

## 📄 License

MIT © Dhanyashree

---

> *"I live inside your repository and watch every commit and push — giving you instant feedback before mistakes reach production."*
> — GitGuard 🛡️

