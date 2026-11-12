from __future__ import annotations

import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass
from typing import Any, Literal

from app.core.config import settings
from app.execution.error_formatter import ExecutionTimeoutError, build_execution_error

RunnerMode = Literal["docker_sandbox", "development_subprocess"]

DEV_MODE_SECURITY_NOTICE = (
    "Running in local development subprocess mode (127.0.0.1 only). "
    "Process isolation, temporary directory cleanup, timeouts, step caps, "
    "and PEP 578 audit hooks are active, but container/VM isolation (Docker) "
    "is required before exposing arbitrary code execution publicly."
)

DOCKER_MODE_SECURITY_NOTICE = (
    "Running inside isolated Docker container (--network none, --read-only, "
    "dropped Linux capabilities, strict memory/CPU/PID limits)."
)


@dataclass
class RunnerResponse:
    execution_id: str
    execution_mode: RunnerMode
    security_notice: str
    duration_ms: float
    payload: dict[str, Any]


class IsolatedExecutionRunner:
    """
    Executes untrusted Python source code strictly outside the FastAPI server process.
    Prefers a locked-down Docker container sandbox when available; otherwise uses
    an explicitly labeled local development subprocess runner with process-group
    timeouts, ephemeral working directory cleanup, and PEP 578 runtime audit hooks.
    """

    def __init__(self) -> None:
        self._worker_script = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "worker_entry.py")
        )
        self._backend_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..")
        )
        self._docker_available: bool | None = None

    def detect_mode(self, environment_override: str | None = None) -> RunnerMode:
        env = (environment_override or settings.environment).lower()
        pref = settings.execution_mode_preference.lower()

        if env == "production":
            if pref == "development_subprocess":
                raise RuntimeError(
                    "SECURITY BLOCK: 'development_subprocess' mode is strictly forbidden when CODEFLOW_ENV=production."
                )
            if not self._is_docker_image_ready():
                raise RuntimeError(
                    f"SECURITY BLOCK: Production mode requires verified Docker sandbox isolation, "
                    f"but Docker daemon or image '{settings.docker_image}' is unavailable."
                )
            return "docker_sandbox"

        if pref == "development_subprocess":
            return "development_subprocess"
        if pref in ("docker", "auto"):
            if self._is_docker_image_ready():
                return "docker_sandbox"
            if pref == "docker":
                raise RuntimeError(
                    f"Docker sandbox requested but image '{settings.docker_image}' or Docker daemon is unavailable."
                )
        return "development_subprocess"

    def _is_docker_daemon_reachable(self) -> bool:
        docker_bin = shutil.which("docker")
        if not docker_bin:
            return False
        try:
            probe = subprocess.run(
                [docker_bin, "info"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=1.5,
                check=False,
            )
            return probe.returncode == 0
        except Exception:
            return False

    def _is_docker_image_ready(self) -> bool:
        if self._docker_available is not None:
            return self._docker_available
        docker_bin = shutil.which("docker")
        if not docker_bin:
            self._docker_available = False
            return False
        try:
            probe = subprocess.run(
                [docker_bin, "image", "inspect", settings.docker_image],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=1.5,
                check=False,
            )
            self._docker_available = probe.returncode == 0
        except Exception:
            self._docker_available = False
        return self._docker_available

    def build_docker_command(self, container_name: str) -> list[str]:
        docker_bin = shutil.which("docker") or "docker"
        return [
            docker_bin,
            "run",
            "--rm",
            "-i",
            "--name",
            container_name,
            "--network",
            "none",
            "--read-only",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=16m",
            "--memory",
            f"{settings.max_memory_mb}m",
            "--memory-swap",
            f"{settings.max_memory_mb}m",
            "--cpus",
            "0.5",
            "--pids-limit",
            "32",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--user",
            "65534:65534",
            settings.docker_image,
            "python3",
            "-I",
            "-B",
            "/runner/app/execution/worker_entry.py",
        ]

    def audit_security_status(self) -> dict[str, Any]:
        docker_bin = shutil.which("docker")
        cli_installed = docker_bin is not None
        daemon_reachable = self._is_docker_daemon_reachable() if cli_installed else False
        # Refresh cached check for live audit accuracy
        self._docker_available = None
        image_ready = self._is_docker_image_ready() if daemon_reachable else False
        docker_verified = bool(cli_installed and daemon_reachable and image_ready)

        blockers: list[str] = []
        if not cli_installed:
            blockers.append("Docker CLI binary is not installed on the host.")
        elif not daemon_reachable:
            blockers.append(
                "Docker daemon is not running or socket is unreachable (/var/run/docker.sock). "
                "Container isolation cannot be verified in practice until Docker daemon is started."
            )
        elif not image_ready:
            blockers.append(
                f"Docker sandbox image '{settings.docker_image}' has not been built yet "
                f"(run `docker build -f backend/Dockerfile.runner -t {settings.docker_image} backend`)."
            )

        active_mode: RunnerMode = (
            "docker_sandbox"
            if docker_verified and settings.execution_mode_preference.lower() != "development_subprocess"
            else "development_subprocess"
        )

        return {
            "environment": settings.environment,
            "active_execution_mode": active_mode,
            "docker_cli_installed": cli_installed,
            "docker_daemon_reachable": daemon_reachable,
            "docker_sandbox_image": settings.docker_image,
            "docker_sandbox_image_present": image_ready,
            "docker_isolation_verified": docker_verified,
            "production_deployment_blocked": not docker_verified,
            "deployment_blockers": blockers,
            "docker_container_flags": [
                "--rm",
                "--network none",
                "--read-only",
                "--tmpfs /tmp:rw,noexec,nosuid,size=16m",
                f"--memory {settings.max_memory_mb}m",
                f"--memory-swap {settings.max_memory_mb}m",
                "--cpus 0.5",
                "--pids-limit 32",
                "--cap-drop ALL",
                "--security-opt no-new-privileges",
                "--user 65534:65534",
            ],
            "worker_sandbox_controls": [
                "PEP 578 sys.addaudithook blocking socket, subprocess, urllib, http, ctypes, shutil, os mutations",
                "Direct user open() blocked; only frozen importlib stdlib reads inside sys.base_prefix permitted",
                "Complete os.environ.clear() inside worker before user code execution",
                "Backend application root removed from sys.path and 'app' imports blocked",
                "POSIX resource.setrlimit (RLIMIT_CPU, RLIMIT_FSIZE=0, RLIMIT_NOFILE=64, RLIMIT_AS/DATA)",
                "Wall-clock SIGALRM ITIMER_REAL + parent process-group SIGKILL timeout enforcement",
                "Ephemeral 0700 working directory deleted after every execution",
            ],
        }

    def run_trace(
        self,
        source_code: str,
        max_steps: int | None = None,
        timeout_seconds: float | None = None,
        stdin_data: str | None = None,
    ) -> RunnerResponse:
        execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        effective_steps = min(
            max(10, max_steps or settings.default_max_steps),
            settings.hard_max_steps,
        )
        effective_timeout = min(
            max(0.5, timeout_seconds or settings.default_timeout_seconds),
            settings.max_timeout_seconds,
        )

        worker_request = {
            "source_code": source_code,
            "stdin": stdin_data,
            "max_steps": effective_steps,
            "timeout_seconds": effective_timeout,
            "max_memory_mb": settings.max_memory_mb,
            "max_output_bytes": settings.max_output_bytes,
            "max_recursion_depth": settings.max_recursion_depth,
        }
        stdin_bytes = json.dumps(worker_request).encode("utf-8")

        mode = self.detect_mode()
        started_at = time.perf_counter()

        if mode == "docker_sandbox":
            payload = self._run_in_docker(
                stdin_bytes=stdin_bytes,
                source_code=source_code,
                timeout_seconds=effective_timeout,
            )
            notice = DOCKER_MODE_SECURITY_NOTICE
        else:
            payload = self._run_in_dev_subprocess(
                stdin_bytes=stdin_bytes,
                source_code=source_code,
                timeout_seconds=effective_timeout,
            )
            notice = DEV_MODE_SECURITY_NOTICE

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        return RunnerResponse(
            execution_id=execution_id,
            execution_mode=mode,
            security_notice=notice,
            duration_ms=duration_ms,
            payload=payload,
        )

    def _run_in_docker(
        self,
        stdin_bytes: bytes,
        source_code: str,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        docker_bin = shutil.which("docker") or "docker"
        container_name = f"cf_sandbox_{uuid.uuid4().hex[:10]}"
        cmd = self.build_docker_command(container_name)

        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        )

        try:
            out_bytes, err_bytes = proc.communicate(
                input=stdin_bytes, timeout=timeout_seconds + 0.75
            )
            return self._parse_worker_output(
                out_bytes=out_bytes,
                err_bytes=err_bytes,
                return_code=proc.returncode,
                source_code=source_code,
                timeout_seconds=timeout_seconds,
            )
        except subprocess.TimeoutExpired:
            self._terminate_process_group(proc)
            return self._timeout_fallback_payload(source_code, timeout_seconds)
        finally:
            self._terminate_process_group(proc)
            try:
                subprocess.run(
                    [docker_bin, "rm", "-f", container_name],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=2.0,
                    check=False,
                )
            except Exception:
                pass

    def _run_in_dev_subprocess(
        self,
        stdin_bytes: bytes,
        source_code: str,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        temp_dir = tempfile.mkdtemp(prefix="codeflow_exec_")
        os.chmod(temp_dir, 0o700)

        scrubbed_env = {
            "PATH": "/usr/bin:/bin",
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONNOUSERSITE": "1",
            "PYTHONUNBUFFERED": "1",
            "HOME": temp_dir,
            "TMPDIR": temp_dir,
        }

        cmd = [sys.executable, "-I", "-B", self._worker_script]

        proc = subprocess.Popen(
            cmd,
            cwd=temp_dir,
            env=scrubbed_env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        )

        try:
            out_bytes, err_bytes = proc.communicate(
                input=stdin_bytes,
                timeout=timeout_seconds + 0.5,
            )
            return self._parse_worker_output(
                out_bytes=out_bytes,
                err_bytes=err_bytes,
                return_code=proc.returncode,
                source_code=source_code,
                timeout_seconds=timeout_seconds,
            )
        except subprocess.TimeoutExpired:
            self._terminate_process_group(proc)
            return self._timeout_fallback_payload(source_code, timeout_seconds)
        finally:
            self._terminate_process_group(proc)
            shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def _terminate_process_group(proc: subprocess.Popen[bytes]) -> None:
        if proc.poll() is not None:
            return
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
        try:
            proc.wait(timeout=0.5)
        except Exception:
            pass

    @staticmethod
    def _timeout_fallback_payload(
        source_code: str,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        err = build_execution_error(
            ExecutionTimeoutError(timeout_seconds),
            source_code.splitlines(),
        )
        return {
            "status": "timeout",
            "total_steps": 0,
            "stdout": "",
            "steps": [],
            "error": {
                "error_type": err.error_type,
                "message": err.message,
                "friendly_title": err.friendly_title,
                "friendly_explanation": err.friendly_explanation,
                "suggestion": err.suggestion,
                "line": err.line,
                "column": err.column,
                "source_line": err.source_line,
                "traceback_lines": err.traceback_lines,
            },
        }

    def _parse_worker_output(
        self,
        out_bytes: bytes,
        err_bytes: bytes,
        return_code: int | None,
        source_code: str,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        if out_bytes:
            try:
                return json.loads(out_bytes.decode("utf-8", errors="replace"))
            except json.JSONDecodeError:
                pass

        # Killed by SIGXCPU / SIGKILL due to CPU or memory limit
        if return_code in (-signal.SIGXCPU, -signal.SIGKILL, -signal.SIGALRM):
            return self._timeout_fallback_payload(source_code, timeout_seconds)

        stderr_text = err_bytes.decode("utf-8", errors="replace").strip()
        err = build_execution_error(
            RuntimeError(
                stderr_text or f"Execution worker exited unexpectedly (code {return_code})."
            ),
            source_code.splitlines(),
        )
        return {
            "status": "runtime_error",
            "total_steps": 0,
            "stdout": "",
            "steps": [],
            "error": {
                "error_type": err.error_type,
                "message": err.message,
                "friendly_title": "Execution Worker Terminated",
                "friendly_explanation": (
                    "The isolated Python runner terminated unexpectedly, often caused by "
                    "exceeding memory limits or severe runtime exhaustion."
                ),
                "suggestion": "Reduce large memory allocations or recursion depth and try again.",
                "line": err.line,
                "column": err.column,
                "source_line": err.source_line,
                "traceback_lines": err.traceback_lines,
            },
        }


execution_runner = IsolatedExecutionRunner()

