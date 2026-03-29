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

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    // Timeout for empty stdin
    setTimeout(() => resolve(data), 50);
  });
}

async function commitFlow() {
  try {
    const diff = run("git diff --cached");
    const files = run("git diff --cached --name-only");

    if (!diff) {
      console.log("⚠️  No staged changes found. Run git add . first!");
      process.exit(0);
    }

    // SKILL 1 — Code Review
    console.log("\n🔍 Skill 1: Code Review...\n");
    const reviewPrompt = `
You are GitGuard, an AI code reviewer. Your goal is to provide a brief but high-quality review of the staged changes.

RULES:
- Analyze the provided diff line-by-line.
- ONLY list changes and risks that actually exist. NEVER say "not detected" or "no changes found".
- Use plain text for headers. Do not use Markdown (###).

📌 Change detected:
(List modified files and highlight 1-2 key logic changes)

Issue Review:
(Identify bugs, secrets, or console.logs using the format below)
[Severity] [Filename]:[Line] - [Issue]
Impact: [Brief risk]
Action: [Fix needed]

Severity Rules:
1. 🚫 CRITICAL (Block commit) - Hardcoded secrets, obvious bugs, console.log in production apps.
2. ⚠️ WARNING (Allow but alert) - Bypassing safety checks, potential edge cases.
3. 💡 SUGGESTION (Just inform) - Style improvements, missing comments.

End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".

Diff to analyze:
\`\`\`diff
${diff}
\`\`\`
  `;

    const reviewResult = await callGroq(reviewPrompt);
    console.log(reviewResult);

    if (reviewResult.includes("VERDICT: BLOCK")) {
      const override = askUser("\n🚫 Critical issues detected! Commit anyway? (y/N): ");
      if (override.toLowerCase() !== "y") {
        console.log("\n🚫 Commit cancelled. Please fix the issues above.\n");
        process.exit(1);
      }
      console.log("\n⚠️ Proceeding despite critical issues...\n");
    }

    // SKILL 2 — Commit Message
    console.log("✨ Skill 2: Commit Message...\n");
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

    // Extract suggested message (more robustly)
    let autoMessage = "Update code";
    const quoteMatch = msgResult.match(/"([^"]+)"/);
    if (quoteMatch) {
      autoMessage = quoteMatch[1];
    } else {
      const lines = msgResult.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const suggestIdx = lines.findIndex(l => l.includes("Suggested commit message"));
      if (suggestIdx !== -1 && lines[suggestIdx + 1]) {
        autoMessage = lines[suggestIdx + 1].replace(/"/g, "");
      } else if (lines.length > 0) {
        autoMessage = lines[0].replace(/"/g, "");
      }
    }

    console.log(`\n💡 Senior Tip: Use this commit message for a professional log:\n   git commit -m "${autoMessage}"\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during commit flow:", error.message);
    process.exit(1);
  }
}

async function pushFlow() {
  try {
    const branch = run("git branch --show-current");
    const stdinData = await readStdin();
    const isForce = stdinData.includes(" +"); // git pre-push stdin format includes '+' for force push

    const files = run("git diff origin/main...HEAD --name-only");
    const fileCount = files ? files.split("\n").length : 0;

    console.log(`\n📍 Branch: ${branch}`);
    console.log(`📁 Files:  ${fileCount}`);

    // SKILL 3 — Risk Analysis
    console.log("\n🛰️ Skill 3: Risk Analysis...\n");
    const riskPrompt = `
You are GitGuard, an AI git assistant.
Analyse this push operation for risks.

Details:
- Branch: ${branch}
- Files changed: ${fileCount}
- Force push detected: ${isForce ? "yes" : "unknown (check if you added --force)"}

Risk Rules:
1. BLOCK if pushing to protected branch (main/master/production) AND files > 20.
2. BLOCK if force push (-f or --force) is detected to protected branches.
3. WARN if any force push is detected.

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

    // Pass control back to the original git process
    process.exit(0);
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
🛡️ GitGuard — AI Git Assistant

Usage:
  node scripts/gitguard.js pre-commit   → Code Review + Commit Message
  node scripts/gitguard.js pre-push     → Risk Analysis
  `);
}