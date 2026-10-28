export interface TherapeuticSectionMeta {
  id: string;
  therapeuticClass: string;
  defaultPrescriptionRequired: boolean | null;
  hindiIndications: string[];
  hindiPrecautions: string[];
}

export interface BrandKnowledgeMatch {
  activeSalts: string[];
  therapeuticClass?: string;
  isPrescriptionRequired?: boolean | null;
  hindiIndications?: string[];
  hindiPrecautions?: string[];
}

export const THERAPEUTIC_SECTIONS: Record<string, TherapeuticSectionMeta> = {
  SET1_ACNE_DERMA: {
    id: 'SET1_ACNE_DERMA',
    therapeuticClass: 'Anti-Acne & Dermatological Preparation (मुँहासे और त्वचा उपचार दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'मुँहासे (Acne vulgaris) और त्वचा के दाने कम करने में सहायक।',
      'त्वचा के रोमछिद्रों (Pores) को साफ करने और अतिरिक्त तेल (Sebum) को नियंत्रित करने के लिए।',
    ],
    hindiPrecautions: [
      'केवल बाहरी त्वचा पर उपयोग के लिए (यदि क्रीम/जेल/लोशन है); आँखों, होंठ और कटी-फटी त्वचा के संपर्क से बचाएं।',
      'उपयोग के दौरान तेज धूप से बचें और डॉक्टर की सलाह अनुसार सनस्क्रीन (Sunscreen) का प्रयोग करें।',
      'गर्भावस्था या स्तनपान के दौरान रेटिनोइड (Isotretinoin / Tretinoin) युक्त दवाओं का प्रयोग बिना डॉक्टर की सलाह के बिल्कुल न करें।',
    ],
  },
  SET1_ADHD_CNS: {
    id: 'SET1_ADHD_CNS',
    therapeuticClass: 'CNS Stimulant & ADHD / Wakefulness Agent (एकाग्रता और सतर्कता बढ़ाने वाली नियंत्रित दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अटेंशन डेफिसिट हाइपरएक्टिविटी डिसऑर्डर (ADHD) या अत्यधिक नींद की समस्या (Narcolepsy / Shift Work Sleep Disorder) के चिकित्सकीय प्रबंधन में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इससे अनिद्रा, घबराहट, सिरदर्द या हृदय गति व रक्तचाप में वृद्धि हो सकती है।',
      'शराब का सेवन न करें और हृदय रोग या उच्च रक्तचाप होने पर डॉक्टर को अवश्य बताएं।',
    ],
  },
  SET1_DEADDICTION: {
    id: 'SET1_DEADDICTION',
    therapeuticClass: 'Alcohol / Substance Dependence Therapy (नशा मुक्ति और लत नियंत्रण की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'शराब या अन्य व्यसन की लत छुड़ाने के चिकित्सकीय उपचार और परामर्श कार्यक्रम में सहायक (De-addiction Therapy)।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इस दवा के दौरान शराब (Alcohol) या अल्कोहल युक्त किसी भी उत्पाद का सेवन गंभीर प्रतिक्रिया पैदा कर सकता है।',
      'लिवर या किडनी की बीमारी होने पर डॉक्टर की विशेष निगरानी आवश्यक है।',
    ],
  },
  SET1_ANTIHISTAMINE: {
    id: 'SET1_ANTIHISTAMINE',
    therapeuticClass: 'Antihistamine & Anti-Allergic (एलर्जी और सर्दी-जुकाम रोधी दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'एलर्जी के लक्षणों जैसे छींक आना, नाक बहना, आँखों में पानी या खुजली से राहत (Allergic Rhinitis)।',
      'त्वचा पर पित्ती (Urticaria), चकत्ते और एलर्जिक खुजली को कम करने में।',
    ],
    hindiPrecautions: [
      'इस दवा के सेवन से नींद या सुस्ती (Drowsiness) आ सकती है; प्रभाव जानने तक वाहन या भारी मशीनरी न चलाएं।',
      'दवा लेते समय शराब (Alcohol) या अन्य नींद लाने वाली दवाओं के सेवन से बचें।',
      'किडनी की गंभीर समस्या या गर्भावस्था में डॉक्टर से परामर्श किए बिना न लें।',
    ],
  },
  SET1_NEURO_ALZHEIMER: {
    id: 'SET1_NEURO_ALZHEIMER',
    therapeuticClass: 'Neuro-Cognitive & Nootropic / Anti-Dementia Agent (स्मृति और तंत्रिका तंत्र सहायक दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अल्जाइमर रोग (Alzheimer’s Disease), डिमेंशिया (Dementia) या मस्तिष्क आघात (Stroke) के बाद तंत्रिका सुधार में सहायक।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'डॉक्टर की सलाह के बिना अचानक दवा बंद न करें या खुराक में बदलाव न करें।',
      'चक्कर आना, मतली या हृदय गति धीमी होने जैसे लक्षण दिखने पर तुरंत चिकित्सक से संपर्क करें।',
    ],
  },
  SET1_ANTIAMOEBIC: {
    id: 'SET1_ANTIAMOEBIC',
    therapeuticClass: 'Antiprotozoal & Antibacterial (अमीबियासिस और पेट के संक्रमण की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अमीबियासिस (Amoebiasis), जियार्डियासिस और बैक्टीरिया/प्रोटोजोआ से होने वाले पेट व आंत के संक्रमणों के उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इस दवा के कोर्स के दौरान और कोर्स समाप्त होने के कम से कम 48 घंटे बाद तक शराब (Alcohol) का सेवन बिल्कुल न करें।',
      'संक्रमण को पूरी तरह ठीक करने के लिए डॉक्टर द्वारा निर्धारित पूरा कोर्स पूरा करें।',
    ],
  },
  SET1_HEMATINIC: {
    id: 'SET1_HEMATINIC',
    therapeuticClass: 'Hematinic, Iron & Folic Acid Supplement (खून की कमी / एनीमिया निवारक आयरन और फोलिक एसिड)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'आयरन और फोलिक एसिड की कमी से होने वाले एनीमिया (Iron Deficiency Anemia) की रोकथाम और उपचार में।',
      'हीमोग्लोबिन (Hemoglobin) के निर्माण और गर्भावस्था व कमजोरी में पोषण सहायता के लिए।',
    ],
    hindiPrecautions: [
      'आयरन की दवा से मल का रंग गहरा या काला हो सकता है, जो सामान्यतः हानिकारक नहीं होता।',
      'चाय, कॉफी या दूध/कैल्शियम सप्लीमेंट के तुरंत साथ आयरन न लें क्योंकि इससे आयरन का अवशोषण कम हो सकता है।',
      'बच्चों की पहुँच से दूर रखें; आयरन की अत्यधिक मात्रा (Overdose) बच्चों के लिए खतरनाक हो सकती है।',
    ],
  },
  SET1_ANESTHETIC: {
    id: 'SET1_ANESTHETIC',
    therapeuticClass: 'Local / General Anesthetic (सुन्न करने या एनेस्थीसिया की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'चिकित्सकीय प्रक्रियाओं, सर्जरी या दर्द/जलन वाले हिस्से को अस्थायी रूप से सुन्न करने (Local / General Anesthesia) के लिए।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इंजेक्शन या इनहेलेशन एनेस्थेटिक का उपयोग केवल प्रशिक्षित डॉक्टर/एनेस्थेटिस्ट की देखरेख में अस्पताल में ही किया जाना चाहिए।',
      'सुन्न हिस्से को गर्म वस्तुओं या चोट से बचाएं जब तक संवेदना वापस न आ जाए।',
    ],
  },
  SET1_ANTIANGINAL: {
    id: 'SET1_ANTIANGINAL',
    therapeuticClass: 'Anti-Anginal & Cardiac Vasodilator (हृदय के दर्द / एनजाइना और रक्तवाहिका विस्तारक दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'हृदय में रक्त प्रवाह सुधारने और सीने के दर्द (Angina Pectoris) की रोकथाम व उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इस दवा से शुरुआती दिनों में सिरदर्द या खड़े होने पर चक्कर (Low Blood Pressure) आ सकता है।',
      'नाइट्रेट (Nitrates) दवाओं के साथ सिल्डेनाफिल/तडालाफिल (PDE-5 inhibitors) का सेवन कभी न करें, इससे रक्तचाप खतरनाक स्तर तक गिर सकता है।',
    ],
  },
  SET1_ANXIOLYTIC: {
    id: 'SET1_ANXIOLYTIC',
    therapeuticClass: 'Anxiolytic, Sedative & Anticonvulsant (चिंता, घबराहट और अनिद्रा निवारक नियंत्रित दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'गंभीर चिंता विकार (Anxiety Disorder), पैनिक अटैक, अनिद्रा (Insomnia) या दौरों (Seizures) के चिकित्सकीय उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इस दवा से नींद, चक्कर और आदत पड़ने (Habit-forming / Dependence) का जोखिम होता है; वाहन या मशीनरी न चलाएं।',
      'शराब का सेवन बिल्कुल न करें और डॉक्टर की सलाह के बिना दवा को अचानक बंद न करें।',
    ],
  },
  SET1_APPETITE: {
    id: 'SET1_APPETITE',
    therapeuticClass: 'Appetite Stimulant & Digestive Tonic (भूख बढ़ाने और पाचन सहायक दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'भूख न लगने (Loss of Appetite / Anorexia) और वजन कम होने की स्थिति में भूख बढ़ाने के लिए।',
    ],
    hindiPrecautions: [
      'इसमें मौजूद घटक (जैसे Cyproheptadine) से नींद या सुस्ती आ सकती है; वाहन चलाते समय सावधानी बरतें।',
      'शराब के सेवन से बचें और बच्चों या बुजुर्गों को केवल डॉक्टर की सलाह अनुसार ही दें।',
    ],
  },
  SET1_ANTIARRHYTHMIC: {
    id: 'SET1_ANTIARRHYTHMIC',
    therapeuticClass: 'Anti-Arrhythmic & Cardiac Glycoside (हृदय की अनियमित धड़कन नियंत्रित करने वाली दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'हृदय की अनियमित धड़कन (Arrhythmia / Atrial Fibrillation) और हार्ट फेल्योर के चिकित्सकीय नियंत्रण में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'हृदय गति, रक्तचाप, थायरॉइड और इलेक्ट्रोलाइट्स की नियमित जाँच डॉक्टर के निर्देशानुसार कराएं।',
      'अत्यधिक चक्कर, सांस फूलने या धड़कन बहुत धीमी होने पर तुरंत डॉक्टर से संपर्क करें।',
    ],
  },
  SET1_ARTHRITIS: {
    id: 'SET1_ARTHRITIS',
    therapeuticClass: 'Anti-Arthritic, Analgesic & Joint Care (जोड़ों के दर्द और गठिया उपचार दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'ऑस्टियोआर्थराइटिस (Osteoarthritis), रूमेटॉइड आर्थराइटिस और जोड़ों के दर्द व सूजन से राहत में।',
    ],
    hindiPrecautions: [
      'पेट में जलन या एसिडिटी से बचने के लिए इसे सामान्यतः भोजन के बाद लेने की सलाह दी जाती है।',
      'किडनी, लिवर, हृदय रोग या पेट के अल्सर (Peptic Ulcer) के मरीजों को बिना डॉक्टरी सलाह के दर्द निवारक दवाएं नहीं लेनी चाहिए।',
    ],
  },
  SET1_ASTHMA_COPD: {
    id: 'SET1_ASTHMA_COPD',
    therapeuticClass: 'Bronchodilator & Anti-Asthmatic Respiratory Care (दमा / अस्थमा और श्वसन मार्ग की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अस्थमा (Asthma) और क्रॉनिक ऑब्सट्रक्टिव पल्मोनरी डिजीज (COPD) में सांस की नली को खोलने और सांस फूलने व घरघराहट से राहत के लिए।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'रोटाकैप (Rotacap / Respicap / Transcap) कैप्सूल को कभी भी पानी के साथ निगलना नहीं चाहिए; इनका उपयोग केवल इनहेलर डिवाइस में ही करें।',
      'स्टेरॉयड युक्त इनहेलर के उपयोग के बाद मुंह में फंगल संक्रमण (Thrush) से बचने के लिए साफ पानी से कुल्ला करें।',
    ],
  },
  SET1_IMMUNOSUPPRESSANT: {
    id: 'SET1_IMMUNOSUPPRESSANT',
    therapeuticClass: 'Immunosuppressant & Transplant Medicine (प्रतिरक्षा प्रणाली नियंत्रक दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अंग प्रत्यारोपण (Organ Transplant) के बाद अंग अस्वीकृति रोकने और गंभीर ऑटोइम्यून रोगों के उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'यह दवा शरीर की रोग प्रतिरोधक क्षमता को कम करती है; संक्रमण से बचें और बुखार या संक्रमण के लक्षण दिखने पर तुरंत डॉक्टर को बताएं।',
      'विशेषज्ञ डॉक्टर की सलाह के बिना ब्रांड या खुराक में कोई परिवर्तन न करें।',
    ],
  },
  SET1_AYURVEDIC: {
    id: 'SET1_AYURVEDIC',
    therapeuticClass: 'Ayurvedic & Herbal Healthcare Formulation (आयुर्वेदिक और हर्बल स्वास्थ्य उत्पाद)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'आयुर्वेदिक जड़ी-बूटियों पर आधारित स्वास्थ्य, पाचन, लिवर या सामान्य शारीरिक सहायता के लिए (Ayurvedic Formulation)।',
    ],
    hindiPrecautions: [
      'पैकेट पर दिए गए घटकों की जाँच करें ताकि किसी जड़ी-बूटी से एलर्जी न हो।',
      'गर्भावस्था, स्तनपान या पुरानी बीमारी की दवाओं के साथ लेने से पहले चिकित्सक से परामर्श लें।',
    ],
  },
  SET2_BPH_UROLOGY: {
    id: 'SET2_BPH_UROLOGY',
    therapeuticClass: 'Urology, Alpha-Blocker & BPH Care (प्रोस्टेट और मूत्र मार्ग विकार की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'पुरुषों में बढ़े हुए प्रोस्टेट (Benign Prostatic Hyperplasia - BPH) और पेशाब के प्रवाह में रुकावट या ओवरएक्टिव ब्लैडर के उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'अल्फा-ब्लॉकर (जैसे Tamsulosin / Silodosin) से अचानक खड़े होने पर चक्कर आ सकता है (Postural Hypotension)।',
      'मोतियाबिंद (Cataract) की सर्जरी कराने से पहले नेत्र चिकित्सक को इस दवा के बारे में अवश्य बताएं।',
    ],
  },
  SET2_COAGULANT: {
    id: 'SET2_COAGULANT',
    therapeuticClass: 'Hemostatic & Anti-Fibrinolytic (रक्तस्राव / ब्लीडिंग रोकने वाली दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'अत्यधिक रक्तस्राव (Heavy Menstrual Bleeding / Epistaxis / Post-surgical Bleeding) को नियंत्रित करने और रोकने में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'यदि पहले कभी रक्त का थक्का जमने (Thrombosis) की समस्या रही हो, तो डॉक्टर को अवश्य सूचित करें।',
    ],
  },
  SET2_ANTICOAGULANT: {
    id: 'SET2_ANTICOAGULANT',
    therapeuticClass: 'Antiplatelet, Anticoagulant & Thrombolytic (रक्त पतला करने और थक्का रोकने वाली दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'रक्त के थक्के (Blood Clots) बनने से रोकने तथा हार्ट अटैक और स्ट्रोक के जोखिम को कम करने में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'इस दवा से मसूड़ों, नाक या चोट से आसानी से खून बहने का जोखिम बढ़ सकता है; काला मल या असामान्य ब्लीडिंग होने पर तुरंत डॉक्टर से मिलें।',
      'कोई भी सर्जरी, दांत का इलाज कराने या दर्द निवारक (NSAIDs) लेने से पहले डॉक्टर को सूचित करें; हृदय रोग विशेषज्ञ से पूछे बिना दवा बंद न करें।',
    ],
  },
  SET2_BONE_CALCIUM: {
    id: 'SET2_BONE_CALCIUM',
    therapeuticClass: 'Calcium, Vitamin D3 & Bone Metabolism Care (हड्डियों की मजबूती और ऑस्टियोपोरोसिस उपचार)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'कैल्शियम व विटामिन डी की कमी पूरा करने और ऑस्टियोपोरोसिस (Osteoporosis) में हड्डियों को मजबूत बनाने के लिए।',
    ],
    hindiPrecautions: [
      'किडनी की पथरी (Kidney Stones) या रक्त में कैल्शियम अधिक होने (Hypercalcemia) पर डॉक्टर की सलाह से ही लें।',
      'बिसफ़ॉस्फ़ोनेट (Bisphosphonates जैसे Alendronate/Risedronate/Ibandronate) और टेरिपराटाइड (Teriparatide) केवल डॉक्टर के पर्चे और निर्देशानुसार ही लें।',
    ],
  },
  SET2_ONCOLOGY: {
    id: 'SET2_ONCOLOGY',
    therapeuticClass: 'Antineoplastic, Targeted Oncology & Chemotherapy (कैंसर उपचार और कीमोथेरेपी की विशेष दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'विभिन्न प्रकार के कैंसर (Malignancies / Tumors) के विशेषज्ञ ऑन्कोलॉजिस्ट (Oncologist) द्वारा निर्धारित उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'यह उच्च जोखिम वाली विशेषज्ञ दवा है; इसका उपयोग केवल कैंसर विशेषज्ञ (Oncologist) की कड़ी निगरानी और नियमित रक्त जाँच के साथ ही करें।',
      'गर्भावस्था और स्तनपान में यह दवा अत्यंत हानिकारक हो सकती है; बुखार, संक्रमण या गंभीर दुष्प्रभाव होने पर तुरंत अस्पताल से संपर्क करें।',
    ],
  },
  SET2_HEPATOBILIARY: {
    id: 'SET2_HEPATOBILIARY',
    therapeuticClass: 'Hepatoprotective & Gallstone Dissolution Agent (लिवर और पित्ताशय की पथरी के उपचार की दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'पित्ताशय की कोलेस्ट्रॉल पथरी (Cholesterol Gallstones) को घोलने और लिवर रोगों (जैसे Cholestatic Liver Disease / Fatty Liver) के उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'एल्युमिनियम युक्त एंटासिड (Antacids) इसके अवशोषण को कम कर सकते हैं, इसलिए उन्हें एक साथ न लें।',
      'लिवर फंक्शन टेस्ट (LFT) की नियमित जाँच डॉक्टर के निर्देशानुसार कराएं।',
    ],
  },
  SET2_CLEANSER: {
    id: 'SET2_CLEANSER',
    therapeuticClass: 'Medicated Skin Cleanser & Antiseptic Wash (औषधीय त्वचा क्लींजर और एंटीसेप्टिक)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'त्वचा की स्वच्छता, मुँहासे/तैलीय त्वचा नियंत्रण या कीटाणुओं से सुरक्षा (Skin Cleansing & Antisepsis) के लिए।',
    ],
    hindiPrecautions: [
      'केवल बाहरी उपयोग (For External Use Only) के लिए; आँखों और मुंह के अंदर जाने से बचाएं।',
      'त्वचा पर अत्यधिक रूखापन, जलन या एलर्जी होने पर उपयोग बंद करें और त्वचा विशेषज्ञ से सलाह लें।',
    ],
  },
  SET2_LAXATIVE: {
    id: 'SET2_LAXATIVE',
    therapeuticClass: 'Laxative & Bowel Regulator (कब्ज निवारक और मल मुलायम करने वाली दवा)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'कब्ज (Constipation) से राहत देने और मल त्याग को आसान बनाने के लिए (Osmotic / Stimulant / Bulk-forming Laxative)।',
    ],
    hindiPrecautions: [
      'इस दवा के साथ पर्याप्त मात्रा में पानी और तरल पदार्थ पिएं।',
      'बिना डॉक्टर की सलाह के लंबे समय तक जुलाब (Laxatives) का लगातार प्रयोग न करें।',
      'पेट में तेज दर्द, मतली, उल्टी या आंतों में रुकावट (Intestinal Obstruction) की आशंका होने पर इसे न लें।',
    ],
  },
  SET2_CONTRACEPTIVE: {
    id: 'SET2_CONTRACEPTIVE',
    therapeuticClass: 'Hormonal Contraceptive & Gynecological Agent (गर्भनिरोधक और महिला हार्मोनल दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'गर्भधारण रोकने (Oral Contraception) या मासिक धर्म की अनियमितता, एंडोमेट्रियोसिस और पीसीओएस (PCOS) के हार्मोनल प्रबंधन में।',
    ],
    hindiPrecautions: [
      'हार्मोनल दवाओं का सेवन स्त्री रोग विशेषज्ञ (Gynecologist) की सलाह के अनुसार सही समय पर ही करें।',
      'धूम्रपान करने वाली महिलाओं, उच्च रक्तचाप, माइग्रेन या रक्त के थक्के (Thrombosis) के इतिहास में विशेष सावधानी आवश्यक है।',
    ],
  },
  SET2_COUGH_COLD: {
    id: 'SET2_COUGH_COLD',
    therapeuticClass: 'Antitussive, Expectorant & Cold Relief (खांसी, बलगम और सर्दी-जुकाम निवारक दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'खांसी (Dry or Productive Cough), गले की खराश, बलगम साफ करने और सर्दी-जुकाम व नाक बंद होने से राहत में।',
    ],
    hindiPrecautions: [
      'खांसी और जुकाम की कई दवाओं से नींद या चक्कर आ सकता है; इन्हें लेने के बाद वाहन न चलाएं।',
      'यदि दवा में पैरासिटामोल (Paracetamol) शामिल है, तो ओवरडोज़ से बचने के लिए साथ में कोई अन्य पैरासिटामोल दवा न लें।',
      'छोटे बच्चों को खांसी-जुकाम की दवा केवल बाल रोग विशेषज्ञ (Pediatrician) की सलाह से ही दें।',
    ],
  },
  SET2_ANTIDANDRUFF: {
    id: 'SET2_ANTIDANDRUFF',
    therapeuticClass: 'Anti-Dandruff & Scalp Antifungal (रूसी और स्कैल्प फंगल संक्रमण रोधी शैम्पू/लोशन)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'सिर की त्वचा में रूसी (Dandruff) और सेबोरिक डर्मेटाइटिस (Seborrheic Dermatitis) के फंगल संक्रमण को कम करने में।',
    ],
    hindiPrecautions: [
      'केवल सिर की त्वचा और बाहरी उपयोग के लिए; आँखों में जाने पर तुरंत साफ पानी से धोएं।',
      'खुले घाव या छिली हुई त्वचा पर बिना डॉक्टर की सलाह के प्रयोग न करें।',
    ],
  },
  SET2_ANTIDEPRESSANT: {
    id: 'SET2_ANTIDEPRESSANT',
    therapeuticClass: 'Antidepressant & Mood Stabilizer (अवसाद और मानसिक स्वास्थ्य उपचार की नियंत्रित दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'डिप्रेशन (Major Depressive Disorder), एंग्जायटी, ओसीडी (OCD) या मूड विकारों के मनोचिकित्सकीय उपचार में।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'डॉक्टर से पूछे बिना इस दवा को अचानक बंद न करें, क्योंकि इससे विदड्रॉल लक्षण (Withdrawal Symptoms) हो सकते हैं।',
      'इलाज के दौरान शराब का सेवन न करें और मूड या व्यवहार में असामान्य बदलाव दिखने पर तुरंत डॉक्टर से मिलें।',
    ],
  },
  SET2_ANTIDIABETIC: {
    id: 'SET2_ANTIDIABETIC',
    therapeuticClass: 'Anti-Diabetic & Blood Glucose Regulator (मधुमेह / ब्लड शुगर नियंत्रण दवा)',
    defaultPrescriptionRequired: true,
    hindiIndications: [
      'टाइप 2 डायबिटीज मेलिटस (Type 2 Diabetes Mellitus) या इंसुलिन आवश्यकता वाले मरीजों में रक्त शर्करा (Blood Sugar) नियंत्रित करने के लिए।',
    ],
    hindiPrecautions: [
      'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।',
      'दवा लेने के बाद भोजन समय पर करें; भोजन छोड़ने से ब्लड शुगर खतरनाक रूप से कम (Hypoglycemia — पसीना आना, कंपकंपी, चक्कर) हो सकती है।',
      'किडनी या लिवर रोग होने और शराब के सेवन से लैक्टिक एसिडोसिस व हाइपोग्लाइसीमिया का खतरा बढ़ता है; नियमित शुगर जाँच कराएं।',
    ],
  },
  SET2_ANTIDIARRHEAL: {
    id: 'SET2_ANTIDIARRHEAL',
    therapeuticClass: 'Anti-Diarrheal & Probiotic Gut Flora Restorer (दस्त निवारक और प्रोबायोटिक आंत स्वास्थ्य दवा)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'दस्त (Diarrhea) को नियंत्रित करने और आंतों में लाभदायक जीवाणुओं (Gut Microflora) का संतुलन बनाए रखने में।',
    ],
    hindiPrecautions: [
      'दस्त के दौरान शरीर में पानी और नमक की कमी (Dehydration) रोकने के लिए ओआरएस (ORS) और पर्याप्त तरल पदार्थ लेते रहें।',
      'यदि मल में खून आए, तेज बुखार हो या 2 दिन में सुधार न हो, तो तुरंत डॉक्टर से परामर्श लें।',
    ],
  },
  SET2_ENZYME: {
    id: 'SET2_ENZYME',
    therapeuticClass: 'Digestive Enzyme & Carminative (पाचन एंजाइम और अपच/गैस निवारक दवा)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'अपच (Indigestion), पेट फूलना (Bloating) और पाचन एंजाइम की कमी (Pancreatic Insufficiency) में भोजन पचाने में सहायक।',
    ],
    hindiPrecautions: [
      'इसे सामान्यतः भोजन के साथ या भोजन के तुरंत बाद लेने की सलाह दी जाती है।',
      'अग्न्याशय की तीव्र सूजन (Acute Pancreatitis) या पेट में गंभीर दर्द होने पर डॉक्टर से संपर्क करें।',
    ],
  },
  SET2_OPHTHALMIC: {
    id: 'SET2_OPHTHALMIC',
    therapeuticClass: 'Ophthalmic Lubricant & Eye Care (आँखों के सूखेपन और जलन से राहत के आई ड्रॉप्स)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'आँखों के सूखेपन (Dry Eyes), जलन, थकान और वातावरणीय चुभन से राहत देने व नमी बनाए रखने के लिए (Artificial Tears)।',
    ],
    hindiPrecautions: [
      'केवल आँखों में डालने के लिए (For Ophthalmic Use Only); ड्रॉपर की नोक को किसी भी सतह या आँख से न छुएं।',
      'यदि आँख में तेज दर्द, मवाद या दृष्टि में धुंधलापन बना रहे, तो नेत्र चिकित्सक (Ophthalmologist) से दिखाएं।',
    ],
  },
  SET2_EMOLLIENT: {
    id: 'SET2_EMOLLIENT',
    therapeuticClass: 'Dermatological Emollient, Moisturizer & Sunscreen (त्वचा मॉइस्चराइजर और धूप से सुरक्षा)',
    defaultPrescriptionRequired: false,
    hindiIndications: [
      'त्वचा के रूखेपन (Dry Skin / Xerosis), खुजली को शांत करने और सूर्य की हानिकारक किरणों (UVA/UVB Rays) से त्वचा की सुरक्षा के लिए।',
    ],
    hindiPrecautions: [
      'केवल बाहरी त्वचा पर लगाने के लिए; आँखों के संपर्क से बचाएं।',
      'त्वचा पर गंभीर दाने या एलर्जिक प्रतिक्रिया होने पर उपयोग रोक दें और त्वचा विशेषज्ञ से मिलें।',
    ],
  },
};

