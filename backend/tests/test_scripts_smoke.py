from pathlib import Path


def test_backend_scripts_exist() -> None:
    assert Path("backend/scripts/build_5etools_data.py").exists()
    assert Path("backend/scripts/sync_data.py").exists()
