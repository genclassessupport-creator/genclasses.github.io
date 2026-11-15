"""Strict parser: turn inline 'List-I: A. .., B. .., C. .., D. ..; List-II: 1. .., 2. .., 3. .., 4. ..'
into {intro, left[4], right[4]} so the test page never has to guess list items."""
import re

HDR_I = re.compile(r"(सूची|List)\s*[-–—]?\s*I(?!I)\b")
HDR_II = re.compile(r"(सूची|List)\s*[-–—]?\s*II\b")


def _find(text, label, start):
    m = re.compile(r"(?:^|(?<=[\s:;,(]))" + re.escape(label) + r"\.\s").search(text, start)
    return m


def parse(text):
    t = re.sub(r"\s+", " ", str(text or "")).strip()
    hdr2 = None
    marks = []
    pos = 0
    for lab in "ABCD":
        m = _find(t, lab, pos)
        if not m:
            return None
        marks.append(m)
        pos = m.end()
    for h in HDR_II.finditer(t):
        if h.start() > marks[3].end():
            hdr2 = h
            break
    if not hdr2:
        return None
    pos = hdr2.end()
    nmarks = []
    for lab in "1234":
        m = _find(t, lab, pos)
        if not m:
            return None
        nmarks.append(m)
        pos = m.end()
    hdr1 = [h for h in HDR_I.finditer(t) if h.start() < marks[0].start()]
    if not hdr1:
        return None
    h1 = hdr1[-1]
    intro = t[: h1.start()].strip().rstrip(":：;,–— ")
    lab1 = t[h1.end(): marks[0].start()].strip(" :：;,")
    lab2 = t[hdr2.end(): nmarks[0].start()].strip(" :：;,")
    if lab1 or lab2:
        w1, w2 = h1.group(0), hdr2.group(0)
        parts = [f"{w1} {lab1}".strip() if lab1 else "", f"{w2} {lab2}".strip() if lab2 else ""]
        intro = (intro + " — " if intro else "") + "; ".join(x for x in parts if x)

    def items(ms, end):
        out = []
        for i, m in enumerate(ms):
            stop = ms[i + 1].start() if i + 1 < len(ms) else end
            out.append(t[m.end():stop].strip().rstrip(",;:।. ").strip())
        return out

    left = items(marks, hdr2.start())
    # drop trailing "List-II (label)" leftovers from item D
    right = items(nmarks, len(t))
    # drop a trailing instruction ("नीचे दिए गए कूट…", "Select the correct answer…") glued to item 4
    right[-1] = re.split(r"[।.;]?\s*(?:नीचे दिए|दिए गए कूट|कूट का प्रयोग|Select the correct|Choose the correct|Use the code)", right[-1])[0].strip().rstrip(",;:।. ")
    if any(not x for x in left + right):
        return None
    if any(re.search(r"(सूची|List)\s*[-–—]?\s*I", x) for x in left + right):
        return None
    return {"intro": intro, "left": left, "right": right}


CUE = re.compile(r"(उपर्युक्त|उपरोक्त|ऊपर दिए|नीचे दिए|इनमें से|निम्नलिखित में से|सही कूट|सही क्रम|सही कालक्रम|कूट का|कितने|कौन|Which|How many|Select|Choose|Of the above|Arrange|What is the correct|the correct)", re.I)


def parse_statements(text):
    """'stem: 1. .. 2. .. 3. .. question?' or 'कथन 1: .. कथन 2: ..' -> {stem, items[[tag, body]], outro}"""
    t = re.sub(r"\s+", " ", str(text or "")).strip()
    kre = re.compile(r"(कथन|Statement)\s*(\d)\s*[:：]\s*", re.I)
    km = list(kre.finditer(t))
    marks = []
    if len(km) >= 2 and [int(m.group(2)) for m in km] == list(range(1, len(km) + 1)):
        marks = [(m.start(), m.end(), f"{m.group(1)} {m.group(2)}") for m in km]
    else:
        nre = re.compile(r"(?:(?<=^)|(?<=[\s:：।;,?(]))(\d{1,2})\.\s")
        pos, want = 0, 1
        while True:
            m = None
            for c in nre.finditer(t, pos):
                if int(c.group(1)) == want:
                    m = c
                    break
            if not m:
                break
            marks.append((m.start(), m.end(), f"{want}."))
            pos, want = m.end(), want + 1
    if len(marks) < 2:
        return None
    stem = t[: marks[0][0]].strip()
    items = []
    for i, (s, e, tag) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(t)
        items.append([tag, t[e:stop].strip().rstrip(",;")])
    last = items[-1][1]
    outro = ""
    if last.endswith("?") or last.endswith(":"):
        # final question sentence after the last full stop / danda
        cut = max(last.rfind("। "), last.rfind(". "), last.rfind("; "))
        frag = last[cut + 2:] if cut >= 0 else ""
        if cut >= 0 and CUE.search(frag):
            items[-1][1], outro = last[: cut + 1].strip(), frag.strip()
        else:
            m = CUE.search(last)
            if m and m.start() > 3:
                items[-1][1], outro = last[: m.start()].strip().rstrip(","), last[m.start():].strip()
    if any(not b for _, b in items):
        return None
    return {"stem": stem, "items": items, "outro": outro}
