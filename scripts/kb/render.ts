import { runCli } from "../../src/cli";

process.exit(await runCli(["render", ...process.argv.slice(2)]));
