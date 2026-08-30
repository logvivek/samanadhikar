import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

export const SYSTEM_INSTRUCTION = `You are "Saman Adhikar Party AI Assistant" (समान अधिकार पार्टी एआई सहायक), the official AI spokesperson for Saman Adhikar Party (समान अधिकार पार्टी).
National President: Kuldeep Sharma (राष्ट्रीय अध्यक्ष: कुलदीप शर्मा जी).
Helpline / Contact numbers: 9412165541, 7310732088.
Slogans: "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा", "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!"

Core 5 Agendas & Ideology:
1. Abolish Reservation System (आरक्षण प्रणाली पूरी तरह खत्म कर केवल योग्यता व आर्थिक आवश्यकता के आधार पर अधिकार)
2. Declare India a Hindu Rashtra (भारत को संवैधानिक हिंदू राष्ट्र घोषित करना व सनातन धर्म का संरक्षण)
3. Implement Population Control Law (देशहित में सभी नागरिकों हेतु 'दो बच्चे' का कड़ा जनसंख्या नियंत्रण कानून)
4. Establish Gurukul Schools in Every District (भारत के 780+ जिलों में अत्याधुनिक गुरुकुल स्कूल खोलना - वैदिक + आधुनिक विज्ञान/AI)
5. Declare Gaumata as Rashtramata (गौमाता को राष्ट्रमाता घोषित करना, संपूर्ण गौ हत्या पर आजीवन कारावास)
6. Grand Mathura Shri Krishna Temple (मथुरा में भगवान श्री कृष्ण की जन्मभूमि पर भव्य मंदिर निर्माण)

Bank Details for Donations:
State Bank of India (SBI), Sadar Bazar Agra, A/C: 34465318239, IFSC: SBIN0002467, UPI: samanadhikarparty@sbi

Personality & Tone: Courteous, patriotic, firm, inspiring, clear, articulate, respectful.
Respond primarily in Hindi in a friendly and informative manner. Use clear bullet points and bold headers where appropriate.`;

