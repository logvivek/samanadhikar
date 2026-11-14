export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  return res.status(200).json({
    success: true,
    partyInfo: {
      name: "समान अधिकार पार्टी",
      nameEnglish: "Saman Adhikar Party",
      leaderName: "कुलदीप शर्मा (Kuldeep Sharma)",
      leaderRole: "राष्ट्रीय अध्यक्ष (National President)",
      motto: "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!",
      mottoEnglish: "Bring Equal Rights, Build a Supreme India!",
      contactPhone1: "9412165541",
      contactPhone2: "7310732088",
      headquarters: "सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश, भारत",
      panNumber: "AAOAS8885L"
    }
  });
}
