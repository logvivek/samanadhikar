import { PolicyPillar, CampaignEvent, PressRelease } from "../types";

const pressBriefingImg = "/images/press_briefing_1785257057040.jpg";
const pressMemorandumImg = "/images/press_memorandum_1785256944924.jpg";
const pressRallyImg = "/images/press_rally_1785257030530.jpg";
const gouMataImg = "/images/gou_mata.jpg";
const gouMata1Img = "/images/gou_mata_1785258015449.jpg";
const gouMata2Img = "/images/gou_mata_1785343721033.jpg";
const candidatePortraitImg = "/images/kuldeep_sharma.jpg";
const campaignBannerImg = "/images/campaign_banner_1785253843161.jpg";

export const PARTY_INFO = {
  name: "समान अधिकार पार्टी",
  nameEnglish: "Saman Adhikar Party",
  leaderName: "कुलदीप शर्मा (Kuldeep Sharma)",
  leaderRole: "राष्ट्रीय अध्यक्ष (National President)",
  motto: "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!",
  mottoEnglish: "Bring Equal Rights, Build a Supreme India!",
  primarySlogan: "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा",
  secondarySlogan: "हर हर महादेव | जय हनुमान | जय हिन्दू राष्ट्र | जय गौमाता",
  contactPhone1: "9412165541",
  contactPhone2: "7310732088",
  headquarters: "सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश, भारत",
  bankDetails: {
    bankName: "भारतीय स्टेट बैंक (State Bank of India)",
    branch: "सदर बाजार, आगरा (Sadar Bazar, Agra)",
    accountNo: "34465318239",
    ifscCode: "SBIN0002467",
    upiId: "7866015900@ybl",
    accountHolder: "SAMAN ADHIKAR PARTY"
  },
  bioHeadline: "राष्ट्र निर्माण, सामाजिक समानता एवं सनातन संस्कृति की रक्षा हेतु संकल्पबद्ध",
  shortBio: "समान अधिकार पार्टी (Saman Adhikar Party) का मुख्य उद्देश्य भारत में सभी नागरिकों के लिए समान अधिकार स्थापित करना, जातिगत भेदभाव उत्पन्न करने वाली आरक्षण व्यवस्था का अंत करना, भारत को आधिकारिक रूप से 'हिंदू राष्ट्र' घोषित कराना, जनसंख्या नियंत्रण कानून लागू करना, प्रत्येक जिले में वैदिक गुरुकुलों की स्थापना करना तथा गौमाता को राष्ट्रमाता का दर्जा दिलाना है।",
  coreAgendasList: [
    "आरक्षण प्रणाली खत्म करें (Abolish Reservation System)",
    "भारत को हिंदू राष्ट्र घोषित करें (Declare India a Hindu Rashtra)",
    "जनसंख्या नियंतरण कानून लागू हो (Implement Population Control Law)",
    "भारत के हर ज़िले में गुरुकुल स्कूल खोलना (Open Gurukul Schools in Every District)",
    "गौमाता को राष्ट्रमाता घोषित करना (Declare Gaumata as Rashtramata)"
  ]
};

