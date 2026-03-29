const { execSync, spawnSync } = require("child_process");
const fs = require("fs");

const mode = process.argv[2];

async function callGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return "";
  }
}

function askUser(question) {
  process.stderr.write(question);
  
  try {
    const fd = fs.openSync("\\\\.\\CON", "r");
    const buffer = Buffer.alloc(1024);
    const bytesRead = fs.readSync(fd, buffer, 0, 1024);
    fs.closeSync(fd);
    
    return buffer.toString("utf8", 0, bytesRead).trim() || "y";
  } catch (e) {
    return "y";
  }
}

async function commitFlow() {
  try {
    const diff = run("git diff --cached");
    const files = run("git diff --cached --name-only");

    if (!diff) {
      console.log("⚠️  No staged changes found. Run git add . first!");
      process.exit(0);
    }

    // SKILL 1 — Review Code
    console.log("\n🔍 Skill 1: Reviewing your code...\n");
    const reviewPrompt = `
You are GitGuard, an AI git assistant.
Review this staged code diff for bugs, console.logs, API keys, and security issues.

Use these severity levels and rules:
1. 🚫 CRITICAL (Block commit)
   - Hardcoded API keys, passwords, tokens, or secrets.
   - Obvious bugs like unhandled errors or undefined variables.
   - console.log or print debug statements in production-level application code (NOT terminal scripts like scripts/gitguard.js where console.log is the UI).
2. ⚠️ WARNING (Allow but alert)
   - Potential issues that don't directly break functionality.
3. 💡 SUGGESTION (Just inform)
   - Missing comments on complex logic.
   - Code style improvements.

For EACH issue, follow this format:
[Severity] [Filename]:[Line] - [Issue]
Impact: [Brief description of risk]
Action: [Fix needed / Commit blocked]

End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".
Only use BLOCK for 🚫 CRITICAL issues.

Diff:
${diff}
  `;

    const reviewResult = await callGroq(reviewPrompt);
    console.log(reviewResult);

    if (reviewResult.includes("VERDICT: BLOCK")) {
      const override = askUser("\n🚫 Critical issues detected! Commit anyway? (y/N): ");
      if (override.toLowerCase() !== "y") {
        console.log("\n🚫 Please fix the issues above before committing!\n");
        process.exit(1);
      }
      console.log("\n⚠️ Committing despite critical issues...\n");
    }

    // SKILL 2 — Auto Commit Message
    console.log("\n✨ Skill 2: Writing your commit message...\n");
    const msgPrompt = `
You are a senior developer.
Given a git diff, generate a concise, professional commit message.

Rules:
- Use conventional commit format (feat, fix, refactor, chore, etc.)
- Mention WHAT changed and WHERE
- Avoid generic words like "update" or "fix stuff"
- Max 1 line summary.

Changed files: ${files}
Diff:
${diff}

Output exactly in this format:
✨ Suggested commit message:
"your message here"

📝 What changed:
- filename: description
  `;

    const msgResult = await callGroq(msgPrompt);
    console.log(msgResult);

    // Extract suggested message
    const match = msgResult.match(/"([^"]+)"/);
    const autoMessage = match ? match[1] : "Update code";

    // Ask Y/N using PowerShell — works on Windows even inside git hooks!
    const answer = askUser("\n👉 Use this commit message? (Y/n): ");
    console.log(""); // new line

    if (answer.toLowerCase() === "n") {
      const customMsg = askUser("✏️  Type your own commit message: ");
      console.log("");
      execSync(`git commit -m "${customMsg}" --no-verify`, { stdio: 'inherit' });
      console.log(`\n✅ Committed with your message: "${customMsg}"`);
    } else {
      execSync(`git commit -m "${autoMessage}" --no-verify`, { stdio: 'inherit' });
      console.log(`\n✅ Committed: "${autoMessage}"`);
    }
  } catch (error) {
    console.error("\n❌ Error during commit flow:", error.message);
    process.exit(1);
  }
}

async function pushFlow() {
  try {
    const branch = run("git branch --show-current");
    const files = run("git diff origin/main...HEAD --name-only");
    const fileCount = files ? files.split("\n").length : 0;

    console.log(`\n📍 Branch: ${branch}`);
    console.log(`📁 Files being pushed: ${fileCount}\n`);

    // SKILL 3 — Warn Risky Ops
    const riskPrompt = `
You are GitGuard, an AI git assistant.
Analyse this push operation for risks.
Use severity levels: 🔴 Critical, 🟡 Warning, 🟢 Tip

Details:
- Branch: ${branch}
- Files changed: ${fileCount}
- Force push detected: ${process.env.GIT_PUSH_OPTION_COUNT > 0 ? "yes" : "no"}

Check ONLY for these critical risks:
1. Force push (--force or -f flag) to main/master/production — this is the ONLY reason to BLOCK
2. More than 20 files changed at once — just a Warning, not a block

Do NOT block for simply pushing to main — that is normal and allowed.
Only BLOCK if force push is detected.

End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".
  `;

    const riskResult = await callGroq(riskPrompt);
    console.log(riskResult);

    if (riskResult.includes("VERDICT: BLOCK")) {
      const answer = askUser("\n⚠️  Risky operation detected! Push anyway? (y/N): ");
      console.log("");
      if (answer.toLowerCase() !== "y") {
        console.log("\n🚫 Push cancelled. Stay safe! 🛡️\n");
        process.exit(1);
      }
    }

    //execSync("git push", { stdio: 'inherit' });
    execSync("git push --no-verify", { stdio: 'inherit' });
    console.log("\n✅ Pushed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error during push flow:", error.message);
    process.exit(1);
  }
}

// Run based on mode
if (mode === "pre-commit") {
  commitFlow();
} else if (mode === "pre-push") {
  pushFlow();
} else {
  console.log(`
🛡️  GitGuard — AI Git Assistant

Usage:
  node scripts/gitguard.js pre-commit   → Review + auto commit message
  node scripts/gitguard.js pre-push     → Check for risky push operations
  `);
}