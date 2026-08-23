import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function readLocalEnvironment() {
  const filePath = resolve(process.cwd(), ".env.local");
  if (!existsSync(filePath)) return {};

  const values = {};
  for (const sourceLine of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) continue;

    const name = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }

  return values;
}

const localEnvironment = readLocalEnvironment();
const missingVariables = REQUIRED_VARIABLES.filter((name) => {
  const value = process.env[name] ?? localEnvironment[name];
  return !value?.trim();
});

if (missingVariables.length > 0) {
  console.error("\nThe Liturgy Compiler is missing required Supabase configuration:");
  for (const name of missingVariables) console.error(`  - ${name}`);
  console.error("\nCopy .env.local.example to .env.local, fill in the three values, and try again.");
  console.error("Keep .env.local on this machine; never commit or paste its values into chat.\n");
  process.exit(1);
}

console.log("Environment check passed.");