export const POLICY_PILLARS: PolicyPillar[] = [
  {
    id: "pol-reservation",
    category: "Reservation",
    titleHi: "आरक्षण प्रणाली खत्म करें एवं समानता स्थापित करें",
    titleEn: "Abolish Reservation System & Ensure Merit-Based Equality",
    subtitleHi: "जाति-मुक्त न्यायपूर्ण व्यवस्था - केवल प्रतिभा एवं आर्थिक आवश्यकता के आधार पर अवसर।",
    subtitleEn: "Eliminate Caste Discrimination - Opportunities Based Purely on Merit & True Economic Need.",
    iconName: "Scale",
    keyStanceHi: "वर्तमान जातिगत आरक्षण प्रणाली समाज में विभाजन पैदा करती है। पार्टी का स्पष्ट संकल्प है कि जातिगत आरक्षण समाप्त कर देश के हर नागरिक को समान अवसर मिले।",
    keyStanceEn: "The current caste-based reservation divides society. Our party advocates abolishing caste reservations to ensure equal merit-based rights.",
    detailedPointsHi: [
      "सभी सरकारी नौकरियों एवं शैक्षणिक संस्थानों में जातिगत आरक्षण व्यवस्था का पूर्ण समापन।",
      "प्रतिभाशाली एवं प्रतिभावान युवाओं को उनकी योग्यता के आधार पर प्राथमिकता।",
      "आर्थिक रूप से अत्यंत कमजोर परिवारों हेतु लक्षित छात्रवृत्ति एवं निशुल्क कोचिंग सहायता।",
      "प्रतिभा पलायन (Brain Drain) को रोकना एवं युवाओं को भारत में ही श्रेष्ठ अवसर प्रदान करना।",
      "समान अधिकार कानून के माध्यम से सभी नागरिकों हेतु एक समान संविधान न्याय।"
    ],
    detailedPointsEn: [
      "Complete abolition of caste-based quotas in public employment and higher education.",
      "Priority based on merit and individual excellence for all youth regardless of background.",
      "Targeted financial stipends and free coaching purely for truly impoverished families.",
      "Stopping brain drain and providing high-quality domestic opportunities for Indian talent.",
      "Equal Rights Law guaranteeing single-tier constitutional treatment for all citizens."
    ],
    billProposalsHi: [
      "समान अधिकार एवं आरक्षण उन्मूलन अधिनियम 2026",
      "प्रतिभा प्रोत्साहन एवं मेधा संरक्षण विधेयक",
      "समान अवसर आयोग का गठन"
    ],
    billProposalsEn: [
      "Equal Rights & Reservation Abolition Act 2026",
      "Merit Encouragement & Talent Protection Bill",
      "National Equal Opportunity Commission Act"
    ],
    expectedImpactHi: "जातिवादी राजनीति का अंत, समाज में परस्पर बंधुत्व की वृद्धि और योग्यता के आधार पर भारत का द्रुत गति से विकास।",
    expectedImpactEn: "End of caste-identity politics, fostering national unity and accelerated development through merit.",
    faq: [
      {
        q: "क्या आर्थिक रूप से कमजोर वर्गों की मदद की जाएगी?",
        a: "हाँ, जाति के बजाय आर्थिक तंगी के आधार पर अध्ययन सामग्री, छात्रवृत्ति एवं कौशल प्रशिक्षण का लाभ दिया जाएगा।",
        qEn: "Will economically weaker sections still receive support?",
        aEn: "Yes, support will be provided purely on economic necessity regardless of caste or religion."
      }
    ]
  },
  {
    id: "pol-hindu-rashtra",
    category: "Hindu Rashtra",
    titleHi: "भारत को हिंदू राष्ट्र घोषित करें",
    titleEn: "Declare India a Cultural & Constitutional Hindu Rashtra",
    subtitleHi: "सनातन संस्कृति, राष्ट्रीय गौरव एवं हमारी प्राचीन धरोहर की पुनर्स्थापना।",
    subtitleEn: "Restoring Sanatan Culture, Civilizational Pride, & Ancient Heritage.",
    iconName: "ShieldAlert",
    keyStanceHi: "भारत विश्व की अनादि सनातन संस्कृति की जन्मभूमि है। भारत को संवैधानिक रूप से हिंदू राष्ट्र घोषित करना हमारी सांस्कृतिक पहचान और संप्रभुता की सुरक्षा हेतु अनिवार्य है।",
    keyStanceEn: "India is the eternal homeland of Sanatan Dharma. Constitutional declaration as a Hindu Rashtra guarantees our cultural heritage and sovereignty.",
    detailedPointsHi: [
      "संसद द्वारा भारत को आधिकारिक 'सांस्कृतिक एवं संवैधानिक हिंदू राष्ट्र' घोषित करना।",
      "सनातन धार्मिक स्थलों, मठों और मंदिरों को सरकारी नियंत्रण (Muzrai System) से मुक्त कराना।",
      "मथुरा में भव्य पूर्ण श्री कृष्ण जन्मभूमि मंदिर का पुनरोद्धार एवं संरक्षण।",
      "संस्कृत भाषा के अध्ययन, अनुसंधान एवं प्रयोग को राष्ट्रीय स्तर पर बढ़ावा देना।",
      "ऐतिहासिक एवं सांस्कृतिक आक्रमणकारियों के नामों वाले स्थलों का नामकरण भारतीय संतों व वीरों पर करना।"
    ],
    detailedPointsEn: [
      "Parliamentary declaration of India as an official Constitutional Hindu Rashtra.",
      "Liberating Hindu temples and religious endowments from state administrative control.",
      "Grand reclamation and construction of the authentic Shri Krishna Janmabhoomi Mandir in Mathura.",
      "National promotion and research funding for Sanskrit language and ancient sciences.",
      "Renaming places named after colonial/invader figures to honour Indian sages and freedom heroes."
    ],
    billProposalsHi: [
      "हिंदू राष्ट्र घोषणा एवं संवैधानिक संशोधन विधेयक",
      "मठ-मंदिर मुक्ति एवं धर्मस्व स्वायत्तता कानून",
      "मथुरा श्री कृष्ण जन्मभूमि पुनरुद्धार अधिनियम"
    ],
    billProposalsEn: [
      "Hindu Rashtra Constitutional Amendment Act",
      "Temple Liberation & Autonomy Act",
      "Mathura Shri Krishna Janmabhoomi Restoration Act"
    ],
    expectedImpactHi: "विश्वभर में सनातन गौरव की पुनर्स्थापना, तीर्थ क्षेत्रों का सर्वांगीण विकास एवं भारत की सांस्कृतिक अक्षुण्णता।",
    expectedImpactEn: "Global restoration of Sanatan pride and holistic development of holy pilgrimage corridors.",
    faq: [
      {
        q: "हिंदू राष्ट्र में अन्य नागरिकों के अधिकार क्या होंगे?",
        a: "समान अधिकार पार्टी का मूल मंत्र ही 'समान अधिकार' है। हिंदू राष्ट्र में सभी नागरिकों को सुरक्षा, न्याय एवं समान नागरिक अधिकार प्राप्त होंगे।",
        qEn: "What about the rights of all citizens in a Hindu Rashtra?",
        aEn: "Equal rights for all citizens is our founding principle. Universal law and safety applies to every law-abiding citizen."
      }
    ]
  },
  {
    id: "pol-population",
    category: "Population",
    titleHi: "जनसंख्या नियंत्रण कानून लागू हो",
    titleEn: "Implement Strict Population Control Law Nationwide",
    subtitleHi: "सीमित संसाधन, असीमित जनसंख्या पर रोक - दो बच्चों का कड़ा नियम।",
    subtitleEn: "Resource Conservation & National Stability - Strict Two-Child Norm.",
    iconName: "Users",
    keyStanceHi: "अनियंत्रित जनसंख्या देश के प्राकृतिक संसाधनों, रोजगार एवं नागरिक सुविधाओं पर भारी बोझ है। देशहित में तुरंत कठोर जनसंख्या नियंत्रण कानून लागू होना चाहिए।",
    keyStanceEn: "Unchecked population growth strains national resources, jobs, and infrastructure. A uniform population control law is vital for national survival.",
    detailedPointsHi: [
      "सभी धर्मावलंबियों और नागरिकों हेतु समान रूप से 'अधिकतम दो बच्चे' का कानून लागू करना।",
      "दो से अधिक बच्चे वाले नागरिकों को सरकारी नौकरियों, सब्सिडी एवं चुनाव लड़ने से वंचित करने का प्रावधान।",
      "छोटे परिवार अपनाने वाले परिवारों को विशेष कर छूट एवं प्राथमिकता वाली नागरिक सुविधाएं।",
      "जनसांख्यिकी संतुलन (Demographic Balance) को बिगड़ने से बचाना।",
      "पर्यावरण, जल संसाधन एवं भूमि के संरक्षण हेतु टिकाऊ विकास मॉडल।"
    ],
    detailedPointsEn: [
      "Enforcing a strict, uniform two-child limit across all communities and religions.",
      "Disqualifications from government jobs, welfare subsidies, and contesting elections for violations.",
      "Tax incentives and priority amenities for families adhering to small family standards.",
      "Preserving national demographic balance and social stability.",
      "Protecting land, water, and ecology from overpopulation pressures."
    ],
    billProposalsHi: [
      "राष्ट्रीय जनसंख्या नियंत्रण एवं परिवार नियोजन अधिनियम 2026",
      "जनसांख्यिकीय संतुलन सुरक्षा कानून"
    ],
    billProposalsEn: [
      "National Population Control & Family Planning Act 2026",
      "Demographic Balance Protection Act"
    ],
    expectedImpactHi: "प्रति व्यक्ति आय में वृद्धि, रोजगार के बेहतर अवसर, गरीबी में गिरावट एवं प्राकृतिक संसाधनों की सुरक्षा।",
    expectedImpactEn: "Higher per capita wealth, reduced poverty, better infrastructure, and ecological conservation.",
    faq: [
      {
        q: "क्या यह कानून सभी संप्रदायों पर समान रूप से लागू होगा?",
        a: "हाँ, यह कानून देश के प्रत्येक नागरिक पर बिना किसी धार्मिक या सामाजिक भेदभाव के एक समान लागू होगा।",
        qEn: "Will this law apply equally to all religions?",
        aEn: "Yes, without any exception or exemption, strictly applicable to every resident of India."
      }
    ]
  },
  {
    id: "pol-gurukul",
    category: "Gurukul",
    titleHi: "भारत के हर ज़िले में गुरुकुल स्कूल खोलना",
    titleEn: "Establish Traditional Gurukul Schools in Every District of India",
    subtitleHi: "आधुनिक विज्ञान, तकनीक एवं वैदिक संस्कारों का अद्भुत समन्वय।",
    subtitleEn: "Blending Modern Science, AI & Technology with Vedic Values & Ethos.",
    iconName: "BookOpen",
    keyStanceHi: "लार्ड मैकाले की शिक्षा पद्धति के स्थान पर भारत के प्रत्येक जिले में सर्वसुविधायुक्त सरकारी गुरुकुल विद्यालयों की स्थापना की जाएगी।",
    keyStanceEn: "Replacing colonial Macaulay education with state-of-the-art Gurukul residential schools in every district of India.",
    detailedPointsHi: [
      "देश के प्रत्येक जिले में न्यूनतम एक विशाल आदर्श गुरुकुल परिसर का निर्माण।",
      "वैदिक गणित, आयुर्वेद, संस्कृत, योग एवं नीतिशास्त्र के साथ आधुनिक विज्ञान, कंप्यूटर व AI की शिक्षा।",
      "विद्यार्थियों हेतु चरित्र निर्माण, देशभक्ति, अनुशासन एवं शारीरिक सौष्ठव की शिक्षा।",
      "निर्धन एवं मेधावी छात्रों हेतु पूर्णतः नि:शुल्क आवासीय व्यवस्था एवं सात्विक भोजन।",
      "प्राचीन भारतीय विज्ञान, खगोलशास्त्र एवं स्थापत्य कला पर विशेष शोध केंद्र।"
    ],
    detailedPointsEn: [
      "Building at least one fully equipped model Gurukul campus in all 780+ districts.",
      "Integrating Vedic Mathematics, Ayurveda, Yoga & Ethics with Computer Science, AI & Robotics.",
      "Focusing on character building, national devotion, physical stamina, and moral courage.",
      "Free residential lodging and nutritious Satvik food for meritorious and rural students.",
      "Dedicated research chairs for ancient Indian astronomy, metallurgy, and architecture."
    ],
    billProposalsHi: [
      "राष्ट्रीय गुरुकुल शिक्षा मिशन अधिनियम",
      "मैकाले शिक्षा सुधार एवं भारतीय ज्ञान परंपरा विधेयक"
    ],
    billProposalsEn: [
      "National Gurukul Education Mission Act",
      "Indian Knowledge System & Macaulay Education Reform Act"
    ],
    expectedImpactHi: "संस्कारवान एवं तकनीकी रूप से सक्षम युवा पीढ़ी का निर्माण, सांस्कृतिक जड़ों की मजबूती।",
    expectedImpactEn: "Generation of patriotic, ethical, and high-tech youth rooted in indigenous wisdom.",
    faq: [
      {
        q: "क्या गुरुकुल के छात्र आधुनिक प्रतियोगी परीक्षाओं में बैठ सकेंगे?",
        a: "बिलकुल! गुरुकुल का पाठ्यक्रम CBSE/ICSE से मान्यता प्राप्त होगा जहाँ साइंस व मैथ के साथ वेद-पुराण का ज्ञान भी दिया जाएगा।",
        qEn: "Will Gurukul students be qualified for modern competitive exams?",
        aEn: "Yes! Gurukul certification will be recognized equivalent to CBSE/State boards with full STEM training."
      }
    ]
  },
  {
    id: "pol-gaumata",
    category: "Gaumata",
    titleHi: "गौमाता को राष्ट्रमाता घोषित करना एवं संरक्षण",
    titleEn: "Declare Gaumata as Rashtramata & Strict Cow Protection",
    subtitleHi: "गौ-संरक्षण, पूर्ण गोवंश वध प्रतिबंध एवं प्राकृतिक कृषि का बढ़ावा।",
    subtitleEn: "Complete Ban on Cow Slaughter, Rashtramata Honor & Organic Agriculture.",
    iconName: "Heart",
    keyStanceHi: "गौमाता भारत की अर्थव्यवस्था, कृषि, स्वास्थ्य एवं संस्कृति की रीढ़ हैं। गौमाता को अविलंब 'राष्ट्रमाता' घोषित कर गोवंश हत्या पर आजीवन कारावास का कानून बनाया जाएगा।",
    keyStanceEn: "Cow is the pillar of Indian agriculture, health, and spiritual identity. Declaring Gaumata as Rashtramata with strict ban on slaughter.",
    detailedPointsHi: [
      "संसद द्वारा गौमाता को आधिकारिक 'राष्ट्रमाता' (National Mother) का दर्जा।",
      "संपूर्ण भारत में गोवंश वध एवं अवैध तस्करी पर गैर-जमानती आजीवन कारावास का कड़ा प्रावधान।",
      "प्रत्येक पंचायत स्तर पर आधुनिक गौशालाओं (Gaushala) एवं गो-अभयारण्य का निर्माण।",
      "पंचगव्य (दूध, दही, घृत, गोमूत्र, गोबर) आधारित औषधि एवं जैविक खाद उद्योगों को प्रोत्साहन।",
      "आवारा एवं बेसहारा गोवंश की देखभाल हेतु राज्य सरकार द्वारा नियमित वित्तीय अनुदान।"
    ],
    detailedPointsEn: [
      "Constitutional declaration of Gaumata as 'Rashtramata' (Mother of the Nation).",
      "Nationwide strict ban on cow slaughter and cattle smuggling with non-bailable life imprisonment.",
      "Constructing hi-tech self-sustaining Gaushalas and Cow Sanctuaries in every Gram Panchayat.",
      "Promoting Panchagavya pharmaceuticals, organic fertilizers, and gobar-gas energy units.",
      "Mandatory monthly state budget allocations for stray cattle feeding and medical care."
    ],
    billProposalsHi: [
      "गौमाता राष्ट्रमाता सम्मान एवं संरक्षण अधिनियम",
      "राष्ट्रीय गोवंश संवर्धन एवं जैविक कृषि कोष विधेयक"
    ],
    billProposalsEn: [
      "Rashtramata Gaumata Protection & Honor Act",
      "National Cattle Welfare & Panchagavya Organic Development Bill"
    ],
    expectedImpactHi: "कृषि लागत में कमी, रसायन-मुक्त भोजन, गोवंश का सम्मान और ग्रामीण अर्थव्यवस्था का सुदृढ़ीकरण।",
    expectedImpactEn: "Chemical-free organic farming, rural economic revival, and protection of sacred fauna.",
    faq: [
      {
        q: "गौशालाओं के संचालन का खर्च कैसे उठाया जाएगा?",
        a: "गोमूत्र व गोबर से बनने वाली जैविक खाद, फिनाइल व सीएनजी बिक्री से गौशालाएं आत्मनिर्भर बनेंगी।",
        qEn: "How will Gaushala operations be funded sustainably?",
        aEn: "By commercial processing of organic fertilizers, bio-CNG, and natural health products."
      }
    ]
  }
];

