// PreToolUse: block hand edits to secrets and the lock file.
let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  const p = JSON.parse(raw).tool_input?.file_path ?? "";
  const name = p.split(/[\\/]/).pop();
  const blocked = (/^\.env(\..+)?$/.test(name) && !name.endsWith(".example")) || name === "package-lock.json";
  if (blocked) {
    console.error(`Blocked: ${name} must not be edited by hand. Change .env.example, or run npm install for the lock file.`);
    process.exit(2);
  }
});
