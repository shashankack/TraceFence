"""Render fixtures/campus/docs/*.md into classification-bannered PDFs (synthetic demo data).
Usage: python3 md_to_pdf.py <docs_dir> <out_dir>   (needs reportlab)"""
import re, sys, pathlib
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem

BANNER = {"public": colors.HexColor("#2e7d32"), "internal": colors.HexColor("#b26a00"), "confidential": colors.HexColor("#b71c1c")}
ss = getSampleStyleSheet()
H1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=18, alignment=0, spaceAfter=6)
H2 = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=12.5, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("b", parent=ss["BodyText"], fontSize=10, leading=14)
META = ParagraphStyle("m", parent=BODY, fontSize=9, textColor=colors.HexColor("#555555"), leading=12)
CELL = ParagraphStyle("c", parent=BODY, fontSize=8.5, leading=11)

def inline(s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)

def render(md_path, out_path):
    lines = md_path.read_text().splitlines()
    cls = next((l.split(":", 1)[1].strip().lower() for l in lines if l.lower().startswith("classification:")), "public")
    owner = next((l.split(":", 1)[1].strip() for l in lines if l.startswith("Owner:")), "")
    banner_right = "PES University (public summary)" if "PES University" in owner else "NullTrace Institute (synthetic demo data)"
    title = next((l[2:] for l in lines if l.startswith("# ")), md_path.stem)
    story, bullets, table = [], [], []

    def flush():
        nonlocal bullets, table
        if bullets:
            story.append(ListFlowable([ListItem(Paragraph(inline(b), BODY), leftIndent=10) for b in bullets], bulletType="bullet", start="•", leftIndent=12))
            bullets = []
        if table:
            rows = [r for r in table if not re.fullmatch(r"\|?[\s|:-]+\|?", r)]
            data = [[Paragraph(inline(c.strip()), CELL) for c in r.strip("|").split("|")] for r in rows]
            t = Table(data, repeatRows=1, hAlign="LEFT")
            t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.grey), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eeeeee")), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
            story.extend([t, Spacer(1, 4)])
            table = []

    for l in lines:
        if l.startswith("|"):
            if bullets: flush()
            table.append(l); continue
        if table: flush()
        if l.startswith("- "):
            bullets.append(l[2:]); continue
        flush()
        if l.startswith("# "): story.append(Paragraph(inline(l[2:]), H1))
        elif l.startswith("## "): story.append(Paragraph(inline(l[3:]), H2))
        elif re.match(r"^(Classification|Owner|Source|Version|Posted|Demo note):", l): story.append(Paragraph(inline(l), META))
        elif l.strip(): story.append(Paragraph(inline(l), BODY))
    flush()

    def page(c, d):
        c.saveState()
        c.setFillColor(BANNER.get(cls, colors.black))
        c.rect(0, A4[1] - 12 * mm, A4[0], 12 * mm, fill=1, stroke=0)
        c.setFillColor(colors.white); c.setFont("Helvetica-Bold", 10)
        c.drawString(15 * mm, A4[1] - 8 * mm, f"CLASSIFICATION: {cls.upper()}")
        c.drawRightString(A4[0] - 15 * mm, A4[1] - 8 * mm, banner_right)
        c.setFillColor(colors.grey); c.setFont("Helvetica", 8)
        c.drawString(15 * mm, 10 * mm, f"{title} · Classification: {cls}")
        c.drawRightString(A4[0] - 15 * mm, 10 * mm, f"Page {d.page}")
        c.restoreState()

    SimpleDocTemplate(str(out_path), pagesize=A4, title=title, author="NullTrace Institute (synthetic)", subject=f"Classification: {cls}",
                      pageCompression=0, invariant=1, topMargin=20 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm).build(story, onFirstPage=page, onLaterPages=page)

if __name__ == "__main__":
    src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for md in sorted(src.glob("*.md")):
        render(md, out / f"{md.stem}.pdf"); print("wrote", out / f"{md.stem}.pdf")
