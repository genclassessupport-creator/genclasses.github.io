#!/usr/bin/env python3
"""Build UP TGT/PGT & GIC (GS section) Mock Tests 01–05 from Hindi markdown."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "assets" / "test-template.html").read_text(encoding="utf-8")
assert "__TEST_JSON__" in TEMPLATE

SRC_DIR = Path("/workspace/tgt-mocks")
OUT_DIR = ROOT / "tests" / "up-tgt-pgt-gic"
HUB_DIR = ROOT / "up-tgt-pgt-gic-mock"

Q_HEAD = re.compile(r"^\*\*(\d{1,2})\.\s+(.*?)\*\*\s*$")
SECTION = re.compile(r"^#{2,4}\s*भाग\s*\d+\s*:\s*(.+)$")
OPT = re.compile(r"^\(([a-dA-D])\)\s+(.*)$")
KEY_LINE = re.compile(r"^(\d{1,2})\.\s+\*\*\(([a-dA-D])\)\*\*\s*(.*)$")
KEY_LINE_ALT = re.compile(r"^(\d{1,2})\.\s+\(([a-dA-D])\)\s*(.*)$")

TOPIC_MAP = {
    "indian history": ("इतिहास", "History"),
    "history": ("इतिहास", "History"),
    "indian polity": ("राजव्यवस्था", "Polity"),
    "polity": ("राजव्यवस्था", "Polity"),
    "indian geography": ("भूगोल", "Geography"),
    "geography": ("भूगोल", "Geography"),
    "indian economy": ("अर्थव्यवस्था", "Economy"),
    "economy": ("अर्थव्यवस्था", "Economy"),
    "general science": ("सामान्य विज्ञान", "Science"),
    "science": ("सामान्य विज्ञान", "Science"),
    "ict": ("सूचना एवं संचार प्रौद्योगिकी", "ICT"),
    "information": ("सूचना एवं संचार प्रौद्योगिकी", "ICT"),
}


def clean_latex(s: str) -> str:
    s = str(s or "")

    def repl(m: re.Match) -> str:
        inner = m.group(1)
        inner = inner.replace(r"\rightarrow", "→")
        inner = inner.replace(r"\leftarrow", "←")
        inner = inner.replace(r"\circ", "°")
        inner = inner.replace(r"\cdot", "·")
        inner = inner.replace(r"\times", "×")
        inner = inner.replace(r"\pm", "±")
        inner = inner.replace(r"\%", "%")
        inner = inner.replace(r"\,", " ")
        inner = inner.replace(r"\;", " ")
        inner = inner.replace(r"\ ", " ")
        inner = re.sub(r"\\text\{([^}]*)\}", r"\1", inner)
        inner = re.sub(r"\\mathrm\{([^}]*)\}", r"\1", inner)
        inner = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}", r"\1/\2", inner)
        for _ in range(4):
            nxt = re.sub(r"([A-Za-z0-9])_\{([^}]+)\}", r"\1\2", inner)
            nxt = re.sub(r"([A-Za-z0-9])_([A-Za-z0-9]+)", r"\1\2", nxt)
            if nxt == inner:
                break
            inner = nxt
        inner = re.sub(r"\^\{([^}]+)\}", r"\1", inner)
        inner = re.sub(r"\^([^\s\\])", r"\1", inner)
        inner = re.sub(r"\\[a-zA-Z]+", "", inner)
        inner = inner.replace("\\", "")
        inner = re.sub(r"\s+", " ", inner).strip()
        return inner

    s = re.sub(r"\$([^$]+)\$", repl, s)
    s = re.sub(r"\\text\{([^}]*)\}", r"\1", s)
    s = s.replace(r"\rightarrow", "→")
    return s


def topic_of(heading: str) -> tuple[str, str]:
    raw = clean_latex(heading or "").strip()
    raw = re.sub(r"\s+", " ", raw)
    en = ""
    hi = raw
    m = re.search(r"\(([^)]+)\)\s*$", raw)
    if m:
        en = m.group(1).strip()
        hi = raw[: m.start()].strip(" —–-")
    blob = (en + " " + hi).lower()
    for key, pair in TOPIC_MAP.items():
        if key in blob:
            return pair
    if "सूचना" in hi or "संचार" in hi:
        return ("सूचना एवं संचार प्रौद्योगिकी", "ICT")
    if "विज्ञान" in hi:
        return ("सामान्य विज्ञान", "Science")
    if "अर्थ" in hi:
        return ("अर्थव्यवस्था", "Economy")
    if "भूगोल" in hi:
        return ("भूगोल", "Geography")
    if "राजव्यवस्था" in hi or "संविधान" in hi:
        return ("राजव्यवस्था", "Polity")
    if "इतिहास" in hi:
        return ("इतिहास", "History")
    return (hi or "सामान्य अध्ययन", en or "General Studies")


def norm_body_line(line: str) -> str:
    s = line.strip()
    s = re.sub(r"^[-*•·]\s+", "", s)
    s = re.sub(r"^\*\*(.+?)\*\*\s*$", r"\1", s)
    s = s.replace("**", "")
    s = clean_latex(s).strip()
    if re.match(r"^(सूची|List)\s*[-–—]?\s*I+\b", s, re.I) and not re.search(r"[:：]", s):
        s = s + ":"
    return s


def parse_keys(key_text: str) -> dict[int, tuple[int, str]]:
    """num -> (answer_index 0-3, explanation)"""
    out: dict[int, tuple[int, str]] = {}
    pending: int | None = None
    for line in key_text.splitlines():
        s = line.strip()
        if not s:
            continue
        m = KEY_LINE.match(s) or KEY_LINE_ALT.match(s)
        if m:
            num = int(m.group(1))
            idx = ord(m.group(2).upper()) - 65
            exp = clean_latex(m.group(3) or "").strip()
            out[num] = (idx if 0 <= idx <= 3 else -1, exp)
            pending = num
        elif pending is not None:
            hi, exp = out[pending][0], out[pending][1]
            extra = clean_latex(s)
            out[pending] = (hi, (exp + " " + extra).strip())
    return out


def parse_questions(q_text: str) -> tuple[list[dict], list[str]]:
    errors: list[str] = []
    lines = q_text.splitlines()
    topic_hi, topic_en = "सामान्य अध्ययन", "General Studies"
    qs: list[dict] = []
    i = 0
    n = len(lines)
    while i < n:
        raw = lines[i].strip()
        sm = SECTION.match(raw)
        if sm:
            topic_hi, topic_en = topic_of(sm.group(1))
            i += 1
            continue
        qm = Q_HEAD.match(raw)
        if not qm:
            i += 1
            continue
        num = int(qm.group(1))
        stem = clean_latex(qm.group(2).replace("**", "")).strip()
        body_lines: list[str] = []
        options: list[str] = []
        i += 1
        mode = "body"
        while i < n:
            s0 = lines[i].strip()
            if not s0 or s0 == "---":
                i += 1
                continue
            if Q_HEAD.match(s0) or SECTION.match(s0) or s0.startswith("## "):
                break
            om = OPT.match(s0)
            if om:
                mode = "opt"
                options.append(clean_latex(om.group(2).replace("**", "")).strip())
                i += 1
                continue
            if mode == "opt" and options:
                # continuation of last option (rare)
                options[-1] = (options[-1] + " " + clean_latex(s0.replace("**", ""))).strip()
                i += 1
                continue
            bl = norm_body_line(s0)
            if bl:
                body_lines.append(bl)
            i += 1
        if len(options) != 4:
            errors.append(f"Q{num}: expected 4 options, got {len(options)}")
        # pad/truncate later only after reporting
        qtext = stem
        if body_lines:
            qtext = stem + "\n" + "\n".join(body_lines)
        qs.append(
            {
                "num": num,
                "topic_hi": topic_hi,
                "topic_en": topic_en,
                "question_hi": qtext,
                "options": options,
            }
        )
    return qs, errors


def build_one(path: Path, test_no: int) -> tuple[dict, dict]:
    raw = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\u00a0", " ")
    parts = re.split(r"^##\s*उत्तरमाला", raw, maxsplit=1, flags=re.M)
    if len(parts) != 2:
        raise SystemExit(f"{path.name}: no answer-key heading")
    q_text, key_text = parts
    keys = parse_keys(key_text)
    parsed, errors = parse_questions(q_text)

    questions = []
    issues = []
    topics = Counter()
    for q in parsed:
        num = q["num"]
        opts = q["options"][:4]
        while len(opts) < 4:
            opts.append("")
        ans, exp = keys.get(num, (-1, ""))
        ok = ans >= 0 and all(opts) and len(q["options"]) == 4
        if num not in keys:
            issues.append(f"Q{num}: missing answer key — left unscored")
        elif ans < 0:
            issues.append(f"Q{num}: unreadable answer key — left unscored")
        if len(q["options"]) != 4:
            issues.append(f"Q{num}: {len(q['options'])} options")
        questions.append(
            {
                "id": num,
                "topic_hi": q["topic_hi"],
                "topic_en": q["topic_en"],
                "question_hi": q["question_hi"],
                "question_en": "",
                "options": [{"hi": o, "en": o} for o in opts],
                "answer": ans if ans >= 0 else None,
                "explanation_hi": exp,
                "explanation_en": "",
            }
        )
        topics[q["topic_en"]] += 1

    seen = [q["id"] for q in questions]
    missing_nums = [i for i in range(1, 51) if i not in seen]
    if missing_nums:
        issues.append(f"missing question numbers: {missing_nums}")
    if len(questions) != 50:
        issues.append(f"count is {len(questions)}, expected 50")

    title = f"UP TGT/PGT & GIC (GS खण्ड) Mock Test {test_no:02d}"
    test = {
        "testId": f"up-tgt-pgt-gic-gs-mock-{test_no:02d}",
        "title": title,
        "shortTitle": f"Mock Test {test_no:02d}",
        "subtitle": "UP TGT/PGT & GIC · GS Practice Test · 50 Questions",
        "tag": "TGT/PGT & GIC · GS",
        "pill": "GS Practice · 50 Q",
        "highlight": f"Mock Test {test_no:02d}",
        "description": (
            f"UP TGT, PGT और GIC (GS खण्ड) का अभ्यास टेस्ट {test_no:02d} — "
            "50 प्रश्न: इतिहास, राजव्यवस्था, भूगोल, अर्थव्यवस्था, विज्ञान एवं ICT।"
        ),
        "durationMinutes": 50,
        "marksPerQuestion": 2.0,
        "negativeMarks": 0.66,
        "questions": questions,
    }
    meta = {
        "no": test_no,
        "count": len(questions),
        "scored": sum(1 for q in questions if q["answer"] is not None),
        "unscored": [q["id"] for q in questions if q["answer"] is None],
        "topics": dict(topics),
        "errors": errors,
        "issues": issues,
        "path": f"tests/up-tgt-pgt-gic/UP-TGT-PGT-GIC-GS-Mock-{test_no:02d}.html",
        "href": f"/tests/up-tgt-pgt-gic/UP-TGT-PGT-GIC-GS-Mock-{test_no:02d}.html",
    }
    return test, meta


def write_test_html(test: dict, out: Path) -> None:
    blob = json.dumps(test, ensure_ascii=False, separators=(",", ":"))
    blob = blob.replace("<", "\\u003c")
    out.write_text(TEMPLATE.replace("__TEST_JSON__", blob), encoding="utf-8")


HUB_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UP TGT/PGT &amp; GIC (GS खण्ड) Mock Tests — GenClasses</title>
<meta name="description" content="UP TGT, PGT and GIC GS section practice tests — 5 mock tests, 50 questions each. History, Polity, Geography, Economy, Science &amp; ICT.">
<meta name="theme-color" content="#E6EEE9">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/hub.css">
<script src="/assets/hub.js"></script>
<style>
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 8px}
.stat{background:var(--glass);border:1px solid var(--line);border-radius:12px;padding:10px 14px;min-width:110px}
.stat b{display:block;font-size:20px;color:var(--gold-hi);font-weight:800}
.stat span{font-size:12px;color:var(--mist);font-weight:600}
.count-hero{display:inline-flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:14px 0 6px;padding:12px 16px;border-radius:16px;background:linear-gradient(135deg,rgba(194,65,12,.18),rgba(30,58,138,.12));border:1px solid rgba(194,65,12,.35);box-shadow:0 6px 22px rgba(80,50,20,.08)}
.count-hero .big{font-family:'Rozha One',serif;font-size:34px;line-height:1;color:var(--gold-hi);font-weight:400}
.count-hero .sub{font-size:13.5px;font-weight:800;color:var(--cream);letter-spacing:.2px}
.count-hero .pill{font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px;background:rgba(194,65,12,.18);border:1px solid rgba(194,65,12,.4);color:var(--gold-hi)}
html[data-theme="light"] .count-hero{background:linear-gradient(135deg,rgba(194,65,12,.12),rgba(30,58,138,.08));border-color:rgba(194,65,12,.35)}
html[data-theme="light"] .count-hero .big{color:#9A3412}
html[data-theme="light"] .count-hero .sub{color:#1F2A2E}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:18px 0 8px}
.card{display:flex;flex-direction:column;gap:8px;background:var(--glass);border:1px solid var(--line);border-radius:16px;padding:16px 16px 14px;text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--gold);transform:translateY(-2px)}
.card .badge{align-self:flex-start;font-size:11px;font-weight:800;letter-spacing:.4px;padding:3px 10px;border-radius:999px;background:rgba(194,65,12,.16);color:#fb923c;border:1px solid rgba(194,65,12,.35)}
html[data-theme="light"] .card .badge{background:rgba(194,65,12,.1);color:#9A3412}
.card h3{font-family:'Mukta',sans-serif;font-size:16px;font-weight:800;color:var(--cream);line-height:1.35;margin:0}
.card .meta{font-size:12.5px;color:var(--mist);font-weight:600}
.card .tags{display:flex;flex-wrap:wrap;gap:5px}
.card .tags span{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--mist)}
.card .go{margin-top:auto;font-size:13px;font-weight:800;color:var(--gold-hi)}
.card .qcount{align-self:flex-start;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;background:linear-gradient(135deg,rgba(194,65,12,.22),rgba(30,58,138,.12));border:1px solid rgba(194,65,12,.4);color:var(--gold-hi)}
.note{font-size:13px;color:var(--mist);margin:6px 0 0;line-height:1.5}
</style>
</head>
<body>
<nav class="hub-nav"><div class="hub-nav-in wrap">
  <a class="brand" href="/"><img src="/assets/gen-logo-96.webp" width="42" height="42" alt="GenClasses"><span><b>GenClasses</b><small>Your goal Our support</small></span></a>
  <div class="hub-links">
    <a href="/syllabus/"><span data-hi>सिलेबस</span><span data-en>Syllabus</span></a>
    <a href="/ncert/">NCERT</a>
    <a href="/polity/">Polity</a>
    <a href="/uppcs-prelims-pyq/">Prelims PYQ</a>
    <a href="/up-tgt-pgt-gic-mock/">TGT/PGT &amp; GIC</a>
    <a href="/#tests"><span data-hi>टेस्ट</span><span data-en>Tests</span></a>
    <a href="/"><span data-hi>होम</span><span data-en>Home</span></a>
  </div>
  <button class="lang-btn" id="langBtn" type="button" aria-label="Language">EN</button>
  <button class="theme-btn" id="themeBtn" aria-label="Theme">🌙</button>
</div></nav>
<main class="wrap">
<div class="breadcrumb" style="padding-top:18px"><a href="/">Home</a> · UP TGT/PGT &amp; GIC</div>
<section class="hero-mini">
  <span class="eyebrow"><span data-hi>UP TGT / PGT &amp; GIC · GS खण्ड</span><span data-en>UP TGT / PGT &amp; GIC · GS Section</span></span>
  <h1><span data-hi>UP TGT/PGT &amp; GIC (GS खण्ड) मॉक टेस्ट</span><span data-en>UP TGT/PGT &amp; GIC (GS Section) Mock Tests</span></h1>
  <div class="count-hero" aria-label="250 questions">
    <span class="big">250</span>
    <span class="sub"><span data-hi>प्रश्न · 5 मॉक टेस्ट · प्रत्येक 50 प्रश्न<br>इतिहास · राजव्यवस्था · भूगोल · अर्थव्यवस्था · विज्ञान एवं ICT</span><span data-en>Questions · 5 mock tests · 50 Q each<br>History · Polity · Geography · Economy · Science &amp; ICT</span></span>
    <span class="pill">NEW</span>
  </div>
  <p data-hi>UP TGT, PGT और GIC की सामान्य अध्ययन खण्ड की तैयारी के लिए पाँच अभ्यास टेस्ट। प्रत्येक टेस्ट में 50 प्रश्न हैं — प्रयास करें, जमा करें, अंक और व्याख्या देखें।</p>
  <p data-en>Five practice tests for the General Studies section of UP TGT, PGT and GIC. Each test has 50 questions — attempt, submit, then see your score and explanations.</p>
  <div class="stats">
    <div class="stat"><b>5</b><span data-hi>मॉक टेस्ट</span><span data-en>Mock tests</span></div>
    <div class="stat"><b>50</b><span data-hi>प्रश्न प्रति टेस्ट</span><span data-en>Questions per test</span></div>
    <div class="stat"><b>50</b><span data-hi>मिनट प्रति टेस्ट</span><span data-en>Minutes per test</span></div>
    <div class="stat"><b>GS</b><span data-hi>पाँच विषय</span><span data-en>Five subjects</span></div>
  </div>
  <p class="note" data-hi>नोट: ये 50 प्रश्नों के अभ्यास टेस्ट हैं। प्रश्नों का स्तर आयोग के पूर्व वर्षों और वर्तमान ट्रेंड पर आधारित है।</p>
  <p class="note" data-en>Note: These are 50-question practice tests. The level follows previous-year papers and the current pattern.</p>
</section>
<section>
  <h2 style="font-size:18px;margin:8px 0 0"><span data-hi>टेस्ट चुनें</span><span data-en>Choose a test</span></h2>
  <div class="grid" id="grid"></div>
</section>
</main>
<script>
(function(){
  var TESTS = __TESTS_JSON__;
  function L(hi,en){ return (document.documentElement.getAttribute("data-lang")==="hi") ? hi : en; }
  var root = document.getElementById("grid");
  TESTS.forEach(function(t){
    var a = document.createElement("a");
    a.className = "card";
    a.href = t.href;
    var tags = (t.topic_labels || []).map(function(s){ return "<span>"+s+"</span>"; }).join("");
    a.innerHTML =
      '<span class="badge">TGT/PGT &amp; GIC · GS</span>' +
      '<span class="qcount">'+t.count+' Qs</span>' +
      '<h3>'+L("मॉक टेस्ट "+t.no_pad, "Mock Test "+t.no_pad)+'</h3>' +
      '<div class="meta">'+t.count+' '+L("प्रश्न · 50 मिनट","Questions · 50 minutes")+'</div>' +
      '<div class="tags">'+tags+'</div>' +
      '<span class="go">'+L("टेस्ट शुरू करें →","Start test →")+'</span>';
    root.appendChild(a);
  });
})();
</script>
<script defer src="/assets/gen-watermark.js"></script>
</body>
</html>
"""


