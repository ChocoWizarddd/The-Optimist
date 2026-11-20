// Offline UI translations for India's 22 constitutionally scheduled languages.
// English remains the fallback for technical text without a reviewed translation.
import commonTranslations from './commonTranslations.json';

export const LANGUAGES = [
  { code: 'as', label: 'অসমীয়া · Assamese' },
  { code: 'bn', label: 'বাংলা · Bengali' },
  { code: 'brx', label: 'बर’ · Bodo' },
  { code: 'doi', label: 'डोगरी · Dogri' },
  { code: 'gu', label: 'ગુજરાતી · Gujarati' },
  { code: 'hi', label: 'हिन्दी · Hindi' },
  { code: 'kn', label: 'ಕನ್ನಡ · Kannada' },
  { code: 'ks', label: 'कॉशुर · Kashmiri' },
  { code: 'kok', label: 'कोंकणी · Konkani' },
  { code: 'mai', label: 'मैथिली · Maithili' },
  { code: 'ml', label: 'മലയാളം · Malayalam' },
  { code: 'mni', label: 'মৈতৈলোন্ · Manipuri (Meitei)' },
  { code: 'mr', label: 'मराठी · Marathi' },
  { code: 'ne', label: 'नेपाली · Nepali' },
  { code: 'or', label: 'ଓଡ଼ିଆ · Odia' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ · Punjabi' },
  { code: 'sa', label: 'संस्कृतम् · Sanskrit' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ · Santali' },
  { code: 'sd', label: 'سنڌي · Sindhi' },
  { code: 'ta', label: 'தமிழ் · Tamil' },
  { code: 'te', label: 'తెలుగు · Telugu' },
  { code: 'ur', label: 'اردو · Urdu' },
];

const labels = {
  as: ['পৰিদৰ্শন', 'লাইভ নিৰীক্ষণ', 'সংৰক্ষণ একক', 'বতৰ', 'সতৰ্কতা আৰু ঘটনা', 'ৰক্ষণাবেক্ষণ', 'প্ৰতিবেদন', 'ভাষা বাছনি কৰক'],
  bn: ['ওভারভিউ', 'লাইভ মনিটরিং', 'সংরক্ষণ ইউনিট', 'আবহাওয়া', 'সতর্কতা ও ঘটনা', 'রক্ষণাবেক্ষণ', 'প্রতিবেদন', 'ভাষা নির্বাচন করুন'],
  brx: ['नायबिजिरनाय', 'लाइभ मोनिटरिं', 'दोनथुमनाय एकाइ', 'बिजौ', 'सांग्रांथि आरो जाथाय', 'सुबिदा', 'रिपर्ट', 'रावखौ सायख'],
  doi: ['जांच', 'लाइव निगरानी', 'भंडारण इकाई', 'मौसम', 'चेतावनी ते घटना', 'रख-रखाव', 'रिपोर्ट', 'भाशा चुनो'],
  gu: ['ઝાંખી', 'લાઇવ મોનિટરિંગ', 'સંગ્રહ એકમો', 'હવામાન', 'ચેતવણીઓ અને ઘટનાઓ', 'જાળવણી', 'અહેવાલો', 'ભાષા પસંદ કરો'],
  hi: ['अवलोकन', 'लाइव निगरानी', 'भंडारण इकाइयाँ', 'मौसम', 'चेतावनियाँ और घटनाएँ', 'रखरखाव', 'रिपोर्ट', 'भाषा चुनें'],
  kn: ['ಅವಲೋಕನ', 'ನೇರ ಮೇಲ್ವಿಚಾರಣೆ', 'ಸಂಗ್ರಹ ಘಟಕಗಳು', 'ಹವಾಮಾನ', 'ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಘಟನೆಗಳು', 'ನಿರ್ವಹಣೆ', 'ವರದಿಗಳು', 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ'],
  ks: ['جائزٕ', 'لایِو نگرٲنی', 'ذخیرہ یونٹ', 'موسم', 'خبردارۍ تہٕ واقعات', 'دیکھ ریکھ', 'رپورٹ', 'زبان ژارِو'],
  kok: ['आढावो', 'लाइव्ह देखरेख', 'सांठोवणी युनिट', 'हवामान', 'इशारे आनी घटना', 'देखभाल', 'अहवाल', 'भास निवडात'],
  mai: ['अवलोकन', 'लाइव निगरानी', 'भंडारण इकाइ', 'मौसम', 'चेतावनी आ घटना', 'रखरखाव', 'रिपोर्ट', 'भाषा चुनू'],
  ml: ['അവലോകനം', 'തത്സമയ നിരീക്ഷണം', 'സംഭരണ യൂണിറ്റുകൾ', 'കാലാവസ്ഥ', 'മുന്നറിയിപ്പുകളും സംഭവങ്ങളും', 'പരിപാലനം', 'റിപ്പോർട്ടുകൾ', 'ഭാഷ തിരഞ്ഞെടുക്കുക'],
  mni: ['ꯌꯦꯡꯁꯤꯟꯕ', 'ꯂꯥꯏꯕ ꯃꯣꯅꯤꯇꯔꯤꯡ', 'ꯁ꯭ꯇꯣꯔꯦꯖ ꯌꯨꯅꯤꯠ', 'ꯋꯦꯗꯔ', 'ꯑꯦꯂꯔꯠ ꯑꯃꯁꯨꯡ ꯏꯚꯦꯟꯠ', 'ꯃꯦꯟꯇꯦꯅꯦꯟꯁ', 'ꯔꯤꯄꯣꯔꯠ', 'ꯂꯣꯟ ꯈꯜꯂꯨ'],
  mr: ['आढावा', 'लाइव्ह निरीक्षण', 'साठवण युनिट', 'हवामान', 'सूचना आणि घटना', 'देखभाल', 'अहवाल', 'भाषा निवडा'],
  ne: ['अवलोकन', 'प्रत्यक्ष निगरानी', 'भण्डारण एकाइ', 'मौसम', 'चेतावनी र घटनाहरू', 'मर्मतसम्भार', 'प्रतिवेदन', 'भाषा छान्नुहोस्'],
  or: ['ସମୀକ୍ଷା', 'ଲାଇଭ୍ ମନିଟରିଂ', 'ସଂରକ୍ଷଣ ୟୁନିଟ୍', 'ପାଣିପାଗ', 'ସତର୍କତା ଓ ଘଟଣା', 'ରକ୍ଷଣାବେକ୍ଷଣ', 'ରିପୋର୍ଟ', 'ଭାଷା ବାଛନ୍ତୁ'],
  pa: ['ਸੰਖੇਪ', 'ਲਾਈਵ ਨਿਗਰਾਨੀ', 'ਸਟੋਰੇਜ ਯੂਨਿਟ', 'ਮੌਸਮ', 'ਚੇਤਾਵਨੀਆਂ ਅਤੇ ਘਟਨਾਵਾਂ', 'ਰੱਖ-ਰਖਾਅ', 'ਰਿਪੋਰਟਾਂ', 'ਭਾਸ਼ਾ ਚੁਣੋ'],
  sa: ['अवलोकनम्', 'प्रत्यक्षनिरीक्षणम्', 'भाण्डारएककानि', 'वातावरणम्', 'सावधान्यः घटनाश्च', 'परिरक्षणम्', 'प्रतिवेदनानि', 'भाषां वृणुत'],
  sat: ['ᱧᱮᱞ', 'ᱡᱤᱣᱤ ᱧᱮᱞ', 'ᱡᱚᱢᱟᱣ ᱮᱠᱟᱭ', 'ᱦᱚᱭ ᱦᱤᱸᱥ', 'ᱦᱚᱥᱤᱭᱟᱹᱨ ᱟᱨ ᱜᱷᱚᱴᱚᱱᱟ', 'ᱡᱚᱛᱚᱱ', 'ᱨᱤᱯᱚᱨᱴ', 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ'],
  sd: ['جائزو', 'لائيو نگراني', 'اسٽوريج يونٽ', 'موسم', 'خبرداريون ۽ واقعا', 'مرمت', 'رپورٽون', 'ٻولي چونڊيو'],
  ta: ['கண்ணோட்டம்', 'நேரடி கண்காணிப்பு', 'சேமிப்பு அலகுகள்', 'வானிலை', 'எச்சரிக்கைகள் மற்றும் நிகழ்வுகள்', 'பராமரிப்பு', 'அறிக்கைகள்', 'மொழியைத் தேர்ந்தெடுக்கவும்'],
  te: ['సారాంశం', 'ప్రత్యక్ష పర్యవేక్షణ', 'నిల్వ యూనిట్లు', 'వాతావరణం', 'హెచ్చరికలు మరియు సంఘటనలు', 'నిర్వహణ', 'నివేదికలు', 'భాషను ఎంచుకోండి'],
  ur: ['جائزہ', 'براہ راست نگرانی', 'ذخیرہ یونٹ', 'موسم', 'انتباہات اور واقعات', 'دیکھ بھال', 'رپورٹس', 'زبان منتخب کریں'],
};

export function translateNav(label, language) {
  const index = ['Overview', 'Live Monitoring', 'Storage Units', 'Weather', 'Alerts & Events', 'Maintenance', 'Reports'].indexOf(label);
  return index < 0 ? label : (labels[language]?.[index] || label);
}

export function languageLabel(language) {
  return labels[language]?.[7] || 'Choose language';
}

export function getLocale(language) {
  if (language === 'en') return 'en-IN';
  try {
    const candidate = `${language}-IN`;
    Intl.DateTimeFormat(candidate);
    return candidate;
  } catch {
    return 'en-IN';
  }
}

const phraseEntries = Object.keys(commonTranslations.hi || {})
  .filter((source) => source.length > 2)
  .sort((a, b) => b.length - a.length);

export function translateText(value, language) {
  if (typeof value !== 'string' || language === 'en' || !commonTranslations[language]) return value;
  const exact = commonTranslations[language][value];
  if (exact && exact !== value) return exact;
  return phraseEntries.reduce((text, source) => {
    const translated = commonTranslations[language][source];
    if (!translated || translated === source) return text;
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'giu'), (_, lead) => `${lead}${translated}`);
  }, value);
}
