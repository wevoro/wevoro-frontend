const fs = require("fs");
const { execSync } = require("child_process");

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

console.log("branch", branch);

let envFile = ".env.local";

if (branch === "main") {
  envFile = ".env.main.local";
} else if (branch === "qa") {
  envFile = ".env.qa.local";
}

try {
  fs.copyFileSync(envFile, ".env.local");
  console.log(`✅ Loaded environment from ${envFile}`);
} catch (err) {
  console.error(`❌ Failed to load ${envFile}:`, err.message);
}
