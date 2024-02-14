from fastapi import APIRouter, HTTPException
from models.schemas import Itinerary, TripInput, CityInfo
from services.planner_service import generate_itinerary, list_cities

router = APIRouter()


@router.post("/generate", response_model=Itinerary)
def generate(trip: TripInput) -> Itinerary:
    if trip.end_date < trip.start_date:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date")
    try:
        return generate_itinerary(trip)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/cities", response_model=list[CityInfo])
def cities() -> list[CityInfo]:
    return [CityInfo(**c) for c in list_cities()]
