# GenClasses वेबसाइट

यह एक तैयार वेबसाइट है। मुखपृष्ठ, टेस्ट-इंजन, लाइट/डार्क थीम, हिंदी-English भाषा-टॉगल, वॉटरमार्क और PDF वाले परिणाम, सब चालू हैं। सामग्री (टेस्ट और नोट्स) इसमें नहीं है; केवल एक नमूना टेस्ट है।

## फ़ोल्डर

1. index.html: मुखपृष्ठ। टेस्ट-सूची और अध्ययन-सामग्री यहीं से बनती है।
2. tests/ca, tests/gs, tests/csat, tests/ncert, tests/upsssc, tests/upspecial: टेस्ट की HTML फ़ाइलें।
3. notes/: अध्ययन-सामग्री (HTML या PDF)।
4. assets/test-template.html: नया टेस्ट बनाने का मूल ढाँचा।
5. assets/gen-watermark.js: साझा वॉटरमार्क।
6. assets/gen-logo.png: लोगो (192 × 192)।
7. files.json: टेस्ट-सूची। GitHub Action इसे हर push पर अपने-आप बनाता है।

## नया टेस्ट जोड़ना

1. assets/test-template.html की कॉपी लें और उसमें __TEST_JSON__ की जगह अपने प्रश्नों का JSON रखें। JSON में testId, title, durationMinutes और questions होते हैं।
2. फ़ाइल को सही श्रेणी-फ़ोल्डर में सेव करें। फ़ाइल-नाम ही कार्ड का शीर्षक बनता है, जिसमें - और _ की जगह स्पेस हो जाता है।
3. tests/gs/नमूना-टेस्ट-भारतीय-राजव्यवस्था.html को उदाहरण मानें।
4. push करते ही files.json बदलेगी और टेस्ट मुखपृष्ठ पर दिखेगा।

## शुरू करने से पहले ये चीज़ें भरें

1. index.html में Telegram और YouTube के लिंक href="#" पर हैं। अपने चैनलों के लिंक डालें।
2. index.html में CONFIG अभी genclassessupport-creator और genclasses.github.io पर सेट है। अगर repo का नाम अलग रखें तो CONFIG में भी वही नाम लिखें।
3. संपर्क का ईमेल genclassessupport@gmail.com है (दूसरा genclassesinfo@gmail.com भी बना है)। संस्थापक का परिचय पुरानी वेबसाइट से लिया गया है; उसे अपने अनुसार बदलें।
4. लोगो बदलना हो तो assets/gen-logo.png को उसी नाम और आकार की नई फ़ाइल से बदलें।

## GitHub Pages पर चढ़ाना

1. GitHub पर नया repo बनाएँ (जैसे genclasses.github.io) और इस फ़ोल्डर की सभी फ़ाइलें main branch पर push करें।
2. Settings खोलें, फिर Pages में Source को Deploy from a branch रखें, branch main और folder / (root) चुनें।
3. CNAME फ़ाइल में genclasses.com लिखा है। Cloudflare पर इस domain का DNS GitHub Pages के निर्देशानुसार सेट करें।
