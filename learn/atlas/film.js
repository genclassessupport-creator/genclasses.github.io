// Two directed shots per lesson, between its opening explanation and conclusion.
const lessonShots=[
 ['नम हवा को पहाड़ की ओर आते देखें।','Follow moist air towards the ridge.','ऊपर उठती हवा ठंडी होती है। बादल पवनमुखी ढाल पर बरसते हैं।','Rising air cools. Clouds release rain on the windward slope.'],
 ['धारा को नदी के मोड़ तक देखें।','Follow the current into a bend.','बाहरी मोड़ पर तेज पानी किनारे को काटता है। भीतरी मोड़ पर रेत जमा होती है।','Faster water cuts the outer bank. Sand settles on the inner bend.'],
 ['ऊपर मुख से निकलती चमकीली धारा देखें।','Find the bright stream emerging at the vent.','लावा ढाल पर नीचे बहता है। ठंडा होने पर यही पदार्थ आग्नेय चट्टान बनता है।','Lava flows downhill. As it cools and solidifies it becomes igneous rock.'],
 ['नदी के मुहाने पर पानी फैलता और धीमा होता है।','Watch the water spread and slow at the river mouth.','जमती तलछट के बीच धारा अलग-अलग रास्तों में बँटती है।','Deposition builds land between branching channels.'],
 ['घाटी के ऊपरी सिरे पर बर्फ का संचय देखें।','Find the accumulation area high in the valley.','दबी हुई बर्फ गुरुत्व के कारण ढाल पर धीरे बहती है।','Compacted ice flows slowly down the valley under gravity.'],
 ['हवा के साथ रेत के कणों को शिखर तक देखें।','Track the sand grains up to the crest.','शिखर पार करके रेत तीखी ढाल पर फिसलती है।','Beyond the crest, grains slip down the steeper face.'],
 ['लहरों को चट्टान के आधार तक आते देखें।','Follow the waves to the base of the cliff.','कटाव नीचे होता है। सहारा घटने से ऊपरी भाग गिर सकता है।','Erosion undercuts the cliff, leaving the overhang vulnerable to collapse.'],
 ['बीच की कटक और उसके दोनों ओर गति पहचानें।','Locate the ridge and watch motion on both sides.','अलग होती प्लेटों के बीच मैग्मा ठंडा होकर नई पर्पटी बनाता है।','Magma cools between the diverging plates, forming new crust.'],
 ['एक शिखर चुनें। उसे दाईं ओर बढ़ते देखें।','Pick a crest and follow its motion to the right.','अब पीले कण पर नज़र रखें। वह ऊपर-नीचे होता है।','Now track the gold particle. It moves up and down.'],
 ['गोला एक छोर पर धीमा होकर दिशा बदलता है।','Watch the bob slow down and reverse at a turning point.','बीच से गुजरते समय ऊँचाई सबसे कम और चाल सबसे अधिक है।','At the centre its height is lowest and its speed greatest.'],
 ['बाईं ओर की समानांतर किरणों की दिशा देखें।','Follow the parallel incident rays from the left.','लेंस से निकलकर किरणें मुड़ती हैं और एक फोकस पर मिलती हैं।','After refraction the rays converge at a common focus.'],
 ['गोला ऊपर जाते हुए भी क्षैतिज दिशा में बढ़ रहा है।','The ball moves horizontally even as it climbs.','शिखर पर ऊर्ध्वाधर वेग पल भर को शून्य है। गुरुत्व उसे नीचे त्वरित करता रहता है।','Vertical velocity briefly reaches zero at the apex. Gravity continues to accelerate the ball downward.'],
 ['शुरू में बाईं तरफ कणों की सांद्रता अधिक है।','Start with the region of high concentration on the left.','कई कणों की अनियमित गति से वितरण पूरे पात्र में फैलता है।','Random motion across many particles spreads the distribution through the container.'],
 ['घास से खरगोश की ओर जाता तीर देखें।','Trace the arrow from grass to rabbit.','अगले तीर पर खरगोश से लोमड़ी को ऊर्जा मिलती है।','At the next feeding step, energy passes from rabbit to fox.'],
 ['सुनहरी माँग और हरी आपूर्ति रेखाओं की ढाल देखें।','Compare the slopes of the demand and supply curves.','जहाँ रेखाएँ मिलती हैं वहाँ एक ही भाव पर दोनों मात्राएँ बराबर हैं।','At the intersection, both quantities are equal at the same price.'],
 ['दोनों निवेश बराबर रकम से शुरू होते हैं।','Compare the identical starting principal.','चक्रवृद्धि में पिछला ब्याज भी ब्याज कमाता है। अंतर बढ़ता जाता है।','With compounding, accumulated interest earns more interest. Watch the gap widen.'],
 ['वृत्त के केंद्र से बिंदु तक त्रिज्या देखें।','Track the radius from the centre to the point.','बिंदु से अक्ष तक खड़ी रेखा का चिह्न कोण की ज्या का चिह्न देता है।','The signed vertical projection gives the sine of the angle.'],
 ['स्रोत से दीवार तक तरंग का जाना देखें।','Follow the outgoing sound from source to wall.','परावर्तित तरंग वही दूरी लौटती है। कुल रास्ता दीवार की दूरी का दोगुना है।','The reflection covers the same distance back. Its total path is twice the wall distance.'],
 ['एक सुनहरी परत को बाएँ किनारे से बीच तक देखें।','Trace the gold bed from the left edge to the centre.','दोनों ओर से दबाव बढ़ता है। परतें बीच में ऊपर मुड़ती हैं।','Compression shortens the beds and they arch upward at the centre.'],
 ['बीच की सुनहरी परत की ऊँचाई को किनारों से मिलाएँ।','Compare the gold bed at the centre with the edges.','संपीड़न में परतें बीच की ओर झुकती हैं और एक द्रोणी बनती है।','As shortening continues, the beds dip inward and form a trough.'],
 ['भ्रंश के दोनों ओर एक रंग की परत पहचानें।','Identify the same marker bed on both sides of the fault.','खींचने से दायाँ खंड झुके हुए तल पर नीचे खिसकता है।','Extension moves the right block down the inclined fault.'],
 ['भ्रंश तल के दाईं ओर सुनहरी परत देखें।','Find the gold bed to the right of the inclined fault.','संपीड़न से यह खंड ऊपर चढ़ता है। परत का स्तर बदल जाता है।','Compression drives that block upward and offsets the bed.']
];
const shotTimes=[0,10,23,37,50];
function updateFilm(){
 const shot=time<10?0:time<23?1:time<37?2:3;
 const row=topics[n], shots=lessonShots[n], lang=hi?0:1;
 const caption=shot===0?row[3+lang]:shot===3?observations[n][lang]:shots?.[(shot-1)*2+lang]||row[3+lang];
 const name=hi?['परिचय','क्या देखें','कैसे होता है','निष्कर्ष']:['Introduction','Watch closely','How it works','Takeaway'];
 const title=name[shot]+'  ·  '+row[1+lang];
 if($('#film-title').textContent!==title)$('#film-title').textContent=title;
 if($('#subtitle').textContent!==caption)$('#subtitle').textContent=caption;
 $('#clock').textContent='0:'+String(Math.floor(time)).padStart(2,'0')+' / 0:50';
 $('#progress').value=time;
 const zoom=shot===0?1+.04*time/10:shot===1?1.04+.09*(time-10)/13:shot===2?1.13-.05*(time-23)/14:1.08-.08*(time-37)/13;
 canvas.style.transform='scale('+zoom+')';
}
