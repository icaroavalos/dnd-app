from fastapi import FastAPI

from app.api.routes.catalog import router as catalog_router
from app.api.routes.characters import router as characters_router
from app.api.routes.formulas import router as formulas_router
from app.api.routes.health import router as health_router

app = FastAPI(title="D&D Backend API")
app.include_router(health_router)
app.include_router(catalog_router)
app.include_router(characters_router)
app.include_router(formulas_router)
