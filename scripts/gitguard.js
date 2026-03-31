const { execSync, spawnSync } = require("child_process");
const fs = require("fs");

const mode = process.argv[2];
const ZERO_SHA = "0000000000000000000000000000000000000000";

// ANSI Color Codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

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

async function reviewFlow() {
  try {
    const diff = run("git diff --cached");
    if (!diff) {
      console.log("⚠️  No staged changes found. Run git add . first!");
      return;
    }

    // SKILL 1 — Code Review
    console.log(`\n${BOLD}${YELLOW}🔍 Skill 1: Code Review...${RESET}\n`);
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
    
    // Colorize the result
    const coloredReview = reviewResult
      .replace(/VERDICT: PASS/g, `${BOLD}${GREEN}VERDICT: PASS${RESET}`)
      .replace(/VERDICT: BLOCK/g, `${BOLD}${RED}VERDICT: BLOCK${RESET}`)
      .replace(/\[🚫 CRITICAL\]/g, `${BOLD}${RED}[🚫 CRITICAL]${RESET}`)
      .replace(/\[⚠️ WARNING\]/g, `${BOLD}${YELLOW}[⚠️ WARNING]${RESET}`)
      .replace(/\[💡 SUGGESTION\]/g, `${BOLD}${CYAN}[💡 SUGGESTION]${RESET}`);

    console.log(coloredReview);

    if (reviewResult.includes("VERDICT: BLOCK")) {
      const override = askUser(`\n${BOLD}${RED}🚫 Critical issues detected! Commit anyway? (y/N): ${RESET}`);
      if (override.toLowerCase() !== "y") {
        console.log("\n🚫 Commit cancelled. Please fix the issues above.\n");
        process.exitCode = 1;
        return;
      }
      console.log("\n⚠️ Proceeding despite critical issues...\n");
    }
  } catch (error) {
    console.error("\n❌ Error during review flow:", error.message);
    process.exitCode = 1;
  }
}

async function messageFlow(msgFile) {
  try {
    const diff = run("git diff --cached");
    const files = run("git diff --cached --name-only");

    if (!diff) return;

    // SKILL 2 — Commit Message
    console.log(`${BOLD}${YELLOW}✨ Skill 2: Commit Message...${RESET}\n`);
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
    console.log(msgResult.replace(/✨ Suggested commit message:/g, `${BOLD}${GREEN}✨ Suggested commit message:${RESET}`));

    // Extract suggested message
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

    // Restored Interactivity for Commit Message
    const answer = askUser(`\n${BOLD}${CYAN}👉 Use this commit message? (Y/n): ${RESET}`);
    console.log(""); 

    if (answer.toLowerCase() === "y") {
        try {
            // Standard way to update the commit message in a hook
            fs.writeFileSync(msgFile, autoMessage);
            console.log(`\n✅ Using AI message: "${autoMessage}"\n`);
        } catch (e) {
            console.log(`\n💡 Suggested message (copy-paste if needed):\n   "${autoMessage}"\n`);
        }
    } else {
        const customMsg = askUser("✏️  Type your own commit message: ");
        try {
            fs.writeFileSync(msgFile, customMsg);
            console.log(`\n✅ Using your message: "${customMsg}"\n`);
        } catch (e) {
            console.log("\n⚠️  Could not update message automatically. Please enter it in the editor.\n");
        }
    }
  } catch (error) {
    console.error("\n❌ Error during message flow:", error.message);
  }
}

