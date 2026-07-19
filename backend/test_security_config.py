"""Kiem thu viec resolve SECRET_KEY luc khoi dong app.core.security.

Dung subprocess (khong import truc tiep trong process test) vi hanh vi can kiem tra
xay ra o thoi diem MODULE duoc import lan dau - python cache import nen khong the
import lai voi bien moi truong khac trong cung mot process.
"""
import subprocess
import sys


def _run(env_overrides: dict[str, str], code: str) -> subprocess.CompletedProcess:
    env = {"PATH": __import__("os").environ.get("PATH", "")}
    env.update(env_overrides)
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=__import__("os").path.dirname(__file__) or ".",
        env=env,
        capture_output=True,
        text=True,
    )


_IMPORT_CODE = "from app.core import security; print(security.SECRET_KEY)"


def test_production_without_secret_key_fails_loudly():
    result = _run({"ENVIRONMENT": "production"}, _IMPORT_CODE)
    assert result.returncode != 0, result.stdout
    assert "SECRET_KEY" in result.stderr


def test_production_with_secret_key_starts_normally():
    result = _run(
        {"ENVIRONMENT": "production", "SECRET_KEY": "real-secret-abc"}, _IMPORT_CODE
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "real-secret-abc"


def test_dev_without_secret_key_gets_random_fallback_not_fixed_string():
    first = _run({}, _IMPORT_CODE)
    second = _run({}, _IMPORT_CODE)
    assert first.returncode == 0, first.stderr
    assert second.returncode == 0, second.stderr
    key_a, key_b = first.stdout.strip(), second.stdout.strip()
    assert key_a != key_b, "moi lan khoi dong dev/CI phai sinh secret khac nhau"
    assert key_a != "default-fallback-secret-key-for-development"


if __name__ == "__main__":
    test_production_without_secret_key_fails_loudly()
    test_production_with_secret_key_starts_normally()
    test_dev_without_secret_key_gets_random_fallback_not_fixed_string()
    print("[SUCCESS] SECRET_KEY resolution (fail-fast production / random dev) test passed.")
