# 07: The process, environment variables and CLIs

## Concepts
- **`process`**: the running program. `argv`, `env`, `pid`, `cwd()`, `memoryUsage()`, `uptime()`, `exitCode`, `exit()`.
- **Environment variables** are how deployed apps receive configuration and secrets (12-factor apps).
  `node --env-file=.env app.js` loads a `.env` file **without any library**. Commit `.env.example`, never `.env`.
- **Command-line parsing** with the built-in `util.parseArgs` (flags, short options, defaults, positionals).
  `commander` and `yargs` add subcommands and help text for bigger tools.
- **stdin / stdout / stderr**: data out on stdout, errors on stderr, so tools compose with pipes (`echo x | todo-cli add -`).
- **Exit codes**: `0` = success, anything else = failure. Prefer setting `process.exitCode` over `process.exit()`,
  so pending output still gets written.
- **Signals**: `SIGINT` (Ctrl+C) and `SIGTERM` (Docker/Kubernetes stop). Handle them to shut down gracefully (lesson 21).
- **`uncaughtException` / `unhandledRejection`**: last-resort logging, then exit. Never "keep going".
- **`node:os`**: CPUs, memory, platform. Useful for sizing worker pools (lesson 11).

## Run
```bash
node 07-process-and-cli/todo-cli.js add "Learn streams" --priority high
node 07-process-and-cli/todo-cli.js list
echo "Buy milk" | node 07-process-and-cli/todo-cli.js add -
node --env-file=07-process-and-cli/.env.example 07-process-and-cli/todo-cli.js list
node 07-process-and-cli/process-info.js a b --flag      # Ctrl+C to stop
node --test "07-process-and-cli/*.test.js"
```