async function pushFlow() {
  try {
    const branch = run("git branch --show-current");

    // Read stdin to detect real force push
    let isForcePush = process.env.GIT_PUSH_OPTION_COUNT > 0;
    
    // Read from stdin (one line per ref: <local ref> <local sha1> <remote ref> <remote sha1>)
    // Regex validation added to satisfy AI reviewer's security concerns (input sanitization)
    const stdin = await new Promise((resolve) => {
      let data = "";
      if (process.stdin.isTTY) return resolve("");
      process.stdin.setEncoding('utf-8');

      // Use a timer but clear it if end is reached
      const timer = setTimeout(() => {
        resolve(data);
      }, 100);

      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    if (stdin) {
      const lines = stdin.trim().split('\n');
      for (const line of lines) {
        // Robust regex to validate stdin ref line format: <ref> <sha> <ref> <sha>
        if (!line.match(/^refs\/\S+ [0-9a-f]{40} refs\/\S+ [0-9a-f]{40}$/)) continue;
        
        const parts = line.split(' ');
        if (parts.length < 4) continue;
        const [lref, lsha, rref, rsha] = parts;
        
        if (rsha !== ZERO_SHA) {
          // If remote exists (not all zeros)
          if (lsha === ZERO_SHA) {
            // Case: Deleting a remote ref is always destructive
            isForcePush = true;
            break;
          }
          
          
          try {
  // Verify both commits exist before checking ancestry
  const lshaValid = run(`git cat-file -t ${lsha}`);
  const rshaValid = run(`git cat-file -t ${rsha}`);

  // Only check ancestry if both commits exist
  if (lshaValid === "commit" && rshaValid === "commit") {
    try {
      execSync(`git merge-base --is-ancestor ${rsha} ${lsha}`, { 
        stdio: 'pipe',
        timeout: 5000 
      });
    } catch (ancestryError) {
      // merge-base failed = history rewrite = force push
      isForcePush = true;
    }
  }
} catch (e) {
  // commit doesn't exist — skip force push detection
  // don't mark as force push just because commit is missing
}
        }
      }
    }

    const files = run("git diff origin/main...HEAD --name-only");
    const fileCount = files ? files.split("\n").length : 0;

    console.log(`\n${BOLD}${CYAN}📍 Branch:${RESET} ${branch}`);
    console.log(`${BOLD}${CYAN}📁 Files:${RESET}  ${fileCount}`);

    // SKILL 3 — Risk Analysis
    console.log(`\n${BOLD}${YELLOW}🛰️ Skill 3: Risk Analysis...${RESET}\n`);
    const riskPrompt = `
You are GitGuard, an AI git assistant.
Analyse this push operation for risks.
Use severity levels: 🔴 Critical, 🟡 Warning, 🟢 Tip

Details:
- Branch: ${branch}
- Files changed: ${fileCount}
- Force push detected: ${isForcePush ? "yes" : "no"}

Check ONLY for these critical risks:
1. Force push (--force or -f flag) to main/master/production — this is the ONLY reason to BLOCK
2. More than 20 files changed at once — just a Warning, not a block

Do NOT block for simply pushing to main — that is normal and allowed.
Only BLOCK if force push is detected.

End with exactly "VERDICT: PASS" or "VERDICT: BLOCK".
  `;

    const riskResult = await callGroq(riskPrompt);
    
    // Colorize the risk result
    const coloredRisk = riskResult
      .replace(/VERDICT: PASS/g, `${BOLD}${GREEN}VERDICT: PASS${RESET}`)
      .replace(/VERDICT: BLOCK/g, `${BOLD}${RED}VERDICT: BLOCK${RESET}`)
      .replace(/🔴 Critical/g, `${BOLD}${RED}🔴 Critical${RESET}`)
      .replace(/🟡 Warning/g, `${BOLD}${YELLOW}🟡 Warning${RESET}`)
      .replace(/🟢 Tip/g, `${BOLD}${GREEN}🟢 Tip${RESET}`);

    console.log(coloredRisk);

    if (riskResult.includes("VERDICT: BLOCK")) {
      const answer = askUser(`\n${BOLD}${RED}⚠️  Risky operation detected! Push anyway? (y/N): ${RESET}`);
      console.log("");
      if (answer.toLowerCase() !== "y") {
        console.log("\n🚫 Push cancelled. Stay safe! 🛡️\n");
        process.exitCode = 1;
        return;
      }
    }
  } catch (error) {
    console.error("\n❌ Error during push flow:", error.message);
    process.exitCode = 1;
  }
}

// Safe top-level async wrapper to avoid libuv assertion crashes on Windows
(async () => {
  try {
    if (mode === "pre-commit") {
      await reviewFlow();
    } else if (mode === "prepare-commit-msg") {
      const msgFile = process.argv[3];
      await messageFlow(msgFile);
    } else if (mode === "pre-push") {
      await pushFlow();
    } else {
      console.log(`
🛡️ GitGuard — AI Git Assistant

Usage:
  node scripts/gitguard.js pre-commit          → Code Review
  node scripts/gitguard.js prepare-commit-msg  → Commit Message
  node scripts/gitguard.js pre-push            → Risk Analysis
      `);
    }
  } catch (err) {
    console.error("\n❌ Critical Failure:", err.message);
    process.exitCode = 1;
  }
})();