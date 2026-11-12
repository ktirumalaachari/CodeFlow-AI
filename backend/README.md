# CODEFLOW AI — Python 3.12 Execution Engine (`backend/`)

FastAPI + `sys.settrace` execution and snapshot serialization engine for Phase 2 of **CODEFLOW AI**.

## Architecture

- `app/main.py` — FastAPI application factory, CORS configuration, and startup security mode check.
- `app/api/routes.py` — `GET /api/health` and `POST /api/execute` endpoints.
- `app/execution/runner.py` — Isolated execution orchestrator (`DockerSandboxRunner` when Docker image `codeflow-python-runner:3.12` is available; `development_subprocess` mode locally).
- `app/execution/worker_entry.py` — Standalone zero-dependency Python 3.12 worker launched via `python3 -I` in an ephemeral `0700` directory with POSIX resource caps and PEP 578 `sys.addaudithook` guards.
- `app/execution/tracer.py` — Deterministic `sys.settrace` engine capturing line, call, return, and exception snapshots.
- `app/execution/serializer.py` — Cycle-safe value serializer preserving mutable object reference IDs (`ref#1`, `ref#2`, ...).
- `app/execution/snapshots.py` — Per-frame state differ tracking `created`, `modified`, `unchanged`, and `deleted` variables.
- `app/execution/explainer.py` — AST + state-diff deterministic explanation engine powering the *"What's Happening?"* panel.
- `app/execution/error_formatter.py` — Beginner-friendly diagnostic mapper for syntax, runtime, timeout, and step-limit errors.

## Security & Isolation Notice

1. **Never In-Process**: User Python code is **never** executed inside Next.js or the FastAPI server process.
2. **Preferred Production Isolation (`docker_sandbox`)**: Build the runner image and run with `--network none`, `--read-only`, `--cap-drop ALL`, `--security-opt no-new-privileges`, `--pids-limit 32`, and strict RAM/CPU caps:
   ```bash
   docker build -f Dockerfile.runner -t codeflow-python-runner:3.12 .
   ```
3. **Local Development Fallback (`development_subprocess`)**: When Docker is not running locally, the engine runs in an explicitly badged **Development-Only Subprocess Mode** bound to `127.0.0.1:8000`. Although it enforces separate process groups (`killpg` on timeout), `-I` isolated mode, scrubbed environment variables, ephemeral directory cleanup, POSIX `rlimit` caps, and PEP 578 `sys.addaudithook` blocks on network sockets, subprocess spawning, and host file reads/writes, **ordinary subprocess + audit-hook isolation is NOT sufficient against hostile untrusted code in public deployments**. Do not expose `development_subprocess` publicly.

## Running Locally

```bash
cd backend
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Running Tests

```bash
cd backend
.venv/bin/pytest -v
```

