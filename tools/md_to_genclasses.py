#!/usr/bin/env python3
"""Parse bilingual UPPCS MCQ markdown into GenClasses test HTML files."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "assets" / "test-template.html").read_text(encoding="utf-8")
assert "__TEST_JSON__" in TEMPLATE

Q_START = re.compile(
    r"^\s*\**\s*(?:Question\s*|Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,3})\s*[.)\:।]\s*\**\s*(.*\S)?\s*$",
    re.I,
)
Q_PREFIX = re.compile(r"^\s*\**\s*(?:Question|Q\.?|प्रश्न|प्र\.)\s*\d", re.I)
OPT = re.compile(
    r"^\s*[-*•·]?\s*\**\s*[\(\[]?\s*([A-Da-d])\s*[\)\].:।]\s+\**\s*(.+?)\s*\**\s*$"
)
ANS = re.compile(
    r"^\s*\**\s*(?:सही\s*)?(?:उत्तर|उत्‍तर|Answer|Ans|Correct\s*Answer|Correct\s*Option|सही\s*विकल्प|जवाब)\s*\**\s*[:：=\-–.)]+\s*\**\s*(.+?)\s*\**\s*$",
    re.I,
)
EXP = re.compile(
    r"^\s*\**\s*(?:व्याख्या|स्पष्टीकरण|Explanation|Solution|हल|कारण|Note|टिप्पणी|संकेत|सुझाव|Hint)\s*\**\s*[:：=\-–.)]+\s*\**\s*(.*)$",
    re.I,
)
TOPIC = re.compile(r"^\s*\**\s*(?:विषय|Topic|टॉपिक)\s*\**\s*[:：=\-–]+\s*(.+)$", re.I)
QEN = re.compile(
    r"^\s*\**\s*(?:Question\s*English|English\s*Question|Question\s*EN|प्रश्न\s*English)\s*\**\s*[:：=\-–]+\s*(.+)$",
    re.I,
)
DEV = re.compile(r"[\u0900-\u097F]")
STRIP_QEN = re.compile(r"^(?:Question|Q\.?)\s*\d{1,3}\s*[.)\:।]\s*", re.I)


def clean_md(s: str) -> str:
    s = str(s or "")
    s = re.sub(r"^\s*\*\*", "", s)
    s = re.sub(r"\*\*\s*$", "", s)
    s = re.sub(r"^\s*[-*•·]\s*", "", s)
    return s.strip()


def split_bi(s: str) -> dict:
    s = clean_md(s)
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return {"hi": "", "en": ""}
    m = re.match(r"^(.*?)(?:\s*\|\s*|\s*\|\|\s*)(.+)$", s)
    if m:
        return {"hi": clean_md(m.group(1)), "en": clean_md(m.group(2))}
    idx = s.find(" / ")
    while idx != -1:
        right = s[idx + 3 :]
        if right.strip() and not DEV.search(right):
            return {"hi": clean_md(s[:idx]), "en": clean_md(right)}
        idx = s.find(" / ", idx + 3)
    return {"hi": s, "en": ""}


def q_breaks(t: str) -> str:
    t = str(t or "")
    if not t:
        return t
    t = re.sub(r"\s+(?=(?:कथन|Statement)\s*\d+\s*[:：])", "\n", t)
    t = re.sub(
        r"\s+(?=(?:सूची|List)\s*[-–]?\s*(?:III|II|I|1|2)\s*[:：](?!\s*(?:सूची|List)))",
        "\n",
        t,
    )
    return t.strip()


def clean_exp_en(t: str) -> str:
    return re.sub(r"^Explanation\s*[:：]\s*", "", str(t or ""), flags=re.I).strip()


def let_idx(letter: str, n: int) -> int:
    i = ord(str(letter).upper()[0]) - 65
    return i if 0 <= i < n else -1


def parse_mcq(raw: str) -> dict:
    if not raw or not raw.strip():
        return {"questions": [], "errors": ["empty"]}
    text = raw.replace("\r\n", "\n").replace("\r", "\n").replace("\u00a0", " ")
    lines = text.split("\n")
    qs, errors = [], []
    cur = None
    last_num = 0
    mode = "seek"
    exp_lines: list[str] = []

    def flush_exp():
        nonlocal exp_lines
        if cur is not None and exp_lines:
            t = " ".join(exp_lines)
            t = re.sub(r"\s+", " ", t).strip()
            if t:
                cur["explanation"] = (cur["explanation"] + " " + t).strip() if cur["explanation"] else t
        exp_lines = []

    def finalize():
        nonlocal cur
        flush_exp()
        if cur is None:
            return
        if len(cur["options"]) >= 4 and cur["q"]:
            qs.append(cur)
        elif cur["q"]:
            errors.append(f"Q{cur.get('num','?')}: fewer than 4 options")
        cur = None

    for line0 in lines:
        line = line0.strip()
        if not line:
            continue
        line = re.sub(r"^#{1,6}\s*", "", line)
        if not line:
            continue
        if re.match(r"^[\s\-–—=_*|]{3,}$", line) or re.match(r"^`{3,}", line):
            continue
        if line.count("|") >= 3 and line.startswith("|"):
            continue

        qm = Q_START.match(line)
        is_q = False
        if qm:
            num = int(qm.group(1))
            if cur is None:
                is_q = True
            elif Q_PREFIX.match(line):
                is_q = True
            elif num == last_num + 1 and cur and len(cur["options"]) >= 2 and cur["answerRaw"]:
                is_q = True
        if qm and is_q:
            finalize()
            last_num = int(qm.group(1))
            cur = {
                "num": last_num,
                "q": (qm.group(2) or "").strip(),
                "qEn": "",
                "topicRaw": "",
                "options": [],
                "answerRaw": None,
                "explanation": "",
            }
            mode = "q"
            continue
        if cur is None:
            continue

        tm = TOPIC.match(line)
        if tm:
            cur["topicRaw"] = tm.group(1).strip()
            continue
        qen = QEN.match(line)
        if qen:
            cur["qEn"] = (cur["qEn"] + "\n" + qen.group(1).strip()).strip() if cur["qEn"] else qen.group(1).strip()
            continue
        om = OPT.match(line)
        if om and mode != "exp":
            cur["options"].append(om.group(2).strip())
            mode = "opt"
            continue
        am = ANS.match(line)
        if am:
            flush_exp()
            cur["answerRaw"] = am.group(1).strip()
            mode = "ans"
            continue
        em = EXP.match(line)
        if em:
            flush_exp()
            if em.group(1):
                exp_lines.append(em.group(1).strip())
            mode = "exp"
            continue
        if mode == "q":
            cur["q"] = (cur["q"] + "\n" + line) if cur["q"] else line
        elif mode == "opt" and cur["options"]:
            cur["options"][-1] = cur["options"][-1] + " " + line
        elif mode == "exp":
            exp_lines.append(line)
        elif mode == "ans":
            exp_lines.append(line)
            mode = "exp"

    finalize()

    out = []
    for qi, q in enumerate(qs):
        q_bi = split_bi(q["q"])
        if q["qEn"]:
            q_bi["en"] = clean_md(q["qEn"])
        q_bi["en"] = STRIP_QEN.sub("", q_bi["en"]).strip()
        t_bi = split_bi(q["topicRaw"]) if q["topicRaw"] else {"hi": "", "en": ""}
        e_bi = split_bi(q["explanation"])
        e_bi["en"] = clean_exp_en(e_bi["en"])

        idx = -1
        if q["answerRaw"]:
            s = re.sub(r"^\**|\**$", "", q["answerRaw"]).strip()
            m = re.match(r"^[\(\[]?\s*([A-Da-d])\s*[\)\].:।\-–\s]", s) or re.match(
                r"^[\(\[]?\s*([A-Da-d])\s*$", s
            )
            if m:
                idx = let_idx(m.group(1), len(q["options"]))
            if idx < 0:
                def norm(t):
                    return re.sub(r"[\s().,:।\-–]+", "", t.lower())

                sN = norm(s)
                for i, o in enumerate(q["options"]):
                    oN = norm(o)
                    if oN and (oN == sN or oN in sN or sN in oN):
                        idx = i
                        break

        out.append(
            {
                "id": qi + 1,
                "topic_hi": t_bi["hi"] or "सामान्य अध्ययन",
                "topic_en": t_bi["en"] or "General Studies",
                "question_hi": q_breaks(q_bi["hi"]),
                "question_en": q_breaks(q_bi["en"]),
                "options": [split_bi(o) for o in q["options"][:4]],
                "answer": idx if idx >= 0 else 0,
                "explanation_hi": e_bi["hi"],
                "explanation_en": e_bi["en"],
                "_ok": idx >= 0,
                "_src_num": q["num"],
            }
        )
    return {"questions": out, "errors": errors}


TOPIC_RULES = [
    ("Constitution", "संविधान", ["संविधान", "अनुच्छेद", "अनुसूची", "constitution", "article", "schedule", "fundamental right", "मौलिक"]),
    ("Geography", "भूगोल", ["नदी", "महासागर", "पठार", "मृदा", "जलवायु", "वर्षा", "भूगोल", "river", "ocean", "soil", "climate", "plateau", "monsoon", "latitude", "equator", "भूमध्य", "मकर"]),
    ("History", "इतिहास", ["युद्ध", "आंदोलन", "मुगल", "ब्रिटिश", "कांग्रेस", "इतिहास", "battle", "mughal", "congress", "revolt", "विद्रोह", "गांधी", "अकबर"]),
    ("Economy", "अर्थव्यवस्था", ["बैंक", "बजट", "GDP", "मुद्रा", "आर्थिक", "bank", "budget", "inflation", "वित्तीय", "RBI", "उद्योग", "industry"]),
    ("Environment", "पर्यावरण", ["पर्यावरण", "पारिस्थितिकी", "जैव", "प्रदूषण", "environment", "ecology", "pollution", "biodiversity", "वन"]),
    ("Science", "विज्ञान", ["विषाणु", "रोग", "रसायन", "virus", "disease", "chemical", "विज्ञान", "physics", "biology"]),
    ("UP-Special", "उत्तर-प्रदेश", ["उत्तर प्रदेश", "उत्तर-प्रदेश", "uttar pradesh", "लखनऊ", "कानपुर", "वाराणसी"]),
    ("Polity", "राजव्यवस्था", ["संसद", "राष्ट्रपति", "राज्यपाल", "विधान", "parliament", "president", "governor", "emergency", "आपातकाल"]),
]


def infer_topic(questions: list) -> tuple[str, str]:
    blob = " ".join(
        (q.get("question_hi") or "") + " " + (q.get("question_en") or "") for q in questions[:15]
    ).lower()
    best = ("GS-Mixed", "मिश्रित-GS")
    best_score = 0
    for en, hi, keys in TOPIC_RULES:
        score = sum(blob.count(k.lower()) for k in keys)
        if score > best_score:
            best_score = score
            best = (en, hi)
    return best


def duration_for(n: int) -> int:
    # ~1.2 min per Q, round to 5; floor 30 for 50Q
    return max(30, int(round(n * 1.2 / 5) * 5))


def build_test(questions: list, test_no: int, topic_en: str, topic_hi: str) -> dict:
    clean = []
    for q in questions:
        q = dict(q)
        q.pop("_ok", None)
        q.pop("_src_num", None)
        clean.append(q)
    slug = f"uppcs-2026-test-{test_no:02d}-{topic_en.lower()}"
    title_hi = f"UP PCS Prelims 2026 — टेस्ट {test_no:02d} ({topic_hi})"
    return {
        "testId": slug,
        "title": title_hi,
        "shortTitle": f"टेस्ट {test_no:02d}",
        "subtitle": f"UP PCS Prelims 2026 · {topic_hi}",
        "tag": "UP PCS 2026",
        "description": f"GenClasses UP PCS Prelims 2026 अभ्यास टेस्ट {test_no:02d} — {topic_hi} / {topic_en}.",
        "durationMinutes": duration_for(len(clean)),
        "marksPerQuestion": 2.0,
        "negativeMarks": 0.66,
        "questions": clean,
    }


def filename_for(test_no: int, topic_en: str) -> str:
    # Card title comes from filename (-/_ → spaces)
    return f"UP-PCS-Prelims-2026-Test-{test_no:02d}-{topic_en}.html"


def write_test_html(test_obj: dict, out_path: Path) -> None:
    # Compact JSON is fine; ensure no </script> breakage
    blob = json.dumps(test_obj, ensure_ascii=False, separators=(",", ":"))
    blob = blob.replace("<", "\\u003c")
    html = TEMPLATE.replace("__TEST_JSON__", blob)
    out_path.write_text(html, encoding="utf-8")


def main():
    md_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "tests" / "uppcs2026"
    if not md_dir:
        print("usage: md_to_genclasses.py <md_dir> [out_dir]", file=sys.stderr)
        sys.exit(2)
    files = sorted(md_dir.glob("01M668*.md"))
    if not files:
        files = sorted(md_dir.glob("*.md"))
    out_dir.mkdir(parents=True, exist_ok=True)

    summary = []
    bad_all = []
    for i, f in enumerate(files, 1):
        raw = f.read_text(encoding="utf-8")
        parsed = parse_mcq(raw)
        qs = parsed["questions"]
        bad = [q["id"] for q in qs if not q.get("_ok")]
        if parsed["errors"]:
            bad_all.append((f.name, "errors", parsed["errors"]))
        if bad:
            bad_all.append((f.name, "bad_answers", bad))
        topic_en, topic_hi = infer_topic(qs)
        # avoid duplicate topic suffixes colliding in same run by keeping test number unique
        test = build_test(qs, i, topic_en, topic_hi)
        name = filename_for(i, topic_en)
        # if filename collision, append index
        out = out_dir / name
        if out.exists():
            name = filename_for(i, f"{topic_en}-{i}")
            out = out_dir / name
            test["testId"] = f"uppcs-2026-test-{i:02d}-{topic_en.lower()}-{i}"
        write_test_html(test, out)
        summary.append(
            {
                "file": f.name,
                "out": name,
                "count": len(qs),
                "bad": bad,
                "topic": topic_en,
                "testId": test["testId"],
            }
        )
        print(f"[{i:02d}] {f.name} → {name} ({len(qs)} Q, bad={bad or 'none'}, topic={topic_en})")

    print(json.dumps({"tests": len(summary), "summary": summary, "issues": bad_all}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