export function getSectionKeyForDatasetLine(source: 'SET1' | 'SET2', lineNumber: number): string {
  if (source === 'SET1') {
    if (lineNumber <= 972) return 'SET1_ACNE_DERMA';
    if (lineNumber <= 1040) return 'SET1_ADHD_CNS';
    if (lineNumber <= 1083) return 'SET1_DEADDICTION';
    if (lineNumber <= 3402) return 'SET1_ANTIHISTAMINE';
    if (lineNumber <= 3791) return 'SET1_NEURO_ALZHEIMER';
    if (lineNumber <= 3904) return 'SET1_ANTIAMOEBIC';
    if (lineNumber <= 5287) return 'SET1_HEMATINIC';
    if (lineNumber <= 5590) return 'SET1_ANESTHETIC';
    if (lineNumber <= 6415) return 'SET1_ANTIANGINAL';
    if (lineNumber <= 8019) return 'SET1_ANXIOLYTIC';
    if (lineNumber <= 8193) return 'SET1_APPETITE';
    if (lineNumber <= 8268) return 'SET1_ANTIARRHYTHMIC';
    if (lineNumber <= 8720) return 'SET1_ARTHRITIS';
    if (lineNumber <= 11222) return 'SET1_ASTHMA_COPD';
    if (lineNumber <= 11890) return 'SET1_IMMUNOSUPPRESSANT';
    return 'SET1_AYURVEDIC';
  } else {
    if (lineNumber <= 835) return 'SET2_BPH_UROLOGY';
    if (lineNumber <= 1109) return 'SET2_COAGULANT';
    if (lineNumber <= 2279) return 'SET2_ANTICOAGULANT';
    if (lineNumber <= 2655) return 'SET2_BONE_CALCIUM';
    if (lineNumber <= 8263) return 'SET2_ONCOLOGY';
    if (lineNumber <= 8520) return 'SET2_HEPATOBILIARY';
    if (lineNumber <= 8806) return 'SET2_CLEANSER';
    if (lineNumber <= 9625) return 'SET2_LAXATIVE';
    if (lineNumber <= 9852) return 'SET2_CONTRACEPTIVE';
    if (lineNumber <= 12599) return 'SET2_COUGH_COLD';
    if (lineNumber <= 12772) return 'SET2_ANTIDANDRUFF';
    if (lineNumber <= 14790) return 'SET2_ANTIDEPRESSANT';
    if (lineNumber <= 22266) return 'SET2_ANTIDIABETIC';
    if (lineNumber <= 22951) return 'SET2_ANTIDIARRHEAL';
    if (lineNumber <= 23301) return 'SET2_ENZYME';
    if (lineNumber <= 23833) return 'SET2_OPHTHALMIC';
    return 'SET2_EMOLLIENT';
  }
}

