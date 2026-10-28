import type {
  AnalyzeApiEnvelope,
  FoodRelation,
  LanguageMode,
  MedicineData,
} from '../types/medicine';

export interface LocalizedBenefit {
  title: string;
  description: string;
  badge?: string;
}

export interface LocalizedReportContent {
  lang: LanguageMode;
  statusLabel: string;
  brandLabel: string;
  brandValue: string;
  dosageFormLabel: string;
  dosageFormValue: string;
  strengthLabel: string;
  strengthValue: string;
  therapeuticClassLabel: string;
  therapeuticClassValue: string;
  rxLabel: string;
  rxTag: string;
  rxWarningBanner: string | null;
  activeSaltsLabel: string;
  activeSaltsList: string[];
  activeSaltsDescription: string;
  usesLabel: string;
  usesList: string[];
  precautionsLabel: string;
  precautionsList: string[];
  guidanceLabel: string;
  guidanceText: string;
  disclaimerLabel: string;
  disclaimerText: string;
  unclearTitle: string;
  unclearText: string;
  unclearActionText: string;
  packagingEvidenceLabel: string;

  // Schedule & Administration (How & When to take)
  scheduleSectionTitle: string;
  howToTakeLabel: string;
  howToTakeText: string;
  timingScheduleLabel: string;
  morningLabel: string;
  morningTime: string;
  morningActive: boolean;
  afternoonLabel: string;
  afternoonTime: string;
  afternoonActive: boolean;
  eveningLabel: string;
  eveningTime: string;
  eveningActive: boolean;
  frequencyLabel: string;
  frequencyText: string;
  foodRelation: FoodRelation;
  foodRelationBadge: string;
  foodRelationInstruction: string;

  // Benefits
  benefitsSectionTitle: string;
  benefitsList: LocalizedBenefit[];
}

// ---------------------------------------------------------------------------
// Standard Clinical Presets & Translations for Indian Formulations
// ---------------------------------------------------------------------------

interface SaltKnowledge {
  aliases?: string[];
  enUses: string[];
  hinglishUses: string[];
  hiUses?: string[];
  enPrecautions: string[];
  hinglishPrecautions: string[];
  hiPrecautions?: string[];
  enAdvice: string;
  hinglishAdvice: string;
  hiAdvice?: string;
  enClass: string;
  hinglishClass: string;
  hiClass?: string;

  // How to take
  howToTake: {
    en: string;
    hinglish: string;
    hi: string;
  };

  // Schedule & Timings
  morning: boolean;
  morningTime: string;
  afternoon: boolean;
  afternoonTime: string;
  evening: boolean;
  eveningTime: string;
  frequency: {
    en: string;
    hinglish: string;
    hi: string;
  };
  foodRelation: FoodRelation;
  foodInstruction: {
    en: string;
    hinglish: string;
    hi: string;
  };

  // Formatted Benefits
  benefits: {
    en: LocalizedBenefit[];
    hinglish: LocalizedBenefit[];
    hi: LocalizedBenefit[];
  };
}