export const PRESS_RELEASES_SEED: PressRelease[] = [
  {
    id: "pr-karyakram-01",
    title: "समान अधिकार पार्टी का विशाल प्रदेश स्तरीय कार्यकर्ता सम्मेलन एवं महा-समीक्षा कार्यक्रम",
    titleEn: "State Level Worker Conference & Review Program - Saman Adhikar Party",
    category: "Karyakram",
    date: "2026-08-08",
    location: "कोठी मीना बाज़ार मैदान, आगरा, उत्तर प्रदेश",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    imageUrl: campaignBannerImg,
    content: `समान अधिकार पार्टी के तत्वावधान में आगरा के ऐतिहासिक कोठी मीना बाज़ार मैदान में विशाल प्रदेश स्तरीय कार्यकर्ता सम्मेलन आयोजित किया गया। 

कार्यक्रम की अध्यक्षता राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी ने की। सम्मेलन में उत्तर प्रदेश एवं पड़ोसी राज्यों से आए हजारों पदाधिकारियों व निष्ठावान कार्यकर्ताओं ने भाग लिया। 

प्रमुख निर्णय एवं संकल्प:
1. प्रदेश के सभी जिलों व तहसीलों में कार्यकारिणी का पूर्ण विस्तार।
2. आरक्षण खात्मा व हिंदू राष्ट्र जन-जागरण हेतु गांव-गांव चौपाल का आयोजन।
3. आगामी चुनावों के लिए बूथ स्तर पर संगठन को मजबूत करने की कार्ययोजना स्वीकृति।`
  },
  {
    id: "pr-rally-01",
    title: "आगरा से मथुरा ऐतिहासिक 'हिंदू राष्ट्र हुंकार पदयात्रा एवं विशाल महा-रैली'",
    titleEn: "Agra to Mathura Grand Hindu Rashtra Rally & Padayatra",
    category: "Rally",
    date: "2026-08-05",
    location: "आगरा-मथुरा राष्ट्रीय राजमार्ग / मथुरा कलेक्ट्रेट",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    hasVideo: true,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    videoCaption: "रैली दृश्य: हजारों गाड़ियों व पदयात्रियों का काफिला भगवा ध्वजों के साथ मथुरा की ओर अग्रसर।",
    imageUrl: pressRallyImg,
    content: `समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के ओजस्वी आह्वान पर आगरा से मथुरा तक ऐतिहासिक 'हिंदू राष्ट्र हुंकार रैली' का आयोजन किया गया।

रैली में 5,000 से अधिक दुपहिया व चारपहिया वाहनों तथा हजारों समर्थकों का विशाल काफिला भगवा ध्वज लहराते हुए जय श्री राम व जय गौमाता के नारों के साथ आगे बढ़ा। मथुरा आगमन पर स्थानीय जनता एवं संतों द्वारा रैली का पुष्प वर्षा कर भव्य स्वागत किया गया।

रैली के मुख्य बिंदु:
• आरक्षण मुक्त भारत एवं समानता की पुरजोर मांग।
• मथुरा में भव्य श्री कृष्ण जन्मभूमि मंदिर निर्माण का राष्ट्रव्यापी शंखनाद।
• गौमाता को राष्ट्रमाता घोषित करने हेतु ज्ञापन पत्र प्रस्तुत।`
  },
  {
    id: "pr-yt-107",
    title: "समान अधिकार पार्टी का राष्ट्रीय डिजिटल सदस्यता एवं जन-संपर्क अभियान #Shorts",
    titleEn: "National Digital Membership & Public Campaign - Saman Adhikar Party #Shorts",
    category: "Public Announcement",
    date: "2026-08-02",
    location: "आगरा HQ / यूट्यूब शॉट्स",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/8kR2m8qX7aY",
    videoCaption: "आधिकारिक यूट्यूब शॉट्स (@samanadhikarparty3851): राष्ट्रीय डिजिटल सदस्यता एवं जन-संपर्क अभियान।",
    imageUrl: campaignBannerImg,
    content: `समान अधिकार पार्टी से जुड़ें और राष्ट्र निर्माण में अपनी भागीदारी दर्ज कराएं। देश में समानता और न्याय की स्थापना हेतु हमारे यूट्यूब चैनल (@samanadhikarparty3851/shorts) को सबक्राइब करें।`
  },
  {
    id: "pr-yt-101",
    title: "गौमाता को राष्ट्रमाता घोषित करने और पूर्ण रक्षा के लिए हुंकार | समान अधिकार पार्टी #Shorts",
    titleEn: "Gaumata Rashtramata Declaration & Protection Call - Saman Adhikar Party #Shorts",
    category: "Public Announcement",
    date: "2026-08-01",
    location: "आगरा HQ / यूट्यूब शॉट्स",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/3i_JmO9G2xA",
    videoCaption: "आधिकारिक यूट्यूब शॉट्स (@samanadhikarparty3851): गौमाता को राष्ट्रमाता घोषित कराने हेतु जन-आह्वान।",
    imageUrl: gouMata1Img,
    content: `समान अधिकार पार्टी का मुख्य लक्ष्य गौमाता को 'राष्ट्रमाता' का दर्जा दिलाना और संपूर्ण गोवंश संरक्षण हेतु आजीवन कारावास का कड़ा कानून बनवाना है।
    
देखें राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी का विशेष वक्तव्य। चैनल सबक्राइब करें: https://www.youtube.com/@samanadhikarparty3851/shorts`
  },
  {
    id: "pr-yt-102",
    title: "जातिवादी आरक्षण खत्म कर योग्यता के आधार पर अधिकार - राष्ट्रीय अध्यक्ष कुलदीप शर्मा #Shorts",
    titleEn: "Abolish Caste Reservation, Honor Talent & Merit - Kuldeep Sharma #Shorts",
    category: "National Agenda",
    date: "2026-07-30",
    location: "नई दिल्ली / यूट्यूब शॉट्स",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/r8sFm9sW4jA",
    videoCaption: "आधिकारिक यूट्यूब शॉट्स: आरक्षण खात्मा व योग्यता सम्मान का ओजस्वी संदेश।",
    imageUrl: candidatePortraitImg,
    content: `आरक्षण का पूर्ण उन्मूलन ही श्रेष्ठ और समर्थ भारत के निर्माण की प्रथम कुंजी है। देश के योग्य एवं मेधावी युवाओं को जातिगत सीमाओं से परे केवल योग्यता के आधार पर अवसर मिलना चाहिए।
    
समान अधिकार पार्टी का आधिकारिक यूट्यूब शॉट्स देखें: @samanadhikarparty3851`
  },
  {
    id: "pr-yt-103",
    title: "भारत को संवैधानिक हिंदू राष्ट्र बनाने का संकल्प - 'तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा' #Shorts",
    titleEn: "Saman Adhikar Party Pledge for Constitutional Hindu Rashtra #Shorts",
    category: "National Agenda",
    date: "2026-07-27",
    location: "आगरा-मथुरा मण्डल / यूट्यूब शॉट्स",
    spokesperson: "समान अधिकार पार्टी केंद्रीय मीडिया सेल",
    isUrgent: false,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/k9P2m7gH4wE",
    videoCaption: "यूट्यूब शॉट्स: 'तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा' - कुलदीप शर्मा जी का हुंकार।",
    imageUrl: pressRallyImg,
    content: `सनातन संस्कृति की रक्षा और भारत को संवैधानिक हिंदू राष्ट्र बनाने हेतु समान अधिकार पार्टी का राष्ट्रव्यापी अभियान।
    
यूट्यूब पर देखें और शेयर करें: https://www.youtube.com/@samanadhikarparty3851/shorts`
  },
  {
    id: "pr-yt-104",
    title: "भारत के हर ज़िले में अत्याधुनिक गुरुकुल विद्यालय स्थापना का संदेश #Shorts",
    titleEn: "National Gurukul Mission in Every District - Official YouTube Short",
    category: "Public Announcement",
    date: "2026-07-22",
    location: "मथुरा धाम / यूट्यूब शॉट्स",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: false,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/p7L4v8qN1sK",
    videoCaption: "यूट्यूब शॉट्स: वैदिक + एआई तकनीक से लैस गुरुकुल योजना।",
    imageUrl: gouMata2Img,
    content: `भारत के 780 से अधिक जिलों में आधुनिक विज्ञान, कंप्यूटर/AI व वैदिक संस्कारों से युक्त गुरुकुलों की स्थापना का संकल्प।
    
यूट्यूब शॉट्स: @samanadhikarparty3851`
  },
  {
    id: "pr-yt-105",
    title: "मथुरा में भव्य श्री कृष्ण जन्मभूमि मंदिर निर्माण एवं जन-चेतना #Shorts",
    titleEn: "Mathura Shri Krishna Janmabhoomi Temple Construction Call #Shorts",
    category: "Demonstration",
    date: "2026-07-15",
    location: "मथुरा / यूट्यूब शॉट्स",
    spokesperson: "कुलदीप शर्मा",
    isUrgent: false,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/x5M9v3qL8pZ",
    videoCaption: "यूट्यूब शॉट्स: मथुरा धाम में श्री कृष्ण जन्मभूमि भव्य मंदिर निर्माण का संकल्प।",
    imageUrl: pressMemorandumImg,
    content: `मथुरा की पावन धरती से भगवान श्री कृष्ण जन्मभूमि पर भव्य पूर्ण मंदिर निर्माण का आह्वान। 
    
यूट्यूब चैनल पर लाइव देखें: https://www.youtube.com/@samanadhikarparty3851/shorts`
  },
  {
    id: "pr-yt-106",
    title: "दो बच्चों का सख्त जनसंख्या नियंत्रण कानून देश हित में आवश्यक #Shorts",
    titleEn: "Strict Population Control Law Message - Saman Adhikar Party #Shorts",
    category: "National Agenda",
    date: "2026-07-12",
    location: "उत्तर प्रदेश / यूट्यूब शॉट्स",
    spokesperson: "राष्ट्रीय अध्यक्ष कुलदीप शर्मा",
    isUrgent: false,
    hasVideo: true,
    videoUrl: "https://www.youtube.com/shorts/v3Q7k9pW2mL",
    videoCaption: "यूट्यूब शॉट्स: सभी नागरिकों पर दो बच्चों के कड़े जनसंख्या नियंत्रण कानून का समर्थन।",
    imageUrl: pressBriefingImg,
    content: `सीमित संसाधनों और समृद्ध भविष्य के लिए सभी नागरिकों पर अनिवार्य जनसंख्या नियंत्रण कानून लागू हो।
    
ऑफ़िशियल यूट्यूब चैनल: @samanadhikarparty3851`
  },
  {
    id: "pr-2026-media-01",
    title: "अयोध्या राम मंदिर ट्रस्ट में चंदा चोरी व वित्तीय धांधली के खिलाफ आगरा में महामहिम राष्ट्रपति महोदया के नाम ज्ञापन सौंपा - कुलदीप शर्मा",
    titleEn: "Presidential Memorandum Submitted to Agra DM Demanding Immediate Dissolution of Ram Mandir Trust & SC Probe",
    category: "Press Briefing",
    date: "2026-07-28",
    location: "आगरा कलेक्ट्रेट, उत्तर प्रदेश",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    hasVideo: true,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoCaption: "प्रेस बाइट: आगरा कलेक्ट्रेट परिसर में प्रमुख समाचार चैनलों (JST News, Lok Bharti, Nation Times, Samachar Live) को संबोधित करते राष्ट्रीय अध्यक्ष कुलदीप शर्मा।",
    imageUrl: pressBriefingImg,
    galleryImages: [pressBriefingImg, pressMemorandumImg, pressRallyImg],
    content: `समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा ने आज आगरा कलेक्ट्रेट में महामहिम राष्ट्रपति महोदया के नाम जिलाधिकारी आगरा को ज्ञापन सौंपा।
    
प्रेस प्रतिनिधियों को संबोधित करते हुए राष्ट्रीय अध्यक्ष कुलदीप शर्मा ने कहा:
"माननीय महामहिम राष्ट्रपति महोदया के नाम जिलाधिकारी आगरा को एक ज्ञापन दिया गया है। समान अधिकार पार्टी ने मांग की है कि अयोध्या राम मंदिर में जहां डकैती हुई है, लूट हुई है और चंदा चोरी हुई है... उस ट्रस्ट को तुरंत भंग कर नया पारदर्शी ट्रस्ट बनाया जाए।

नया ट्रस्ट चारों पूज्य शंकराचार्यों की देखरेख में बनना चाहिए, जो हमारे सनातन धर्म के सच्चे ध्वजवाहक हैं। उस ट्रस्ट में RSS और BJP का कोई भी कार्यकर्ता या नेता नहीं होना चाहिए। यह 125 करोड़ सनातनियों की आस्था से जुड़ा हुआ विषय है।

चंपत राय, गोपाल गिरी, गोविंद गिरी, अनिल मिश्रा सहित सभी दोषियों पर सख्त कानूनी कार्रवाई हो और इसकी जांच सुप्रीम कोर्ट के वरिष्ठ जजों से कराई जाए। चंदे की पाई-पाई का हिसाब देश के सामने आना चाहिए।"

पार्टी ने चेतावनी दी है कि यदि चंदा चोरी के दोषियों को तुरंत गिरफ्तार नहीं किया गया तो समान अधिकार पार्टी देशव्यापी उग्र आंदोलन शुरू करेगी।`
  },
  {
    id: "pr-2026-media-02",
    title: "समान अधिकार पार्टी प्रतिनिधिमंडल ने आगरा जिलाधिकारी कार्यालय में सौंपा आधिकारिक ज्ञापन पत्र",
    titleEn: "Saman Adhikar Party Delegation Submits Official Memorandum to Agra City Magistrate",
    category: "Public Announcement",
    date: "2026-07-28",
    location: "कलेक्ट्रेट / एडीएम सिटी कार्यालय, आगरा",
    spokesperson: "कुलदीप शर्मा, बबलूलाल दिवाकर, सतीश चन्द भारद्वाज",
    isUrgent: false,
    imageUrl: pressMemorandumImg,
    galleryImages: [pressMemorandumImg, pressBriefingImg, pressRallyImg],
    content: `समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नेतृत्व में प्रतिनिधिमंडल (जिसमें अनु. मोर्चा शहर अध्यक्ष बबलूलाल दिवाकर, पूर्व विधायक प्रत्याशी सतीश चन्द भारद्वाज व महिला प्रतिनिधि शामिल थीं) ने आगरा कलेक्ट्रेट पहुंचकर नगर मजिस्ट्रेट / एडीएम सिटी को औपचारिक ज्ञापन सौंपा।
    
ज्ञापन में दर्ज मुख्य राष्ट्रव्यापी बिंदु:
1. राम मंदिर ट्रस्ट का पुनर्गठन पूज्य चारों शंकराचार्यों के सानिध्य में किया जाए।
2. जातिगत आरक्षण व्यवस्था का अंत कर समाज के हर नागरिक को समान अधिकार दिया जाए।
3. भारत को संवैधानिक रूप से अखंड हिंदू राष्ट्र घोषित किया जाए।
4. दो बच्चों का सख्त जनसंख्या नियंत्रण कानून तुरंत प्रभाव से लागू हो।
5. गौमाता को 'राष्ट्रमाता' का दर्जा दिया जाए एवं गोवंश वध पर आजीवन कारावास का कठोर दंड तय हो।`
  },
  {
    id: "pr-2026-media-03",
    title: "समान अधिकार पार्टी का आगरा की मुख्य सड़कों पर ऐतिहासिक विरोध मार्च व पदयात्रा प्रदर्शन",
    titleEn: "Mass Protest March & Rally Led by Saman Adhikar Party on Agra City Roads",
    category: "Demonstration",
    date: "2026-07-28",
    location: "सदर बाजार से कलेक्ट्रेट मार्ग, आगरा",
    spokesperson: "बबलूलाल दिवाकर (अनु. मोर्चा शहर अध्यक्ष)",
    isUrgent: false,
    hasVideo: true,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    videoCaption: "प्रदर्शन वीडियो: 'समान अधिकार पार्टी - जिंदाबाद! जिंदाबाद!', 'राम मंदिर को ट्रस्ट से मुक्त करो!', 'चंदा चोरों को - जेल भेजो!'",
    imageUrl: pressRallyImg,
    galleryImages: [pressRallyImg, pressMemorandumImg, pressBriefingImg],
    content: `समान अधिकार पार्टी के सैकड़ों निष्ठावान कार्यकर्ताओं एवं समर्थकों ने आगरा की मुख्य सड़कों पर विशाल विरोध मार्च निकाला।
    
कार्यकर्ताओं ने हाथों में "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है", "जय हिंदू राष्ट्र | हर हर महादेव | जय गौ माता" के विशाल लाल-सफेद बैनर लेकर गगनभेदी नारेबाजी की।

मार्च का नेतृत्व राष्ट्रीय अध्यक्ष कुलदीप शर्मा, अनु. मोर्चा शहर अध्यक्ष बबलूलाल दिवाकर (Mo. 9410659986) तथा पूर्व विधायक प्रत्याशी सतीश चन्द भारद्वाज (Mo. 8273424256) ने किया। कार्यकर्ताओं ने कलेक्ट्रेट चौराहे पर जमकर प्रदर्शन किया और धर्म के नाम पर लूट करने वालों को अविलंब जेल भेजने की पुरजोर मांग की।`
  },
  {
    id: "pr-101",
    title: "समान अधिकार पार्टी का विशाल पदयात्रा एवं ज्ञापन प्रदर्शन: 'आरक्षण खत्म करो, समान अधिकार दो'",
    titleEn: "Saman Adhikar Party Grand Padayatra & Delegation Memorandum: Abolish Reservation, Ensure Equal Rights",
    category: "Demonstration",
    date: "2026-07-25",
    location: "आगरा / मथुरा, उत्तर प्रदेश",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    isUrgent: true,
    imageUrl: gouMata1Img,
    content: `समान अधिकार पार्टी के तत्वावधान में राष्ट्रीय अध्यक्ष कुलदीप शर्मा के नेतृत्व में आगरा से मथुरा तक ऐतिहासिक जन-चेतना पदयात्रा का आयोजन किया गया। हजारों समर्थकों ने 'तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा' और 'समान अधिकार लाना है, श्रेष्ठ भारत बनाना है' के गगनभेदी नारों के साथ मुख्य प्रशासनिक अधिकारी को ज्ञापन सौंपा।

प्रेस को संबोधित करते हुए कुलदीप शर्मा ने कहा: "जब तक देश में जातिवादी आरक्षण व्यवस्था कायम है, तब तक भारत में वास्तविक समानता नहीं आ सकती। योग्य युवाओं को उनका अधिकार मिलना ही चाहिए। हमारी पार्टी संसद से सड़क तक इस लड़ाई को अंतिम सांस तक लड़ेगी।"

इस अवसर पर राष्ट्रीय कार्यकारिणी के सदस्य, प्रांतीय संयोजक एवं आगरा-मथुरा क्षेत्र के हजारों युवाओं ने बढ़-चढ़कर भाग लिया।`
  },
  {
    id: "pr-102",
    title: "राष्ट्रीय अध्यक्ष कुलदीप शर्मा की प्रेस वार्ता: भारत को हिंदू राष्ट्र घोषित करने एवं जनसंख्या नियंत्रण कानून पर हुंकार",
    titleEn: "National President Kuldeep Sharma's Press Briefing on Hindu Rashtra & Population Control Law",
    category: "Press Briefing",
    date: "2026-07-18",
    location: "नई दिल्ली / आगरा",
    spokesperson: "समान अधिकार पार्टी केंद्रीय मीडिया सेल",
    isUrgent: false,
    imageUrl: gouMata2Img,
    content: `समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा ने आज प्रेस क्लब में आयोजित विशाल प्रेस कॉन्फ्रेंस में पार्टी का आधिकारिक संकल्प-पत्र जारी किया।

प्रेस वार्ता में कुलदीप शर्मा ने पाँच प्रमुख संकल्प दोहराए:
1. आरक्षण प्रणाली का पूर्ण उन्मूलन।
2. भारत को आधिकारिक हिंदू राष्ट्र घोषित करना।
3. दो बच्चों का सख्त जनसंख्या नियंत्रण कानून।
4. हर ज़िले में आधुनिक वैदिक गुरुकुल की स्थापना।
5. गौमाता को राष्ट्रमाता का दर्जा एवं गोवंश वध पर आजीवन कारावास।

पार्टी अध्यक्ष ने कहा कि आगामी चुनावों में समान अधिकार पार्टी देश भर में अपने प्रत्याशी उतारेगी और सनातन संस्कृति व सामाजिक न्याय की पुनर्स्थापना के लिए राष्ट्रव्यापी अभियान चलाएगी। संपर्क सूत्र: 9412165541, 7310732088.`
  },
  {
    id: "pr-103",
    title: "हर जिले में गुरुकुल विद्यालय स्थापना एवं गौमाता को 'राष्ट्रमाता' का दर्जा देने हेतु संकल्प पत्र जारी",
    titleEn: "Declaration of National Gurukul Mission & Rashtramata Gaumata Campaign",
    category: "National Agenda",
    date: "2026-07-10",
    location: "मथुरा, उत्तर प्रदेश",
    spokesperson: "कुलदीप शर्मा",
    isUrgent: false,
    imageUrl: gouMataImg,
    content: `मथुरा के पावन धाम से समान अधिकार पार्टी ने अपने राष्ट्रव्यापी शैक्षिक एवं सांस्कृतिक अभियान का आगाज किया। पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा ने घोषणा की कि पार्टी का प्रमुख लक्ष्य भारत के प्रत्येक 780 से अधिक जिलों में राज्य-स्तरीय अत्याधुनिक गुरुकुल परिसरों का निर्माण करना है।

इन गुरुकुलों में छात्रों को वेद-वेदांग, संस्कृत एवं योग के साथ-साथ आधुनिक एआई, रोबोटिक्स, गणित व विज्ञान की शिक्षा दी जाएगी। साथ ही गौमाता को राष्ट्रमाता घोषित कराने हेतु देश भर में 1 करोड़ हस्ताक्षरों का महा-अभियान चलाया जा रहा है।`
  }
];

