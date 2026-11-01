#!/usr/bin/env python3
"""Build GenClasses Polity PYQ tests from Purvavlokan GS 2026 English MD extract."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "assets" / "test-template.html").read_text(encoding="utf-8")
assert "__TEST_JSON__" in TEMPLATE

SRC = Path("/workspace/polity-pyq/source.md")
OUT_DIR = ROOT / "tests" / "polity"
MANIFEST = OUT_DIR / "manifest.json"

DEV = re.compile(r"[\u0900-\u097F]")
CHAPTER = re.compile(r"^##\s+अध्याय\s+(\d+)\s*:\s*(.+)$")
QHEAD = re.compile(r"^####\s+प्रश्न\s+(\d+)\s*:\s*(.*)$")
OPT = re.compile(r"^[-*•]?\s*\(?([A-Da-d])\)?[.\)]\s+(.+)$")
# also: - (A) text
OPT2 = re.compile(r"^[-*•]\s*\(([A-Da-d])\)\s+(.+)$")
ANS = re.compile(r"^उत्तर:\s*(.+)$")
EXP = re.compile(r"^व्याख्या:\s*(.*)$")
TOPIC_LINE = re.compile(r"^विषय:\s*(.+)$")
QEN_LINE = re.compile(r"^Question English:\s*(.+)$", re.I)

SRC_BRACKET = re.compile(r"\[([^\]]+)\]")

# Topic packs by actual chapter numbers in this book
PACKS = [
    ("01-constitutional-development", "Constitutional Development", "संवैधानिक विकास", [1]),
    ("02-constituent-assembly", "Constituent Assembly", "संविधान सभा", [2, 3]),
    ("03-sources-parts-articles", "Sources, Parts & Articles", "स्रोत, भाग एवं अनुच्छेद", [4, 5, 6]),
    ("04-schedules-preamble", "Schedules & Preamble", "अनुसूचियाँ एवं प्रस्तावना", [7, 8]),
    ("05-governance-symbols-states", "Governance, Symbols & States", "शासन, प्रतीक एवं राज्य", [9, 10, 11]),
    ("06-citizenship", "Citizenship", "नागरिकता", [12]),
    ("07-fundamental-rights", "Fundamental Rights", "मौलिक अधिकार", [13]),
    ("08-dpsp-duties", "DPSP & Fundamental Duties", "नीति निदेशक तत्व एवं मौलिक कर्तव्य", [14, 15]),
    ("09-president-vp", "President & Vice-President", "राष्ट्रपति एवं उपराष्ट्रपति", [16, 17]),
    ("10-council-ministers-ag-cag", "Council of Ministers, AG & CAG", "मंत्रिपरिषद, महान्यायवादी एवं CAG", [18, 19]),
    ("11-lok-sabha-rajya-sabha", "Lok Sabha & Rajya Sabha", "लोकसभा एवं राज्यसभा", [20, 21]),
    ("12-parliament-process-committees", "Parliament Process & Committees", "संसदीय प्रक्रिया एवं समितियाँ", [22, 23, 24]),
    ("13-supreme-court", "Supreme Court", "उच्चतम न्यायालय", [25]),
    ("14-governor-state-legislature", "Governor & State Legislature", "राज्यपाल एवं राज्य विधानमंडल", [26, 27]),
    ("15-high-court-centre-state", "High Court & Centre–State", "उच्च न्यायालय एवं केन्द्र–राज्य", [28, 29]),
    ("16-emergency-finance-niti", "Emergency, Finance & NITI", "आपातकाल, वित्त आयोग एवं नीति आयोग", [30, 31, 32]),
    ("17-lokpal-commissions-special", "Lokpal, Commissions & Special Provisions", "लोकपाल, आयोग एवं विशेष उपबंध", [33, 34]),
    ("18-election-parties", "Election Commission & Parties", "निर्वाचन आयोग एवं राजनीतिक दल", [35, 36]),
    ("19-amendment-language", "Amendment & Official Language", "संविधान संशोधन एवं राजभाषा", [37, 38]),
    ("20-panchayati-raj", "Panchayati Raj", "पंचायती राज", [39]),
    ("21-special-misc", "Special Provisions & Misc", "विशेष उपबंध एवं विविध", [40, 41]),
]


def clean(s: str) -> str:
    s = str(s or "")
    s = re.sub(r"\*\*", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_bi(s: str) -> dict:
    s = clean(s)
    if not s:
        return {"hi": "", "en": ""}
    m = re.match(r"^(.*?)\s*\|\s*(.+)$", s)
    if m:
        return {"hi": clean(m.group(1)), "en": clean(m.group(2))}
    idx = s.find(" / ")
    while idx != -1:
        right = s[idx + 3 :]
        if right.strip() and not DEV.search(right):
            return {"hi": clean(s[:idx]), "en": clean(right)}
        idx = s.find(" / ", idx + 3)
    if DEV.search(s):
        return {"hi": s, "en": ""}
    return {"hi": "", "en": s}


def q_breaks(t: str) -> str:
    t = str(t or "")
    t = re.sub(r"\s+(?=(?:कथन|Statement)\s*\d+\s*[:：])", "\n", t)
    t = re.sub(r"\s+(?=(?:सूची|List)\s*[-–]?\s*(?:III|II|I|1|2)\s*[:：])", "\n", t)
    t = re.sub(r"\s*/\s*(?=(?:List|Statement|Code|कूट)\b)", "\n", t)
    return t.strip()


def looks_like_exam_tag(s: str) -> bool:
    s = s.strip()
    if not re.search(r"\d{4}", s):
        return False
    # reject prose with years that aren't exam tags
    keys = (
        "U.P", "UP.", "PCS", "P.C.S", "RO", "ARO", "R.O", "A.R.O",
        "Lower", "IAS", "I.A.S", "UDA", "LDA", "U.D.A", "L.D.A",
        "B.E.O", "APO", "GIC", "PSC", "P.S.C", "CDS", "NDA",
        "यू.पी", "उ.प्र", "पी.सी.एस", "आर.ओ", "ए.आर.ओ", "लोअर",
    )
    return any(k.lower() in s.lower() or k in s for k in keys)


def normalize_source(raw: str) -> str:
    s = clean(raw).strip("[]")
    # multi exams separated by ;
    parts = [p.strip() for p in re.split(r"\s*;\s*", s) if p.strip()]
    norms = []
    for p in parts:
        if " / " in p:
            sub = [x.strip() for x in p.split(" / ")]
            p = next((x for x in sub if not DEV.search(x)), sub[-1])
        # Prefer English-ish
        if DEV.search(p) and not re.search(r"[A-Za-z]", p):
            # Map common Hindi exam tags → English badge form
            hi_map = [
                (r"यू\.?पी\.?\s*पी\.?सी\.?एस\.?\s*\(प्री\)\s*", "UPPCS (Pre) "),
                (r"यू\.?पी\.?\s*पी\.?सी\.?एस\.?\s*\(मेन्स\)\s*", "UPPCS (Mains) "),
                (r"यू\.?पी\.?पी\.?सी\.?एस\.?\s*\(प्री\)\s*", "UPPCS (Pre) "),
                (r"यू\.?पी\.?पी\.?सी\.?एस\.?\s*\(मेन्स\)\s*", "UPPCS (Mains) "),
                (r"यू\.?पी\.?\s*आर\.?ओ\.?/ए\.?आर\.?ओ\.?\s*\(प्री\)\s*(?:\(री-एग्ज़ाम\))?\s*", "RO/ARO (Pre) "),
                (r"यू\.?पी\.?\s*आर\.?ओ\.?/ए\.?आर\.?ओ\.?\s*\(मेन्स\)\s*", "RO/ARO (Mains) "),
                (r"यू\.?पी\.?\s*लोअर[^\d]*\(प्री\)\s*", "UP Lower (Pre) "),
                (r"यू\.?पी\.?\s*यू\.?डी\.?ए\.?/एल\.?डी\.?ए\.?\s*\(प्री\)\s*", "UP UDA/LDA (Pre) "),
            ]
            out_hi = p
            for pat, rep_ in hi_map:
                out2 = re.sub(pat, rep_, out_hi)
                if out2 != out_hi:
                    out_hi = out2
                    break
            if out_hi != p and re.search(r"[A-Za-z]", out_hi):
                norms.append(re.sub(r"\s+", " ", out_hi).strip())
            else:
                norms.append(p)
            continue
        repls = [
            (r"U\.P\.P\.C\.S\.\s*\(Pre\)\s*", "UPPCS (Pre) "),
            (r"U\.P\.P\.C\.S\.\s*\(Mains\)\s*", "UPPCS (Mains) "),
            (r"U\.P\.?\s*P\.C\.S\.\s*\(Pre\)\s*", "UPPCS (Pre) "),
            (r"U\.P\.?\s*P\.C\.S\.\s*\(Mains\)\s*", "UPPCS (Mains) "),
            (r"U\.P\.?\s*R\.O\./A\.R\.O\.\s*\(Pre\)\s*(?:\(Re[- ]?Exam\.?\))?\s*", "RO/ARO (Pre) "),
            (r"U\.P\.?\s*R\.O\./A\.R\.O\.\s*\(Mains\)\s*", "RO/ARO (Mains) "),
            (r"U\.P\.?\s*Lower\s*Sub\.?\s*(?:\(Spl\.?\))?\s*\(Pre\)\s*", "UP Lower (Pre) "),
            (r"U\.P\.?\s*Lower\s*\(Pre\)\s*", "UP Lower (Pre) "),
            (r"U\.P\.U\.D\.A\./\s*L\.D\.A\.\s*\(Pre\)\s*", "UP UDA/LDA (Pre) "),
            (r"U\.P\.U\.D\.A\./\s*L\.D\.A\.\s*\(Mains\)\s*", "UP UDA/LDA (Mains) "),
            (r"U\.P\.?\s*U\.D\.A\./\s*L\.D\.A\.\s*\(Pre\)\s*", "UP UDA/LDA (Pre) "),
            (r"I\.A\.S\.\s*\(Pre\)\s*", "IAS (Pre) "),
            (r"U\.P\.P\.S\.C\.\s*\(GIC\)\s*", "UPPSC (GIC) "),
        ]
        out = p
        for pat, rep in repls:
            out2 = re.sub(pat, rep, out, flags=re.I)
            if out2 != out:
                out = out2
                break
        # collapse double spaces; keep year lists like 2006, 2010
        out = re.sub(r"\s+", " ", out).strip()
        # Re-Exam marker
        out = re.sub(r"\(Re[- ]?Exam\.?\)\s*", "Re-Exam ", out, flags=re.I)
        norms.append(out)
    # return first (primary) for badge; full joined kept separately
    return norms[0] if norms else s


def normalize_source_full(raw: str) -> str:
    s = clean(raw).strip("[]")
    parts = [normalize_source(p) for p in re.split(r"\s*;\s*", s) if p.strip() and looks_like_exam_tag(p)]
    return "; ".join(parts) if parts else normalize_source(s)


def exam_class(src: str) -> str:
    s = (src or "").lower()
    if not s:
        return "unknown"
    if "lower" in s or "लोअर" in s:
        return "lower"
    if "ro/aro" in s or "r.o" in s or "aro" in s or "आर.ओ" in s:
        return "ro-aro"
    if ("mains" in s or "मेन्स" in s) and ("uppcs" in s or "p.c.s" in s or "pcs" in s or "पी.सी" in s):
        return "uppcs-mains"
    if ("pre" in s or "प्री" in s) and ("uppcs" in s or "p.c.s" in s or "pcs" in s or "पी.सी" in s):
        return "uppcs-pre"
    if "ias" in s:
        return "ias"
    if "uda" in s or "lda" in s or "यू.डी" in s:
        return "uda-lda"
    if "gic" in s:
        return "other"
    return "other"


def extract_sources(text: str) -> list[str]:
    found = []
    for m in SRC_BRACKET.finditer(text or ""):
        inner = m.group(1)
        if looks_like_exam_tag(inner):
            full = normalize_source_full(inner)
            if full:
                for part in full.split("; "):
                    if part and part not in found:
                        found.append(part)
    return found


def sim(a: str, b: str) -> float:
    a, b = clean(a).lower(), clean(b).lower()
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a[:320], b[:320]).ratio()


def parse_answer(raw: str, nopt: int) -> tuple[int | None, str | None]:
    s = clean(raw)
    s = re.sub(r"^\(+|\)+$", "", s).strip()
    if not s or s in ("*", "(*)", "—", "-", "∗"):
        return None, "Withdrawn / no key in book (*)"
    if re.search(r"[&,/]| और | and ", s, re.I):
        letters = re.findall(r"[A-Da-d]", s)
        if len(set(x.upper() for x in letters)) > 1:
            return None, f"Multiple answers in book: {clean(raw)}"
    m = re.match(r"^[\(\[]?\s*([A-Da-d])\s*[\)\]]?$", s) or re.match(
        r"^[\(\[]?\s*([A-Da-d])\b", s
    )
    if m:
        i = ord(m.group(1).upper()) - 65
        if 0 <= i < nopt:
            return i, None
        return None, f"Answer letter out of range: {s}"
    return None, f"Unparsed answer: {s}"


def split_explanation(raw: str) -> tuple[str, str, list[dict]]:
    raw = str(raw or "").strip()
    related: list[dict] = []
    hi_part, en_part = raw, ""
    if " | " in raw:
        hi_part, en_part = raw.split(" | ", 1)

    def peel(part: str, lang: str) -> str:
        nonlocal related
        if not part:
            return ""
        # related marker " * " or " / * "
        main = part
        rel = ""
        m = re.search(r"(?:\s/\s\*\s|\s\*\s)", part)
        if m:
            main = part[: m.start()].strip()
            rel = part[m.end() :].strip()
        if rel:
            for chunk in re.split(r"\s+\*\s+", rel):
                chunk = chunk.strip().lstrip("/ ").strip()
                if not chunk:
                    continue
                srcs = extract_sources(chunk)
                qtxt = SRC_BRACKET.sub("", chunk).strip()
                qtxt = re.sub(r"\s+", " ", qtxt).strip(" -–—")
                related.append({"q": qtxt, "sources": srcs, "lang": lang})
        return clean(main)

    hi_main = peel(hi_part, "hi")
    en_main = peel(en_part, "en")
    en_main = re.sub(r"^(?:Explanation|Exp)\s*[:：]\s*", "", en_main, flags=re.I).strip()
    return hi_main, en_main, related


def pick_source(q_en: str, q_hi: str, related: list[dict], all_srcs: list[str]) -> tuple[str | None, bool]:
    best, best_score = None, 0.0
    for r in related:
        if not r.get("sources"):
            continue
        score = max(sim(q_en, r["q"]), sim(q_hi, r["q"]) * 0.9)
        if score > best_score:
            best_score = score
            best = r["sources"][0]
    if best and best_score >= 0.55:
        return best, False
    # If the only source in block sits on a near-identical related EN restatement
    if best and best_score >= 0.42:
        return best, False
    # Do NOT assign unrelated footnote sources
    return None, True


def parse_md(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n")
    chapters: dict[int, str] = {}
    cur_ch = 0
    questions: list[dict] = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i].rstrip()
        cm = CHAPTER.match(line)
        if cm:
            cur_ch = int(cm.group(1))
            chapters[cur_ch] = clean(cm.group(2))
            i += 1
            continue
        qm = QHEAD.match(line)
        if not qm:
            i += 1
            continue
        qnum = int(qm.group(1))
        q_hi_inline = (qm.group(2) or "").strip()
        i += 1
        topic_raw = ""
        q_en = ""
        q_hi_extra = []
        options: list[str] = []
        ans_raw = ""
        exp_lines: list[str] = []
        mode = "meta"

        while i < n:
            L = lines[i].rstrip()
            if QHEAD.match(L) or CHAPTER.match(L):
                break
            if not L.strip():
                i += 1
                continue
            tm = TOPIC_LINE.match(L)
            if tm:
                topic_raw = tm.group(1).strip()
                i += 1
                continue
            qen = QEN_LINE.match(L)
            if qen:
                q_en = qen.group(1).strip()
                i += 1
                # continuation lines until option/answer
                while i < n:
                    L2 = lines[i].rstrip()
                    if OPT2.match(L2) or OPT.match(L2) or ANS.match(L2) or TOPIC_LINE.match(L2) or QHEAD.match(L2) or CHAPTER.match(L2) or QEN_LINE.match(L2):
                        break
                    if L2.strip():
                        q_en = (q_en + " " + L2.strip()).strip()
                    i += 1
                continue
            om = OPT2.match(L) or OPT.match(L)
            if om and mode in ("meta", "opt"):
                options.append(om.group(2).strip())
                mode = "opt"
                i += 1
                continue
            am = ANS.match(L)
            if am:
                ans_raw = am.group(1).strip()
                mode = "ans"
                i += 1
                continue
            em = EXP.match(L)
            if em:
                exp_lines.append(em.group(1) or "")
                mode = "exp"
                i += 1
                while i < n:
                    L2 = lines[i].rstrip()
                    if QHEAD.match(L2) or CHAPTER.match(L2):
                        break
                    exp_lines.append(L2)
                    i += 1
                continue
            if mode == "meta" and not options:
                # rare: extra Hindi question lines
                if not TOPIC_LINE.match(L) and not QEN_LINE.match(L):
                    q_hi_extra.append(L.strip())
            i += 1

        q_hi = clean(q_hi_inline)
        if q_hi_extra:
            q_hi = clean(q_hi + " " + " ".join(q_hi_extra))
        q_en = clean(q_en)

        exp_raw = " ".join(x for x in exp_lines if x is not None)
        exp_hi, exp_en, related = split_explanation(exp_raw)
        all_srcs = extract_sources(exp_raw) + extract_sources(q_hi) + extract_sources(q_en)
        seen, uniq = set(), []
        for s in all_srcs:
            if s not in seen:
                seen.add(s)
                uniq.append(s)
        source, missing = pick_source(q_en, q_hi, related, uniq)

        ans_idx, ans_note = parse_answer(ans_raw, max(len(options), 4))

        ch_title = chapters.get(cur_ch, "Indian Polity")
        if topic_raw:
            t_bi = split_bi(topic_raw)
        else:
            t_bi = split_bi(ch_title)
        topic_en = t_bi["en"] or ch_title.split("|")[-1].strip()
        topic_hi = t_bi["hi"] or ch_title.split("|")[0].strip()

        opt_objs = []
        for o in options[:4]:
            ob = split_bi(o)
            en = ob["en"] or (ob["hi"] if ob["hi"] and not DEV.search(ob["hi"]) else "")
            hi = ob["hi"] if DEV.search(ob["hi"] or "") else (ob["hi"] if not en else ob["hi"])
            if not en and hi and not DEV.search(hi):
                en, hi = hi, ""
            opt_objs.append({"hi": hi or "", "en": en or hi or "—"})
        while len(opt_objs) < 4:
            opt_objs.append({"hi": "—", "en": "—"})

        questions.append(
            {
                "chapter": cur_ch,
                "chapter_title": ch_title,
                "src_num": qnum,
                "topic_hi": topic_hi or "भारतीय राजव्यवस्था",
                "topic_en": topic_en or "Indian Polity",
                "question_hi": q_breaks(q_hi),
                "question_en": q_breaks(q_en) or q_breaks(q_hi),
                "options": opt_objs,
                "answer": ans_idx,
                "answer_note": ans_note,
                "explanation_hi": exp_hi,
                "explanation_en": exp_en,
                "source": source,
                "source_missing": bool(missing or not source),
                "exam_class": exam_class(source or ""),
                "related_sources": uniq,
            }
        )
    return questions


def duration_for(n: int) -> int:
    return max(30, int(round(n * 1.2 / 5) * 5))


def write_test(questions: list, pack: tuple) -> dict:
    slug, title_en, title_hi, _chs = pack
    clean_qs = []
    exam_counts: Counter = Counter()
    missing_ans = 0
    missing_src = 0
    for i, q in enumerate(questions, 1):
        exam_counts[q["exam_class"]] += 1
        if q["answer"] is None:
            missing_ans += 1
        if q.get("source_missing") or not q.get("source"):
            missing_src += 1
        clean_qs.append(
            {
                "id": i,
                "topic_hi": q["topic_hi"],
                "topic_en": q["topic_en"],
                "question_hi": q["question_hi"] or q["question_en"],
                "question_en": q["question_en"] or q["question_hi"],
                "options": q["options"],
                "answer": q["answer"],
                "answer_note": q.get("answer_note") or "",
                "explanation_hi": q["explanation_hi"],
                "explanation_en": q["explanation_en"],
                "source": q["source"] or "",
                "source_missing": bool(q.get("source_missing") or not q.get("source")),
                "exam": q["exam_class"],
            }
        )
    test_id = f"polity-pyq-{slug}"
    fname = f"Polity-PYQ-{slug}.html"
    obj = {
        "testId": test_id,
        "title": f"Polity PYQ — {title_en}",
        "shortTitle": title_en,
        "subtitle": f"Purvavlokan GS · Indian Polity · {title_hi}",
        "tag": "Polity PYQ",
        "description": (
            f"Indian Polity & Governance previous year questions — {title_en}. "
            "Exam/year badge from Purvavlokan General Studies 2026 (English) when present in the extract."
        ),
        "durationMinutes": duration_for(len(clean_qs)),
        "marksPerQuestion": 2.0,
        "negativeMarks": 0.66,
        "questions": clean_qs,
    }
    blob = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    html = TEMPLATE.replace("__TEST_JSON__", blob)
    (OUT_DIR / fname).write_text(html, encoding="utf-8")
    return {
        "file": fname,
        "path": f"tests/polity/{fname}",
        "title_en": title_en,
        "title_hi": title_hi,
        "slug": slug,
        "count": len(clean_qs),
        "missing_answers": missing_ans,
        "missing_sources": missing_src,
        "exam_counts": dict(exam_counts),
        "chapters": list(pack[3]),
        "testId": test_id,
        "exams_present": sorted(k for k, v in exam_counts.items() if v and k != "unknown"),
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.glob("Polity-PYQ-*.html"):
        f.unlink()

    qs = parse_md(SRC)
    by_ch: dict[int, list] = defaultdict(list)
    for q in qs:
        by_ch[q["chapter"]].append(q)

    manifest = []
    global_exam: Counter = Counter()
    total_missing_ans = 0
    total_missing_src = 0

    for pack in PACKS:
        pack_qs = []
        for ch in pack[3]:
            pack_qs.extend(by_ch.get(ch, []))
        if not pack_qs:
            print(f"WARN empty pack {pack[0]}")
            continue
        chunks = [pack_qs]
        if len(pack_qs) > 110:
            mid = (len(pack_qs) + 1) // 2
            chunks = [pack_qs[:mid], pack_qs[mid:]]
        for ci, chunk in enumerate(chunks):
            if len(chunks) == 1:
                p = pack
            else:
                p = (
                    f"{pack[0]}-part{ci+1}",
                    f"{pack[1]} (Part {ci+1})",
                    f"{pack[2]} (भाग {ci+1})",
                    pack[3],
                )
            info = write_test(chunk, p)
            manifest.append(info)
            for k, v in info["exam_counts"].items():
                global_exam[k] += v
            total_missing_ans += info["missing_answers"]
            total_missing_src += info["missing_sources"]
            print(
                f"[{len(manifest):02d}] {info['file']}  Q={info['count']}  "
                f"noAns={info['missing_answers']}  noSrc={info['missing_sources']}"
            )

    covered = sum(len(by_ch[c]) for p in PACKS for c in p[3])
    orphan_chs = sorted(set(by_ch) - {c for p in PACKS for c in p[3]})
    # per-exam among questions that HAVE a source
    sourced = [q for q in qs if q.get("source")]
    sourced_exam = Counter(q["exam_class"] for q in sourced)

    report = {
        "total_questions": len(qs),
        "covered": covered,
        "orphan_chapters": orphan_chs,
        "tests": len(manifest),
        "missing_answers": total_missing_ans,
        "missing_sources": total_missing_src,
        "with_source": len(sourced),
        "exam_counts_all": dict(global_exam),
        "exam_counts_sourced": dict(sourced_exam),
        "manifest": manifest,
        "source_file": str(SRC),
    }
    MANIFEST.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    Path("/workspace/polity-pyq/build-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: report[k] for k in report if k != "manifest"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
