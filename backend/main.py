import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import itinerary, geocoding, export

load_dotenv()

app = FastAPI(title="Travel Itinerary Builder", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itinerary.router, prefix="/api")
app.include_router(geocoding.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
