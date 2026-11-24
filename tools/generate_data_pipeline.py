from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "assets" / "evidence" / "data-pipeline.png"

W, H = 1600, 900
BG = "#060606"
PANEL = "#111111"
WHITE = "#F4F4EF"
MUTED = "#9B9B94"
LINE = "#41413D"
NEUTRAL = "#8A8A82"
ACCENT = "#D4FF00"
ACTUAL = "#8296FF"
SYNTHETIC = "#D4FF00"
QA = "#74D98A"

REGULAR = Path(r"C:\Windows\Fonts\malgun.ttf")
BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(BOLD if bold else REGULAR), size)


def text(draw, xy, value, size, color=WHITE, bold=False, anchor=None):
    draw.text(xy, value, fill=color, font=font(size, bold), anchor=anchor)


def arrow(draw, start, end, color=LINE, width=3):
    x1, y1 = start
    x2, y2 = end
    draw.line((x1, y1, x2, y2), fill=color, width=width)
    if abs(x2 - x1) >= abs(y2 - y1):
        direction = 1 if x2 > x1 else -1
        head = [(x2, y2), (x2 - direction * 12, y2 - 7), (x2 - direction * 12, y2 + 7)]
    else:
        direction = 1 if y2 > y1 else -1
        head = [(x2, y2), (x2 - 7, y2 - direction * 12), (x2 + 7, y2 - direction * 12)]
    draw.polygon(head, fill=color)


def dashed_rect(draw, box, color, dash=12, gap=7, width=2):
    x1, y1, x2, y2 = box
    for x in range(x1, x2, dash + gap):
        draw.line((x, y1, min(x + dash, x2), y1), fill=color, width=width)
        draw.line((x, y2, min(x + dash, x2), y2), fill=color, width=width)
    for y in range(y1, y2, dash + gap):
        draw.line((x1, y, x1, min(y + dash, y2)), fill=color, width=width)
        draw.line((x2, y, x2, min(y + dash, y2)), fill=color, width=width)


def card(draw, box, step, title, lines, accent=LINE, dashed=False, metric=None):
    x1, y1, x2, y2 = box
    draw.rectangle(box, fill=PANEL)
    if dashed:
        dashed_rect(draw, box, accent)
    else:
        draw.rectangle(box, outline=accent, width=2)
    text(draw, (x1 + 24, y1 + 22), f"{step:02d}", 17, accent, True)
    text(draw, (x1 + 24, y1 + 54), title, 25, WHITE, True)
    y = y1 + 98
    for line in lines:
        text(draw, (x1 + 24, y), line, 16, MUTED)
        y += 30
    if metric:
        text(draw, (x1 + 24, y2 - 30), metric, 17, accent, True, anchor="ls")


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)

    text(draw, (70, 55), "DATA PIPELINE · SOURCE TO DECISION", 16, ACCENT, True)
    text(draw, (70, 92), "H&M 판매 데이터를 MD 판단 정보로 바꾸는 과정", 43, WHITE, True)
    text(
        draw,
        (70, 155),
        "실제 판매 기록을 정제하고, 원본에 없는 운영 조건은 별도 생성·검증한 뒤 분석 DB에 연결했습니다.",
        19,
        MUTED,
    )

    top_y1, top_y2 = 230, 425
    bottom_y1, bottom_y2 = 535, 750
    top = [(70, top_y1, 490, top_y2), (590, top_y1, 1010, top_y2), (1110, top_y1, 1530, top_y2)]
    bottom = [
        (70, bottom_y1, 385, bottom_y2),
        (455, bottom_y1, 770, bottom_y2),
        (840, bottom_y1, 1155, bottom_y2),
        (1225, bottom_y1, 1540, bottom_y2),
    ]

    card(draw, top[0], 1, "H&M 원본 데이터", ["transactions_train.csv", "articles.csv"], ACTUAL, metric="31,788,324건 · 105,542종")
    card(draw, top[1], 2, "분석 범위 선정", ["여성복 3개 섹션", "2019·2020년 7–8월"], NEUTRAL, metric="기준일 2020-08-31")
    card(draw, top[2], 3, "정제·집계", ["article_id를 문자열로 보존", "상품×일자×채널 단위 집계"], NEUTRAL, metric="90,754행 · 286종")

    card(draw, bottom[0], 4, "운영 사례 선별", ["판매 변화 유형 분류", "8/31 이후 판매는 선정에 미사용"], NEUTRAL, metric="46종")
    card(draw, bottom[1], 5, "가상 운영 조건 생성", ["재고·발주·리드타임", "판매가·원가·상품 상태"], SYNTHETIC, dashed=True, metric="46 · 3,864 · 92 · 52행")
    card(draw, bottom[2], 6, "전수 QA", ["SKU·수불·발주↔입고", "음수 재고·정보 누출 검사"], QA, metric="검증 실패 0건")
    card(draw, bottom[3], 7, "SQLite 분석 DB", ["판매 변화·재고 소진", "전략 손익·판단·시즌 기획"], ACCENT, metric="MD 의사결정 화면")

    arrow(draw, (490, 327), (590, 327))
    arrow(draw, (1010, 327), (1110, 327))
    # Wrap the flow to the second row without a diagonal crossing.
    draw.line((1320, 425, 1320, 475, 227, 475, 227, 535), fill=LINE, width=3)
    draw.polygon([(227, 535), (220, 523), (234, 523)], fill=LINE)
    arrow(draw, (385, 642), (455, 642))
    arrow(draw, (770, 642), (840, 642))
    arrow(draw, (1155, 642), (1225, 642))

    # Legend and source note.
    draw.line((70, 815, 105, 815), fill=ACTUAL, width=4)
    text(draw, (117, 815), "H&M 실제 상품·판매", 14, WHITE, anchor="lm")
    for x in range(330, 365, 9):
        draw.line((x, 815, min(x + 5, 365), 815), fill=SYNTHETIC, width=4)
    text(draw, (377, 815), "규칙 기반 가상 운영 조건", 14, WHITE, anchor="lm")
    draw.line((630, 815, 665, 815), fill=QA, width=4)
    text(draw, (677, 815), "생성 후 전수 검증", 14, WHITE, anchor="lm")

    text(
        draw,
        (70, 858),
        "실제: 상품 정보·관측 판매  |  가상: 재고·발주·리드타임·원화 판매가·원가·상품 상태",
        15,
        MUTED,
    )

    image.save(OUT, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
