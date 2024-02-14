from __future__ import annotations
from models.schemas import Itinerary


def _build_html(itinerary: Itinerary) -> str:
    days_html = ""
    for day in itinerary.days:
        activities_html = ""
        for act in day.activities:
            booking_badge = '<span style="color:#b45309;font-size:11px;margin-left:6px;">[Book ahead]</span>' if act.booking_required else ""
            activities_html += f"""
            <div style="margin-bottom:14px;padding:12px 14px;border-left:3px solid #2563eb;background:#f8fafc;">
              <div style="display:flex;align-items:baseline;gap:10px;">
                <span style="font-weight:700;color:#1e40af;min-width:50px;">{act.time}</span>
                <span style="font-weight:600;font-size:14px;">{act.name}</span>{booking_badge}
              </div>
              <p style="margin:6px 0 4px;color:#374151;font-size:13px;">{act.description}</p>
              <div style="font-size:12px;color:#6b7280;">
                📍 {act.address} &nbsp;·&nbsp; ⏱ {act.duration_minutes} min &nbsp;·&nbsp; 💰 {act.estimated_cost}
              </div>
              {"<div style='font-size:12px;color:#6b7280;margin-top:3px;'>💡 " + act.tips + "</div>" if act.tips else ""}
            </div>"""

        days_html += f"""
        <div style="margin-bottom:28px;page-break-inside:avoid;">
          <h2 style="margin:0 0 4px;color:#1e3a8a;font-size:17px;border-bottom:2px solid #dbeafe;padding-bottom:6px;">
            Day {day.day} — {day.date} &nbsp;<span style="font-weight:400;font-size:14px;color:#6b7280;">{day.theme}</span>
          </h2>
          <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">
            Budget estimate: {day.daily_budget_estimate} &nbsp;·&nbsp; {day.transport_tips}
          </div>
          {activities_html}
        </div>"""

    packing_items = "".join(f"<li>{tip}</li>" for tip in itinerary.packing_tips)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 32px 40px; color: #111827; font-size: 13px; }}
  h1 {{ font-size: 24px; color: #1e3a8a; margin-bottom: 4px; }}
  .summary {{ color: #374151; margin-bottom: 24px; font-size: 14px; line-height: 1.6; }}
  .meta {{ background: #eff6ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af; }}
  ul {{ padding-left: 18px; color: #374151; line-height: 1.8; }}
</style>
</head>
<body>
  <h1>✈ {itinerary.destination} — Travel Itinerary</h1>
  <p class="summary">{itinerary.summary}</p>
  <div class="meta">
    <strong>Total budget estimate:</strong> {itinerary.total_budget_estimate}
  </div>

  {days_html}

  <div style="margin-top:28px;padding:16px;background:#f0fdf4;border-radius:8px;page-break-inside:avoid;">
    <h3 style="margin:0 0 8px;color:#166534;">Packing tips</h3>
    <ul>{packing_items}</ul>
  </div>
</body>
</html>"""


def generate_pdf(itinerary: Itinerary) -> bytes:
    try:
        import weasyprint
        html = _build_html(itinerary)
        return weasyprint.HTML(string=html).write_pdf()
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed. Run: pip install weasyprint")
