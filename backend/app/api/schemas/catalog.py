from pydantic import BaseModel


class CatalogListResponse(BaseModel):
    ruleset: str
    results: list[dict]
