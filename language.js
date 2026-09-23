/* ===================== STATE ===================== */
/* LANG_META: registry of enabled UI languages. To add a new NER language, add an entry here
   (code + label) and a matching key-set in STR[code]; any missing key auto-falls back to English
   (see t()). Never fabricate translations — leave a language out of LANG_META until verified. */
const LANG_META = [
  {code:'en',label:'English'},{code:'hi',label:'हिन्दी'},{code:'as',label:'অসমীয়া'},{code:'bn',label:'বাংলা'},
  {code:'ne',label:'नेपाली'},{code:'mni',label:'মণিপুরী (Manipuri)'},{code:'brx',label:'बड़ो (Bodo)'},
  {code:'lus',label:'Mizo ṭawng'},{code:'kha',label:'Khasi'},{code:'grt',label:'A·chik (Garo)'},
  {code:'trp',label:'Kokborok'},{code:'kht',label:'Tai Khamti'}
  /* Kha/Grt/Trp/Kht UI strings intentionally left untranslated (English fallback via t()) until a
     verified translation is supplied — see rule in file header: never invent NER-language text. */
];
const STR = {
  en:{dashboard:"Dashboard",patients:"Patients",campaigns:"Health Camps",reports:"Reports",followups:"Follow-ups",settings:"Settings",sync:"Sync",
    reg_title:"Register patient", q_pain:"Pain severity (0 = none, 10 = worst)", cam_title:"Camera movement test",
    cam_position:"Position the phone so your full body is visible.", cam_start:"Start Camera Assessment",
    cam_stand:"Please stand straight.", cam_bend:"Please slowly bend your knee.", cam_straighten:"Now straighten your knee.",
    cam_walk:"Please walk forward normally.", cam_done:"The movement test is complete.",
    cam_unavailable:"Camera analysis unavailable — please use the manual/sensor assessment.",
    live_angle:"Knee Angle", live_move:"Movement", live_maxflex:"Maximum Flexion", live_rom:"Current ROM",
    live_quality:"Movement Quality", live_conf:"Camera Confidence", data_quality:"Data quality",
    insufficient:"Insufficient data. Please repeat the test.", ai_result:"AI-assisted screening",
    ai_disclaimer:"This is a screening assessment and does not replace professional clinical diagnosis.",
    follow_up:"Follow-up", err_generic:"Something went wrong. Please try again.", btn_continue:"Continue", btn_back:"Back"},
  hi:{dashboard:"डैशबोर्ड",patients:"मरीज़",campaigns:"स्वास्थ्य शिविर",reports:"रिपोर्ट",followups:"फॉलो-अप",settings:"सेटिंग्स",sync:"सिंक",
    reg_title:"मरीज़ पंजीकरण", q_pain:"दर्द की तीव्रता (0 = कोई नहीं, 10 = सबसे अधिक)", cam_title:"कैमरा मूवमेंट टेस्ट",
    cam_position:"फोन को इस तरह रखें कि आपका पूरा शरीर दिखाई दे।", cam_start:"कैमरा मूल्यांकन शुरू करें",
    cam_stand:"कृपया सीधे खड़े हों।", cam_bend:"कृपया धीरे-धीरे अपना घुटना मोड़ें।", cam_straighten:"अब अपना घुटना सीधा करें।",
    cam_walk:"कृपया सामान्य रूप से आगे चलें।", cam_done:"मूवमेंट टेस्ट पूरा हो गया है।",
    cam_unavailable:"कैमरा विश्लेषण उपलब्ध नहीं है — कृपया मैनुअल/सेंसर मूल्यांकन का उपयोग करें।",
    live_angle:"घुटने का कोण", live_move:"गति", live_maxflex:"अधिकतम मोड़", live_rom:"वर्तमान ROM",
    live_quality:"मूवमेंट गुणवत्ता", live_conf:"कैमरा विश्वास", data_quality:"डेटा गुणवत्ता",
    insufficient:"अपर्याप्त डेटा। कृपया परीक्षण दोबारा करें।", ai_result:"AI-सहायित स्क्रीनिंग",
    ai_disclaimer:"यह एक स्क्रीनिंग मूल्यांकन है और पेशेवर नैदानिक निदान का विकल्प नहीं है।",
    follow_up:"फॉलो-अप", err_generic:"कुछ गलत हो गया। कृपया पुनः प्रयास करें।", btn_continue:"जारी रखें", btn_back:"पीछे"},
  as:{dashboard:"ডেশ্ববৰ্ড",patients:"ৰোগী",campaigns:"স্বাস্থ্য শিবিৰ",reports:"প্ৰতিবেদন",followups:"ফলো-আপ",settings:"ছেটিং",sync:"ছিংক"},
  bn:{dashboard:"ড্যাশবোর্ড",patients:"রোগী",campaigns:"স্বাস্থ্য শিবির",reports:"রিপোর্ট",followups:"ফলো-আপ",settings:"সেটিংস",sync:"সিঙ্ক"},
  ne:{dashboard:"ड्यासबोर्ड",patients:"बिरामीहरू",campaigns:"स्वास्थ्य शिविर",reports:"प्रतिवेदन",followups:"फलोअप",settings:"सेटिङहरू",sync:"सिंक",
    reg_title:"बिरामी दर्ता", q_pain:"दुखाइको गम्भीरता (0 = कुनै छैन, 10 = सबैभन्दा बढी)", cam_title:"क्यामेरा चाल परीक्षण",
    cam_position:"फोनलाई यसरी राख्नुहोस् कि तपाईंको पूरा शरीर देखियोस्।", cam_start:"क्यामेरा मूल्याङ्कन सुरु गर्नुहोस्",
    cam_stand:"कृपया सीधा उभिनुहोस्।", cam_bend:"कृपया बिस्तारै आफ्नो घुँडा बङ्ग्याउनुहोस्।", cam_straighten:"अब आफ्नो घुँडा सीधा पार्नुहोस्।",
    cam_walk:"कृपया सामान्य रूपमा अगाडि हिँड्नुहोस्।", cam_done:"चाल परीक्षण पूरा भयो।",
    cam_unavailable:"क्यामेरा विश्लेषण उपलब्ध छैन — कृपया म्यानुअल/सेन्सर मूल्याङ्कन प्रयोग गर्नुहोस्।",
    live_angle:"घुँडाको कोण", live_move:"चाल", live_maxflex:"अधिकतम फ्लेक्सन", live_rom:"हालको ROM",
    live_quality:"चाल गुणस्तर", live_conf:"क्यामेरा विश्वास", data_quality:"डेटा गुणस्तर",
    insufficient:"अपर्याप्त डेटा। कृपया परीक्षण फेरि गर्नुहोस्।", ai_result:"AI-सहायता प्राप्त स्क्रिनिङ",
    ai_disclaimer:"यो स्क्रिनिङ मूल्याङ्कन हो र व्यावसायिक क्लिनिकल निदानको विकल्प होइन।",
    follow_up:"फलोअप", err_generic:"केही गलत भयो। कृपया फेरि प्रयास गर्नुहोस्।", btn_continue:"जारी राख्नुहोस्", btn_back:"पछाडि"},
  /* mni/brx/lus/kha/grt/trp/kht: no verified translation set available yet — every key falls
     back to English via t(). Selectable in the dropdown now; fill in once verified strings exist. */
  mni:{}, brx:{}, lus:{}, kha:{}, grt:{}, trp:{}, kht:{}
};
function t(k){ return (STR[DB.lang]&&STR[DB.lang][k]) || STR.en[k] || k; }

