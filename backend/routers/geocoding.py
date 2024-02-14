from fastapi import APIRouter, HTTPException, Query
from models.schemas import GeoResult
from services.geocoding_service import geocode as _geocode

router = APIRouter()


@router.get("/geocode", response_model=GeoResult)
async def geocode_endpoint(q: str = Query(..., min_length=2)) -> GeoResult:
    result = await _geocode(q)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Location not found: {q}")
    return result
