// Shared state and the two languages. Loaded before engine.js and ui.js.
const MINI = document.documentElement.classList.contains('mini');

const state = {
  layer: 'all',
  tempFilter: 'all',
  regionFilter: 'all',
  search: '',
  selectedId: null,
  season: 'summer', // 'summer' = south-west monsoon, 'winter' = north-east monsoon
  lang: 'hi',
  playing: true,
  speed: 1,
  autoRotate: true,
  showLabels: !MINI,
  showGrid: true,
  sidebarOpen: window.innerWidth >= 820,
  quizMode: false,
  quiz: { currentItem: null, options: [], answered: false, score: 0, total: 0, streak: 0 }
};
try { state.lang = localStorage.getItem('gen_lang') === 'hi' ? 'hi' : 'en'; } catch { state.lang = 'en'; }

const TEXT = {
  en: {
    title: 'Globe', subtitle: 'Local winds & ocean currents', back: '← Visual Atlas', langBtn: 'हिन्दी',
    layerAll: 'All', layerWinds: 'Local winds', layerCurrents: 'Ocean currents', quizBtn: 'Quiz',
    tempAll: 'All', tempWarm: 'Warm', tempCold: 'Cold', tempSeasonal: 'Reversing',
    allRegions: 'All regions & oceans', search: 'Search Chinook, Gulf Stream, Loo...',
    noMatch: 'Nothing matches. Clear the filters and try again.',
    hotspotsTitle: 'Where warm and cold currents meet',
    wind: 'Wind', current: 'Current', localWind: 'Local wind', oceanCurrent: 'Ocean current',
    warm: 'Warm', cold: 'Cold', seasonal: 'Reversing',
    labelRegion: 'Region', labelDirection: 'Direction', labelMechanism: 'How it forms',
    labelImpact: 'Effect on climate and economy', labelExamTip: 'Exam pointer (UPSC / UPPCS)', focusBtn: 'Show on globe',
    quizTitle: 'Identify it on the globe', quizScore: 'Score', quizNext: 'Next question', recenter: 'Show again',
    quizAsk: (temp, kind, where, clue) => `Which ${temp} ${kind} is highlighted on the globe? (${where}) Clue: ${clue}`,
    correct: 'Correct!', answerIs: 'Answer: ',
    legWarmWind: 'Warm wind', legColdWind: 'Cold wind', legWarmCurr: 'Warm current', legColdCurr: 'Cold current', legSeasonal: 'Reverses with monsoon',
    spin: 'Spin', names: 'Names', grid: 'Grid', reset: 'Reset',
    summerLabel: 'SW monsoon', winterLabel: 'NE monsoon',
    summerBadge: 'SW monsoon · flows north-east', winterBadge: 'NE monsoon · flows south-west',
    summerDir: 'North-east (summer, SW monsoon)', winterDir: 'South-west (winter, NE monsoon): reversed',
    summerToast: '☀️ South-west monsoon: the Somali Current runs fast towards the north-east.',
    winterToast: '❄️ North-east monsoon: the Somali Current turns back towards the south-west.'
  },
  hi: {
    title: 'ग्लोब', subtitle: 'स्थानीय पवनें व महासागरीय धाराएँ', back: '← दृश्य एटलस', langBtn: 'English',
    layerAll: 'सभी', layerWinds: 'स्थानीय पवनें', layerCurrents: 'महासागरीय धाराएँ', quizBtn: 'अभ्यास',
    tempAll: 'सभी', tempWarm: 'गरम', tempCold: 'ठंडी', tempSeasonal: 'मौसमी',
    allRegions: 'सभी क्षेत्र व महासागर', search: 'खोजें: चिनूक, लू, गल्फ स्ट्रीम...',
    noMatch: 'कुछ नहीं मिला। फ़िल्टर हटाकर दोबारा देखें।',
    hotspotsTitle: 'जहाँ गरम और ठंडी धाराएँ मिलती हैं',
    wind: 'पवन', current: 'धारा', localWind: 'स्थानीय पवन', oceanCurrent: 'महासागरीय धारा',
    warm: 'गरम', cold: 'ठंडी', seasonal: 'मौसमी',
    labelRegion: 'क्षेत्र', labelDirection: 'बहाव की दिशा', labelMechanism: 'कैसे बनती है',
    labelImpact: 'जलवायु व अर्थव्यवस्था पर असर', labelExamTip: 'परीक्षा के लिए (UPSC / UPPCS)', focusBtn: 'ग्लोब पर देखें',
    quizTitle: 'ग्लोब पर पहचानिए', quizScore: 'अंक', quizNext: 'अगला प्रश्न', recenter: 'फिर दिखाएँ',
    quizAsk: (temp, kind, where, clue) => `ग्लोब पर चमक रही यह ${temp} ${kind} कौन-सी है? (${where}) संकेत: ${clue}`,
    correct: 'सही उत्तर!', answerIs: 'सही उत्तर: ',
    legWarmWind: 'गरम पवन', legColdWind: 'ठंडी पवन', legWarmCurr: 'गरम धारा', legColdCurr: 'ठंडी धारा', legSeasonal: 'मानसून के साथ पलटने वाली',
    spin: 'घुमाएँ', names: 'नाम', grid: 'रेखाएँ', reset: 'शुरू से',
    summerLabel: 'द.-प. मानसून', winterLabel: 'उ.-पू. मानसून',
    summerBadge: 'द.-प. मानसून · उत्तर-पूर्व की ओर', winterBadge: 'उ.-पू. मानसून · दक्षिण-पश्चिम की ओर',
    summerDir: 'उत्तर-पूर्व (गर्मी, दक्षिण-पश्चिम मानसून)', winterDir: 'दक्षिण-पश्चिम (सर्दी, उत्तर-पूर्व मानसून): उलटी दिशा',
    summerToast: '☀️ दक्षिण-पश्चिम मानसून: सोमाली धारा तेज़ी से उत्तर-पूर्व की ओर बहती है।',
    winterToast: '❄️ उत्तर-पूर्व मानसून: सोमाली धारा पलटकर दक्षिण-पश्चिम की ओर बहती है।'
  }
};

// Text of an item in the current language. Keys: name nickname subRegion direction mechanism impact examTip
const HI_KEY = { name: 'n', nickname: 'k', subRegion: 's', direction: 'd', mechanism: 'm', impact: 'i', examTip: 't' };
function tx(item, key) {
  const hindi = state.lang === 'hi' && HI[item.id];
  return (hindi && hindi[HI_KEY[key]]) || item[key];
}
function regionName(region) {
  return state.lang === 'hi' ? (HI_REGIONS[region] || region) : (region === 'Oceania' ? 'Australia & NZ' : region);
}
