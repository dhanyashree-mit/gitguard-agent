const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("\n🛡️  Setting up GitGuard...\n");

// Copy hooks
try {
  fs.copyFileSync(
    path.join(__dirname, "../hooks/pre-commit"),
    path.join(__dirname, "../.git/hooks/pre-commit")
  );
  fs.copyFileSync(
    path.join(__dirname, "../hooks/pre-push"),
    path.join(__dirname, "../.git/hooks/pre-push")
  );
  fs.copyFileSync(
    path.join(__dirname, "../hooks/prepare-commit-msg"),
    path.join(__dirname, "../.git/hooks/prepare-commit-msg")
  );
  console.log("✅ Git hooks installed!");
} catch (e) {
  console.log("❌ Hook installation failed:", e.message);
}

// Check API key
if (!process.env.GROQ_API_KEY) {
  console.log("⚠️  GROQ_API_KEY not set!");
  console.log("   Get your free key at: console.groq.com");
  console.log("   Then run: setx GROQ_API_KEY your-key-here");
} else {
  console.log("✅ GROQ API key found!");
}

console.log("\n🎉 GitGuard is ready! It will now protect every commit and push.\n");