interface SaltRule {
  pattern: RegExp;
  getSalts: (strength: string | null, productLine: string) => string[];
  rxOverride?: boolean;
}

const SALT_RULES: SaltRule[] = [
  // Acne & Dermatology
  {
    pattern: /\b(AZIDERM|EXAZEL|EZANIC|AZECNE|AZOBRIL)\b/i,
    getSalts: (s) => [s ? `Azelaic Acid (${s})` : 'Azelaic Acid'],
    rxOverride: true,
  },
  {
    pattern: /\b(A RET|RETINO A|TRETIN(?!\s*ISO)|AIROL|SUPATRET|REVIZE)\b/i,
    getSalts: (s) => [s ? `Tretinoin (${s})` : 'Tretinoin'],
    rxOverride: true,
  },
  {
    pattern: /\b(ACUTRET|SOTRET|ISOTROIN|TRETIVA|ISOTANE|TUFACNE|RESOTEN|TRETIN ISO|I DERIVA|D ACNE I)\b/i,
    getSalts: (s) => [s ? `Isotretinoin (${s})` : 'Isotretinoin'],
    rxOverride: true,
  },
  {
    pattern: /\b(EPIDUO|DERIVA BPO|PERODUO|ADAPLE C)\b/i,
    getSalts: (_s, line) =>
      /CLIND/i.test(line) || /\bC\b/i.test(line)
        ? ['Adapalene (0.1% w/w)', 'Clindamycin (1% w/w)']
        : ['Adapalene (0.1% w/w)', 'Benzoyl Peroxide (2.5% w/w)'],
    rxOverride: true,
  },
  {
    pattern: /\b(DERIVA CMS|DERIVA MS|ADAFERIN|ADAPLE|ADACIN|ADIFF|ACLENE)\b/i,
    getSalts: (s, line) =>
      /CMS/i.test(line)
        ? ['Adapalene (0.1% w/w)', 'Clindamycin (1% w/w)']
        : [s ? `Adapalene (${s})` : 'Adapalene (0.1% w/w)'],
    rxOverride: true,
  },
  {
    pattern: /\b(BENZAC AC|PERSOL|PEROBAR|BREVOXYL|BENGEL|PERNEX AC)\b/i,
    getSalts: (s) => [s ? `Benzoyl Peroxide (${s})` : 'Benzoyl Peroxide'],
    rxOverride: false,
  },
  {
    pattern: /\b(CLINDAC A|CLEARGEL|FACECLIN|ACNESOL|ERYTOP|CLINCIN)\b/i,
    getSalts: (s, line) =>
      /AT|AP/i.test(line)
        ? ['Clindamycin (1% w/w)', 'Adapalene (0.1% w/w)']
        : [s ? `Clindamycin (${s})` : 'Clindamycin (1% w/w)'],
    rxOverride: true,
  },
  {
    pattern: /\b(TAZRET|TAZOTENE)\b/i,
    getSalts: (s) => [s ? `Tazarotene (${s})` : 'Tazarotene'],
    rxOverride: true,
  },

  // ADHD / Wakefulness
  {
    pattern: /\b(MODALERT|MODAFIL|MODAPRO|MODATEC|PROVAKE)\b/i,
    getSalts: (s) => [s ? `Modafinil (${s})` : 'Modafinil'],
    rxOverride: true,
  },
  {
    pattern: /\b(WAKLERT|ARMOD)\b/i,
    getSalts: (s) => [s ? `Armodafinil (${s})` : 'Armodafinil'],
    rxOverride: true,
  },
  {
    pattern: /\b(AXEPTA|ATTENTROL|ATTERA|ATTENTIN|ATOKEM)\b/i,
    getSalts: (s) => [s ? `Atomoxetine (${s})` : 'Atomoxetine'],
    rxOverride: true,
  },

  // De-addiction
  {
    pattern: /\b(ACAMPROL|ACAMPTAS)\b/i,
    getSalts: (s) => [s ? `Acamprosate Calcium (${s})` : 'Acamprosate Calcium (333 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(DISULFIRAM|ESPERAL|TYFUSIN)\b/i,
    getSalts: (s) => [s ? `Disulfiram (${s})` : 'Disulfiram'],
    rxOverride: true,
  },
  {
    pattern: /\b(NALTIMA|NODICT)\b/i,
    getSalts: (s) => [s ? `Naltrexone Hydrochloride (${s})` : 'Naltrexone Hydrochloride (50 mg)'],
    rxOverride: true,
  },

  // Antihistamines & Leukotriene Modifiers
  {
    pattern: /\b(ALLEGRA M|MONTAIR FX|MONTEK FX|ODIMONT FX|TELEKAST F|LUKOTAS FX|MONTEMAC FX)\b/i,
    getSalts: (s) => [
      s ? `Montelukast & Fexofenadine Hydrochloride (${s})` : 'Montelukast (10 mg) + Fexofenadine Hydrochloride (120 mg)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(ALLEGRA|HISTAFREE|ALTIVA|FEXOVA|FEXY|FEXIGRA|FEGRA|FENIXA)\b/i,
    getSalts: (s) => [s ? `Fexofenadine Hydrochloride (${s})` : 'Fexofenadine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(MONTAIR LC|MONTEK LC|L MONTUS|ODIMONT LC|TELEKAST L|XYZAL M|TECZINE M|LECOPE M|ALLERCET M|MONTICOPE|LCZ MONT|LAVETA M)\b/i,
    getSalts: (s) => [
      s ? `Montelukast & Levocetirizine Dihydrochloride (${s})` : 'Montelukast (10 mg) + Levocetirizine Dihydrochloride (5 mg)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(MONTAIR|MONTEK|ROMILAST|SINGULAIR|TELEKAST|ODIMONT|MONTEMAC)\b/i,
    getSalts: (s) => [s ? `Montelukast Sodium (${s})` : 'Montelukast Sodium'],
    rxOverride: true,
  },
  {
    pattern: /\b(CETZINE|OKACET(?!\s*L)|ALERID|ZYRTEC|CETCIP(?!\s*L)|ALLERCET(?!\s*L)|HICET(?!\s*L))\b/i,
    getSalts: (s) => [s ? `Cetirizine Hydrochloride (${s})` : 'Cetirizine Hydrochloride (10 mg)'],
    rxOverride: false,
  },
  {
    pattern: /\b(XYZAL|TECZINE|VOZET|LEVOCET|1 AL|LECOPE|LEVOSIZ|OKACET L|CETCIP L|ALLERCET L)\b/i,
    getSalts: (s) => [s ? `Levocetirizine Dihydrochloride (${s})` : 'Levocetirizine Dihydrochloride (5 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(AVIL|INTAVIL)\b/i,
    getSalts: (s) => [s ? `Pheniramine Maleate (${s})` : 'Pheniramine Maleate'],
    rxOverride: true,
  },
  {
    pattern: /\b(ATARAX|HICOPE|HYRAX)\b/i,
    getSalts: (s) => [s ? `Hydroxyzine Hydrochloride (${s})` : 'Hydroxyzine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(BILAGRA|BILAZEST|BELTAS|BILANTA|BILASURE)\b/i,
    getSalts: (s) => [s ? `Bilastine (${s})` : 'Bilastine (20 mg)'],
    rxOverride: true,
  },

  // Neuro / Alzheimer's
  {
    pattern: /\b(DONEP|ARICEP|ALZIL|DONECEPT)\b/i,
    getSalts: (s, line) =>
      /\bM\b/i.test(line)
        ? [`Donepezil Hydrochloride + Memantine Hydrochloride (${s || '5 mg / 10 mg'})`]
        : [s ? `Donepezil Hydrochloride (${s})` : 'Donepezil Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(ADMENTA|EBIXA|LARENTINE)\b/i,
    getSalts: (s) => [s ? `Memantine Hydrochloride (${s})` : 'Memantine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(STROCIT|CITILIN|SOMAZINA|PREXARON|CLINAXON|CITIMAC|NUROCOL)\b/i,
    getSalts: (s, line) =>
      /PLUS|\bP\b/i.test(line)
        ? ['Citicoline (500 mg)', 'Piracetam (800 mg)']
        : [s ? `Citicoline Sodium (${s})` : 'Citicoline Sodium (500 mg)'],
    rxOverride: true,
  },

  // Antiamoebic
  {
    pattern: /\b(FLAGYL|METROGYL|METRON|METROCIP)\b/i,
    getSalts: (s) => [s ? `Metronidazole (${s})` : 'Metronidazole'],
    rxOverride: true,
  },
  {
    pattern: /\b(NIZONIDE|NITAZET|NITACURE|ZONAXID)\b/i,
    getSalts: (s) => [s ? `Nitazoxanide (${s})` : 'Nitazoxanide'],
    rxOverride: true,
  },
  {
    pattern: /\b(SATROGYL)\b/i,
    getSalts: (s, line) =>
      /\bO\b/i.test(line)
        ? ['Satranidazole (300 mg)', 'Ofloxacin (200 mg)']
        : [s ? `Satranidazole (${s})` : 'Satranidazole (300 mg)'],
    rxOverride: true,
  },

  // Hematinics
  {
    pattern: /\b(OROFER XT|FERIUM XT|LIVOGEN XT|CHERI XT|FERONIA XT|AUTRIN|DEXORANGE|HEMFER|RUBIRED|TONOFERON)\b/i,
    getSalts: (s) => [
      s ? `Elemental Iron / Ferrous Ascorbate & Folic Acid (${s})` : 'Ferrous Ascorbate (100 mg) + Folic Acid (1.5 mg)',
    ],
    rxOverride: false,
  },
  {
    pattern: /\b(FOLVITE|FOL 5|VITAFOL|ZYFOLIC)\b/i,
    getSalts: (s) => [s ? `Folic Acid (${s})` : 'Folic Acid (5 mg)'],
    rxOverride: false,
  },
  {
    pattern: /\b(ENCICARB|FERINJECT|OROFER FCM)\b/i,
    getSalts: (s) => [s ? `Ferric Carboxymaltose Injection (${s})` : 'Ferric Carboxymaltose'],
    rxOverride: true,
  },

  // Anesthetics
  {
    pattern: /\b(XYLOCAINE|LIGNOX|LOX|GESICAIN|XYLONUMB)\b/i,
    getSalts: (s) => [s ? `Lignocaine Hydrochloride / Lidocaine (${s})` : 'Lignocaine Hydrochloride (2%)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ANAWIN|SENSORCAINE|BUPIVAN|BUPITROY)\b/i,
    getSalts: (s) => [s ? `Bupivacaine Hydrochloride (${s})` : 'Bupivacaine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(DIPRIVAN|NEOROF|FRESOFOL|TROYPOFOL|PROPOVAN)\b/i,
    getSalts: (s) => [s ? `Propofol Injectable Emulsion (${s})` : 'Propofol (1% w/v)'],
    rxOverride: true,
  },

  // Anti-Anginal
  {
    pattern: /\b(SORBITRATE|ISORDIL)\b/i,
    getSalts: (s) => [s ? `Isosorbide Dinitrate (${s})` : 'Isosorbide Dinitrate'],
    rxOverride: true,
  },
  {
    pattern: /\b(MONOTRATE|ISMO|IMDUR|MONIT(?!\s*GTN)|SOLOTRATE)\b/i,
    getSalts: (s) => [s ? `Isosorbide-5-Mononitrate (${s})` : 'Isosorbide-5-Mononitrate'],
    rxOverride: true,
  },
  {
    pattern: /\b(NITROCONTIN|ANGISPAN TR|GTN|MYONIT|NITROLONG|MONIT GTN)\b/i,
    getSalts: (s) => [s ? `Nitroglycerin / Glyceryl Trinitrate (${s})` : 'Nitroglycerin (2.6 mg / 6.4 mg CR)'],
    rxOverride: true,
  },
  {
    pattern: /\b(FLAVEDON|CYTOGARD|CARVIDON|TRIVEDON|METAGARD)\b/i,
    getSalts: (s) => [s ? `Trimetazidine Hydrochloride (${s})` : 'Trimetazidine Hydrochloride (35 mg MR)'],
    rxOverride: true,
  },
  {
    pattern: /\b(NIKORAN|KORANDIL|NICOSTAR)\b/i,
    getSalts: (s) => [s ? `Nicorandil (${s})` : 'Nicorandil'],
    rxOverride: true,
  },
  {
    pattern: /\b(IVABID|CORALAN|IVABRAD|IVABEAT)\b/i,
    getSalts: (s) => [s ? `Ivabradine (${s})` : 'Ivabradine'],
    rxOverride: true,
  },
  {
    pattern: /\b(RANOLAZ|RANCAD|RANX|RANOZEX)\b/i,
    getSalts: (s) => [s ? `Ranolazine Extended-Release (${s})` : 'Ranolazine (500 mg)'],
    rxOverride: true,
  },

  // Anxiolytics & Benzodiazepines
  {
    pattern: /\b(ALPRAX|RESTYL|TRIKA|ALZOLAM|ANXIT|ZOLAX)\b/i,
    getSalts: (s) => [s ? `Alprazolam (${s})` : 'Alprazolam'],
    rxOverride: true,
  },
  {
    pattern: /\b(CLONOTRIL|RIVOTRIL|LONAZEP|PETRIL|ZAPIZ|KLONAZ)\b/i,
    getSalts: (s) => [s ? `Clonazepam (${s})` : 'Clonazepam'],
    rxOverride: true,
  },
  {
    pattern: /\b(ATIVAN|LOPEZ|LORAWEL)\b/i,
    getSalts: (s) => [s ? `Lorazepam (${s})` : 'Lorazepam'],
    rxOverride: true,
  },
  {
    pattern: /\b(VALIUM|CALMPOSE|ZEPOSE|PLACIDOX)\b/i,
    getSalts: (s) => [s ? `Diazepam (${s})` : 'Diazepam'],
    rxOverride: true,
  },
  {
    pattern: /\b(FRISIUM|CLOBA|LOBAZAM|SOLZAM)\b/i,
    getSalts: (s) => [s ? `Clobazam (${s})` : 'Clobazam'],
    rxOverride: true,
  },
  {
    pattern: /\b(ETILAAM|ETIZOLA|EZOLENT)\b/i,
    getSalts: (s) => [s ? `Etizolam (${s})` : 'Etizolam'],
    rxOverride: true,
  },

  // Appetite
  {
    pattern: /\b(CIPLACTIN|PRACTIN|APTIMUST|CYPON|ABITOL)\b/i,
    getSalts: (s) => [s ? `Cyproheptadine Hydrochloride (${s})` : 'Cyproheptadine Hydrochloride (4 mg)'],
    rxOverride: true,
  },

  // Anti-Arrhythmic
  {
    pattern: /\b(CORDARONE|AMIODAR|DURON|TACHYRA|EURYTHMIC)\b/i,
    getSalts: (s) => [s ? `Amiodarone Hydrochloride (${s})` : 'Amiodarone Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(LANOXIN|DIXIN)\b/i,
    getSalts: (s) => [s ? `Digoxin (${s})` : 'Digoxin (0.25 mg)'],
    rxOverride: true,
  },

  // Arthritis / Rheumatology
  {
    pattern: /\b(ETOVA|ETOGESIC|ETOFREE)\b/i,
    getSalts: (s) => [s ? `Etodolac (${s})` : 'Etodolac'],
    rxOverride: true,
  },
  {
    pattern: /\b(DYCERIN|ORCERIN|CARTIDIN|HILIN)\b/i,
    getSalts: (s, line) =>
      /GM/i.test(line)
        ? ['Diacerein (50 mg)', 'Glucosamine Sulfate (750 mg)', 'Methylsulfonylmethane (250 mg)']
        : [s ? `Diacerein (${s})` : 'Diacerein (50 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(LEFRA|ARAVA|RUMALEF|LEFNO)\b/i,
    getSalts: (s) => [s ? `Leflunomide (${s})` : 'Leflunomide'],
    rxOverride: true,
  },
  {
    pattern: /\b(ZYCEL|CELEDOL|OSTIGARD)\b/i,
    getSalts: (s) => [s ? `Celecoxib (${s})` : 'Celecoxib'],
    rxOverride: true,
  },

  // Asthma / COPD
  {
    pattern: /\b(FORACORT|BUDAMATE|FORMONIDE|SYMBICORT|DIGIHALER FB|QUIKHALE FB|PEAKHALE FB|COMBIHALE FB|AIRTEC FB)\b/i,
    getSalts: (s) => [
      s ? `Formoterol Fumarate & Budesonide (${s})` : 'Formoterol Fumarate (6 mcg) + Budesonide (200 mcg)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(SEROFLO|SERETIDE|COMBITIDE|FLUTROL|AIRTEC SF|PEAKHALE SF|QUIKHALE SF)\b/i,
    getSalts: (s) => [
      s ? `Salmeterol & Fluticasone Propionate (${s})` : 'Salmeterol + Fluticasone Propionate',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(DUOLIN|COMBIMIST)\b/i,
    getSalts: (s) => [
      s ? `Levosalbutamol & Ipratropium Bromide (${s})` : 'Levosalbutamol + Ipratropium Bromide',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(ASTHALIN|VENTORLIN|SALBETOL)\b/i,
    getSalts: (s) => [s ? `Salbutamol / Albuterol (${s})` : 'Salbutamol'],
    rxOverride: true,
  },
  {
    pattern: /\b(LEVOLIN|SALBAIR)\b/i,
    getSalts: (s) => [s ? `Levosalbutamol (${s})` : 'Levosalbutamol'],
    rxOverride: true,
  },
  {
    pattern: /\b(BUDECORT|PULMICORT|DERINIDE|BUNASE)\b/i,
    getSalts: (s) => [s ? `Budesonide (${s})` : 'Budesonide'],
    rxOverride: true,
  },
  {
    pattern: /\b(TIOVA|TIOMIST|AIRTIO)\b/i,
    getSalts: (s) => [s ? `Tiotropium Bromide (${s})` : 'Tiotropium Bromide (18 mcg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(DERIPHYLLIN|DERICIP)\b/i,
    getSalts: (s) => [
      s ? `Etofylline & Theophylline (${s})` : 'Etofylline + Theophylline Hydrate',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(DOXOLIN|DOXORIL|SYNASMA|DOXOVENT|DOXIFLO)\b/i,
    getSalts: (s) => [s ? `Doxofylline (${s})` : 'Doxofylline (400 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(AB PHYLLINE|AB FLO|ACEBROBID|MACPHYLLINE)\b/i,
    getSalts: (s) => [s ? `Acebrophylline (${s})` : 'Acebrophylline (100 mg)'],
    rxOverride: true,
  },

  // Immunosuppressants
  {
    pattern: /\b(PANGRAF|PROGRAF|TACROGRAF|TACROZ|TAKFA|Vingraf)\b/i,
    getSalts: (s) => [s ? `Tacrolimus (${s})` : 'Tacrolimus'],
    rxOverride: true,
  },
  {
    pattern: /\b(PANIMUN BIORAL|SANDIMMUN|IMUSPORIN|CYCLOPHIL|ARPIMUNE)\b/i,
    getSalts: (s) => [s ? `Cyclosporine (${s})` : 'Cyclosporine'],
    rxOverride: true,
  },
  {
    pattern: /\b(CELLCEPT|MYCEPT|MYFORTIC|RENODAPT|MOFILET|BAXMUNE)\b/i,
    getSalts: (s) => [s ? `Mycophenolate Mofetil / Mycophenolic Acid (${s})` : 'Mycophenolate Mofetil (500 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(AZORAN|IMURAN|AZAPURE)\b/i,
    getSalts: (s) => [s ? `Azathioprine (${s})` : 'Azathioprine (50 mg)'],
    rxOverride: true,
  },

  // BPH / Urology
  {
    pattern: /\b(URIMAX|CONTIFLO|VELTAM|DYNAPRES|TAMFLO|TAMSULIN)\b/i,
    getSalts: (s, line) =>
      /\bD\b|\bPLUS\b/i.test(line)
        ? ['Tamsulosin Hydrochloride (0.4 mg)', 'Dutasteride (0.5 mg)']
        : [s ? `Tamsulosin Hydrochloride (${s})` : 'Tamsulosin Hydrochloride (0.4 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(SILODAL|RAPILIF|SILOFAST|SILDURA)\b/i,
    getSalts: (s, line) =>
      /\bD\b|\bD8\b|\bD4\b/i.test(line)
        ? [`Silodosin (${s || '8 mg'})`, 'Dutasteride (0.5 mg)']
        : [s ? `Silodosin (${s})` : 'Silodosin (8 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ALFOO|FLOTRAL|ALFUSIN)\b/i,
    getSalts: (s, line) =>
      /\bD\b/i.test(line)
        ? ['Alfuzosin Hydrochloride (10 mg)', 'Dutasteride (0.5 mg)']
        : [s ? `Alfuzosin Hydrochloride (${s})` : 'Alfuzosin Hydrochloride (10 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(DUPROST|DUTAS|VELTRIDE)\b/i,
    getSalts: (s, line) =>
      /\bT\b/i.test(line)
        ? ['Dutasteride (0.5 mg)', 'Tamsulosin (0.4 mg)']
        : [s ? `Dutasteride (${s})` : 'Dutasteride (0.5 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(FINPECIA|FINAX|FINCAR|FINAST)\b/i,
    getSalts: (s) => [s ? `Finasteride (${s})` : 'Finasteride'],
    rxOverride: true,
  },
  {
    pattern: /\b(MIRABIG|BETMIGA|BLADMIR|VESIBETA)\b/i,
    getSalts: (s) => [s ? `Mirabegron (${s})` : 'Mirabegron'],
    rxOverride: true,
  },

  // Coagulants & Anticoagulants
  {
    pattern: /\b(PAUSE|TRAPIC|TRENAXA|TEXAKIND|CLIP|XAMIC|CYKLOKAPRON)\b/i,
    getSalts: (s, line) =>
      /MF/i.test(line)
        ? ['Tranexamic Acid (500 mg)', 'Mefenamic Acid (250 mg)']
        : [s ? `Tranexamic Acid (${s})` : 'Tranexamic Acid (500 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(DICYNENE|ETHASYL|SYLATE|COSKLOT|E SYLATE)\b/i,
    getSalts: (s) => [s ? `Ethamsylate (${s})` : 'Ethamsylate'],
    rxOverride: true,
  },
  {
    pattern: /\b(ECOSPRIN|DELISPRIN|SPRIN)\b/i,
    getSalts: (s, line) => {
      if (/GOLD/i.test(line)) return ['Aspirin (75 mg)', 'Atorvastatin (10 mg)', 'Clopidogrel (75 mg)'];
      if (/AV/i.test(line)) return [`Aspirin (${s || '75 mg'})`, 'Atorvastatin (10 mg / 20 mg)'];
      return [s ? `Aspirin / Acetylsalicylic Acid (${s})` : 'Aspirin (75 mg)'];
    },
    rxOverride: true,
  },
  {
    pattern: /\b(CLOPITAB|DEPLATT|PLAVIX|CLAVIX|CERUVIN|CLOPIVAS|PLAGRIL|PREVA)\b/i,
    getSalts: (s, line) => {
      if (/GOLD|CV/i.test(line)) return ['Clopidogrel (75 mg)', 'Atorvastatin (10 mg / 20 mg)', 'Aspirin (75 mg)'];
      if (/\bA\b|\bAP\b|\bAS\b/i.test(line)) return ['Clopidogrel (75 mg)', `Aspirin (${s || '75 mg'})`];
      return [s ? `Clopidogrel Bisulfate (${s})` : 'Clopidogrel Bisulfate (75 mg)'];
    },
    rxOverride: true,
  },
  {
    pattern: /\b(BRILINTA|AXCER|TICAGAT|TICAFLO)\b/i,
    getSalts: (s) => [s ? `Ticagrelor (${s})` : 'Ticagrelor (90 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ACITROM|ARTIFLO|ACENO)\b/i,
    getSalts: (s) => [s ? `Acenocoumarol / Nicoumalone (${s})` : 'Acenocoumarol'],
    rxOverride: true,
  },
  {
    pattern: /\b(WARF|UNIWARFIN|MYWARF)\b/i,
    getSalts: (s) => [s ? `Warfarin Sodium (${s})` : 'Warfarin Sodium'],
    rxOverride: true,
  },
  {
    pattern: /\b(XARELTO)\b/i,
    getSalts: (s) => [s ? `Rivaroxaban (${s})` : 'Rivaroxaban'],
    rxOverride: true,
  },
  {
    pattern: /\b(ELIQUIS|APIGAT)\b/i,
    getSalts: (s) => [s ? `Apixaban (${s})` : 'Apixaban'],
    rxOverride: true,
  },
  {
    pattern: /\b(PRADAXA|DABISTAR|DABIGAT|DABICLOT)\b/i,
    getSalts: (s) => [s ? `Dabigatran Etexilate (${s})` : 'Dabigatran Etexilate'],
    rxOverride: true,
  },
  {
    pattern: /\b(CLEXANE|LONOPIN|CUTENOX|ENCLEX|LOMOH)\b/i,
    getSalts: (s) => [s ? `Enoxaparin Sodium Injection (${s})` : 'Enoxaparin Sodium'],
    rxOverride: true,
  },

  // Oncology
  {
    pattern: /\b(ABIRAPRO|ZECYTE|XBIRA|ABSTET|SAMTICA)\b/i,
    getSalts: (s) => [s ? `Abiraterone Acetate (${s})` : 'Abiraterone Acetate (250 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(GLIVEC|VEENAT|IMATIB|IMANIB|IMALEK)\b/i,
    getSalts: (s) => [s ? `Imatinib Mesylate (${s})` : 'Imatinib Mesylate (400 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(GEFTINAT|IRESSA|GEFTICIP)\b/i,
    getSalts: (s) => [s ? `Gefitinib (${s})` : 'Gefitinib (250 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ERLONAT|TARCEVA|ERLOCIP)\b/i,
    getSalts: (s) => [s ? `Erlotinib Hydrochloride (${s})` : 'Erlotinib Hydrochloride (150 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(CAPEGARD|XELODA|CAPECAD|CAPXCEL)\b/i,
    getSalts: (s) => [s ? `Capecitabine (${s})` : 'Capecitabine (500 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(FOLITRAX|MEXATE|IMUTREX|MEXT|ZEXATE)\b/i,
    getSalts: (s) => [s ? `Methotrexate (${s})` : 'Methotrexate'],
    rxOverride: true,
  },
  {
    pattern: /\b(FEMARA|LETROZ|LETERO|FERTOLET)\b/i,
    getSalts: (s) => [s ? `Letrozole (${s})` : 'Letrozole (2.5 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ARIMIDEX|ALTRAZ|ARMOTRAZ)\b/i,
    getSalts: (s) => [s ? `Anastrozole (${s})` : 'Anastrozole (1 mg)'],
    rxOverride: true,
  },

  // Hepatobiliary
  {
    pattern: /\b(UDILIV|URSOCOL|URSOKEM|ACTIBILE|GOLBI|URSODIL)\b/i,
    getSalts: (s) => [s ? `Ursodeoxycholic Acid (${s})` : 'Ursodeoxycholic Acid (300 mg)'],
    rxOverride: true,
  },

  // Laxatives
  {
    pattern: /\b(DUPHALAC|LOOZ|LACTIHEP|EVICT|LIVOLUK|CADILOSE)\b/i,
    getSalts: () => ['Lactulose Solution USP (10 g / 15 mL)'],
    rxOverride: false,
  },
  {
    pattern: /\b(CREMAFFIN)\b/i,
    getSalts: (_s, line) =>
      /PLUS/i.test(line)
        ? ['Liquid Paraffin', 'Milk of Magnesia', 'Sodium Picosulfate']
        : ['Liquid Paraffin', 'Milk of Magnesia'],
    rxOverride: false,
  },
  {
    pattern: /\b(DULCOFLEX|DULCOLAX|GERBISA)\b/i,
    getSalts: (s) => [s ? `Bisacodyl (${s})` : 'Bisacodyl (5 mg)'],
    rxOverride: false,
  },

  // Cough & Cold
  {
    pattern: /\b(ASCORIL LS|BRO ZEDEX LS|MACBERY LS|SOLVIN LS|CHERICOF LS|KUFRIL LS|GRILINCTUS LS|AMBRODIL LX)\b/i,
    getSalts: () => [
      'Levosalbutamol Sulphate (1 mg / 5 mL)',
      'Ambroxol Hydrochloride (30 mg / 5 mL)',
      'Guaifenesin (50 mg / 5 mL)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(MUCINAC|MUCOMIX|FLUIMUCIL)\b/i,
    getSalts: (s) => [s ? `Acetylcysteine / N-Acetylcysteine (${s})` : 'Acetylcysteine (600 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(SINAREST|WIKORYL|FEBREX PLUS|SOLVIN COLD|CHESTON COLD|MAXTRA P|D COLD TOTAL)\b/i,
    getSalts: () => [
      'Paracetamol',
      'Phenylephrine Hydrochloride',
      'Chlorpheniramine Maleate / Cetirizine',
    ],
    rxOverride: true,
  },

  // Antidepressants
  {
    pattern: /\b(NEXITO|CIPRALEX|STALOPAM|REXIPRA|FELIZ S|SZETALO|S CITADEP|C PRAM S)\b/i,
    getSalts: (s, line) =>
      /PLUS|FORTE|LS/i.test(line)
        ? [`Escitalopram Oxalate (${s || '10 mg'})`, 'Clonazepam (0.5 mg / 0.25 mg)']
        : [s ? `Escitalopram Oxalate (${s})` : 'Escitalopram Oxalate'],
    rxOverride: true,
  },
  {
    pattern: /\b(DAXID|SERTA|SERLIFT|ZOSERT|SERENATA)\b/i,
    getSalts: (s) => [s ? `Sertraline Hydrochloride (${s})` : 'Sertraline Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(FLUDAC|PRODEP|FLUNIL|NUZAC)\b/i,
    getSalts: (s) => [s ? `Fluoxetine Hydrochloride (${s})` : 'Fluoxetine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(PAXIDEP|PARI CR|PEXEP|XET|PATROXTA)\b/i,
    getSalts: (s) => [s ? `Paroxetine Hydrochloride (${s})` : 'Paroxetine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(DUZELA|SYMBAL|DULANE|DUVANTA)\b/i,
    getSalts: (s) => [s ? `Duloxetine Hydrochloride (${s})` : 'Duloxetine Hydrochloride'],
    rxOverride: true,
  },
  {
    pattern: /\b(TRYPTOMER|AMITONE|ELIWEL|SAROTENA)\b/i,
    getSalts: (s) => [s ? `Amitriptyline Hydrochloride (${s})` : 'Amitriptyline Hydrochloride'],
    rxOverride: true,
  },

  // Anti-Diabetics & Insulins
  {
    pattern: /\b(GLYCOMET GP|AMARYL M|ZORYL M|GLIMESTAR M|GLIMISAVE M|GLIMY M|DIAPRIDE M|GEMER|GLADOR M|GLUCORYL M|AZULIX MF|ISRYL M|APRIGLIM M)\b/i,
    getSalts: (s, line) => {
      const isForte = /FORTE|DS/i.test(line);
      return [
        `Glimepiride (${s || '1 mg / 2 mg'})`,
        `Metformin Hydrochloride SR (${isForte ? '1000 mg' : '500 mg'})`,
      ];
    },
    rxOverride: true,
  },
  {
    pattern: /\b(AMARYL|ZORYL|GLIMESTAR|GLIMISAVE|GLIMY|DIAPRIDE|GLADOR|GLUCORYL|EUGLIM|AZULIX|ISRYL|APRIGLIM)\b/i,
    getSalts: (s, line) => {
      if (/MV|VG|TRIO/i.test(line)) {
        return ['Glimepiride', 'Metformin Hydrochloride SR', 'Voglibose'];
      }
      if (/MP|PM|PG/i.test(line)) {
        return ['Glimepiride', 'Metformin Hydrochloride SR', 'Pioglitazone'];
      }
      return [s ? `Glimepiride (${s})` : 'Glimepiride'];
    },
    rxOverride: true,
  },
  {
    pattern: /\b(GLYCOMET|GLYCIPHAGE|METSMALL|CETAPIN|OBIMET|GLUCONORM SR|EXERMET|MELMET|WALAPHAGE|BIGOMET|OKAMET)\b/i,
    getSalts: (s, line) => {
      if (/TRIO|VG|GV/i.test(line)) {
        return ['Glimepiride', 'Metformin Hydrochloride SR', 'Voglibose'];
      }
      if (/GP|G1|G2|GX/i.test(line)) {
        return ['Glimepiride', `Metformin Hydrochloride (${s || '500 mg'})`];
      }
      return [s ? `Metformin Hydrochloride (${s})` : 'Metformin Hydrochloride (500 mg)'];
    },
    rxOverride: true,
  },
  {
    pattern: /\b(DIAMICRON|GLIZID|RECLIDE|GLYCINORM|CYBLEX|DIANORM|EUCLIDE)\b/i,
    getSalts: (s, line) =>
      /\bM\b|MEX|RECLIMET/i.test(line)
        ? [`Gliclazide (${s || '80 mg / 60 mg'})`, 'Metformin Hydrochloride (500 mg)']
        : [s ? `Gliclazide (${s})` : 'Gliclazide'],
    rxOverride: true,
  },
  {
    pattern: /\b(VOBIT|VOBOSE|VOLIX|VOLIBO|VOGLI|PPG|PRANDIAL|STARVOG|ADVOG|ZUVOG)\b/i,
    getSalts: (s, line) =>
      /\bM\b|MF/i.test(line)
        ? [`Voglibose (${s || '0.2 mg / 0.3 mg'})`, 'Metformin Hydrochloride (500 mg)']
        : [s ? `Voglibose (${s})` : 'Voglibose (0.2 mg / 0.3 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(JANUMET|ISTAMET|ZITAMET)\b/i,
    getSalts: (s) => [
      s ? `Sitagliptin Phosphate & Metformin Hydrochloride (${s})` : 'Sitagliptin (50 mg) + Metformin Hydrochloride (500 mg / 1000 mg)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(JANUVIA|ISTAVEL|ZITA(?!\s*PLUS|\s*MET))\b/i,
    getSalts: (s) => [s ? `Sitagliptin Phosphate (${s})` : 'Sitagliptin Phosphate (100 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(GALVUS MET|JALRA M|ZOMELIS MET|VYSOV M)\b/i,
    getSalts: (s) => [
      s ? `Vildagliptin & Metformin Hydrochloride (${s})` : 'Vildagliptin (50 mg) + Metformin Hydrochloride (500 mg / 1000 mg)',
    ],
    rxOverride: true,
  },
  {
    pattern: /\b(GALVUS|JALRA|ZOMELIS|VYSOV)\b/i,
    getSalts: (s) => [s ? `Vildagliptin (${s})` : 'Vildagliptin (50 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(TENIVA|TENGLYN|ZITEN|OLYMPRIX|TENDIA|ZITA PLUS|AFOGLIP|DYNAGLIPT|TENEBITE)\b/i,
    getSalts: (s, line) =>
      /\bM\b|MET/i.test(line)
        ? ['Teneligliptin (20 mg)', `Metformin Hydrochloride SR (${s || '500 mg'})`]
        : [s ? `Teneligliptin (${s})` : 'Teneligliptin (20 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(FORXIGA|OXRA|GLEDEPA)\b/i,
    getSalts: (s) => [s ? `Dapagliflozin (${s})` : 'Dapagliflozin (10 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(JARDIANCE|GIBTULIO)\b/i,
    getSalts: (s) => [s ? `Empagliflozin (${s})` : 'Empagliflozin (10 mg / 25 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(LANTUS|BASALOG|GLARITUS|TOUJEO|BASAGLAR)\b/i,
    getSalts: (s) => [s ? `Insulin Glargine Injection (${s})` : 'Insulin Glargine (100 IU/mL)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ACTRAPID|HUMINSULIN R|WOSULIN R|INSUGEN R)\b/i,
    getSalts: (s) => [s ? `Soluble Insulin / Regular Human Insulin (${s})` : 'Human Insulin Regular (40 IU/mL / 100 IU/mL)'],
    rxOverride: true,
  },
  {
    pattern: /\b(MIXTARD|HUMINSULIN 30\/70|WOSULIN 30\/70|INSUGEN 30\/70)\b/i,
    getSalts: (s) => [s ? `Biphasic Isophane Human Insulin 30/70 (${s})` : 'Biphasic Human Insulin 30/70'],
    rxOverride: true,
  },

  // Probiotics & Anti-diarrheals
  {
    pattern: /\b(ENTEROGERMINA|ENTROMAX|CLAUSIBAC)\b/i,
    getSalts: () => ['Bacillus clausii Spores Suspension (2 Billion / 5 mL)'],
    rxOverride: false,
  },
  {
    pattern: /\b(ECONORM|NORMAGUT|GUTPRO)\b/i,
    getSalts: () => ['Saccharomyces boulardii (250 mg)'],
    rxOverride: false,
  },
  {
    pattern: /\b(REDOTIL|ENUFF|ZEDOTT|RACIGYL|CADOTRIL)\b/i,
    getSalts: (s) => [s ? `Racecadotril (${s})` : 'Racecadotril (100 mg)'],
    rxOverride: true,
  },
  {
    pattern: /\b(IMODIUM|ELDOPER|ROKO|ANDIAL)\b/i,
    getSalts: (s) => [s ? `Loperamide Hydrochloride (${s})` : 'Loperamide Hydrochloride (2 mg)'],
    rxOverride: false,
  },

  // Enzymes
  {
    pattern: /\b(CREON|ENZAR|PANLIPASE|AGNA)\b/i,
    getSalts: (s) => [s ? `Pancreatin Minimicrospheres (${s})` : 'Pancreatin (10000 / 25000 IU)'],
    rxOverride: true,
  },
  {
    pattern: /\b(ARISTOZYME|UNIENZYME|DIGEPLEX|LUPIZYME|VITAZYME|NEOPEPTINE)\b/i,
    getSalts: () => ['Fungal Diastase + Pepsin'],
    rxOverride: false,
  },

  // Ophthalmic
  {
    pattern: /\b(REFRESH TEARS|REFRESH LIQUIGEL|ECOTEARS|ADD TEARS|LUBREX|VELDROP|EYEMIST)\b/i,
    getSalts: (s) => [s ? `Carboxymethylcellulose Sodium Eye Drops (${s})` : 'Carboxymethylcellulose Sodium (0.5% w/v)'],
    rxOverride: false,
  },
];

export function inferBrandKnowledge(
  brandFamily: string,
  productLine: string,
  strength: string | null,
  sectionKey: string
): {
  activeSalts: string[];
  therapeuticClass: string;
  isPrescriptionRequired: boolean | null;
  hindiIndications: string[];
  hindiPrecautions: string[];
} {
  const section = THERAPEUTIC_SECTIONS[sectionKey] || THERAPEUTIC_SECTIONS.SET1_AYURVEDIC;
  const combinedText = `${brandFamily} ${productLine}`;

  for (const rule of SALT_RULES) {
    if (rule.pattern.test(combinedText)) {
      return {
        activeSalts: rule.getSalts(strength, productLine),
        therapeuticClass: section.therapeuticClass,
        isPrescriptionRequired:
          rule.rxOverride !== undefined ? rule.rxOverride : section.defaultPrescriptionRequired,
        hindiIndications: section.hindiIndications,
        hindiPrecautions: section.hindiPrecautions,
      };
    }
  }

  return {
    activeSalts: [],
    therapeuticClass: section.therapeuticClass,
    isPrescriptionRequired: section.defaultPrescriptionRequired,
    hindiIndications: section.hindiIndications,
    hindiPrecautions: section.hindiPrecautions,
  };
}
