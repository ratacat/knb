// Regenerate `knb/schema.json` from `contract.jsonSchema()` so the static schema
// file stays in sync with the TypeScript source of truth.
// Run via: bun run sync-schema
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { jsonSchema } from "../src/core/contract";

const target = resolve(import.meta.dir, "..", "knb", "schema.json");
const content = `${JSON.stringify(jsonSchema(), null, 2)}\n`;
await writeFile(target, content, "utf8");
console.log(`Wrote ${target}`);
