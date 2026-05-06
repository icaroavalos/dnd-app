from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_capabilities_endpoint_describes_storage_state() -> None:
    response = client.get("/api/capabilities")

    assert response.status_code == 200
    assert response.json()["persistence"] is False
    assert response.json()["storage"] == "browser"
    assert response.json()["future_storage_supported"] is True
