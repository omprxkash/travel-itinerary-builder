from __future__ import annotations
from datetime import date
from typing import Literal
from pydantic import BaseModel, Field


class TripInput(BaseModel):
    destination: str
    start_date: date
    end_date: date
    num_travelers: int = 1
    budget_level: Literal["budget", "mid-range", "luxury"]
    interests: list[str]
    requirements: str = ""


class Activity(BaseModel):
    time: str
    name: str
    type: str
    description: str
    duration_minutes: int
    estimated_cost: str
    address: str
    tips: str = ""
    booking_required: bool = False
    lat: float | None = None
    lng: float | None = None


class DayPlan(BaseModel):
    day: int
    date: str
    theme: str
    activities: list[Activity]
    daily_budget_estimate: str
    transport_tips: str


class Itinerary(BaseModel):
    destination: str
    summary: str
    days: list[DayPlan]
    total_budget_estimate: str
    packing_tips: list[str]


class GeoResult(BaseModel):
    lat: float
    lng: float
    display_name: str


class CityInfo(BaseModel):
    name: str
    display_name: str
    country: str
    lat: float
    lng: float
    poi_count: int