export const CAMPAIGN_EVENTS: CampaignEvent[] = [
  {
    id: "evt-101",
    title: "विशाल हिंदू राष्ट्र महासम्मेलन एवं जनसभा - आगरा",
    titleHi: "विशाल हिंदू राष्ट्र महासम्मेलन एवं जनसभा - आगरा",
    type: "Rally",
    date: "2026-08-10",
    displayDate: "सोमवार, 10 अगस्त 2026",
    time: "सायं 4:00 बजे से रात्रि 8:00 बजे",
    locationName: "कोठी मीना बाज़ार मैदान",
    address: "एमजी रोड, सदर के पास",
    cityState: "आगरा, उत्तर प्रदेश",
    precinctDistrict: "आगरा मंडल",
    description: "राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी का ओजस्वी भाषण। आरक्षण उन्मूलन, जनसंख्या नियंत्रण एवं हिंदू राष्ट्र संकल्प पर विशाल जनसैलाब।",
    isVirtual: false,
    capacity: 25000,
    rsvpCount: 18450,
    featuredSpeakers: ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)", "साध्वी गीतांजलि देवी", "स्वामी देवानंद महाराज"]
  },
  {
    id: "evt-102",
    title: "मथुरा श्री कृष्ण जन्मभूमि पदयात्रा एवं धर्म सभा",
    titleHi: "मथुरा श्री कृष्ण जन्मभूमि पदयात्रा एवं धर्म सभा",
    type: "Padayatra",
    date: "2026-08-18",
    displayDate: "मंगलवार, 18 अगस्त 2026",
    time: "प्रातः 9:00 बजे से",
    locationName: "विश्राम घाट से श्री कृष्ण जन्मभूमि मार्ग",
    address: "पावन विश्राम घाट",
    cityState: "मथुरा, उत्तर प्रदेश",
    precinctDistrict: "मथुरा ज़िला",
    description: "मथुरा में भव्य पूर्ण श्री कृष्ण मन्दिर निर्माण एवं गौमाता को राष्ट्रमाता घोषित करने हेतु ऐतिहासिक पदयात्रा।",
    isVirtual: false,
    capacity: 15000,
    rsvpCount: 11200,
    featuredSpeakers: ["कुलदीप शर्मा", "स्थानीय संत समाज"]
  },
  {
    id: "evt-103",
    title: "प्रेस कॉन्फ्रेंस एवं डिजिटल संवाद: गुरुकुल शिक्षा नीति 2026",
    titleHi: "प्रेस कॉन्फ्रेंस एवं डिजिटल संवाद: गुरुकुल शिक्षा नीति 2026",
    type: "Press Conference",
    date: "2026-08-25",
    displayDate: "मंगलवार, 25 अगस्त 2026",
    time: "दोपहर 2:00 बजे - 4:00 बजे",
    locationName: "प्रेस क्लब ऑडिटोरियम एवं यूट्यूब/फेसबुक लाइव",
    address: "सदर बाजार",
    cityState: "आगरा / ऑनलाइन लाइव",
    precinctDistrict: "ऑनलाइन एवं आगरा HQ",
    description: "प्रत्येक ज़िले में गुरुकुल विद्यालय योजना की विस्तृत रूपरेखा एवं पत्रकारों के प्रश्नों के सीधे उत्तर।",
    isVirtual: true,
    virtualLink: "https://samanadhikarparty.org/live-press",
    capacity: 50000,
    rsvpCount: 34200,
    featuredSpeakers: ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)", "डॉ. अशोक शास्त्री (शिक्षाविद)"]
  }
];

