import { runCli } from "../../src/cli";

process.exit(await runCli(["validate", ...process.argv.slice(2)]));
