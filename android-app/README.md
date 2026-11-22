# GenClasses Android ऐप

genclasses.com को Android ऐप के रूप में खोलने वाला हल्का (WebView) ऐप। कोई बाहरी लाइब्रेरी नहीं।

1. पैकेज: com.genclasses.app
2. सुविधाएँ: पूरी वेबसाइट ऐप में, PDF सीधे Downloads › GenClasses में, टेस्ट-परिणाम का प्रिंट/PDF (window.print), Telegram/WhatsApp/ईमेल लिंक अपने ऐप में, बिना इंटरनेट हिंदी संदेश व "फिर से कोशिश", Back बटन से पिछला पन्ना, genclasses.com के लिंक सीधे ऐप में (.well-known/assetlinks.json)।
3. नया संस्करण: app/build.gradle में versionCode एक बढ़ाएँ और versionName बदलें, फिर `./gradlew assembleRelease` चलाएँ और app/build/outputs/apk/release/app-release.apk को /app/GenClasses.apk पर रखें।
4. Signing: `keystore.properties` (storeFile, storePassword, keyAlias, keyPassword) इसी फ़ोल्डर में चाहिए। यह फ़ाइल और .jks कभी git में न डालें। हर अपडेट उसी key से साइन होना ज़रूरी है, वरना पुराने उपयोगकर्ता अपडेट इंस्टॉल नहीं कर पाएँगे।
