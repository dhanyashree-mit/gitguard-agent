const { execSync } = require("child_process");
const readline = require("readline");

const mode = process.argv[2];

async function callClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return "";
  }
}

async function preCommit() {
  const diff = run("git diff --cached");
  const files = run("git diff --cached --name-only");

  if (!diff) {
    console.log("⚠️  No staged changes found. Use git add . first!");
    process.exit(0);
  }

  // SKILL 1 — Review Code
  console.log("🔍 Skill 1: Reviewing your code...\n");
  const reviewPrompt = `
You are GitGuard, an AI git assistant.
Review this staged code diff for bugs, console.logs, API keys, and security issues.
Use severity levels: 🔴 Critical, 🟡 Warning, 🟢 Tip
List each issue with filename and line number.
End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".
Only use BLOCK for Critical issues.

Diff:
${diff}
  `;

  const reviewResult = await callClaude(reviewPrompt);
  console.log(reviewResult);

  if (reviewResult.includes("VERDICT: BLOCK")) {
    process.exit(1);
  }

  // SKILL 2 — Auto Commit Message
  console.log("\n✨ Skill 2: Writing your commit message...\n");
  const msgPrompt = `
You are GitGuard, an AI git assistant.
Read these code changes and write a clear, natural commit message.
Start with a verb: Add, Fix, Update, Remove, Refactor
Keep it under 72 characters.
Also list what changed per file in one line each.

Changed files: ${files}
Diff: ${diff}

Output format:
✨ Suggested commit message:
"your message here"

📝 What changed:
- filename: description
  `;

  const msgResult = await callClaude(msgPrompt);
  console.log(msgResult);

  // Ask user to confirm
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("\n👉 Use this commit message? (Y/n): ", async (answer) => {
    rl.close();
    if (answer.toLowerCase() === "n") {
      console.log("✏️  OK! Type your own message when git asks.");
      process.exit(0);
    }

    // Extract message and commit
    const match = msgResult.match(/"([^"]+)"/);
    if (match) {
      const message = match[1];
      run(`git commit -m "${message}"`);
      console.log(`\n✅ Committed: "${message}"`);
      process.exit(0);
    }
    process.exit(0);
  });
}

async function prePush() {
  const branch = run("git branch --show-current");
  const files = run("git diff origin/main...HEAD --name-only");
  const fileCount = files ? files.split("\n").length : 0;
  const args = process.env.GIT_PUSH_ARGS || "";

  console.log(`📍 Branch: ${branch}`);
  console.log(`📁 Files being pushed: ${fileCount}\n`);

  // SKILL 3 — Warn Risky Ops
  const riskPrompt = `
You are GitGuard, an AI git assistant.
Analyse this push operation for risks.
Use severity levels: 🔴 Critical, 🟡 Warning, 🟢 Tip

Details:
- Branch: ${branch}
- Files changed: ${fileCount}
- Push args: ${args}
- Protected branches: main, master, production

Check for:
1. Force push being used
2. Pushing directly to main/master/production
3. More than 20 files at once
4. Branch name has no prefix (feature/, fix/, chore/)

For each risk explain what could go wrong and suggest safer alternative.
End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".
Only BLOCK for Critical issues.
  `;

  const riskResult = await callClaude(riskPrompt);
  console.log(riskResult);

  if (riskResult.includes("VERDICT: BLOCK")) {
    process.exit(1);
  }
  process.exit(0);
}

// Run based on mode
if (mode === "pre-commit") {
  preCommit();
} else if (mode === "pre-push") {
  prePush();
}