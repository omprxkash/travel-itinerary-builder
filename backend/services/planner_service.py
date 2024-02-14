from __future__ import annotations
import json
import math
import os
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from models.schemas import Activity, DayPlan, Itinerary, TripInput

POI_DIR = Path(__file__).parent.parent / "data" / "poi"

BUDGET_TIERS: dict[str, list[str]] = {
    "budget": ["budget"],
    "mid-range": ["budget", "mid-range"],
    "luxury": ["budget", "mid-range", "luxury"],
}

COST_ESTIMATES: dict[str, dict[str, str]] = {
    "budget": {"attraction": "Free–€10", "restaurant": "€8–€15", "museum": "€5–€12"},
    "mid-range": {"attraction": "€10–€30", "restaurant": "€15–€35", "museum": "€12–€20"},
    "luxury": {"attraction": "€30+", "restaurant": "€60–€150+", "museum": "€20+"},
}

PACKING_TIPS: dict[str, list[str]] = {
    "paris": ["A light scarf goes with everything and blocks café drafts.", "Metro tickets — buy a carnet of 10.", "Comfortable walking shoes; Paris cobblestones are no joke.", "Small day-bag; most museums ban large backpacks."],
    "tokyo": ["IC card (Suica or Pasmo) for seamless transit everywhere.", "Cash — many ramen shops and small restaurants are cash-only.", "Portable Wi-Fi or SIM card; offline maps won't cut it.", "Collapsible bag for convenience store hauls."],
    "rome": ["Book Colosseum and Vatican tickets at least a week ahead.", "A water bottle — Rome has 2,500 free fountains (nasoni).", "Modest clothing (covered shoulders and knees) for churches.", "Euros in cash; tourist spots sometimes 'forget' the card machine."],
}

DEFAULT_TIPS = [
    "Download offline maps before you leave.",
    "Keep digital and paper copies of important documents.",
    "Notify your bank before travelling.",
    "A small first-aid kit is always worth the bag space.",
]


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in kilometres between two coordinates."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def _load_pois(destination: str) -> list[dict]:
    key = destination.strip().lower()
    for path in POI_DIR.glob("*.json"):
        if path.stem.lower() == key:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    raise ValueError(f"No curated POI data for '{destination}'. Available: {[p.stem for p in POI_DIR.glob('*.json')]}")


def _filter_pois(pois: list[dict], interests: list[str], budget_level: str) -> list[dict]:
    allowed_tiers = BUDGET_TIERS[budget_level]
    interest_set = set(i.lower() for i in interests) if interests else None

    result = []
    for poi in pois:
        if poi["avg_cost"] not in allowed_tiers:
            continue
        if interest_set:
            if not set(t.lower() for t in poi.get("tags", [])) & interest_set:
                continue
        result.append(poi)

    if len(result) < 10:
        # Relax interest filter if too few results
        result = [p for p in pois if p["avg_cost"] in allowed_tiers]
    return result


def _parse_open_hours(open_hours: str) -> list[tuple[int, int]]:
    """Return list of (start_minutes, end_minutes) from '09:00-18:00' or '09:00-14:00,18:00-22:00'."""
    windows = []
    for slot in open_hours.split(","):
        slot = slot.strip()
        if "-" not in slot:
            continue
        parts = slot.split("-")
        if len(parts) != 2:
            continue
        try:
            sh, sm = map(int, parts[0].split(":"))
            eh, em = map(int, parts[1].split(":"))
            windows.append((sh * 60 + sm, eh * 60 + em))
        except ValueError:
            continue
    return windows or [(9 * 60, 21 * 60)]


def _is_open(poi: dict, current_minutes: int, duration: int) -> bool:
    windows = _parse_open_hours(poi.get("open_hours", "09:00-21:00"))
    for start, end in windows:
        if start <= current_minutes and (current_minutes + duration) <= end:
            return True
    return False