const COMMON_SALTS_MAP: Record<string, SaltKnowledge> = {
  paracetamol: {
    aliases: ['crocin', 'dolo', 'calpol', 'pacimol', 'feva', 'metacin', 'acetaminophen'],
    enUses: [
      'Effective reduction of fever and elevated body temperature.',
      'Relief from mild to moderate pain including headaches, body aches, muscle pain, and toothache.',
    ],
    hinglishUses: [
      'Bukhaar (fever) aur sharir ke taapmaan ko kam karne ke liye.',
      'Halke se madhyam dard jaise sir dard, badan dard, daant dard aur jodon ke dard mein aaram deta hai.',
    ],
    hiUses: [
      'तीव्र बुखार (Fever) और शरीर के बढ़े तापमान को सुरक्षित रूप से कम करने हेतु।',
      'सिरदर्द, बदन दर्द, मांसपेशियों के दर्द और दांत दर्द से त्वरित व प्रभावी राहत।',
    ],
    enPrecautions: [
      'Do not exceed the recommended maximum daily dose (max 4,000 mg/day for adults) to prevent risk of liver toxicity.',
      'Avoid drinking alcohol while taking paracetamol.',
      'Check other cold/cough medications to prevent accidental paracetamol double-dosing.',
    ],
    hinglishPrecautions: [
      'Nirdharit dose se zyada na lein; zyada paracetamol lene se liver ko gambhir nuksaan ho sakta hai.',
      'Dawa ke saath sharab (alcohol) ka sevan bilkul na karein.',
      'Agar koi doosri sardi-zukham ki dawa le rahe hain, toh check karein ki usme bhi paracetamol na ho.',
    ],
    hiPrecautions: [
      'वयस्क 24 घंटे में 4000mg से अधिक खुराक कतई न लें, अन्यथा लिवर को गंभीर नुकसान हो सकता है।',
      'दवा के सेवन के दौरान शराब का सेवन बिल्कुल न करें।',
      'अन्य खांसी-जुकाम की दवाओं में भी पैरासिटामोल होने की जांच करें ताकि ओवरडोज न हो।',
    ],
    enAdvice:
      'Take after meals with a full glass of water. If fever persists for more than 3 consecutive days, consult your physician promptly.',
    hinglishAdvice:
      'Dawa ko khane ke baad paani ke saath lein. Agar bukhaar 3 din se zyada rahe toh turant doctor se consult karein.',
    hiAdvice:
      'दवा को भोजन के बाद एक गिलास पानी के साथ लें। यदि बुखार 3 दिन से अधिक रहे तो तुरंत डॉक्टर से संपर्क करें।',
    enClass: 'Analgesic & Antipyretic (Pain Relief & Fever Reducer)',
    hinglishClass: 'Dard Aur Bukhaar Ki Dawa (Analgesic & Antipyretic)',
    hiClass: 'एनाल्जेसिक एवं एंटीपायरेटिक (दर्द निवारक व ज्वरनाशक)',
    howToTake: {
      en: 'Swallow whole with a full glass of water (approx. 200 ml). Do not chew, crush, or break the tablet. If oral suspension, measure using the calibrated dosing cup.',
      hinglish: 'Ek poora glass paani ke sath bina chabaye poori goli nigal lein. Goli ko todein ya peesein nahi. Agar syrup hai toh measuring cup se naap kar lein.',
      hi: 'एक गिलास ताजे पानी के साथ पूरी गोली निगलें। गोली को चबाएं, तोड़ें या पीसें नहीं। सिरप होने पर नापने वाले ढक्कन का ही प्रयोग करें।',
    },
    morning: true,
    morningTime: '08:00 AM - 09:00 AM',
    afternoon: true,
    afternoonTime: '01:30 PM - 02:30 PM (If needed)',
    evening: true,
    eveningTime: '08:30 PM - 09:30 PM',
    frequency: {
      en: '1 tablet every 6 to 8 hours as needed (Maximum 4 tablets per 24 hours)',
      hinglish: 'Zaroorat padne par har 6 se 8 ghante mein 1 goli (24 ghante mein maximum 4 goli)',
      hi: 'आवश्यकतानुसार प्रत्येक 6 से 8 घंटे में 1 गोली (24 घंटे में अधिकतम 4 गोलियां)',
    },
    foodRelation: 'AFTER_FOOD',
    foodInstruction: {
      en: 'Take strictly 15 to 30 minutes AFTER food or a light meal with water to prevent any gastric irritation.',
      hinglish: 'Pet mein jalan ya acidity se bachne ke liye hamesha khane ya halke nashte ke 15-30 minute BAAD lein.',
      hi: 'पेट में एसिडिटी या जलन से बचाव हेतु सदैव भोजन या हल्के नाश्ते के 15-30 मिनट बाद ताजे पानी से लें।',
    },
    benefits: {
      en: [
        {
          title: 'Rapid Fever Reduction',
          badge: 'Fast Acting ~30 Mins',
          description: 'Resets the hypothalamic heat-regulating center to safely lower high body temperatures within 30 to 45 minutes.',
        },
        {
          title: 'Targeted Pain Relief',
          badge: 'Dual Action',
          description: 'Inhibits peripheral and central pain receptors, alleviating headaches, body stiffness, toothaches, and post-viral soreness.',
        },
        {
          title: 'High Gastric Safety Profile',
          badge: 'Stomach Gentle',
          description: 'Does not irritate the stomach lining or induce gastric ulcers unlike traditional NSAIDs like aspirin or ibuprofen.',
        },
      ],
      hinglish: [
        {
          title: 'Tez Bukhaar Mein Turant Aaram',
          badge: 'Tez Asar ~30 Min',
          description: 'Sharir ke badhe huye taapmaan ko lagbhag 30 se 45 minute ke andar surakshit roop se kam karta hai.',
        },
        {
          title: 'Dard Aur Akdan Se Rahat',
          badge: 'Multi-Pain Relief',
          description: 'Sir dard, peeth dard, maanspeshiyon ki akdan aur daant dard mein turant rahat pradan karta hai.',
        },
        {
          title: 'Pet Ke Liye Surakshit',
          badge: 'Pet Par Saumya',
          description: 'Aspirin ya ibuprofen ki tulna mein pet ki aantarik parat ke liye kaafi surakshit aur saumya hota hai.',
        },
      ],
      hi: [
        {
          title: 'तीव्र ज्वर से त्वरित राहत',
          badge: 'त्वरित असर ~30 मिनट',
          description: 'मस्तिष्क के ताप-नियंत्रक केंद्र को संतुलित कर 30 से 45 मिनट के भीतर बुखार को सुरक्षित रूप से घटाता है।',
        },
        {
          title: 'प्रभावी दर्द निवारक',
          badge: 'दोहरा प्रभाव',
          description: 'सिरदर्द, जोड़ों के दर्द, बदन दर्द और मांसपेशियों के खिंचाव से निरंतर राहत दिलाता है।',
        },
        {
          title: 'पेट की सुरक्षा के अनुकूल',
          badge: 'अल्सर-मुक्त सुरक्षा',
          description: 'पारंपरिक दर्दनिवारक दवाओं (NSAIDs) की तुलना में पेट की परत पर अत्यधिक सुरक्षित और सौम्य रहता है।',
        },
      ],
    },
  },

  amoxicillin: {
    aliases: ['mox', 'augmentin', 'clamox', 'amoxyclav', 'novamox', 'moxikind'],
    enUses: [
      'Treatment of bacterial infections affecting the respiratory tract, throat, ears, sinuses, and urinary system.',
      'Eradication of susceptible bacterial pathogens under medical supervision.',
    ],
    hinglishUses: [
      'Bacterial infections jaise gale ki kharash, sinus, chest infection, kaan ke infection aur peshab ke infection ke ilaj ke liye.',
      'Sharir ke andar hanikarak bacteria ko nasht karne mein madad karti hai.',
    ],
    hiUses: [
      'गले, कान, छाती, फेफड़ों, साइनस और मूत्र मार्ग के बैक्टीरियल संक्रमण का संपूर्ण उपचार।',
      'रोग पैदा करने वाले हानिकारक जीवाणुओं (Bacteria) का प्रभावी खात्मा।',
    ],
    enPrecautions: [
      'Schedule H Antibiotic: Must only be taken on the valid prescription of a Registered Medical Practitioner.',
      'Always complete the full prescribed course even if symptoms disappear early, to prevent antibiotic resistance.',
      'Take with food to minimize possible stomach upset or nausea.',
    ],
    hinglishPrecautions: [
      'Schedule H Antibiotic: Bina doctor ke prescription ke is dawa ko kabhi na khareedein aur na lein.',
      'Doctor dwara bataya gaya pura course poora karein; thoda theek lagne par bhi dawa beech mein na chhorein taaki bacteria resistant na bane.',
      'Khane ke saath ya turant baad lein taaki pet kharab ya ulti jaisa na lage.',
    ],
    hiPrecautions: [
      'शिड्यूल H एंटीबायोटिक: केवल पंजीकृत डॉक्टर के वैध पर्चे पर ही सेवन करें।',
      'लक्षण ठीक होने पर भी डॉक्टर द्वारा बताया गया पूरा कोर्स समाप्त करें, अन्यथा बैक्टीरिया प्रतिरोधी बन सकते हैं।',
      'पेट में मरोड़ या जी मिचलाने से बचने के लिए भोजन के साथ लें।',
    ],
    enAdvice:
      'Take doses at evenly spaced intervals around the clock. Notify your doctor immediately if any allergic skin rash or severe diarrhea develops.',
    hinglishAdvice:
      'Dawa ko nishchit samay par lein. Agar twacha par koi allergy, chakatte ya dast ki shikayat ho toh turant doctor ko batayein.',
    hiAdvice:
      'समान समय अंतराल पर नियमित रूप से लें। एलर्जी या दस्त होने पर तुरंत चिकित्सक से संपर्क करें।',
    enClass: 'Broad-Spectrum Penicillin Antibiotic',
    hinglishClass: 'Bacterial Infection Ki Antibiotic Dawa',
    hiClass: 'ब्रॉड-स्पेक्ट्रम पेनिसिलिन एंटीबायोटिक (जीवाणुरोधी)',
    howToTake: {
      en: 'Swallow whole with a full glass of water. Space doses strictly at equal intervals (every 8 or 12 hours) to maintain continuous bactericidal drug concentration in circulation.',
      hinglish: 'Goli ko poore glass paani ke sath nigalein. Nirdharit niyamit samay (har 8 ya 12 ghante) par lein taaki sharir mein antibiotic ka level bana rahe.',
      hi: 'एक गिलास पानी के साथ पूरी गोली निगलें। रक्त में दवा का निरंतर स्तर बनाए रखने के लिए समान अंतराल (हर 8 या 12 घंटे) पर लें।',
    },
    morning: true,
    morningTime: '08:00 AM',
    afternoon: false,
    afternoonTime: '02:00 PM (If 3x Daily)',
    evening: true,
    eveningTime: '08:00 PM - 09:00 PM',
    frequency: {
      en: 'Twice daily (Every 12 hours) or Thrice daily as strictly prescribed by your physician',
      hinglish: 'Din mein 2 baar (har 12 ghante par) ya doctor ke nirdeshanusar',
      hi: 'दिन में 2 बार (हर 12 घंटे पर) या डॉक्टर के निर्देशानुसार पूरा कोर्स',
    },
    foodRelation: 'AFTER_FOOD',
    foodInstruction: {
      en: 'Take with a meal or immediately within 15 minutes after eating to optimize absorption and prevent nausea or gastric distress.',
      hinglish: 'Khane ke sath ya khana khane ke turant 15 minute ke andar lein taaki ulti ya pet kharab na ho.',
      hi: 'भोजन के साथ या खाना खाने के तुरंत 15 मिनट के भीतर लें ताकि पेट खराब या जी मिचलाने की समस्या न हो।',
    },
    benefits: {
      en: [
        {
          title: 'Broad-Spectrum Bacterial Eradication',
          badge: 'Broad Spectrum',
          description: 'Destroys bacterial cell walls to eliminate infections across the respiratory, ENT, dental, and urinary systems.',
        },
        {
          title: 'High Tissue Penetration',
          badge: 'Deep Reach',
          description: 'Quickly reaches optimal therapeutic concentrations in bronchial secretions, middle ear fluids, and sinus mucosa.',
        },
        {
          title: 'Prevents Bacterial Complications',
          badge: 'Clinical Cure',
          description: 'Halts bacterial progression and prevents secondary systemic complications when taken as a complete course.',
        },
      ],
      hinglish: [
        {
          title: 'Bacteria Ka Pura Khatma',
          badge: 'Complete Cure',
          description: 'Gale, kaan, sinus aur chest ke bacterial infections ko jad se khatam karne mein behad prabhavi.',
        },
        {
          title: 'Tez Healing Aur Aaram',
          badge: 'Fast Relief',
          description: 'Khoon mein jaldi ghulkar infection wale hisse tak pahunchta hai aur 48 ghante mein asar dikhata hai.',
        },
        {
          title: 'Secondary Infection Se Bachav',
          badge: 'Protection',
          description: 'Course pura karne par infection ke dobara lautne ya failne ka khatra khatam ho jata hai.',
        },
      ],
      hi: [
        {
          title: 'हानिकारक जीवाणुओं का समूल नाश',
          badge: 'ब्रॉड स्पेक्ट्रम',
          description: 'बैक्टीरिया की कोशिका भित्ति को नष्ट कर गले, कान, फेफड़ों और मूत्र मार्ग के संक्रमण को जड़ से मिटाता है।',
        },
        {
          title: 'ऊतकों में त्वरित अवशोषण',
          badge: 'शीघ्र प्रभाव',
          description: 'श्वसन तंत्र और साइनस के ऊतकों में गहराई से पहुंचकर 24-48 घंटे में संक्रमण के लक्षण शांत करता है।',
        },
        {
          title: 'संक्रमण की पुनरावृत्ति से सुरक्षा',
          badge: 'सुरक्षा कवच',
          description: 'पूरा कोर्स लेने पर रोग के दोबारा लौटने या जटिलताओं के पनपने का खतरा समाप्त हो जाता है।',
        },
      ],
    },
  },

  pantoprazole: {
    aliases: ['pan', 'pantocid', 'pantodac', 'omez', 'rabeprazole', 'omeprazole', 'esomeprazole', 'rantac', 'ranitidine'],
    enUses: [
      'Treatment of gastroesophageal reflux disease (GERD), acid reflux, and persistent heartburn.',
      'Healing and prevention of gastric ulcers and acid-induced irritation of the stomach lining.',
    ],
    hinglishUses: [
      'Pet mein jalan (heartburn), acid reflux, gas aur khatti dakaar se aaram ke liye.',
      'Pet ke chaalon (gastric ulcers) ko theek karne aur pet ki suraksha ke liye.',
    ],
    hiUses: [
      'पेट में अत्यधिक गैस, खट्टी डकारें, सीने की जलन (Heartburn) और एसिड रिफ्लक्स का उपचार।',
      'पेट एवं आंतों के छालों (Gastric & Peptic Ulcers) को ठीक करने और सुरक्षित रखने हेतु।',
    ],
    enPrecautions: [
      'Best taken once daily in the morning, approximately 30 to 60 minutes before breakfast.',
      'Swallow the tablet or capsule whole; do not crush, chew, or break it.',
      'Long-term continuous therapy should only be performed under ongoing physician supervision.',
    ],
    hinglishPrecautions: [
      'Subah nashte se lagbhag 30 se 60 minute pehle khali pet lena sabse behtar hota hai.',
      'Goli ko chabayein ya todein nahi, poora paani ke saath nigal lein.',
      'Bina doctor ki salah ke lambe samay tak lagataar is dawa ka sevan na karein.',
    ],
    hiPrecautions: [
      'सुबह नाश्ते से 30 से 60 मिनट पूर्व खाली पेट लेना ही सर्वाधिक लाभकारी होता है।',
      'गोली या कैप्सूल को तोड़े, चबाए या खोले बिना पूरा निगलें।',
      'बिना डॉक्टर के परामर्श के लगातार कई महीनों तक इसका सेवन न करें।',
    ],
    enAdvice:
      'Take consistently before your morning meal. Maintaining a healthy diet and avoiding excessively spicy or oily food enhances recovery.',
    hinglishAdvice:
      'Subah khali pet lein. Dawa ke saath-saath zyada teekha, tala-bhuna khana khane se bachein taaki acidity jaldi theek ho.',
    hiAdvice:
      'सुबह खाली पेट लें। अत्यधिक तला-भुना व तीखा भोजन खाने से परहेज करें।',
    enClass: 'Proton Pump Inhibitor (Acid Reducer & Gastroprotective)',
    hinglishClass: 'Pet Ki Gas Aur Acidity Kam Karne Wali Dawa (PPI)',
    hiClass: 'प्रोटॉन पंप इनहिबिटर (एसिड कम करने वाली गैस्ट्रोप्रोटेक्टिव दवा)',
    howToTake: {
      en: 'Swallow the delayed-release tablet or capsule whole with half a glass of plain water. Never crush, chew, or split the enteric coating.',
      hinglish: 'Aadha glass sadhe paani ke saath poori goli nigal lein. Goli ki coating ko chabayein ya todein nahi.',
      hi: 'आधे गिलास सादे पानी के साथ पूरी गोली निगलें। दवा की ऊपरी कोटिंग को चबाएं या तोड़ें नहीं।',
    },
    morning: true,
    morningTime: '07:30 AM - 08:00 AM (First thing in morning)',
    afternoon: false,
    afternoonTime: 'Not recommended',
    evening: false,
    eveningTime: '07:30 PM (Only if twice-daily advised)',
    frequency: {
      en: 'Once daily in the morning on an empty stomach (Or twice daily for severe erosive reflux)',
      hinglish: 'Rozana subah khali pet 1 goli (ya doctor ke bataye anusar)',
      hi: 'प्रतिदिन सुबह खाली पेट 1 गोली (गंभीर स्थिति में डॉक्टर के निर्देशानुसार 2 बार)',
    },
    foodRelation: 'BEFORE_FOOD',
    foodInstruction: {
      en: 'Must be taken strictly 30 to 60 minutes BEFORE morning breakfast on an empty stomach for maximum acid pump suppression.',
      hinglish: 'Subah nashta karne se lagbhag 30 se 60 minute PEHLE khali pet lein taaki yeh acid ko banne se rok sake.',
      hi: 'सुबह का नाश्ता करने से अनिवार्यतः 30 से 60 मिनट पहले खाली पेट लें ताकि यह पेट में एसिड के स्राव को प्रभावी ढंग से रोक सके।',
    },
    benefits: {
      en: [
        {
          title: '24-Hour Acid Suppression',
          badge: '24-Hr Shield',
          description: 'Irreversibly inhibits active gastric H+/K+ ATPase proton pumps to eliminate persistent heartburn, acidity, and acid regurgitation.',
        },
        {
          title: 'Ulcer Healing & Mucosal Repair',
          badge: 'Mucosal Repair',
          description: 'Maintains ideal stomach pH for rapid cellular re-epithelialization and healing of erosive esophagitis and stomach ulcers.',
        },
        {
          title: 'Gastroprotection from Painkillers',
          badge: 'Protective Shield',
          description: 'Shields delicate gastric mucosa against erosions and bleeding caused by pain relievers and antibiotic regimens.',
        },
      ],
      hinglish: [
        {
          title: '24 Ghante Gas Aur Jalan Se Chhuttkara',
          badge: '24-Hr Shield',
          description: 'Pet ke acid banane wale pumps ko shant karta hai, jisse seene ki jalan aur khatti dakaar turant band hoti hai.',
        },
        {
          title: 'Pet Ke Chaalo Ko Theek Kare',
          badge: 'Ulcer Healing',
          description: 'Pet ki aantarik deewar ko healing ka samay deta hai aur chhaalo ko jaldi theek karta hai.',
        },
        {
          title: 'Dard Ki Dawaon Se Pet Ki Suraksha',
          badge: 'Stomach Protection',
          description: 'Painkillers ya antibiotics ke sath lene par pet mein acidity ya jalan nahi hone deta.',
        },
      ],
      hi: [
        {
          title: '24 घंटे एसिडिटी और जलन से राहत',
          badge: '24-घंटे सुरक्षा',
          description: 'पेट में एसिड बनाने वाले एंजाइम्स को नियंत्रित कर सीने की जलन और एसिड रिफ्लक्स को दिनभर शांत रखता है।',
        },
        {
          title: 'पेट व भोजन नली के छालों का उपचार',
          badge: 'अल्सर हीलिंग',
          description: 'पेट की अंदरूनी परत को सुरक्षित कर घावों और छालों को तेजी से भरने में मदद करता है।',
        },
        {
          title: 'दर्द निवारक दवाओं से पेट की सुरक्षा',
          badge: 'गैस्ट्रो-प्रोटेक्शन',
          description: 'एंटीबायोटिक या दर्दनिवारक दवाओं के कारण होने वाली पेट में जलन व गैस से संपूर्ण सुरक्षा प्रदान करता है।',
        },
      ],
    },
  },

  cetirizine: {
    aliases: ['ctz', 'zyrtec', 'okacet', 'levocetirizine', 'allegra', 'fexofenadine', 'avil', 'cetriz'],
    enUses: [
      'Relief from symptoms of seasonal and perennial allergic rhinitis (sneezing, runny nose, itchy watery eyes).',
      'Management of allergic skin reactions including hives (urticaria) and pruritus.',
    ],
    hinglishUses: [
      'Allergy ke lakshano jaise chhikein aana, naak behna, aankhon mein khujli aur paani aane se aaram ke liye.',
      'Twacha par allergy, laal daane, chakatte aur khujli (urticaria) ke upchaar ke liye.',
    ],
    hiUses: [
      'मौसमी व धूल-प्रदूषण से होने वाली एलर्जी, छींकें, बहती नाक, आंखों में खुजली और पानी आने से राहत।',
      'त्वचा पर पित्ती (Urticaria), लाल चकत्ते, खुजली और एलर्जी का प्रभावी नियंत्रण।',
    ],
    enPrecautions: [
      'May cause drowsiness or dizziness; exercise caution when driving or operating machinery.',
      'Avoid concurrent consumption of alcohol as it intensifies drowsiness.',
      'Consult your physician if you have kidney impairment or severe urinary retention issues.',
    ],
    hinglishPrecautions: [
      'Is dawa se thodi neend ya aalsi pan (drowsiness) aa sakti hai; dawa lene ke baad gaadi chalane se bachein.',
      'Dawa ke sath sharab (alcohol) bilkul na piyein kyunki isse neend aur susti badh sakti hai.',
      'Kidney ki bimari hone par doctor ki salah ke bina na lein.',
    ],
    hiPrecautions: [
      'हल्की नींद या सुस्ती आ सकती है; दवा लेने के बाद वाहन चलाने या भारी मशीनरी चलाने से बचें।',
      'दवा के साथ शराब का सेवन न करें क्योंकि इससे अत्यधिक सुस्ती आ सकती है।',
      'गुर्दे (Kidney) के मरीज डॉक्टर की सलाह के बाद ही सेवन करें।',
    ],
    enAdvice:
      'Take preferably in the evening or before bedtime with or without food. Stay adequately hydrated throughout the day.',
    hinglishAdvice:
      'Is dawa ko aamtaur par raat ko sone se pehle lena behtar hota hai. Din bhar paryapt paani piyein.',
    hiAdvice:
      'सामान्यतः रात को सोने से पहले लें। पर्याप्त पानी पिएं।',
    enClass: 'Second-Generation Antihistamine & Anti-Allergic',
    hinglishClass: 'Allergy Aur Sardi-Zukham Ki Dawa (Antihistamine)',
    hiClass: 'एंटीहिस्टामाइन एवं एंटी-एलर्जिक (एलर्जी रोधी दवा)',
    howToTake: {
      en: 'Swallow whole with water. Avoid exceeding 10 mg within 24 hours. Ideal for bedtime administration to minimize daytime sluggishness.',
      hinglish: 'Paani ke sath 1 goli nigalein. 24 ghante mein 1 se zyada goli na lein. Raat ko sone se pehle lena sabse behtar rehta hai.',
      hi: 'पानी के साथ 1 गोली निगलें। 24 घंटे में केवल एक गोली लें। दिन में सुस्ती से बचने के लिए इसे रात को लेना सर्वोत्तम है।',
    },
    morning: false,
    morningTime: 'Not advised (may cause daytime sleepiness)',
    afternoon: false,
    afternoonTime: 'Not recommended',
    evening: true,
    eveningTime: '09:00 PM - 10:00 PM (Before Bedtime)',
    frequency: {
      en: 'Once daily in the evening / night before bedtime',
      hinglish: 'Rozana raat ko sone se pehle 1 goli',
      hi: 'प्रतिदिन रात को सोने से पहले 1 गोली',
    },
    foodRelation: 'WITH_OR_WITHOUT_FOOD',
    foodInstruction: {
      en: 'Can be taken with or without food. Taking with an evening meal or glass of water reduces any potential mild stomach sensitivity.',
      hinglish: 'Khane ke pehle ya baad kisi bhi samay le sakte hain. Raat ke khane ke baad paani ke sath lena sabse accha hota hai.',
      hi: 'भोजन से पहले या बाद में कभी भी लिया जा सकता है। रात के भोजन के बाद सादे पानी से लेना आरामदायक रहता है।',
    },
    benefits: {
      en: [
        {
          title: '24-Hour Continuous Allergy Blocker',
          badge: '24-Hr Defense',
          description: 'Rapidly blocks peripheral histamine H1 receptors, silencing persistent sneezing, allergic coughing, and watery eyes.',
        },
        {
          title: 'Relieves Severe Itching & Hives',
          badge: 'Skin Calming',
          description: 'Swiftly subsides inflammatory skin wheals, chronic urticaria flare-ups, and insect bite irritation.',
        },
        {
          title: 'Non-Habit Forming Second Gen Safety',
          badge: 'Safety Tested',
          description: 'Modern formulation designed with lower central nervous sedation compared to older first-generation antihistamines.',
        },
      ],
      hinglish: [
        {
          title: 'Chhiko Aur Zukham Se 24 Ghante Aaram',
          badge: 'Allergy Shield',
          description: 'Histamine ko block karke behne wali naak, gale ki khujli aur chhikon par turant rok lagata hai.',
        },
        {
          title: 'Twacha Ki Khujli Aur Daano Mein Rahat',
          badge: 'Anti-Itch',
          description: 'Allergy ke kaaran sharir par aane wale laal chakatte aur khujli ko tezi se shant karta hai.',
        },
        {
          title: 'Surakshit Formulation',
          badge: 'Safe Profile',
          description: 'Purani dawaiyon ki tulna mein kam susti lata hai aur aadat nahi padne deta.',
        },
      ],
      hi: [
        {
          title: '24 घंटे एलर्जी एवं छींकों से मुक्ति',
          badge: '24-घंटे राहत',
          description: 'हिस्टामाइन रिसेप्टर्स को ब्लॉक कर बहती नाक, छींकों और आंखों से पानी आने को तेजी से रोकता है।',
        },
        {
          title: 'त्वचा की खुजली व पित्ती का शमन',
          badge: 'त्वचा रक्षक',
          description: 'एलर्जी के लाल दानों, पित्ती (Urticaria) और त्वचा की तीव्र जलन को शीघ्र शांत करता है।',
        },
        {
          title: 'सुरक्षित आधुनिक फार्मूला',
          badge: 'विश्वसनीय',
          description: 'पुरानी एलर्जी की दवाओं की तुलना में कम सुस्ती पैदा करता है और इसकी आदत नहीं पड़ती।',
        },
      ],
    },
  },

  metformin: {
    aliases: ['glycomet', 'glyciphab', 'obimet', 'janumet', 'glimepiride', 'diabetic'],
    enUses: [
      'First-line management and control of high blood glucose levels in patients with Type 2 Diabetes Mellitus.',
      'Improves peripheral insulin sensitivity and decreases hepatic glucose production.',
    ],
    hinglishUses: [
      'Type 2 Diabetes mein blood sugar level ko niyamit aur control mein rakhne ke liye.',
      'Sharir mein insulin ke asar ko behtar banane mein madad karti hai.',
    ],
    hiUses: [
      'टाइप 2 डायबिटीज में बढ़े हुए ब्लड शुगर को नियंत्रित एवं सामान्य स्तर पर बनाए रखने हेतु।',
      'शरीर की कोशिकाओं में इंसुलिन की कार्यक्षमता को बढ़ाने में सहायक।',
    ],
    enPrecautions: [
      'Schedule H Prescription Drug: Must be taken under strict periodic medical supervision.',
      'Always take with or immediately after meals to reduce gastrointestinal discomfort or nausea.',
      'Regularly monitor blood sugar levels and kidney function (serum creatinine) as advised by your doctor.',
    ],
    hinglishPrecautions: [
      'Schedule H Dawa: Keval doctor ke bataye anusar hi niyamit roop se lein.',
      'Khane ke saath ya turant baad lein taaki pet mein dard, ulti ya gas ki samasya na ho.',
      'Samay-samay par apna blood sugar aur kidney function test zaroor karwayein.',
    ],
    hiPrecautions: [
      'शिड्यूल H दवा: केवल डॉक्टर द्वारा निर्धारित मात्रा में ही नियमित रूप से लें।',
      'पेट दर्द या जी मिचलाने से बचने के लिए हमेशा भोजन के साथ या तुरंत बाद लें।',
      'समय-समय पर ब्लड शुगर और गुर्दे की कार्यक्षमता (Creatinine) की जांच अवश्य करवाएं।',
    ],
    enAdvice:
      'Never skip meals while taking diabetic medication. Combine regular medication with a balanced diabetic diet and daily physical activity.',
    hinglishAdvice:
      'Dawa lene ke baad khana skip na karein. Dawa ke saath santulit aahar aur niyamit walk/vyayam zaroor karein.',
    hiAdvice:
      'दवा लेने के बाद भोजन न छोड़ें। दवा के साथ-साथ संतुलित आहार व नियमित व्यायाम अपनाएं।',
    enClass: 'Biguanide Oral Antidiabetic Agent',
    hinglishClass: 'Sugar (Diabetes) Control Karne Ki Dawa',
    hiClass: 'बाइगुआनाइड ओरल एंटी-डायबिटिक (ब्लड शुगर नियंत्रक दवा)',
    howToTake: {
      en: 'Swallow whole with water during or immediately following your main meals. If extended-release (SR/ER), never crush or chew the tablet.',
      hinglish: 'Khane ke beech mein ya khane ke turant baad paani ke sath nigalein. SR/ER goli ko todein ya chabayein nahi.',
      hi: 'भोजन के दौरान या खाने के तुरंत बाद एक गिलास पानी से निगलें। SR या ER गोली को चबाएं या तोड़ें नहीं।',
    },
    morning: true,
    morningTime: '08:30 AM (With Breakfast)',
    afternoon: false,
    afternoonTime: 'Not typically scheduled',
    evening: true,
    eveningTime: '08:30 PM (With Dinner)',
    frequency: {
      en: 'Once or twice daily with morning and evening meals as prescribed',
      hinglish: 'Subah nashte aur raat ke khane ke sath 1-1 goli (doctor ke nirdeshanusar)',
      hi: 'सुबह नाश्ते और रात के भोजन के साथ डॉक्टर द्वारा सुझाई गई खुराक में',
    },
    foodRelation: 'AFTER_FOOD',
    foodInstruction: {
      en: 'Strictly take WITH or IMMEDIATELY AFTER food to prevent stomach cramps, nausea, and metallic taste.',
      hinglish: 'Khana khate samay ya khane ke turant baad hi lein. Khali pet lene se pet mein dard ya ulti ho sakti hai.',
      hi: 'अनिवार्यतः भोजन के साथ या खाने के तुरंत बाद लें। खाली पेट लेने से पेट में मरोड़ या जी मिचलाने की समस्या हो सकती है।',
    },
    benefits: {
      en: [
        {
          title: 'Normalizes Blood Glucose',
          badge: 'HbA1c Reducer',
          description: 'Suppresses excessive liver glucose release (gluconeogenesis) and lowers elevated fasting blood sugar.',
        },
        {
          title: 'Enhances Natural Insulin Uptake',
          badge: 'Insulin Sensitivity',
          description: 'Stimulates peripheral glucose transport into muscles without triggering sudden dangerous hypoglycemic drops.',
        },
        {
          title: 'Cardiovascular & Weight Neutral',
          badge: 'Cardio Protective',
          description: 'Promotes arterial health and helps avoid the unwanted weight gain frequently seen with other diabetes drugs.',
        },
      ],
      hinglish: [
        {
          title: 'Sugar Level Ko Niyantrit Rakhe',
          badge: 'Sugar Control',
          description: 'Liver se nikalne wali faltu sugar ko rok kar fasting aur khane ke baad ke blood sugar ko normal banata hai.',
        },
        {
          title: 'Insulin Ka Sahi Upyog',
          badge: 'Better Health',
          description: 'Sharir ki maanspeshiyon mein insulin ke asar ko badhata hai aur achanak sugar girne ka khatra nahi hota.',
        },
        {
          title: 'Dil Aur Wajan Ke Liye Behtar',
          badge: 'Weight Neutral',
          description: 'Wajan ko badhne nahi deta aur lambe samay mein dil aur damniyon ki suraksha karta hai.',
        },
      ],
      hi: [
        {
          title: 'ब्लड शुगर का सुरक्षित नियमन',
          badge: 'शुगर नियंत्रण',
          description: 'लिवर द्वारा अतिरिक्त ग्लूकोज उत्पादन को रोककर फास्टिंग और भोजन के बाद के शुगर लेवल को सामान्य रखता है।',
        },
        {
          title: 'इंसुलिन संवेदनशीलता में सुधार',
          badge: 'इंसुलिन बैलेंस',
          description: 'मांसपेशियों द्वारा ग्लूकोज के उपयोग को सुगम बनाता है तथा अचानक शुगर लो (Hypoglycemia) होने का जोखिम नहीं रहता।',
        },
        {
          title: 'हृदय सुरक्षा एवं वजन नियंत्रण',
          badge: 'हृदय रक्षक',
          description: 'रक्त वाहिकाओं को स्वस्थ रखता है और वजन बढ़ने की समस्या उत्पन्न नहीं करता।',
        },
      ],
    },
  },

  telmisartan: {
    aliases: ['telma', 'telmikind', 'cresar', 'amlodipine', 'cilacar', 'hypertension', 'blood pressure'],
    enUses: [
      'Management of essential hypertension (high blood pressure) to lower cardiovascular risk.',
      'Cardioprotective and renal protective support in at-risk adult patients.',
    ],
    hinglishUses: [
      'High blood pressure (uchh raktchaap) ko control mein rakhne ke liye.',
      'Dil (heart) aur kidney ko blood pressure ke nuksaan se bachane mein madad karti hai.',
    ],
    hiUses: [
      'उच्च रक्तचाप (High BP) को नियंत्रित कर हार्ट अटैक व स्ट्रोक के जोखिम को कम करने हेतु।',
      'हृदय और गुर्दे (Kidney) को उच्च रक्तचाप के दुष्प्रभावों से सुरक्षा प्रदान करने में सहायक।',
    ],
    enPrecautions: [
      'Schedule H Prescription Drug: Take exactly as directed by your cardiologist or physician.',
      'Do not abruptly discontinue this medication even if you feel completely well.',
      'Rise slowly from sitting or lying positions to avoid postural dizziness or lightheadedness.',
    ],
    hinglishPrecautions: [
      'Schedule H Dawa: Doctor ke nirdesh anusar rozana ek nishchit samay par lein.',
      'Theek lagne par bhi bina doctor se poochhe dawa achanak band na karein.',
      'Baithe ya lete huye achanak jaldbazi mein na uthein, chakkar aa sakte hain.',
    ],
    hiPrecautions: [
      'शिड्यूल H दवा: डॉक्टर द्वारा निर्देशित निश्चित समय पर प्रतिदिन लें।',
      'स्वस्थ महसूस होने पर भी बिना डॉक्टर की सलाह के अचानक दवा बंद न करें।',
      'बैठने या लेटने की स्थिति से अचानक तेजी से न उठें ताकि चक्कर न आएं।',
    ],
    enAdvice:
      'Take at the same time each day, with or without food. Maintain a low-sodium diet and monitor your blood pressure periodically at home.',
    hinglishAdvice:
      'Rozana ek hi samay par lein. Khane mein namak kam karein aur niyamit roop se blood pressure ki jaanch karte rahein.',
    hiAdvice:
      'प्रतिदिन एक ही समय पर लें। नमक का सेवन सीमित करें और नियमित बीपी मॉनिटर करें।',
    enClass: 'Angiotensin II Receptor Blocker (Antihypertensive)',
    hinglishClass: 'Blood Pressure (BP) Control Karne Ki Dawa',
    hiClass: 'एंजियोटेंसिन II रिसेप्टर ब्लॉकर (उच्च रक्तचाप रोधी दवा)',
    howToTake: {
      en: 'Swallow whole with a glass of water, preferably at the exact same hour every morning to establish an unbroken rhythm.',
      hinglish: 'Subah ek glass paani ke sath ek nishchit samay par poori goli nigalein.',
      hi: 'प्रतिदिन सुबह एक निश्चित समय पर एक गिलास पानी के साथ पूरी गोली निगलें।',
    },
    morning: true,
    morningTime: '08:00 AM - 09:00 AM (Fixed Hour)',
    afternoon: false,
    afternoonTime: 'Not scheduled',
    evening: false,
    eveningTime: 'Not typically scheduled',
    frequency: {
      en: 'Once daily in the morning at the same scheduled time',
      hinglish: 'Rozana subah ek hi samay par 1 goli',
      hi: 'प्रतिदिन सुबह एक निश्चित समय पर 1 गोली',
    },
    foodRelation: 'WITH_OR_WITHOUT_FOOD',
    foodInstruction: {
      en: 'Can be taken with or without food. Take consistently around your breakfast routine.',
      hinglish: 'Khane se pehle ya baad kisi bhi samay le sakte hain, lekin rozana ek hi routine follow karein.',
      hi: 'भोजन से पहले या बाद में कभी भी ली जा सकती है, किंतु प्रतिदिन एक ही समय पर लें।',
    },
    benefits: {
      en: [
        {
          title: '24-Hour Continuous BP Normalization',
          badge: '24-Hr Coverage',
          description: 'Long 24-hour elimination half-life safeguards against dangerous early-morning blood pressure spikes.',
        },
        {
          title: 'Protects Heart & Kidneys',
          badge: 'Cardio-Renal Shield',
          description: 'Reduces vascular wall strain and slows progression of diabetic nephropathy and kidney strain.',
        },
        {
          title: 'Clean Tolerability Profile',
          badge: 'High Tolerability',
          description: 'Does not cause the irritating dry cough commonly provoked by traditional ACE inhibitors.',
        },
      ],
      hinglish: [
        {
          title: '24 Ghante Blood Pressure Control',
          badge: 'BP Normalizer',
          description: 'Subah ke samay achanak BP badhne se rokta hai aur poore 24 ghante dil par dabav kam rakhta hai.',
        },
        {
          title: 'Dil Aur Gurde Ki Suraksha',
          badge: 'Organ Protective',
          description: 'High BP se hone wale heart attack, stroke aur kidney damage ke risk ko kaafi had tak kam karta hai.',
        },
        {
          title: 'Bina Sookhi Khaansi Ke Surakshit',
          badge: 'No Cough',
          description: 'Doosri BP ki dawaiyon ki tarah gale mein kharash ya sookhi khansi paida nahi karta.',
        },
      ],
      hi: [
        {
          title: '24 घंटे ब्लड प्रेशर का निरंतर नियंत्रण',
          badge: '24-घंटे सुरक्षा',
          description: 'सुबह के समय रक्तचाप के अचानक बढ़ने से रोकता है और 24 घंटे धमनियों पर दबाव सामान्य रखता है।',
        },
        {
          title: 'हृदय और गुर्दों का सुरक्षा कवच',
          badge: 'अंग सुरक्षा',
          description: 'उच्च रक्तचाप के कारण होने वाले दिल के दौरे, स्ट्रोक और गुर्दे की विफलता के जोखिम को घटाता है।',
        },
        {
          title: 'बिना सूखी खांसी के उत्कृष्ट सहनशीलता',
          badge: 'सहज सेवन',
          description: 'अन्य बीपी दवाओं की तरह गले में खराश या निरंतर सूखी खांसी की समस्या उत्पन्न नहीं करता।',
        },
      ],
    },
  },

  azithromycin: {
    aliases: ['azithral', 'azee', 'zady', 'zithrox'],
    enUses: [
      'Treatment of acute respiratory tract infections, tonsillitis, pharyngitis, sinusitis, and skin infections.',
      'Targeted eradication of atypical and susceptible bacterial pathogens.',
    ],
    hinglishUses: [
      'Gale ke infection, tonsils, sinusitis, chest infection aur fefdon ke bacterial infection ke ilaj ke liye.',
      'Bacteria ke vikas ko rok kar infection ko jaldi theek karta hai.',
    ],
    hiUses: [
      'गले के संक्रमण, टॉन्सिल, साइनस, फेफड़ों और त्वचा के गंभीर बैक्टीरियल संक्रमण से राहत।',
      'जीवाणुओं के प्रोटीन संश्लेषण को बाधित कर संक्रमण का त्वरित खात्मा।',
    ],
    enPrecautions: [
      'Schedule H Antibiotic: Complete the prescribed 3 or 5-day course without skipping doses.',
      'Notify your doctor if you have a history of irregular heart rhythms (QT prolongation) or liver disease.',
      'Do not take antacids containing aluminum or magnesium at the same time.',
    ],
    hinglishPrecautions: [
      'Schedule H Antibiotic: Doctor dwara bataye gaye 3 ya 5 din ke course ko bina roke poora karein.',
      'Agar dil ki dhadkan ya liver ki koi samasya hai toh pehle doctor ko batayein.',
      'Is dawa ke sath koi bhi antacid (gas ka syrup/goli) na lein.',
    ],
    hiPrecautions: [
      'शिड्यूल H दवा: डॉक्टर द्वारा अनुशंसित 3 या 5 दिन का कोर्स अधूरा न छोड़ें।',
      'दिल की धड़कन (Arrhythmia) या लिवर की बीमारी का इतिहास होने पर डॉक्टर को बताएं।',
      'इस दवा के साथ एल्युमिनियम या मैग्नीशियम युक्त एंटासिड का सेवन न करें।',
    ],
    enAdvice:
      'Take at a fixed time each day with a full glass of water. Continue adequate fluid intake throughout the treatment.',
    hinglishAdvice:
      'Rozana ek nishchit samay par paani ke sath lein aur din bhar khoob paani piyein.',
    hiAdvice:
      'प्रतिदिन एक निश्चित समय पर भरपूर पानी के साथ लें।',
    enClass: 'Macrolide Antibiotic',
    hinglishClass: 'Macrolide Antibiotic Dawa',
    hiClass: 'मैक्रोलाइड एंटीबायोटिक (जीवाणुरोधी दवा)',
    howToTake: {
      en: 'Swallow whole with a full glass of water. Do not crush or chew. Take once daily at the same time every day.',
      hinglish: 'Ek poora glass paani ke sath bina tode goli nigal lein. Rozana ek hi samay par lein.',
      hi: 'एक गिलास पानी के साथ पूरी गोली निगलें। प्रतिदिन ठीक एक ही समय पर लें।',
    },
    morning: true,
    morningTime: '09:00 AM - 10:00 AM',
    afternoon: false,
    afternoonTime: 'Not recommended',
    evening: false,
    eveningTime: 'Not recommended',
    frequency: {
      en: 'Once daily for 3 or 5 days as prescribed by your doctor',
      hinglish: 'Rozana sirf 1 baar 3 se 5 din tak (doctor ke nirdeshanusar)',
      hi: 'दिन में केवल 1 बार (लगातार 3 या 5 दिन तक डॉक्टर के निर्देशानुसार)',
    },
    foodRelation: 'AFTER_FOOD',
    foodInstruction: {
      en: 'Take with a light meal or 1 to 2 hours after meals to minimize any nausea or abdominal discomfort.',
      hinglish: 'Halke khane ke sath ya khana khane ke 1 ghante baad lein taaki pet mein dard ya ulti jaisa na lage.',
      hi: 'हल्के भोजन के साथ या खाने के 1 घंटे बाद लें ताकि पेट में मरोड़ या जी मिचलाने से बचाव हो सके।',
    },
    benefits: {
      en: [
        {
          title: 'Rapid Respiratory Tissue Penetration',
          badge: 'High Tissue Reach',
          description: 'Concentrates heavily in pulmonary tissues, tonsils, and sinuses to rapidly suppress localized bacterial colonies.',
        },
        {
          title: 'Convenient Once-Daily Dosing',
          badge: 'Single Daily Dose',
          description: 'Long biological half-life provides sustained 24-hour therapeutic antibiotic coverage with just 1 daily tablet.',
        },
        {
          title: 'Prolonged Post-Antibiotic Effect',
          badge: 'Lasting Defense',
          description: 'Continues destroying residual pathogens for days even after completing the 3-day course.',
        },
      ],
      hinglish: [
        {
          title: 'Gale Aur Fefdon Mein Tez Asar',
          badge: 'Deep Reach',
          description: 'Tonsils aur fefdon ke andar tezi se ghulkar infection ko 24 ghante ke andar shant karta hai.',
        },
        {
          title: 'Din Mein Sirf Ek Baar',
          badge: 'Easy Dosing',
          description: 'Din bhar mein keval 1 baar lena hota hai, jisse dawa lene mein sahuliyat rehti hai.',
        },
        {
          title: 'Course Khatam Hone Par Bhi Asar',
          badge: 'Lasting Action',
          description: '3 din ka course poora hone ke baad bhi sharir mein bacteria ko badhne se roke rakhta hai.',
        },
      ],
      hi: [
        {
          title: 'श्वसन तंत्र में गहरा व त्वरित प्रभाव',
          badge: 'शीघ्र राहत',
          description: 'गले, टॉन्सिल और फेफड़ों के ऊतकों में गहराई से पहुंचकर जीवाणुओं को तुरंत समाप्त करता है।',
        },
        {
          title: 'दिन में केवल एक बार सेवन',
          badge: 'सुविधाजनक खुराक',
          description: 'लंबे समय तक रक्त में सक्रिय रहने के कारण दिन में केवल एक खुराक ही पर्याप्त होती है।',
        },
        {
          title: 'कोर्स के बाद भी निरंतर सुरक्षा',
          badge: 'दीर्घकालिक प्रभाव',
          description: '3 या 5 दिन का कोर्स समाप्त होने के बाद भी कई दिनों तक हानिकारक बैक्टीरिया को पनपने नहीं देता।',
        },
      ],
    },
  },

  ibuprofen: {
    aliases: ['combiflam', 'brufen', 'aceclofenac', 'zerodol', 'voveran', 'diclofenac'],
    enUses: [
      'Relief from acute inflammatory pain, joint inflammation, arthritis, back pain, and dental pain.',
      'Reduction of fever associated with inflammatory states.',
    ],
    hinglishUses: [
      'Jodon ka dard, gathiya, kamar dard, sujan aur daant ke tej dard se aaram pane ke liye.',
      'Sujan ko kam karke dard mein tezi se aaram deta hai.',
    ],
    hiUses: [
      'जोड़ों के दर्द, गठिया (Arthritis), सूजन, कमर दर्द, मोच और दांत के तीव्र दर्द से राहत।',
      'सूजन को कम कर दर्द निवारक प्रभाव प्रदान करता है।',
    ],
    enPrecautions: [
      'Always take strictly after food or with milk to protect stomach lining.',
      'Avoid if you have active stomach ulcers, severe kidney disease, or cardiac failure.',
      'Do not combine with other NSAID pain relievers or aspirin.',
    ],
    hinglishPrecautions: [
      'Pet mein jalan aur ulcer se bachne ke liye hamesha khane ke baad ya doodh ke sath lein.',
      'Pet mein chhaale ya kidney ki bimari hone par is dawa ka sevan na karein.',
      'Dusri dard ki goli jaise aspirin ke sath na lein.',
    ],
    hiPrecautions: [
      'पेट में अल्सर या जलन से बचाव के लिए अनिवार्य रूप से भोजन या दूध के बाद ही लें।',
      'पेट में छाले (Ulcers) या गुर्दे की बीमारी होने पर इसका सेवन न करें।',
      'अन्य दर्दनिवारक दवाओं के साथ मिलाकर न लें।',
    ],
    enAdvice:
      'Use the lowest effective dose for the shortest duration necessary to control symptoms.',
    hinglishAdvice:
      'Dard kam hote hi dawa band kar dein ya doctor ke bataye samay tak hi lein.',
    hiAdvice:
      'लक्षण नियंत्रित होने पर डॉक्टर की सलाह अनुसार ही सेवन सीमित करें।',
    enClass: 'Non-Steroidal Anti-Inflammatory Drug (NSAID)',
    hinglishClass: 'Sujan Aur Dard Kam Karne Wali Dawa (NSAID)',
    hiClass: 'नॉन-स्टेरॉयडल एंटी-इन्फ्लेमेटरी दवा (NSAID दर्द व सूजन रोधी)',
    howToTake: {
      en: 'Swallow whole with a full glass of water or milk. Do not lie down for at least 15 to 20 minutes after taking to facilitate smooth esophageal transit.',
      hinglish: 'Ek glass paani ya doodh ke sath poori goli nigalein. Dawa lene ke turant baad letein nahi.',
      hi: 'एक गिलास पानी या दूध के साथ पूरी गोली निगलें। दवा लेने के तुरंत बाद 15 मिनट तक सीधे बैठे रहें, लेटें नहीं।',
    },
    morning: true,
    morningTime: '08:30 AM (After Breakfast)',
    afternoon: false,
    afternoonTime: '02:00 PM (Only if 3x prescribed)',
    evening: true,
    eveningTime: '08:30 PM (After Dinner)',
    frequency: {
      en: 'Twice daily after meals, strictly as advised by your physician',
      hinglish: 'Din mein 2 baar subah-shaam khane ke baad',
      hi: 'दिन में 2 बार (सुबह एवं शाम भोजन के बाद) डॉक्टर के निर्देशानुसार',
    },
    foodRelation: 'AFTER_FOOD',
    foodInstruction: {
      en: 'STRICTLY AFTER FOOD: Never take on an empty stomach. Always consume after a hearty meal or with a glass of milk to prevent gastric erosion.',
      hinglish: 'HAMESHA KHANE KE BAAD: Khali pet bilkul na lein. Hamesha khana khane ke baad ya doodh ke sath lein.',
      hi: 'अनिवार्यतः भोजन के बाद: खाली पेट कतई न लें। सदैव भोजन करने के तुरंत बाद या दूध के साथ लें।',
    },
    benefits: {
      en: [
        {
          title: 'Potent Anti-Inflammatory Action',
          badge: 'Anti-Inflammatory',
          description: 'Inhibits cyclooxygenase (COX) enzymes to directly suppress tissue prostaglandins causing swelling and tenderness.',
        },
        {
          title: 'Fast Musculoskeletal Relief',
          badge: 'Rapid Relief',
          description: 'Significantly relieves stiffness in back spasms, sprains, sports injuries, and arthritis within 45 minutes.',
        },
        {
          title: 'Dual Pain & Swelling Reduction',
          badge: 'Dual Efficacy',
          description: 'Treats both the perceived pain signal and the underlying localized inflammatory edema simultaneously.',
        },
      ],
      hinglish: [
        {
          title: 'Sujan Aur Dard Par Sidha Asar',
          badge: 'Fast Relief',
          description: 'Maanspeshiyon aur jodon ke andar sujan ko kam karke dard ko jad se dabata hai.',
        },
        {
          title: 'Moch Aur Kamar Dard Mein Turant Rahat',
          badge: 'Deep Action',
          description: 'Khel-kood ki chot, moch, gardan aur kamar ke jhatke se hone wale dard ko 45 minute mein aaram deta hai.',
        },
        {
          title: 'Do-Tarfa Suraksha',
          badge: 'Dual Action',
          description: 'Dard ke sath-sath sharir ki jakdan aur sujan dono par ek sath kaam karta hai.',
        },
      ],
      hi: [
        {
          title: 'तीव्र सूजन व दर्द से मुक्ति',
          badge: 'सूजन रोधी',
          description: 'सूजन पैदा करने वाले रसायनों को रोककर जोड़ों, नसों और मांसपेशियों की जकड़न को तुरंत शांत करता है।',
        },
        {
          title: 'मोच व पीठ दर्द में शीघ्र आराम',
          badge: 'त्वरित राहत',
          description: 'चोट, मोच, गठिया और पीठ दर्द में 45 मिनट के भीतर असर दिखाना प्रारंभ कर देता है।',
        },
        {
          title: 'दोहरा चिकित्सीय लाभ',
          badge: 'दोहरा प्रभाव',
          description: 'दर्द की संवेदना घटाने के साथ-साथ भीतरी सूजन को भी तेजी से दूर करता है।',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Clinical Knowledge Matching & Schedule Synthesis Helper Functions
// ---------------------------------------------------------------------------
function matchSaltKnowledge(data: MedicineData): SaltKnowledge | undefined {
  const brandLower = (data.brand_name || '').toLowerCase();
  const saltsLower = (data.active_salts || []).map((s) => s.toLowerCase());
  const combined = [brandLower, ...saltsLower].join(' ');

  for (const [key, val] of Object.entries(COMMON_SALTS_MAP)) {
    if (combined.includes(key)) {
      return val;
    }
    if (val.aliases && val.aliases.some((alias) => combined.includes(alias.toLowerCase()))) {
      return val;
    }
  }
  return undefined;
}

export function synthesizeScheduleAndBenefits(
  data: MedicineData,
  lang: LanguageMode,
  saltMatch?: SaltKnowledge
): {
  howToTakeText: string;
  morningActive: boolean;
  morningTime: string;
  afternoonActive: boolean;
  afternoonTime: string;
  eveningActive: boolean;
  eveningTime: string;
  frequencyText: string;
  foodRelation: FoodRelation;
  foodRelationBadge: string;
  foodRelationInstruction: string;
  benefits: LocalizedBenefit[];
} {
  if (saltMatch) {
    const foodRelation = saltMatch.foodRelation;
    let foodRelationBadge = '';
    if (foodRelation === 'AFTER_FOOD') {
      foodRelationBadge =
        lang === 'hi'
          ? 'भोजन के बाद (After Food)'
          : lang === 'hinglish'
          ? 'Khaane Ke Baad (After Food)'
          : 'After Food (Post-Meal)';
    } else if (foodRelation === 'BEFORE_FOOD') {
      foodRelationBadge =
        lang === 'hi'
          ? 'भोजन से पहले (Before Food)'
          : lang === 'hinglish'
          ? 'Khaane Se Pehle (Before Food)'
          : 'Before Food (Empty Stomach)';
    } else {
      foodRelationBadge =
        lang === 'hi'
          ? 'भोजन के साथ या बिना (With/Without Food)'
          : lang === 'hinglish'
          ? 'Khaane Ke Sath Ya Bina (With/Without Food)'
          : 'With or Without Food';
    }

    return {
      howToTakeText: saltMatch.howToTake[lang] || saltMatch.howToTake.en,
      morningActive: saltMatch.morning,
      morningTime: saltMatch.morningTime,
      afternoonActive: saltMatch.afternoon,
      afternoonTime: saltMatch.afternoonTime,
      eveningActive: saltMatch.evening,
      eveningTime: saltMatch.eveningTime,
      frequencyText: saltMatch.frequency[lang] || saltMatch.frequency.en,
      foodRelation,
      foodRelationBadge,
      foodRelationInstruction: saltMatch.foodInstruction[lang] || saltMatch.foodInstruction.en,
      benefits: saltMatch.benefits[lang] || saltMatch.benefits.en,
    };
  }

  // Heuristic synthesis for unmapped formulations
  const formLower = (data.dosage_form || '').toLowerCase();
  const classLower = (data.therapeutic_class || '').toLowerCase();
  const isPPI =
    classLower.includes('proton pump') ||
    classLower.includes('antacid') ||
    formLower.includes('gastro') ||
    (data.brand_name || '').toLowerCase().includes('pan');
  const isAllergy = classLower.includes('antihistamine') || classLower.includes('allergy');
  const isTopical = formLower.includes('ointment') || formLower.includes('cream') || formLower.includes('gel');
  const isDrops = formLower.includes('drop');
  const isSyrup =
    formLower.includes('syrup') || formLower.includes('suspension') || formLower.includes('liquid');

  let howToTakeText = '';
  if (isTopical) {
    howToTakeText =
      lang === 'hi'
        ? 'प्रभावित स्थान को पहले हल्के गुनगुने पानी से साफ करके सुखा लें। दवा की पतली परत लगाएं और लगाने के तुरंत बाद हाथ धो लें।'
        : lang === 'hinglish'
        ? 'Prabhavit jagah ko saaf aur sukha karein. Patli parat lagakar halke haath se malish karein aur haath dho lein.'
        : 'Clean and gently dry the affected area. Apply a thin uniform layer with clean fingers and wash hands immediately after application.';
  } else if (isDrops) {
    howToTakeText =
      lang === 'hi'
        ? 'प्रयोग से पूर्व हाथों को साबुन से अच्छी तरह धोएं। ड्रॉपर की नोक को किसी भी सतह या आंख/कान से छूने न दें।'
        : lang === 'hinglish'
        ? 'Dawa daalne se pehle haath ache se dhoyen. Dropper ke aage ke hisse ko haath ya aankh/kaan se touch na karein.'
        : 'Wash hands thoroughly before instilling drops. Avoid touching the dropper tip to fingers, eyelashes, or ears to preserve sterility.';
  } else if (isSyrup) {
    howToTakeText =
      lang === 'hi'
        ? 'प्रत्येक सेवन से पूर्व शीशी को अच्छी तरह हिलाएं। दवा नापने के लिए हमेशा दिए गए मापक कप या ड्रॉपर का ही उपयोग करें।'
        : lang === 'hinglish'
        ? 'Har baar lene se pehle bottle ko achhe se hilayein. Calibrated measuring cup ya dropper se hi nap kar lein.'
        : 'Shake the bottle well prior to every dose. Accurately measure the volume using the provided calibrated measuring cup or syringe.';
  } else {
    howToTakeText =
      lang === 'hi'
        ? 'गोली या कैप्सूल को एक गिलास ताजे पानी के साथ पूरी तरह निगलें। इसे चबाएं, तोड़ें या पीसें नहीं। दिन भर पर्याप्त पानी पिएं।'
        : lang === 'hinglish'
        ? 'Tablet ya capsule ko ek gilaas paani ke sath pura niglein. Ise chabayein ya todein nahi. Din bhar paryapt paani pijiye.'
        : 'Swallow whole with a full glass of plain water. Do not crush, chew, split, or dissolve the tablet or capsule unless explicitly instructed by your physician.';
  }

  let foodRelation: FoodRelation = 'AFTER_FOOD';
  let foodRelationBadge = '';
  let foodRelationInstruction = '';
  let morningActive = true;
  let morningTime = '08:00 AM - 09:00 AM';
  let afternoonActive = false;
  let afternoonTime = '01:30 PM - 02:30 PM';
  let eveningActive = true;
  let eveningTime = '08:30 PM - 09:30 PM';
  let frequencyText = '';

  if (isPPI) {
    foodRelation = 'BEFORE_FOOD';
    foodRelationBadge =
      lang === 'hi'
        ? 'भोजन से पहले (Before Food)'
        : lang === 'hinglish'
        ? 'Khaane Se Pehle (Before Food)'
        : 'Before Food (Empty Stomach)';
    foodRelationInstruction =
      lang === 'hi'
        ? 'सर्वश्रेष्ठ प्रभाव के लिए सुबह नाश्ते से 30 से 60 मिनट पूर्व खाली पेट लें ताकि एसिड स्राव प्रभावी ढंग से नियंत्रित हो सके।'
        : lang === 'hinglish'
        ? 'Subah nashte se 30-60 minute pehle khali pet lein taaki acid generation ruk sake.'
        : 'Take in the morning 30 to 60 minutes before breakfast on an empty stomach for optimal acid pump inhibition.';
    morningActive = true;
    morningTime = '07:30 AM - 08:30 AM';
    afternoonActive = false;
    eveningActive = false;
    frequencyText =
      lang === 'hi'
        ? 'दिन में एक बार (सुबह खाली पेट)'
        : lang === 'hinglish'
        ? 'Din mein 1 baar (Subah khali pet)'
        : 'Once daily in the morning';
  } else if (isAllergy) {
    foodRelation = 'WITH_OR_WITHOUT_FOOD';
    foodRelationBadge =
      lang === 'hi'
        ? 'भोजन के साथ या बिना (With/Without Food)'
        : lang === 'hinglish'
        ? 'Khaane Ke Sath Ya Bina (With/Without Food)'
        : 'With or Without Food';
    foodRelationInstruction =
      lang === 'hi'
        ? 'भोजन के साथ या भोजन के बिना सादे पानी के साथ लिया जा सकता है। खट्टे फलों के रस के साथ न लें।'
        : lang === 'hinglish'
        ? 'Khaane ke sath ya bina le sakte hain. Fruit juice ke sath lene se bachein.'
        : 'May be taken with or without food. Avoid taking alongside grapefruit or citrus fruit juices.';
    morningActive = true;
    morningTime = '08:00 AM - 09:00 AM';
    afternoonActive = false;
    eveningActive = false;
    frequencyText =
      lang === 'hi'
        ? 'दिन में एक बार (24 घंटे में 1 खुराक)'
        : lang === 'hinglish'
        ? 'Din mein 1 baar (24 ghante mein 1 dose)'
        : 'Once daily (every 24 hours)';
  } else {
    foodRelation = 'AFTER_FOOD';
    foodRelationBadge =
      lang === 'hi'
        ? 'भोजन के बाद (After Food)'
        : lang === 'hinglish'
        ? 'Khaane Ke Baad (After Food)'
        : 'After Food (Post-Meal)';
    foodRelationInstruction =
      lang === 'hi'
        ? 'पेट में जलन व एसिडिटी से बचाव के लिए भोजन या हल्के नाश्ते के 15-30 मिनट बाद ही लें।'
        : lang === 'hinglish'
        ? 'Pet mein jalan aur gas se bachne ke liye khana khane ke baad hi lein.'
        : 'Take within 15 to 30 minutes after a meal or snack to protect the gastric mucosa and maximize tolerance.';
    frequencyText =
      lang === 'hi'
        ? 'दिन में 2 बार (सुबह व शाम भोजन के बाद)'
        : lang === 'hinglish'
        ? 'Din mein 2 baar (Subah aur shaam khana khane ke baad)'
        : 'Twice daily (morning and evening post-meal)';
  }

  // Benefits
  const benefits: LocalizedBenefit[] =
    lang === 'hi'
      ? [
          {
            title: 'लक्षित लक्षणों से त्वरित राहत',
            badge: 'त्वरित असर',
            description: 'रोग के प्राथमिक लक्षणों, दर्द या असुविधा को नियंत्रित कर शीघ्र राहत प्रदान करता है।',
          },
          {
            title: 'प्रमाणित चिकित्सीय प्रभाव',
            badge: 'क्लिनिकल सुरक्षा',
            description: 'शरीर की स्वाभाविक कार्यप्रणाली को पुनर्स्थापित कर स्वास्थ्य सुधार को गति देता है।',
          },
          {
            title: 'सुरक्षित व नियंत्रित फॉर्मूलेशन',
            badge: 'उच्च गुणवत्ता',
            description: 'चिकित्सकीय मानकों के अनुसार निर्धारित खुराक में लेने पर शरीर पर सौम्य व सुरक्षित रहता है।',
          },
        ]
      : lang === 'hinglish'
      ? [
          {
            title: 'Laxano Se Turant Rahat',
            badge: 'Fast Relief',
            description: 'Primary takleef aur sharirik bechaini ko tezi se shant karke aaram pahunchata hai.',
          },
          {
            title: 'Pramanit Clinical Asar',
            badge: 'High Efficacy',
            description: 'Sharir ki rog-pratirodhak kshamta aur karyapranali ko normal banaye rakhta hai.',
          },
          {
            title: 'Surakshit Formulation',
            badge: 'Safe Profile',
            description: 'Sahi dose mein lene par pet aur sharir ke anya ango par gentle aur surakshit rehta hai.',
          },
        ]
      : [
          {
            title: 'Targeted Symptom Resolution',
            badge: 'Fast Relief',
            description:
              'Rapidly intervenes in primary symptom pathways to provide prompt clinical relief and functional comfort.',
          },
          {
            title: 'Evidence-Based Clinical Efficacy',
            badge: 'High Efficacy',
            description:
              'Restores biological homeostasis and supports progressive recovery from acute or chronic illness.',
          },
          {
            title: 'Optimized Safety & Tolerance',
            badge: 'Safe Profile',
            description:
              'Formulated for high bioavailability and minimal gastric irritation when taken as clinically advised.',
          },
        ];

  return {
    howToTakeText,
    morningActive,
    morningTime,
    afternoonActive,
    afternoonTime,
    eveningActive,
    eveningTime,
    frequencyText,
    foodRelation,
    foodRelationBadge,
    foodRelationInstruction,
    benefits,
  };
}

export function getLocalizedReportContent(
  data: MedicineData,
  lang: LanguageMode,
  isIdentified: boolean = true,
  unclearReason?: string | null
): LocalizedReportContent {
  const saltMatch = matchSaltKnowledge(data);
  const scheduleData = synthesizeScheduleAndBenefits(data, lang, saltMatch);

  // Status Labels
  let statusLabel = '';
  if (lang === 'hi') {
    statusLabel = isIdentified ? 'पहचान सत्यापित (Verified)' : 'पुनः जांच आवश्यक (Unclear)';
  } else if (lang === 'hinglish') {
    statusLabel = isIdentified ? 'Pehchaan Saphal (Identified)' : 'Jaanch Zaroori (Unclear)';
  } else {
    statusLabel = isIdentified ? 'Identification Confirmed' : 'Verification Needed';
  }

  // Brand Name
  const brandLabel =
    lang === 'hi'
      ? 'ब्रांड / दवा का नाम'
      : lang === 'hinglish'
      ? 'Dawa Ka Naam (Brand Name)'
      : 'Brand / Trade Name';
  const brandValue = data.brand_name || (lang === 'hi' ? 'अस्पष्ट' : 'Unspecified');

  // Dosage Form
  const dosageFormLabel =
    lang === 'hi'
      ? 'दवा का प्रकार (Form)'
      : lang === 'hinglish'
      ? 'Dawa Ka Roop (Dosage Form)'
      : 'Dosage Form';
  let dosageFormValue = data.dosage_form || (lang === 'hi' ? 'मानक ओरल रूप' : 'Standard Oral Formulation');
  if (lang === 'hi') {
    if (dosageFormValue.toLowerCase().includes('tablet')) dosageFormValue = 'ओरल टेबलेट (Oral Tablet)';
    else if (dosageFormValue.toLowerCase().includes('capsule')) dosageFormValue = 'कैप्सूल (Oral Capsule)';
    else if (dosageFormValue.toLowerCase().includes('syrup')) dosageFormValue = 'सिरप / तरल (Oral Syrup)';
    else if (
      dosageFormValue.toLowerCase().includes('ointment') ||
      dosageFormValue.toLowerCase().includes('cream')
    )
      dosageFormValue = 'मलहम / क्रीम (Topical Ointment)';
  }

  // Strength
  const strengthLabel =
    lang === 'hi'
      ? 'सक्रिय क्षमता (Strength)'
      : lang === 'hinglish'
      ? 'Dawa Ki Shakti (Strength)'
      : 'Strength & Concentration';
  const strengthValue = data.strength || (lang === 'hi' ? 'मानक क्षमता' : 'Standard Strength');

  // Therapeutic Class
  const therapeuticClassLabel =
    lang === 'hi'
      ? 'उपचारात्मक वर्ग (Class)'
      : lang === 'hinglish'
      ? 'Dawa Ka Varg (Class)'
      : 'Therapeutic Class';
  let therapeuticClassValue = data.therapeutic_class || '';
  if (saltMatch) {
    if (lang === 'hi' && saltMatch.hiClass) therapeuticClassValue = saltMatch.hiClass;
    else if (lang === 'hinglish' && saltMatch.hinglishClass) therapeuticClassValue = saltMatch.hinglishClass;
    else if (saltMatch.enClass) therapeuticClassValue = saltMatch.enClass;
  }
  if (!therapeuticClassValue) {
    therapeuticClassValue = lang === 'hi' ? 'चिकित्सीय औषधि' : 'Prescribed Therapeutic Agent';
  }

  // Rx Schedule Tag & Warnings
  const rxLabel =
    lang === 'hi'
      ? 'प्रिस्क्रिप्शन स्थिति'
      : lang === 'hinglish'
      ? 'Doctor Parchi Niyam (Rx)'
      : 'Prescription Schedule';
  const rxTag = data.is_prescription_required ? 'Schedule H (Rx Only)' : 'OTC (Over The Counter)';
  let rxWarningBanner: string | null = null;
  if (data.is_prescription_required || data.packaging_evidence?.red_box_detected) {
    rxWarningBanner =
      lang === 'hi'
        ? 'सावधानी (शिड्यूल एच): यह दवा केवल पंजीकृत चिकित्सक के पर्चे पर ही ली जा सकती है।'
        : lang === 'hinglish'
        ? 'Warning (Schedule H): Yeh dawa keval registered doctor ke parchi par hi kharidi aur li ja sakti hai.'
        : 'SCHEDULE H PRESCRIPTION WARNING: To be sold by retail on the prescription of a Registered Medical Practitioner only.';
  }

  // Active Salts
  const activeSaltsLabel =
    lang === 'hi'
      ? 'सक्रिय घटक एवं साल्ट'
      : lang === 'hinglish'
      ? 'Active Salts (Mukhya Tatva)'
      : 'Active Ingredients (Salts)';
  const activeSaltsList: string[] =
    Array.isArray(data.active_salts) && data.active_salts.length > 0
      ? data.active_salts
      : [lang === 'hi' ? 'सक्रिय घटक उपलब्ध नहीं' : 'Active formulation not specified'];
  const activeSaltsDescription =
    lang === 'hi'
      ? `दवा में सम्मिलित सक्रिय रासायनिक घटक जो चिकित्सीय प्रभाव उत्पन्न करते हैं: ${activeSaltsList.join(', ')}।`
      : lang === 'hinglish'
      ? `Dawa mein maujood mukhya salts jo sharir par asar karte hain: ${activeSaltsList.join(', ')}.`
      : `Active chemical pharmacophores responsible for physiological response: ${activeSaltsList.join(', ')}.`;

  // Uses List
  const usesLabel =
    lang === 'hi'
      ? 'प्रमुख चिकित्सीय उपयोग व संकेत'
      : lang === 'hinglish'
      ? 'Dawa Ke Upyog (Indications)'
      : 'Approved Clinical Uses';
  let usesList: string[] = [];
  if (lang === 'hi') {
    usesList = data.hindi_response?.karyapranali_aur_upyog || saltMatch?.hiUses || [];
  } else if (lang === 'hinglish') {
    usesList = data.hinglish_response?.karyapranali_aur_upyog || saltMatch?.hinglishUses || [];
  } else {
    usesList = data.english_response?.uses_and_indications || saltMatch?.enUses || [];
  }
  if (!usesList || usesList.length === 0) {
    usesList = [
      lang === 'hi'
        ? 'उपयोग की पुष्टि चिकित्सक परामर्श के आधार पर करें।'
        : 'Clinical indications should be confirmed with your treating doctor.',
    ];
  }

  // Precautions List
  const precautionsLabel =
    lang === 'hi'
      ? 'महत्वपूर्ण सावधानियां एवं चेतावनी'
      : lang === 'hinglish'
      ? 'Saavdhaniyan Aur Chetwani'
      : 'Precautions & Safety Warnings';
  let precautionsList: string[] = [];
  if (lang === 'hi') {
    precautionsList = data.hindi_response?.sawdhaniyan || saltMatch?.hiPrecautions || [];
  } else if (lang === 'hinglish') {
    precautionsList = data.hinglish_response?.sawdhaniyan || saltMatch?.hinglishPrecautions || [];
  } else {
    precautionsList = data.english_response?.precautions || saltMatch?.enPrecautions || [];
  }
  if (!precautionsList || precautionsList.length === 0) {
    precautionsList = [
      lang === 'hi'
        ? 'गर्भावस्था, स्तनपान या पुरानी बीमारी में चिकित्सक से पूर्व परामर्श आवश्यक है।'
        : 'Always consult your healthcare provider before use, especially during pregnancy or chronic conditions.',
    ];
  }

  // Doctor Guidance
  const guidanceLabel =
    lang === 'hi'
      ? 'चिकित्सीय परामर्श व दिशा-निर्देश'
      : lang === 'hinglish'
      ? 'Doctor Ki Salah (Guidance)'
      : 'Clinical Guidance & Administration';
  let guidanceText = '';
  if (lang === 'hi') {
    guidanceText =
      data.hindi_response?.doctor_paramarsh_sandesh ||
      saltMatch?.hiAdvice ||
      'दवा की पूरी खुराक समय पर लें और बिना डॉक्टर की सलाह के दवा बीच में बंद न करें।';
  } else if (lang === 'hinglish') {
    guidanceText =
      data.hinglish_response?.doctor_paramarsh_sandesh ||
      saltMatch?.hinglishAdvice ||
      'Doctor ki batayi hui poori dose poori karein aur beech mein band na karein.';
  } else {
    guidanceText =
      data.english_response?.doctor_pharmacist_advice ||
      saltMatch?.enAdvice ||
      'Complete the entire prescribed course. Do not alter dosage without physician consultation.';
  }

  // Disclaimer
  const disclaimerLabel =
    lang === 'hi'
      ? 'महत्वपूर्ण चिकित्सीय अस्वीकरण'
      : lang === 'hinglish'
      ? 'Zaroori Medical Disclaimer'
      : 'Official Medical Disclaimer';
  let disclaimerText = '';
  if (lang === 'hi') {
    disclaimerText =
      data.disclaimer_hindi ||
      'अस्वीकरण: यह विश्लेषण केवल शैक्षिक और नैदानिक निर्णय समर्थन के लिए है और पंजीकृत चिकित्सक के प्रत्यक्ष परामर्श का विकल्प नहीं है।';
  } else if (lang === 'hinglish') {
    disclaimerText =
      data.disclaimer_hinglish ||
      'Disclaimer: Yeh jankari keval educational guidance ke liye hai aur registered doctor ke physical checkup ka vikalp nahi hai.';
  } else {
    disclaimerText =
      data.disclaimer_english ||
      'Disclaimer: This report is an AI-assisted educational tool and does not substitute for an in-person physical consultation with a registered medical practitioner.';
  }

  // Unclear / Unidentified Texts
  const unclearTitle =
    lang === 'hi'
      ? 'दवा की पुष्टि नहीं हो सकी (Verification Needed)'
      : lang === 'hinglish'
      ? 'Dawa Ki Pehchaan Pukhta Nahi Ho Saki'
      : 'Medicine Identification Verification Needed';
  const unclearText =
    unclearReason ||
    (lang === 'hi'
      ? 'अपलोड की गई फोटो में फॉयल स्ट्रिप पर साल्ट नाम या ब्रांड स्पष्ट नहीं है। कृपया अच्छी रोशनी में स्पष्ट फोटो अपलोड करें।'
      : lang === 'hinglish'
      ? 'Photo mein strip ka naam ya composition clear nahi dikha. Kripya achhi roshni mein doobara photo kheenche.'
      : 'The uploaded blister strip image does not show legible text for brand name or salt composition. Please re-upload in clear lighting.');
  const unclearActionText =
    lang === 'hi'
      ? 'सुरक्षा कारणों से, बिना डॉक्टर या फार्मासिस्ट सत्यापन के इस दवा का सेवन न करें।'
      : lang === 'hinglish'
      ? 'Safety ke liye doctor ya pharmacist se check karaye bina yeh dawa na lein.'
      : 'For patient safety, do not consume unverified medications without consulting a licensed pharmacist or physician.';

  const packagingEvidenceLabel =
    lang === 'hi'
      ? 'पैकेजिंग व स्ट्रिप प्रमाण'
      : lang === 'hinglish'
      ? 'Packing Aur Strip Ki Jaanch'
      : 'Blister Pack & Specimen Audit';

  return {
    lang,
    statusLabel,
    brandLabel,
    brandValue,
    dosageFormLabel,
    dosageFormValue,
    strengthLabel,
    strengthValue,
    therapeuticClassLabel,
    therapeuticClassValue,
    rxLabel,
    rxTag,
    rxWarningBanner,
    activeSaltsLabel,
    activeSaltsList,
    activeSaltsDescription,
    usesLabel,
    usesList,
    precautionsLabel,
    precautionsList,
    guidanceLabel,
    guidanceText,
    disclaimerLabel,
    disclaimerText,
    unclearTitle,
    unclearText,
    unclearActionText,
    packagingEvidenceLabel,

    // Schedule & Administration (How & When to take)
    scheduleSectionTitle:
      lang === 'hi'
        ? 'सेवन विधि व समय सारिणी (भोजन का नियम)'
        : lang === 'hinglish'
        ? 'Dawa Kaise Aur Kab Lein (Schedule & Food Timing)'
        : 'How & When to Take (Timing & Food Routine)',
    howToTakeLabel:
      lang === 'hi' ? 'सेवन का सही तरीका' : lang === 'hinglish' ? 'Kaise Lein (How to Take)' : 'How to Take',
    howToTakeText: scheduleData.howToTakeText,
    timingScheduleLabel:
      lang === 'hi'
        ? 'दैनिक समय सारिणी'
        : lang === 'hinglish'
        ? 'Dainik Samay Sarini (Schedule)'
        : 'Daily Time Schedule',
    morningLabel: lang === 'hi' ? 'सुबह (प्रातः)' : lang === 'hinglish' ? 'Subah (Morning)' : 'Morning',
    morningTime: scheduleData.morningTime,
    morningActive: scheduleData.morningActive,
    afternoonLabel:
      lang === 'hi' ? 'दोपहर (मध्याह्न)' : lang === 'hinglish' ? 'Dopahar (Afternoon)' : 'Afternoon',
    afternoonTime: scheduleData.afternoonTime,
    afternoonActive: scheduleData.afternoonActive,
    eveningLabel:
      lang === 'hi' ? 'शाम / रात (सायं)' : lang === 'hinglish' ? 'Shaam / Raat (Evening)' : 'Evening / Night',
    eveningTime: scheduleData.eveningTime,
    eveningActive: scheduleData.eveningActive,
    frequencyLabel: lang === 'hi' ? 'खुराक की आवृत्ति' : lang === 'hinglish' ? 'Aavriti (Frequency)' : 'Frequency',
    frequencyText: scheduleData.frequencyText,
    foodRelation: scheduleData.foodRelation,
    foodRelationBadge: scheduleData.foodRelationBadge,
    foodRelationInstruction: scheduleData.foodRelationInstruction,

    // Benefits
    benefitsSectionTitle:
      lang === 'hi'
        ? 'दवा के प्रमुख लाभ व प्रभाव'
        : lang === 'hinglish'
        ? 'Mukhya Labh Aur Fayde (Key Benefits)'
        : 'Key Therapeutic Benefits',
    benefitsList: scheduleData.benefits,
  };
}

// ---------------------------------------------------------------------------
// Formatted Plain Text Exporter (Ready for Clipboard Copy & Print)
// ---------------------------------------------------------------------------
export function formatClinicalReportAsText(
  envelope: AnalyzeApiEnvelope,
  lang: LanguageMode
): string {
  const { result } = envelope;
  const { data } = result;
  const content = getLocalizedReportContent(data, lang, result.is_identified, result.unclear_reason);

  const divider = '======================================================================';
  const subDivider = '----------------------------------------------------------------------';

  if (!result.is_identified) {
    return `${divider}
MEDISCAN AI — MEDICINE IDENTIFICATION NOTICE
Language: ${lang.toUpperCase()} | Confidence: ${(result.confidence_score * 100).toFixed(0)}%
${divider}

STATUS: ${content.statusLabel}
NOTICE: ${content.unclearTitle}

DETAILS:
${content.unclearText}

SAFETY ADVISORY:
${content.guidanceText}

${subDivider}
${content.disclaimerLabel}:
${content.disclaimerText}
${divider}`;
  }

  const usesFormatted = content.usesList.map((u: string) => `• ${u}`).join('\n');
  const precautionsFormatted = content.precautionsList.map((p: string) => `• ${p}`).join('\n');
  const saltsFormatted = content.activeSaltsList.join(' + ');

  const mfg = data.packaging_evidence?.manufacturer
    ? `\nManufacturer (Supporting): ${data.packaging_evidence.manufacturer}`
    : '';

  const redBox =
    data.packaging_evidence?.red_box_detected !== undefined
      ? `\nSchedule H Red Box Detected: ${data.packaging_evidence.red_box_detected ? 'Yes (Rx Alert)' : 'No'}`
      : '';

  const scheduleMorning = content.morningActive ? `YES (${content.morningTime})` : 'NO';
  const scheduleAfternoon = content.afternoonActive ? `YES (${content.afternoonTime})` : 'NO (Unless prescribed)';
  const scheduleEvening = content.eveningActive ? `YES (${content.eveningTime})` : 'NO';

  const benefitsFormatted = content.benefitsList
    .map((b: LocalizedBenefit) => `• [${b.badge || 'Verified'}] ${b.title}: ${b.description}`)
    .join('\n');

  return `${divider}
MEDISCAN AI — CLINICAL MEDICINE REPORT
Language: ${lang === 'en' ? 'English' : lang === 'hinglish' ? 'Hinglish (Roman Hindi)' : 'हिंदी (Hindi)'}
Verification Score: ${(result.confidence_score * 100).toFixed(0)}% | Method: ${envelope.groundingMethod}
${divider}

[1. MEDICINE OVERVIEW]
${content.brandLabel}: ${content.brandValue}
${content.dosageFormLabel}: ${content.dosageFormValue}
${content.strengthLabel}: ${content.strengthValue}
${content.therapeuticClassLabel}: ${content.therapeuticClassValue}
${content.rxLabel}: ${content.rxTag}${mfg}${redBox}

${content.rxWarningBanner ? `[PRESCRIPTION WARNING]\n${content.rxWarningBanner}\n\n` : ''}[2. ACTIVE INGREDIENTS & COMPOSITION]
Active Salts: ${saltsFormatted}
${content.activeSaltsDescription}

[3. HOW TO TAKE MEDICINE (ADMINISTRATION METHOD)]
${content.howToTakeText}

[4. WHEN TO TAKE MEDICINE (DAILY SCHEDULE & FOOD ROUTINE)]
• Morning: ${scheduleMorning}
• Afternoon: ${scheduleAfternoon}
• Evening / Night: ${scheduleEvening}
• Frequency: ${content.frequencyText}
• Food Relationship: ${content.foodRelationBadge}
• Food Instruction: ${content.foodRelationInstruction}

[5. KEY THERAPEUTIC BENEFITS (HEALTH ADVANTAGES)]
${benefitsFormatted}

[6. COMMON USES & INDICATIONS]
${usesFormatted}

[7. IMPORTANT PRECAUTIONS & WARNINGS]
${precautionsFormatted}

[8. DOCTOR / PHARMACIST GUIDANCE]
${content.guidanceText}

${subDivider}
[9. ${content.disclaimerLabel}]
${content.disclaimerText}
${divider}`;
}