export async function generateChatReply(message: string, history?: any[]): Promise<string> {
  const cleanMessage = message.trim();
  const ai = getGeminiClient();

  if (ai) {
    try {
      const contentsList: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.text) {
            contentsList.push({
              role: item.sender === "user" ? "user" : "model",
              parts: [{ text: String(item.text) }]
            });
          }
        }
      }

      contentsList.push({
        role: "user",
        parts: [{ text: cleanMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contentsList,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7
        }
      });

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (geminiErr) {
      console.warn("Gemini API call failed or unauthenticated, switching to Knowledge Engine:", geminiErr);
    }
  }

  // Intelligent Knowledge Engine Fallback
  const msgLower = cleanMessage.toLowerCase();
  if (msgLower.includes("आरक्षण") || msgLower.includes("reservation") || msgLower.includes("sc") || msgLower.includes("st") || msgLower.includes("obc") || msgLower.includes("कोटा")) {
    return `**समान अधिकार पार्टी का आरक्षण नीति पर स्पष्ट रुख:**

1. **जातिगत आरक्षण का पूर्ण समापन**: हमारी पार्टी का दृढ़ विश्वास है कि भारत में जाति के आधार पर दिया जाने वाला आरक्षण समाज में असमानता और वैमनस्य को बढ़ावा देता है।
2. **योग्यता व प्रतिभा का सम्मान**: देश के मेधावी और योग्य युवाओं को अवसर न मिलने से राष्ट्र प्रतिभा पलायन की समस्या झेल रहा है।
3. **आर्थिक आधार पर सहयोग**: आरक्षण समाप्त कर केवल आर्थिक रूप से कमजोर और वास्तव में जरूरतमंद परिवारों को शिक्षा व चिकित्सा में प्रत्यक्ष वित्तीय सहायता दी जाएगी।

"योग्यता को मिले सम्मान, बंद हो जाति का विभाजन - यही है समान अधिकार पार्टी का पैगाम!"`;
  }

  if (msgLower.includes("हिंदू राष्ट्र") || msgLower.includes("hindu rashtra") || msgLower.includes("सनातन") || msgLower.includes("धर्म") || msgLower.includes("संस्कृति")) {
    return `**भारत को हिंदू राष्ट्र घोषित करने हेतु संकल्प:**

राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** के नेतृत्व में समान अधिकार पार्टी भारत को संवैधानिक रूप से **'हिंदू राष्ट्र'** घोषित करने हेतु कृतसंकल्पित है।

• **प्राचीन संस्कृति का पुनरुद्धार**: भारत की 5,000 वर्ष पुरानी सनातन परंपरा और सांस्कृतिक मूल्यों को संवैधानिक संरक्षण देना।
• **धार्मिक स्थलों की स्वतंत्रता**: भारत के सभी मठ-मंदिरों को सरकारी नियंत्रण से मुक्त कर संत समाज और भक्तों को सौंपना।
• **सांस्कृतिक स्वाभिमान**: "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा" के मूल मंत्र के साथ देश के हर नागरिक को राष्ट्र प्रथम की भावना से जोड़ना।`;
  }

  if (msgLower.includes("गुरुकुल") || msgLower.includes("gurukul") || msgLower.includes("शिक्षा") || msgLower.includes("स्कूल") || msgLower.includes("education")) {
    return `**हर ज़िले में अत्याधुनिक गुरुकुल खोलने की योजना:**

समान अधिकार पार्टी भारत के सभी **780+ जिलों** में राज्य स्तरीय विश्वस्तरीय 'गुरुकुल' स्थापित करेगी:

• **वैदिक व आधुनिक शिक्षा का संगम**: छात्रों को वेद, उपनिषद, संस्कृत व योग के साथ-साथ आर्टिफिशियल इंटेलिजेंस (AI), रोबोटिक्स, कोडिंग, आधुनिक गणित और विज्ञान की शिक्षा।
• **चरित्र निर्माण व चरित्र शिक्षण**: युवाओं में देशप्रेम, नैतिक मूल्य, सैन्य प्रशिक्षण व स्वावलंबन का संचार।
• **निःशुल्क व्यवस्था**: योग्य और मेधावी छात्र-छात्राओं हेतु आधुनिक छात्रावास व गुरुकुल शिक्षा पूर्णतः समर्पित रहेगी।`;
  }

  if (msgLower.includes("गौमाता") || msgLower.includes("gaumata") || msgLower.includes("गौ हत्या") || msgLower.includes("गाय") || msgLower.includes("cow") || msgLower.includes("राष्ट्रमाता")) {
    return `**गौमाता को राष्ट्रमाता का दर्जा व गोवंश संरक्षण:**

1. **राष्ट्रमाता का दर्जा**: पवित्र गौमाता को भारत की 'राष्ट्रमाता' घोषित करने हेतु पार्टी द्वारा 1 करोड़ हस्ताक्षर अभियान चलाया जा रहा है।
2. **गौ हत्या पर आजीवन कारावास**: देश भर में गौ हत्या, गौ तस्करी पर पूर्ण प्रतिबंध और दोषियों के खिलाफ आजीवन कारावास का कड़ा कानून।
3. **आधुनिक गोशालाएं**: प्रत्येक ग्राम पंचायत में वैज्ञानिक आधार पर आत्मनिर्भर गोशालाओं का निर्माण जहां पंचगव्य और प्राकृतिक कृषि को बढ़ावा दिया जाएगा।`;
  }

  if (msgLower.includes("जनसंख्या") || msgLower.includes("population") || msgLower.includes("2 child") || msgLower.includes("दो बच्चे")) {
    return `**जनसंख्या नियंत्रण कानून लागू करने का संकल्प:**

देश में सीमित संसाधनों पर अत्यधिक जनसंख्या के दबाव को नियंत्रित करने के लिए समान अधिकार पार्टी कठोर **'दो बच्चे' का जनसंख्या नियंत्रण कानून** लागू करेगी:

• **समान रूप से लागू**: यह कानून पंथ, मजहब या वर्ग से परे भारत के हर नागरिक पर अनिवार्य रूप से लागू होगा।
• **सरकारी सुविधाओं से संबद्धता**: कानून का उल्लंघन करने वालों को सरकारी नौकरियों, सब्सिडी व चुनाव लड़ने से वंचित करने का कठोर प्रावधान।`;
  }

  if (msgLower.includes("अध्यक्ष") || msgLower.includes("कुलदीप") || msgLower.includes("नेता") || msgLower.includes("leader") || msgLower.includes("sharma")) {
    return `**समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष:**

समान अधिकार पार्टी के संस्थापक व राष्ट्रीय अध्यक्ष **श्रद्धेय कुलदीप शर्मा जी** हैं।

• **संपर्क हेल्पलाइन**: 9412165541, 7310732088
• **मुख्यालय**: समान अधिकार पार्टी केंद्रीय कार्यालय, आगरा-मथुरा मण्डल, उत्तर प्रदेश।
• **संदेश**: "आरक्षण मुक्त, समर्थ, समृद्ध और हिंदू राष्ट्र भारत के निर्माण हेतु समाज के सभी वर्गों का एक मंच पर आना आवश्यक है।"`;
  }

  if (msgLower.includes("दान") || msgLower.includes("सहयोग") || msgLower.includes("donation") || msgLower.includes("donate") || msgLower.includes("बैंक") || msgLower.includes("upi")) {
    return `**समान अधिकार पार्टी को आर्थिक सहयोग (Donation) प्रदान करें:**

आपकी छोटी से छोटी सहायता भी देश में आरक्षण खात्मा व हिंदू राष्ट्र निर्माण की क्रांति को गति देगी।

• **बैंक का नाम**: भारतीय स्टेट बैंक (State Bank of India)
• **शाखा**: सदर बाजार, आगरा (उत्तर प्रदेश)
• **खाता संख्या (A/C No.)**: 34465318239
• **IFSC कोड**: SBIN0002467
• **UPI ID**: samanadhikarparty@sbi

*(दान करने के पश्चात आपको तुरंत डिजिटल रसीद एवं धन्यवाद पत्र प्राप्त होगा।)*`;
  }

  if (msgLower.includes("सदस्यता") || msgLower.includes("join") || msgLower.includes("सदस्य") || msgLower.includes("member") || msgLower.includes("शामिल")) {
    return `**समान अधिकार पार्टी की सदस्यता कैसे लें?**

आप समान अधिकार पार्टी के राष्ट्रव्यापी अभियान में मुख्य 3 तरीकों से जुड़ सकते हैं:

1. **ऑनलाइन फॉर्म**: वेबसाइट के 'सदस्यता' (Membership) बटन पर क्लिक कर अपना नाम, मोबाइल नंबर व जिला दर्ज करें।
2. **हेल्पलाइन कॉल**: हमारे राष्ट्रीय कार्यालय नंबर **9412165541 / 7310732088** पर सीधे कॉल/व्हाट्सएप करें।
3. **स्थानीय जिला इकाई**: अपने जिले के पार्टी संयोजकों से मिलकर सदस्यता रसीद प्राप्त करें।

"आओ मिलकर बनाएं - समान अधिकार से युक्त, समर्थ भारत!"`;
  }

  return `जय श्री राम! समान अधिकार पार्टी (Saman Adhikar Party) में आपका स्वागत है।

राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088)।

मुख्य 5 संकल्प:
1. जातिगत आरक्षण समाप्त कर केवल योग्यता व आर्थिक स्थिति को प्राथमिकता।
2. भारत को संवैधानिक हिंदू राष्ट्र घोषित करना।
3. सभी नागरिकों हेतु दो बच्चे का जनसंख्या नियंत्रण कानून।
4. हर जिले में अत्याधुनिक गुरुकुल स्कूल स्थापित करना।
5. गौमाता को राष्ट्रमाता घोषित करना व गौ हत्या पर कठोर दंड।`;
}
