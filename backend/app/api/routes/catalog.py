from fastapi import APIRouter, HTTPException

from app.api.schemas.catalog import CatalogListResponse
from app.infrastructure.repositories.data_repository import DataRepository
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/api", tags=["catalog"])
service = CatalogService(DataRepository())


def _catalog_response(ruleset: str, name: str) -> CatalogListResponse:
    try:
        return CatalogListResponse(**service.get_catalog(ruleset, name))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Catalog not found") from exc


def _features_response(ruleset: str) -> CatalogListResponse:
    try:
        return CatalogListResponse(**service.get_features_catalog(ruleset))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Catalog not found") from exc


@router.get("/manifest")
def manifest() -> dict:
    return service.get_manifest()


@router.get("/rulesets")
def rulesets() -> dict[str, list[str]]:
    return {"rulesets": service.list_rulesets()}


@router.get("/rulesets/{ruleset}/classes", response_model=CatalogListResponse)
def classes(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "classes")


@router.get("/rulesets/{ruleset}/subclasses", response_model=CatalogListResponse)
def subclasses(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "subclasses")


@router.get("/rulesets/{ruleset}/races", response_model=CatalogListResponse)
def races(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "races")


@router.get("/rulesets/{ruleset}/subraces", response_model=CatalogListResponse)
def subraces(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "subraces")


@router.get("/rulesets/{ruleset}/backgrounds", response_model=CatalogListResponse)
def backgrounds(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "backgrounds")


@router.get("/rulesets/{ruleset}/equipment", response_model=CatalogListResponse)
def equipment(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "equipment")


@router.get("/rulesets/{ruleset}/feats", response_model=CatalogListResponse)
def feats(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "feats")


@router.get("/rulesets/{ruleset}/spells", response_model=CatalogListResponse)
def spells(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "spells")


@router.get("/rulesets/{ruleset}/class-spells", response_model=CatalogListResponse)
def class_spells(ruleset: str) -> CatalogListResponse:
    return _catalog_response(ruleset, "class-spells")


@router.get("/rulesets/{ruleset}/features", response_model=CatalogListResponse)
def features(ruleset: str) -> CatalogListResponse:
    return _features_response(ruleset)
