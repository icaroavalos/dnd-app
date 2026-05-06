from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ruleset_classes_endpoint_returns_results() -> None:
    response = client.get("/api/rulesets/5e-2024/classes")

    assert response.status_code == 200
    body = response.json()
    assert body["ruleset"] == "5e-2024"
    assert isinstance(body["results"], list)


def test_manifest_endpoint_returns_rulesets() -> None:
    response = client.get("/api/manifest")

    assert response.status_code == 200
    body = response.json()
    assert "rulesets" in body
    assert "5e-2024" in body["rulesets"]


def test_rulesets_endpoint_returns_known_rulesets() -> None:
    response = client.get("/api/rulesets")

    assert response.status_code == 200
    assert "5e-2024" in response.json()["rulesets"]


def test_features_endpoint_returns_merged_results() -> None:
    response = client.get("/api/rulesets/5e-2024/features")

    assert response.status_code == 200
    body = response.json()
    assert body["ruleset"] == "5e-2024"
    assert isinstance(body["results"], list)
    assert any("subclassShortName" in item for item in body["results"])


def test_unknown_ruleset_returns_not_found() -> None:
    response = client.get("/api/rulesets/not-a-ruleset/classes")

    assert response.status_code == 404
    assert response.json() == {"detail": "Catalog not found"}
