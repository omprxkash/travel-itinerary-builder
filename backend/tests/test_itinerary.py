from __future__ import annotations
import sys
import os
from datetime import date
from unittest.mock import AsyncMock, patch

import pytest

# Make backend importable from tests/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.schemas import TripInput
from services.planner_service import generate_itinerary, list_cities


def make_trip(**kwargs) -> TripInput:
    defaults = dict(
        destination="tokyo",
        start_date=date(2025, 10, 1),
        end_date=date(2025, 10, 5),
        num_travelers=2,
        budget_level="mid-range",
        interests=["history", "food"],
    )
    defaults.update(kwargs)
    return TripInput(**defaults)


def test_tokyo_5day_plan():
    trip = make_trip()
    result = generate_itinerary(trip)

    assert result.destination == "tokyo"
    assert len(result.days) == 5
    for day in result.days:
        assert len(day.activities) >= 2, f"Day {day.day} has fewer than 2 activities"
        assert day.theme
        assert day.daily_budget_estimate


def test_paris_3day_plan():
    trip = make_trip(destination="paris", end_date=date(2025, 10, 3))
    result = generate_itinerary(trip)

    assert len(result.days) == 3
    assert result.total_budget_estimate
    assert len(result.packing_tips) > 0


def test_rome_plan():
    trip = make_trip(destination="rome", end_date=date(2025, 10, 2))
    result = generate_itinerary(trip)

    assert len(result.days) == 2


def test_budget_filter_excludes_luxury():
    trip = make_trip(destination="tokyo", budget_level="budget", interests=[])
    result = generate_itinerary(trip)

    for day in result.days:
        for act in day.activities:
            # Budget trips should not have "luxury" cost labels
            assert "luxury" not in act.estimated_cost.lower()


def test_single_day_trip():
    trip = make_trip(start_date=date(2025, 11, 1), end_date=date(2025, 11, 1))
    result = generate_itinerary(trip)
    assert len(result.days) == 1


def test_summary_mentions_interests():
    trip = make_trip(interests=["art", "food"])
    result = generate_itinerary(trip)
    assert "art" in result.summary or "food" in result.summary


def test_activities_have_lat_lng():
    trip = make_trip(destination="paris")
    result = generate_itinerary(trip)
    activities_with_coords = [
        a for day in result.days for a in day.activities if a.lat is not None
    ]
    assert len(activities_with_coords) > 0


def test_list_cities_returns_three():
    cities = list_cities()
    names = [c["name"] for c in cities]
    assert "paris" in names
    assert "tokyo" in names
    assert "rome" in names
    for c in cities:
        assert c["poi_count"] >= 25


def test_unknown_destination_raises():
    trip = make_trip(destination="atlantis")
    with pytest.raises(ValueError, match="No curated POI data"):
        generate_itinerary(trip)


@pytest.mark.asyncio
async def test_geocode_endpoint():
    from unittest.mock import AsyncMock, MagicMock, patch
    from services.geocoding_service import geocode

    mock_response = MagicMock()
    mock_response.json.return_value = [
        {"lat": "48.8566", "lon": "2.3522", "display_name": "Paris, France"}
    ]
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("services.geocoding_service.httpx.AsyncClient", return_value=mock_client):
        result = await geocode("Paris")

    assert result is not None
    assert abs(result.lat - 48.8566) < 0.01
    assert abs(result.lng - 2.3522) < 0.01
