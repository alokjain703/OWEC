"""
Migration helper scripts for OMNI backend.

Usage (after `pip install -e ".[dev]"` with venv active):
    omni-migrate              – upgrade to head
    omni-migrate-new "msg"    – autogenerate a new revision
    omni-migrate-down         – downgrade one step
    omni-migrate-history      – print revision history

Or call directly:
    python -m scripts.migrate upgrade
    python -m scripts.migrate new "add users table"
    python -m scripts.migrate downgrade
    python -m scripts.migrate history
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

# Always resolve paths relative to this file so the script works regardless
# of which directory the user calls it from.
BACKEND_DIR = Path(__file__).resolve().parent.parent


def _alembic(*args: str) -> int:
    """Run an alembic sub-command inside the omni-backend directory."""
    cmd = [sys.executable, "-m", "alembic", *args]
    result = subprocess.run(cmd, cwd=BACKEND_DIR)
    return result.returncode


# ── Entry-point functions ─────────────────────────────────────────────────────


def upgrade() -> None:
    """Upgrade the database to the latest revision (head)."""
    rc = _alembic("upgrade", "head")
    sys.exit(rc)


def downgrade() -> None:
    """Downgrade the database by one revision."""
    rc = _alembic("downgrade", "-1")
    sys.exit(rc)


def new_revision() -> None:
    """
    Autogenerate a new migration revision.

    Pass the revision message as the first CLI argument, e.g.:
        omni-migrate-new "add projects table"
    """
    args = sys.argv[1:]
    message = args[0] if args else "auto"
    rc = _alembic("revision", "--autogenerate", "-m", message)
    sys.exit(rc)


def history() -> None:
    """Print the full revision history."""
    rc = _alembic("history", "--verbose")
    sys.exit(rc)


def current() -> None:
    """Print the current revision the database is at."""
    rc = _alembic("current", "--verbose")
    sys.exit(rc)


# ── __main__ shim (python -m scripts.migrate <cmd> [msg]) ────────────────────

COMMANDS = {
    "upgrade": upgrade,
    "up": upgrade,
    "downgrade": downgrade,
    "down": downgrade,
    "new": new_revision,
    "revision": new_revision,
    "history": history,
    "current": current,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(
            "Usage: python -m scripts.migrate <command> [message]\n"
            "\n"
            "Commands:\n"
            "  upgrade   (up)       – apply all pending migrations\n"
            "  downgrade (down)     – roll back one revision\n"
            "  new       (revision) – autogenerate a new migration (requires message)\n"
            "  history              – show full revision history\n"
            "  current              – show current DB revision\n"
        )
        sys.exit(0)

    cmd = sys.argv[1]
    # Shift argv so entry-point functions receive the rest as their own argv[1:]
    sys.argv = [sys.argv[0], *sys.argv[2:]]

    fn = COMMANDS.get(cmd)
    if fn is None:
        print(f"Unknown command: {cmd!r}")
        print(f"Available: {', '.join(COMMANDS)}")
        sys.exit(1)

    fn()


if __name__ == "__main__":
    main()
