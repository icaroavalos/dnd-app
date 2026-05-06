from fastapi import APIRouter

from app.api.schemas.common import CapabilitiesResponse

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/capabilities", response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    return CapabilitiesResponse(
        persistence=False,
        storage="browser",
        future_storage_supported=True,
    )
