import os
import httpx
from models.schemas import GeoResult


NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", "travel-itinerary-app/1.0")


async def geocode(query: str) -> GeoResult | None:
    """Query Nominatim and return the top result, or None if not found."""
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 0,
    }
    headers = {"User-Agent": USER_AGENT}

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(NOMINATIM_BASE, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    if not data:
        return None

    item = data[0]
    return GeoResult(
        lat=float(item["lat"]),
        lng=float(item["lon"]),
        display_name=item["display_name"],
    )