def write_hub(metas: list[dict]) -> None:
    HUB_DIR.mkdir(parents=True, exist_ok=True)
    cards = []
    for m in metas:
        labels = []
        order = ["History", "Polity", "Geography", "Economy", "Science", "ICT"]
        for k in order:
            if m["topics"].get(k):
                labels.append(f"{k} {m['topics'][k]}")
        cards.append(
            {
                "no": m["no"],
                "no_pad": f"{m['no']:02d}",
                "count": m["count"],
                "href": m["href"],
                "topic_labels": labels,
            }
        )
    html = HUB_HTML.replace("__TESTS_JSON__", json.dumps(cards, ensure_ascii=False, separators=(",", ":")))
    (HUB_DIR / "index.html").write_text(html, encoding="utf-8")
    (HUB_DIR / "tests.json").write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_files_json(paths: list[str]) -> None:
    fj = ROOT / "files.json"
    files = json.loads(fj.read_text(encoding="utf-8"))
    for p in paths:
        if p not in files:
            files.append(p)
    files = sorted(set(files))
    fj.write_text(json.dumps(files, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    srcs = [
        SRC_DIR / "mock-01.md",
        SRC_DIR / "mock-02.md",
        SRC_DIR / "mock-03.md",
        SRC_DIR / "mock-04.md",
        SRC_DIR / "mock-05.md",
    ]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    metas = []
    for i, src in enumerate(srcs, 1):
        if not src.exists():
            raise SystemExit(f"missing {src}")
        test, meta = build_one(src, i)
        out = ROOT / meta["path"]
        write_test_html(test, out)
        metas.append(meta)
        print(f"[{i:02d}] {src.name} → {meta['path']}  Q={meta['count']} scored={meta['scored']} unscored={meta['unscored'] or 'none'}")
        print(f"     topics={meta['topics']}")
        if meta["errors"] or meta["issues"]:
            print(f"     ISSUES: {meta['errors'] + meta['issues']}")
        # leftover latex check
        blob = json.dumps(test, ensure_ascii=False)
        leftover = re.findall(r"\$[^$]+\$|\\text\{", blob)
        if leftover:
            print(f"     leftover latex: {leftover[:12]}")
        # 'फुल लेंथ' / Full Length check
        if re.search(r"फुल\s*लेंथ|Full Length", blob, re.I):
            print("     ERROR: Full Length wording still present")
    write_hub(metas)
    update_files_json([m["path"] for m in metas])
    print("hub ->", HUB_DIR / "index.html")
    print(json.dumps({"summary": metas}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