export const PRECINCTS_LIST = [
  "आगरा सदर एवं ग्रामीण",
  "मथुरा एवं वृंदावन धाम",
  "अलीगढ़ एवं हाथरस क्षेत्र",
  "कानपुर नगर एवं देहात",
  "मेरठ एवं पश्चिमांचल",
  "लखनऊ एवं मध्य उत्तर प्रदेश",
  "वाराणसी एवं पूर्वांचल",
  "दिल्ली NCR एवं हरियाणा मंडल"
];

export const DONATION_PRESETS = [
  { amount: 101, label: "₹101", impact: "100 प्रचार पत्रक एवं संकल्प साहित्य का वितरण" },
  { amount: 501, label: "₹501", impact: "10 गाँव में बैनर व पोस्टर अभियान हेतु सहयोग" },
  { amount: 1100, label: "₹1,100", impact: "1 गौशाला हेतु चारा एवं चिकित्सा सामग्री" },
  { amount: 2100, label: "₹2,100", impact: "गुरुकुल छात्र की 1 माह की पठन-पाठन सामग्री" },
  { amount: 5100, label: "₹5,100", impact: "ज़िला पदयात्रा एवं लाउडस्पीकर प्रचार रथ सहयोग" },
  { amount: 11000, label: "₹11,000", impact: "प्रेस कॉन्फ्रेंस एवं प्रांतीय संवाद सम्मेलन प्रायोजन" }
];

export const VOLUNTEER_INTERESTS = [
  "सोशल मीडिया व डिजिटल प्रचार (Social Media)",
  "घर-घर जनसंपर्क एवं पर्चा वितरण (Door-to-door)",
  "पदयात्रा एवं रैली व्यवस्था (Rally Support)",
  "गौ-सेवा एवं गौशाला अभियान (Gaushala Service)",
  "गुरुकुल प्रचार व विद्यार्थी संपर्क (Gurukul Mission)",
  "कानूनी व प्रशासनिक मीडिया टीम (Legal & Media)"
];
