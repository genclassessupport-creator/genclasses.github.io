# GenClasses वेबसाइट

GenClasses में विषयवार टेस्ट, PDF पुस्तकें, विज़ुअल नोट्स, फ्लैशकार्ड और सिलेबस रोडमैप उपलब्ध हैं। नए learning pages में Hindi/English, light/dark theme और इसी ब्राउज़र में सहेजी गई प्रगति समर्थित है।

## Visual learning, flashcards and syllabus

- `/learn/`: 12 illustrated foundation lessons; source content is in `content/foundations.mjs`.
- `/flashcards/`: 68 cards, explicit reveal, remembered/review modes, shuffle, undo and round summaries. Existing `gen_flash` progress is retained.
- `/syllabus/`: five exam pathways, topic search and checklists. Existing `gen_syll_prog` exam keys are retained. Detailed syllabus text is maintained in `content/syllabus-source.json`; confirm commission notifications before updating exam rules.
- Six untimed, bilingual foundation sets (10 questions each) are generated from `content/practice.mjs`. These are original practice, not official PYQs or full mock papers. Some questions also appear in foundation lessons for revision.
- Theme and language preferences use the existing `gen_theme` and `gen_lang` keys. Progress stays in the current browser; no account or server sync is implied.

Regenerate the static pages after editing content:

```sh
node tools/build-studios.mjs
node tools/check-learning.mjs
```

The second command refreshes `files.json` and validates generated content, internal links, IDs and JavaScript syntax. Hosting remains static GitHub Pages; no dependency installation is required. The homepage is edited directly rather than regenerated.

## फ़ोल्डर

1. index.html: मुखपृष्ठ। टेस्ट-सूची और अध्ययन-सामग्री यहीं से बनती है।
2. tests/uppcs2026, tests/ca, tests/gs, tests/csat, tests/ncert, tests/upsssc, tests/upspecial: टेस्ट की HTML फ़ाइलें।
3. notes/: अध्ययन-सामग्री (HTML या PDF)।
4. assets/test-template.html: नया टेस्ट बनाने का मूल ढाँचा।
5. assets/generator.html: MD से GenClasses टेस्ट बनाने का जनरेटर।
6. assets/gen-watermark.js: साझा वॉटरमार्क।
7. assets/gen-logo.png / .webp: लोगो (192×192). हेडर के लिए gen-logo-96.webp (~3KB). favicon.ico, apple-touch-icon.png, gen-logo-og.jpg भी।
8. files.json: टेस्ट-सूची। GitHub Action इसे हर push पर अपने-आप बनाता है।

## नया टेस्ट जोड़ना

1. assets/test-template.html की कॉपी लें और उसमें __TEST_JSON__ की जगह अपने प्रश्नों का JSON रखें। JSON में testId, title, durationMinutes और questions होते हैं।
2. फ़ाइल को सही श्रेणी-फ़ोल्डर में सेव करें। फ़ाइल-नाम ही कार्ड का शीर्षक बनता है, जिसमें - और _ की जगह स्पेस हो जाता है।
3. tests/gs/नमूना-टेस्ट-भारतीय-राजव्यवस्था.html को उदाहरण मानें।
4. push करते ही files.json बदलेगी और टेस्ट मुखपृष्ठ पर दिखेगा।

## संपर्क व ब्रांड

1. Telegram: https://t.me/genclassesofficial (मुख्य) और https://t.me/genclasses
2. ईमेल: genclassessupport@gmail.com · genclassesinfo@gmail.com
3. टैगलाइन: Your goal Our support
4. CONFIG: genclassessupport-creator / genclasses.github.io — repo नाम बदलें तो CONFIG भी बदलें।
5. लोगो: assets/gen-logo.png (192×192), gen-logo-96.webp/png, favicon*, apple-touch-icon, gen-logo-og.jpg

## GitHub Pages पर चढ़ाना

1. GitHub पर नया repo बनाएँ (जैसे genclasses.github.io) और इस फ़ोल्डर की सभी फ़ाइलें main branch पर push करें।
2. Settings खोलें, फिर Pages में Source को Deploy from a branch रखें, branch main और folder / (root) चुनें।
3. CNAME फ़ाइल में genclasses.com लिखा है। Cloudflare पर इस domain का DNS GitHub Pages के निर्देशानुसार सेट करें।

## UP PCS Prelims 2026

`tools/md_to_genclasses.py` से markdown MCQ को `tests/uppcs2026/` में GenClasses टेस्ट में बदला जा सकता है। ब्राउज़र में `assets/generator.html` भी वही काम करता है।
