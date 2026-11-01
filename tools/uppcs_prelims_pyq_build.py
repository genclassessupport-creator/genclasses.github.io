#!/usr/bin/env python3
"""Build UPPCS Prelims PYQ 2018–2025 tests (subject-wise) from the 16 MD parts."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "assets" / "test-template.html").read_text(encoding="utf-8")
assert "__TEST_JSON__" in TEMPLATE

SRC_DIR = Path("/workspace/uppcs-md")
OUT_DIR = ROOT / "tests" / "uppcs-prelims-pyq"
HUB_DIR = ROOT / "uppcs-prelims-pyq"
MAX_Q = 100

QHEAD = re.compile(r"^####\s+प्रश्न\s+(\d+)\s*:\s*(.*)$")
TOPIC = re.compile(r"^विषय:\s*(.+?)\s*\|\s*(.+?)\s*$")
QEN = re.compile(r"^Question English:\s*(.+)$", re.I)
OPT = re.compile(r"^[-*•]\s*\(([A-Da-d])\)\s+(.+)$")
ANS = re.compile(r"^उत्तर:\s*(.+)$")
EXP = re.compile(r"^व्याख्या:\s*(.*)$")
YEAR_TAG = re.compile(r"\[?\s*UPPCS\s+Pre\s+(\d{4})\s*\]?", re.I)
STAR_NOTE = re.compile(r"मूल प्रश्न में उत्तर\s*\(\*\)\s*अंकित|उत्तर\s*\(\*\)\s*अंकित", re.I)

# Skip mega-dump (exact union of the other parts)
SKIP_PARTS = {"part-08.md"}

SUBJECT_META = {
    "Ancient History": ("ancient-history", "Ancient History", "प्राचीन इतिहास", "history"),
    "Medieval History": ("medieval-history", "Medieval History", "मध्यकालीन इतिहास", "history"),
    "Modern History": ("modern-history", "Modern History", "आधुनिक इतिहास", "history"),
    "Indian Polity": ("indian-polity", "Indian Polity", "भारतीय राजव्यवस्था", "polity"),
    "Indian Economy": ("indian-economy", "Indian Economy", "भारतीय अर्थव्यवस्था", "economy"),
    "Indian Geography": ("indian-geography", "Indian Geography", "भारत का भूगोल", "geography"),
    "World Geography": ("world-geography", "World Geography", "विश्व का भूगोल", "geography"),
    "Environment and Ecology": ("environment-ecology", "Environment & Ecology", "पर्यावरण एवं पारिस्थितिकी", "environment"),
    "Population and Urbanization": ("population-urbanization", "Population & Urbanization", "जनसंख्या एवं नगरीकरण", "population"),
    "Current Affairs": ("current-affairs", "Current Affairs", "सम-सामयिकी", "current"),
    "Uttar Pradesh Special": ("up-special", "Uttar Pradesh Special", "उत्तर प्रदेश राज्य विशेष", "up"),
    "Miscellaneous": ("miscellaneous", "Miscellaneous", "विविध", "misc"),
    "Physics": ("physics", "Physics", "भौतिक विज्ञान", "science"),
    "Chemistry": ("chemistry", "Chemistry", "रसायन विज्ञान", "science"),
    "Biology": ("biology", "Biology", "जीव विज्ञान", "science"),
}

SECTION_ORDER = [
    ("history", "History", "इतिहास"),
    ("polity", "Indian Polity", "भारतीय राजव्यवस्था"),
    ("economy", "Indian Economy", "भारतीय अर्थव्यवस्था"),
    ("geography", "Geography", "भूगोल"),
    ("environment", "Environment & Ecology", "पर्यावरण एवं पारिस्थितिकी"),
    ("science", "Science", "विज्ञान"),
    ("population", "Population & Urbanization", "जनसंख्या एवं नगरीकरण"),
    ("current", "Current Affairs", "सम-सामयिकी"),
    ("up", "Uttar Pradesh Special", "उत्तर प्रदेश राज्य विशेष"),
    ("misc", "Miscellaneous", "विविध"),
]

BOOK_SCRUB = re.compile(
    r"(?i)\b(?:spectrum|laxmikanth|ramesh\s*singh|majid\s*hussain|gc\s*leong|"
    r"lucent|arihant|drishti|vision\s*ias|vajiram|next\s*ias|forumias|"
    r"mcgraw[\s-]?hill|pearson|orient\s*blackswan|unique\s*publishers|"
    r"youth\s*competition|kiran\s*prakashan|disha\s*publication)\b[^.|]*"
)


def clean(s: str) -> str:
    s = re.sub(r"\*\*", "", str(s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_bi(s: str) -> dict:
    s = clean(s)
    if " | " in s:
        hi, en = s.split(" | ", 1)
        return {"hi": clean(hi), "en": clean(en)}
    return {"hi": s, "en": ""}


def scrub_expl(s: str) -> str:
    s = BOOK_SCRUB.sub("", s or "")
    return clean(s)


def parse_answer(raw: str, nopt: int, expl: str) -> tuple[int | None, str]:
    if STAR_NOTE.search(expl or ""):
        return None, "Official key marked (*) — left unscored"
    s = clean(raw)
    if not s or s in ("*", "(*)", "—", "-", "∗"):
        return None, "No key (*) — left unscored"
    m = re.match(r"^[\(\[]?\s*([A-Da-d])\s*[\)\]]?", s)
    if m:
        i = ord(m.group(1).upper()) - 65
        if 0 <= i < nopt:
            return i, ""
        return None, f"Answer out of range: {s}"
    return None, f"Unparsed answer: {s}"


def strip_year_brackets(text: str) -> tuple[str, str | None]:
    year = None
    m = YEAR_TAG.search(text or "")
    if m:
        year = m.group(1)
    text = YEAR_TAG.sub("", text or "")
    text = re.sub(r"\s{2,}", " ", text).strip(" :;-–—")
    return clean(text), year


def parse_file(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n").split("\n")
    out: list[dict] = []
    i, n = 0, len(lines)
    while i < n:
        qm = QHEAD.match(lines[i].rstrip())
        if not qm:
            i += 1
            continue
        q_hi, year = strip_year_brackets(qm.group(2) or "")
        i += 1
        topic_hi = topic_en = ""
        q_en = ""
        options: list[dict] = []
        ans_raw = ""
        exp_raw = ""
        while i < n:
            L = lines[i].rstrip()
            if QHEAD.match(L):
                break
            if not L.strip():
                i += 1
                continue
            tm = TOPIC.match(L)
            if tm:
                topic_hi, topic_en = clean(tm.group(1)), clean(tm.group(2))
                i += 1
                continue
            qen = QEN.match(L)
            if qen:
                q_en, y2 = strip_year_brackets(qen.group(1))
                if y2 and not year:
                    year = y2
                i += 1
                while i < n:
                    L2 = lines[i].rstrip()
                    if OPT.match(L2) or ANS.match(L2) or TOPIC.match(L2) or QHEAD.match(L2) or QEN.match(L2):
                        break
                    if L2.strip():
                        chunk, y3 = strip_year_brackets(L2.strip())
                        q_en = clean(q_en + " " + chunk)
                        if y3 and not year:
                            year = y3
                    i += 1
                continue
            om = OPT.match(L)
            if om:
                bi = split_bi(om.group(2))
                # drop trailing exam junk in option D sometimes
                for k in ("hi", "en"):
                    bi[k] = re.sub(r"\s*U\.?P\.?\s*P\.?C\.?S.*$", "", bi[k], flags=re.I).strip()
                    bi[k] = YEAR_TAG.sub("", bi[k]).strip()
                options.append(bi)
                i += 1
                continue
            am = ANS.match(L)
            if am:
                ans_raw = am.group(1).strip()
                i += 1
                continue
            em = EXP.match(L)
            if em:
                exp_raw = em.group(1)
                i += 1
                while i < n:
                    L2 = lines[i].rstrip()
                    if QHEAD.match(L2):
                        break
                    if L2.strip():
                        exp_raw += " " + L2.strip()
                    i += 1
                continue
            # stray continuation of Hindi stem
            if not options and not ans_raw and not topic_hi:
                chunk, y4 = strip_year_brackets(L.strip())
                q_hi = clean(q_hi + " " + chunk)
                if y4 and not year:
                    year = y4
            i += 1

        if len(options) < 2:
            continue
        expl_hi, expl_en = "", ""
        if " | " in (exp_raw or ""):
            expl_hi, expl_en = exp_raw.split(" | ", 1)
        else:
            expl_hi = exp_raw or ""
        expl_hi, expl_en = scrub_expl(expl_hi), scrub_expl(expl_en)
        ans_idx, ans_note = parse_answer(ans_raw, len(options), expl_hi + " " + expl_en)
        source = f"UPPCS (Pre) {year}" if year else ""
        out.append(
            {
                "topic_hi": topic_hi,
                "topic_en": topic_en,
                "question_hi": q_hi,
                "question_en": q_en or q_hi,
                "options": options,
                "answer": ans_idx,
                "answer_note": ans_note,
                "explanation_hi": expl_hi,
                "explanation_en": expl_en,
                "source": source,
                "source_missing": not bool(source),
                "exam": "uppcs-pre" if year else "unknown",
                "year": year,
            }
        )
    return out


def chunk(qs: list[dict], size: int = MAX_Q) -> list[list[dict]]:
    if len(qs) <= size:
        return [qs]
    return [qs[i : i + size] for i in range(0, len(qs), size)]


def write_test(test: dict, path: Path) -> None:
    html = TEMPLATE.replace("__TEST_JSON__", json.dumps(test, ensure_ascii=False, separators=(",", ":")))
    title = f"GenClasses — {test['title']}"
    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1, flags=re.S)
    path.write_text(html, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HUB_DIR.mkdir(parents=True, exist_ok=True)
    # clear old html in out
    for old in OUT_DIR.glob("*.html"):
        old.unlink()

    by_subject: dict[str, list[dict]] = defaultdict(list)
    for path in sorted(SRC_DIR.glob("part-*.md")):
        if path.name in SKIP_PARTS:
            print("skip", path.name, "(combined dump)")
            continue
        qs = parse_file(path)
        if not qs:
            print("empty", path.name)
            continue
        subj = qs[0]["topic_en"] or "Miscellaneous"
        # normalize key
        if subj not in SUBJECT_META:
            # try first non-empty
            for q in qs:
                if q["topic_en"] in SUBJECT_META:
                    subj = q["topic_en"]
                    break
        print(f"{path.name}: {len(qs)} → {subj}")
        by_subject[subj].extend(qs)

    tests_meta = []
    total = 0
    unscored = 0
    years_all: Counter = Counter()
    section_totals: dict[str, int] = defaultdict(int)

    for subj_en, qs in sorted(by_subject.items(), key=lambda x: SUBJECT_META.get(x[0], ("", x[0]))[1]):
        meta = SUBJECT_META.get(subj_en)
        if not meta:
            print("WARN unknown subject", subj_en, len(qs))
            meta = (
                re.sub(r"[^a-z0-9]+", "-", subj_en.lower()).strip("-"),
                subj_en,
                qs[0].get("topic_hi") or subj_en,
                "misc",
            )
        slug, title_en, title_hi, section = meta
        parts = chunk(qs)
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        for pi, part_qs in enumerate(parts):
            suffix = f"-{letters[pi]}" if len(parts) > 1 else ""
            part_label_en = f" (Part {letters[pi]})" if len(parts) > 1 else ""
            part_label_hi = f" (भाग {letters[pi]})" if len(parts) > 1 else ""
            test_id = f"uppcs-pre-pyq-{slug}{suffix}"
            fname = f"UPPCS-Pre-PYQ-{slug}{suffix}.html"
            missing = sum(1 for q in part_qs if q["answer"] is None)
            unscored += missing
            for q in part_qs:
                if q.get("year"):
                    years_all[q["year"]] += 1
            # renumber ids
            questions = []
            for i, q in enumerate(part_qs, 1):
                qq = dict(q)
                qq["id"] = i
                questions.append(qq)
            test = {
                "testId": test_id,
                "title": f"UPPCS Prelims PYQ — {title_en}{part_label_en}",
                "shortTitle": f"{title_en}{part_label_en}",
                "subtitle": f"UPPCS Prelims · 2018–2025 · {title_hi}{part_label_hi}",
                "tag": "UPPCS Pre PYQ",
                "description": (
                    f"UPPCS Prelims PYQs (2018–2025) — {title_en}{part_label_en}. "
                    "Each question shows the exam/year badge. Items with official (*) key are left unscored."
                ),
                "durationMinutes": max(25, int(round(len(questions) * 1.2))),
                "marksPerQuestion": 2.0,
                "negativeMarks": 0.66,
                "questions": questions,
            }
            write_test(test, OUT_DIR / fname)
            yc = Counter(q["year"] for q in questions if q.get("year"))
            tests_meta.append(
                {
                    "path": f"tests/uppcs-prelims-pyq/{fname}",
                    "slug": slug,
                    "section": section,
                    "title_en": f"{title_en}{part_label_en}",
                    "title_hi": f"{title_hi}{part_label_hi}",
                    "count": len(questions),
                    "missing_answers": missing,
                    "years": dict(sorted(yc.items())),
                    "exam_counts": {"uppcs-pre": sum(1 for q in questions if q["exam"] == "uppcs-pre"),
                                    "unknown": sum(1 for q in questions if q["exam"] != "uppcs-pre")},
                }
            )
            total += len(questions)
            section_totals[section] += len(questions)
            print(f"  wrote {fname} ({len(questions)} q, unscored {missing})")

    manifest = {
        "total": total,
        "unscored": unscored,
        "years": dict(sorted(years_all.items())),
        "sections": [
            {"id": sid, "title_en": en, "title_hi": hi, "count": section_totals.get(sid, 0)}
            for sid, en, hi in SECTION_ORDER
            if section_totals.get(sid, 0)
        ],
        "tests": tests_meta,
        "note": "part-08.md skipped (combined duplicate of subject parts)",
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (HUB_DIR / "tests.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("TOTAL", total, "tests", len(tests_meta), "unscored", unscored, "years", dict(years_all))


if __name__ == "__main__":
    main()
