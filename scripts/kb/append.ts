import { runCli } from "../../src/cli";

process.exit(await runCli(["append", ...process.argv.slice(2)]));
