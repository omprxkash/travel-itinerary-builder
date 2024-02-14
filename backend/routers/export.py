from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import Itinerary
from services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/export/pdf")
def export_pdf(itinerary: Itinerary) -> Response:
    try:
        pdf_bytes = generate_pdf(itinerary)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    filename = f"itinerary-{itinerary.destination.lower().replace(' ', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