def _format_time(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    return f"{h:02d}:{m:02d}"


def _cost_label(poi: dict, budget_level: str) -> str:
    ptype = poi.get("type", "attraction")
    category = "restaurant" if ptype == "restaurant" else ("museum" if ptype == "museum" else "attraction")
    tier = poi.get("avg_cost", budget_level)
    return COST_ESTIMATES.get(tier, COST_ESTIMATES["mid-range"]).get(category, "Varies")


def _transport_tip(poi_a: dict, poi_b: dict) -> str:
    dist = haversine(poi_a["lat"], poi_a["lng"], poi_b["lat"], poi_b["lng"])
    if dist < 0.5:
        return "Short walk (under 10 min)"
    if dist < 2.0:
        return f"Walk or metro (~{round(dist * 12)} min walk)"
    return f"Metro or taxi recommended (~{round(dist, 1)} km)"


def _nearest_restaurant(candidate: dict, restaurants: list[dict], used: set) -> dict | None:
    available = [r for r in restaurants if id(r) not in used]
    if not available:
        return None
    return min(available, key=lambda r: haversine(candidate["lat"], candidate["lng"], r["lat"], r["lng"]))


def _build_day_theme(attractions: list[dict]) -> str:
    """Pick a theme label based on the most common interest tag for the day."""
    tags: dict[str, int] = {}
    for a in attractions:
        for t in a.get("tags", []):
            tags[t] = tags.get(t, 0) + 1
    if not tags:
        return "Exploring the city"
    top = max(tags, key=tags.__getitem__)
    themes = {
        "history": "Diving into history",
        "art": "Art and culture day",
        "food": "A day for the palate",
        "nature": "Parks and open air",
        "nightlife": "Neighbourhoods and nightlife",
        "adventure": "Off the beaten path",
        "culture": "Culture and local life",
        "sightseeing": "Classic sights",
        "architecture": "Architecture walk",
    }
    return themes.get(top, "A day in the city")


def _cluster_by_proximity(pois: list[dict]) -> list[dict]:
    """Greedy reorder so consecutive POIs are geographically close."""
    if not pois:
        return pois
    ordered = [pois[0]]
    remaining = list(pois[1:])
    while remaining:
        last = ordered[-1]
        nearest = min(remaining, key=lambda p: haversine(last["lat"], last["lng"], p["lat"], p["lng"]))
        ordered.append(nearest)
        remaining.remove(nearest)
    return ordered


def generate_itinerary(trip: TripInput) -> Itinerary:
    all_pois = _load_pois(trip.destination)
    filtered = _filter_pois(all_pois, trip.interests, trip.budget_level)

    restaurants = [p for p in filtered if p["type"] == "restaurant"]
    attractions = [p for p in filtered if p["type"] != "restaurant"]

    num_days = max(1, (trip.end_date - trip.start_date).days + 1)

    used_attractions: set[int] = set()
    used_restaurants: set[int] = set()
    days: list[DayPlan] = []

    daily_cost_num = 0.0

    for day_num in range(1, num_days + 1):
        day_date = trip.start_date + timedelta(days=day_num - 1)
        current_time = 9 * 60  # 09:00
        end_of_day = 22 * 60  # 22:00

        day_pois: list[dict] = []
        day_activities: list[Activity] = []
        last_poi: dict | None = None

        # Pick a cluster of attractions for this day
        available = [a for a in attractions if id(a) not in used_attractions]
        # Seed: pick one and cluster around it
        if not available:
            used_attractions.clear()
            available = list(attractions)

        seed = available[0]
        cluster = sorted(available, key=lambda p: haversine(seed["lat"], seed["lng"], p["lat"], p["lng"]))[:8]
        cluster = _cluster_by_proximity(cluster)

        attraction_iter = iter(cluster)
        meal_times = {12 * 60: False, 19 * 60: False}  # lunch / dinner slots

        while current_time < end_of_day:
            # Check if it's meal time
            meal_inserted = False
            for meal_time, done in sorted(meal_times.items()):
                if not done and current_time >= meal_time - 30:
                    anchor = last_poi or seed
                    if not any(id(r) not in used_restaurants for r in restaurants):
                        used_restaurants.clear()
                    restaurant = _nearest_restaurant(anchor, restaurants, used_restaurants)
                    if restaurant and _is_open(restaurant, current_time, restaurant["duration_minutes"]):
                        transport = _transport_tip(last_poi, restaurant) if last_poi else "Short walk"
                        day_activities.append(Activity(
                            time=_format_time(current_time),
                            name=restaurant["name"],
                            type="restaurant",
                            description=restaurant["description"],
                            duration_minutes=restaurant["duration_minutes"],
                            estimated_cost=_cost_label(restaurant, trip.budget_level),
                            address=restaurant["address"],
                            tips=f"Transport from previous stop: {transport}",
                            lat=restaurant.get("lat"),
                            lng=restaurant.get("lng"),
                        ))
                        used_restaurants.add(id(restaurant))
                        current_time += restaurant["duration_minutes"] + 15
                        last_poi = restaurant
                        meal_times[meal_time] = True
                        meal_inserted = True
                        break

            if meal_inserted:
                continue

            # Pick next attraction
            try:
                poi = next(attraction_iter)
            except StopIteration:
                break

            if id(poi) in used_attractions:
                continue
            if not _is_open(poi, current_time, poi["duration_minutes"]):
                current_time += 30
                continue
            if current_time + poi["duration_minutes"] > end_of_day:
                break

            transport = _transport_tip(last_poi, poi) if last_poi else "Short walk from your accommodation"
            booking = poi.get("type") in ("museum", "attraction") and poi.get("avg_cost") != "budget"

            day_activities.append(Activity(
                time=_format_time(current_time),
                name=poi["name"],
                type=poi["type"],
                description=poi["description"],
                duration_minutes=poi["duration_minutes"],
                estimated_cost=_cost_label(poi, trip.budget_level),
                address=poi["address"],
                tips=f"Transport: {transport}",
                booking_required=booking,
                lat=poi.get("lat"),
                lng=poi.get("lng"),
            ))
            used_attractions.add(id(poi))
            day_pois.append(poi)
            current_time += poi["duration_minutes"] + 20  # 20 min buffer between stops
            last_poi = poi

        # Ensure at least 2 activities by adding a meal fallback if needed
        if len(day_activities) == 1 and restaurants:
            if not any(id(r) not in used_restaurants for r in restaurants):
                used_restaurants.clear()
            fallback = next((r for r in restaurants if id(r) not in used_restaurants), restaurants[0])
            end_time = current_time
            day_activities.append(Activity(
                time=_format_time(end_time),
                name=fallback["name"],
                type="restaurant",
                description=fallback["description"],
                duration_minutes=fallback["duration_minutes"],
                estimated_cost=_cost_label(fallback, trip.budget_level),
                address=fallback["address"],
                tips="A perfect spot to wind down the day.",
                lat=fallback.get("lat"),
                lng=fallback.get("lng"),
            ))
            used_restaurants.add(id(fallback))

        # Estimate daily budget
        # Simple: 2 meals + avg 3 attractions
        if trip.budget_level == "budget":
            day_budget = f"€40–€70 per person"
        elif trip.budget_level == "mid-range":
            day_budget = f"€80–€150 per person"
        else:
            day_budget = f"€200–€400 per person"

        # Transport tips for the day
        if len(day_activities) > 1:
            first_act = day_activities[0]
            last_act = day_activities[-1]
            total_dist = sum(
                haversine(day_activities[i].lat or 0, day_activities[i].lng or 0,
                          day_activities[i + 1].lat or 0, day_activities[i + 1].lng or 0)
                for i in range(len(day_activities) - 1)
                if day_activities[i].lat and day_activities[i + 1].lat
            )
            if total_dist > 5:
                transport_tips = "Consider a day transit pass — you'll cover a fair amount of ground today."
            else:
                transport_tips = "Most stops are walkable. Comfortable shoes are the only transport you need."
        else:
            transport_tips = "Compact day — easy on the feet."

        theme = _build_day_theme(day_pois) if day_pois else "Exploring the city"

        days.append(DayPlan(
            day=day_num,
            date=day_date.strftime("%Y-%m-%d"),
            theme=theme,
            activities=day_activities if day_activities else [
                Activity(
                    time="09:00",
                    name=f"Explore {trip.destination}",
                    type="sightseeing",
                    description="A free morning to wander and discover the neighbourhood at your own pace.",
                    duration_minutes=120,
                    estimated_cost="Free",
                    address=trip.destination,
                )
            ],
            daily_budget_estimate=day_budget,
            transport_tips=transport_tips,
        ))

    # Total budget
    multipliers = {"budget": (40, 70), "mid-range": (80, 150), "luxury": (200, 400)}
    low, high = multipliers[trip.budget_level]
    total_low = low * num_days * trip.num_travelers
    total_high = high * num_days * trip.num_travelers
    total_budget = f"€{total_low:,}–€{total_high:,} for {trip.num_travelers} traveller{'s' if trip.num_travelers != 1 else ''}"

    dest_key = trip.destination.strip().lower()
    packing = PACKING_TIPS.get(dest_key, DEFAULT_TIPS)

    summary = (
        f"A {num_days}-day trip to {trip.destination} shaped around your interest in "
        f"{', '.join(trip.interests) if trip.interests else 'everything the city has to offer'}. "
        f"Planned for {trip.num_travelers} traveller{'s' if trip.num_travelers != 1 else ''} "
        f"on a {trip.budget_level} budget."
    )

    return Itinerary(
        destination=trip.destination,
        summary=summary,
        days=days,
        total_budget_estimate=total_budget,
        packing_tips=packing,
    )


def list_cities() -> list[dict]:
    cities = []
    meta = {
        "paris": {"display_name": "Paris", "country": "France", "lat": 48.8566, "lng": 2.3522},
        "tokyo": {"display_name": "Tokyo", "country": "Japan", "lat": 35.6762, "lng": 139.6503},
        "rome": {"display_name": "Rome", "country": "Italy", "lat": 41.9028, "lng": 12.4964},
    }
    for path in sorted(POI_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            pois = json.load(f)
        key = path.stem.lower()
        info = meta.get(key, {"display_name": path.stem.title(), "country": "", "lat": 0.0, "lng": 0.0})
        cities.append({
            "name": key,
            "display_name": info["display_name"],
            "country": info["country"],
            "lat": info["lat"],
            "lng": info["lng"],
            "poi_count": len(pois),
        })
    return cities
