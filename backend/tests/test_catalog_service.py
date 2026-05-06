from app.infrastructure.repositories.data_repository import DataRepository
from app.services.catalog_service import CatalogService


def test_catalog_service_lists_known_rulesets() -> None:
    service = CatalogService(DataRepository())

    rulesets = service.list_rulesets()

    assert "5e-2014" in rulesets
    assert "5e-2024" in rulesets
