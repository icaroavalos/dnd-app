from pydantic import BaseModel


class CapabilitiesResponse(BaseModel):
    persistence: bool
    storage: str
    future_storage_supported: bool
