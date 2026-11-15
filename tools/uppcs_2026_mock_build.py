#!/usr/bin/env python3
"""Build UPPCS 2026 free full-length mock tests (150 Q each) from bilingual markdown.
usage: uppcs_2026_mock_build.py <md_dir>  (files sorted by name → Mock 01..05)"""
from __future__ import annotations
import json, re, sys
from collections import Counter
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from md_to_genclasses import parse_mcq, write_test_html  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "tests" / "uppcs2026"
HUB_DIR = ROOT / "uppcs-2026-mock"

KW = [
    ("करेंट अफेयर्स", "Current Affairs", ["2025", "2026", "बजट", "आर्थिक सर्वेक्षण", "सूचकांक", "रिपोर्ट"]),
    ("उत्तर प्रदेश", "UP Special", ["उत्तर प्रदेश", "लखनऊ", "प्रयागराज", "वाराणसी", "बुंदेलखंड", "आगरा"]),
    ("पर्यावरण", "Environment", ["पर्यावरण", "पारिस्थितिक", "प्रदूषण", "जैव विविधता", "अभयारण्य", "राष्ट्रीय उद्यान", "रामसर", "ओज़ोन", "ओजोन", "प्रोटोकॉल", "IUCN", "वन्यजीव", "जलवायु परिवर्तन"]),
    ("राजव्यवस्था", "Polity", ["संविधान", "अनुच्छेद", "संसद", "लोकसभा", "राज्यसभा", "राष्ट्रपति", "राज्यपाल", "न्यायालय", "मौलिक", "अनुसूची", "विधेयक", "संशोधन", "पंचायत"]),
    ("अर्थव्यवस्था", "Economy", ["अर्थव्यवस्था", "बैंक", "मुद्रा", "मुद्रास्फीति", "राजकोषीय", "पंचवर्षीय", "कर ", "निर्यात", "GDP"]),
    ("विज्ञान", "Science", ["विटामिन", "रोग", "वायरस", "विषाणु", "जीवाणु", "रासायनिक", "यौगिक", "अम्ल", "धातु", "विद्युत", "हार्मोन", "कोशिका", "उपकरण"]),
    ("भूगोल", "Geography", ["नदी", "पर्वत", "पठार", "झील", "महासागर", "सागर", "जलधारा", "बंदरगाह", "मृदा", "खनिज", "जनगणना", "जनजाति", "मानसून", "द्वीप", "देश"]),
    ("इतिहास एवं संस्कृति", "History & Culture", ["युद्ध", "वंश", "मौर्य", "गुप्त", "मुगल", "कांग्रेस", "आंदोलन", "ब्रिटिश", "अभिलेख", "समाज", "मंदिर", "नृत्य", "ग्रंथ", "सम्राट", "विद्रोह"]),
]


def topic(q: str) -> tuple[str, str]:
    best, score = ("सामान्य अध्ययन", "General Studies"), 0
    for hi, en, ws in KW:
        s = sum(q.count(w) for w in ws)
        if hi == "करेंट अफेयर्स":
            s = 99 if re.search(r"202[56]", q) else 0
        if s > score:
            best, score = (hi, en), s
    return best


HI = {"Current Affairs": "करेंट अफेयर्स", "History & Culture": "इतिहास एवं संस्कृति", "Geography": "भूगोल", "Polity": "राजव्यवस्था", "Economy": "अर्थव्यवस्था", "Science": "विज्ञान", "Environment": "पर्यावरण", "UP Special": "उत्तर प्रदेश विशेष", "General Studies": "सामान्य अध्ययन"}
TOPICS = None


def main() -> None:
    global TOPICS
    tp = Path(sys.argv[1]) / "topics.json"  # optional per-question topic labels from the set builder
    if tp.exists():
        TOPICS = json.loads(tp.read_text(encoding="utf-8"))
    src = sorted(Path(sys.argv[1]).glob("*.md"))
    assert len(src) == 5, src
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cards = []
    for i, f in enumerate(src, 1):
        parsed = parse_mcq(f.read_text(encoding="utf-8"))
        qs = parsed["questions"]
        bad = [q["id"] for q in qs if not q.get("_ok")]
        if parsed["errors"] or bad or len(qs) != 150:
            raise SystemExit(f"{f.name}: errors={parsed['errors']} bad={bad} n={len(qs)}")
        tc = Counter()
        for qi, q in enumerate(qs):
            q.pop("_ok", None); q.pop("_src_num", None)
            if TOPICS:
                en = TOPICS[i - 1][qi]; hi = HI[en]
            else:
                hi, en = topic(q["question_hi"])
            q["topic_hi"], q["topic_en"] = hi, en
            tc[en] += 1
        test = {
            "testId": f"uppcs-2026-free-mock-{i:02d}",
            "title": f"UPPCS 2026 मॉक टेस्ट {i:02d} (निःशुल्क)",
            "shortTitle": f"मॉक टेस्ट {i:02d}",
            "subtitle": "UPPCS प्रारंभिक 2026 · सामान्य अध्ययन प्रथम प्रश्नपत्र · 150 प्रश्न",
            "tag": "UPPCS 2026 · मॉक",
            "pill": "150 प्रश्न · 2 घंटे",
            "highlight": f"मॉक टेस्ट {i:02d}",
            "description": f"UPPCS प्रारंभिक 2026 का निःशुल्क मॉक टेस्ट {i:02d} — परीक्षा जैसे 150 प्रश्न: करेंट अफेयर्स, इतिहास, भूगोल, राजव्यवस्था, अर्थव्यवस्था, विज्ञान, पर्यावरण और उत्तर प्रदेश विशेष।",
            "durationMinutes": 120,
            "marksPerQuestion": 1.33,
            "negativeMarks": 0.44,
            "questions": qs,
        }
        name = f"UPPCS-2026-Free-Mock-Test-{i:02d}.html"
        write_test_html(test, OUT_DIR / name)
        cards.append({"no": i, "no_pad": f"{i:02d}", "count": len(qs), "href": f"/tests/uppcs2026/{name}", "topics": dict(tc)})
        print(i, name, len(qs), dict(tc))
    HUB_DIR.mkdir(parents=True, exist_ok=True)
    (HUB_DIR / "tests.json").write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    hub = (ROOT / "tools" / "uppcs_2026_mock_hub.html").read_text(encoding="utf-8")
    (HUB_DIR / "index.html").write_text(hub.replace("__TESTS_JSON__", json.dumps(cards, ensure_ascii=False, separators=(",", ":"))), encoding="utf-8")


if __name__ == "__main__":
    main()
