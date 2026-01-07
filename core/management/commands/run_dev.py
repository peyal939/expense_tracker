from __future__ import annotations

import os
import signal
import subprocess
import sys
from pathlib import Path

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run backend (Django) and frontend (static http.server) together."

    def add_arguments(self, parser):
        parser.add_argument(
            "--backend-host",
            default="127.0.0.1",
            help="Backend host (default: 127.0.0.1)",
        )
        parser.add_argument(
            "--backend-port",
            default="8000",
            help="Backend port (default: 8000)",
        )
        parser.add_argument(
            "--frontend-host",
            default="127.0.0.1",
            help="Frontend host (default: 127.0.0.1)",
        )
        parser.add_argument(
            "--frontend-port",
            default="5173",
            help="Frontend port (default: 5173)",
        )
        parser.add_argument(
            "--no-frontend",
            action="store_true",
            help="Only run the backend server.",
        )

    def handle(self, *args, **options):
        repo_root = Path.cwd()
        frontend_dir = repo_root / "frontend"

        python = sys.executable

        backend_addr = f"{options['backend_host']}:{options['backend_port']}"
        frontend_addr = f"{options['frontend_host']}:{options['frontend_port']}"

        self.stdout.write(self.style.SUCCESS("Starting dev servers..."))
        self.stdout.write(f"- Backend:  http://{backend_addr}/api/v1/health/")
        if not options["no_frontend"]:
            self.stdout.write(f"- Frontend: http://{frontend_addr}/")
        self.stdout.write("Press Ctrl+C to stop both.")

        procs: list[subprocess.Popen] = []

        try:
            backend_proc = subprocess.Popen(
                [python, "manage.py", "runserver", backend_addr],
                cwd=str(repo_root),
            )
            procs.append(backend_proc)

            if not options["no_frontend"]:
                if not frontend_dir.exists():
                    raise RuntimeError("Missing ./frontend directory")

                frontend_proc = subprocess.Popen(
                    [python, "-m", "http.server", str(options["frontend_port"]), "--bind", options["frontend_host"]],
                    cwd=str(frontend_dir),
                )
                procs.append(frontend_proc)

            # Wait for either process to exit
            while True:
                for p in procs:
                    code = p.poll()
                    if code is not None:
                        raise RuntimeError(f"A dev server exited early (code={code}).")
        except KeyboardInterrupt:
            self.stdout.write("\nStopping dev servers...")
        finally:
            for p in procs:
                self._terminate(p)

    def _terminate(self, proc: subprocess.Popen) -> None:
        if proc.poll() is not None:
            return

        try:
            if os.name == "nt":
                proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                proc.terminate()
        except Exception:
            try:
                proc.terminate()
            except Exception:
                pass

        try:
            proc.wait(timeout=5)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
