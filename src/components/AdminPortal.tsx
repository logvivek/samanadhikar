import React, { useState, useEffect } from "react";
import { loginAdmin, verifyAdminToken } from "../utils/adminAuth";
import {
  ShieldCheck,
  Lock,
  Settings,
  Edit3,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  FileText,
  Users,
  Heart,
  Calendar,
  CreditCard,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Eye,
  LogOut,
  Megaphone,
  Globe,
  Clock
} from "lucide-react";
import { PressRelease } from "../types";

interface AdminPortalProps {
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onRefreshData,
  onNavigateToTab
}) => {
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>("");

  // Admin Active Sub-Tab
  const [activeAdminTab, setActiveAdminTab] = useState<"branding" | "press" | "events" | "members" | "donations" | "settings">("branding");

  // Status notification
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Editable Party Info
  const [partyInfo, setPartyInfo] = useState<any>({
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
      upiId: "samanadhikarparty@sbi",
      accountHolder: "SAMAN ADHIKAR PARTY"
    },
    shortBio: "समान अधिकार पार्टी का मुख्य उद्देश्य भारत में सभी नागरिकों के लिए समान अधिकार स्थापित करना, जातिगत भेदभाव उत्पन्न करने वाली आरक्षण व्यवस्था का अंत करना, भारत को आधिकारिक रूप से 'हिंदू राष्ट्र' घोषित कराना, जनसंख्या नियंत्रण कानून लागू करना, प्रत्येक जिले में वैदिक गुरुकुलों की स्थापना करना तथा गौमाता को राष्ट्रमाता का दर्जा दिलाना है।",
    coreAgendasList: [
      "आरक्षण प्रणाली खत्म करें (Abolish Reservation System)",
      "भारत को हिंदू राष्ट्र घोषित करें (Declare India a Hindu Rashtra)",
      "जनसंख्या नियंतरण कानून लागू हो (Implement Population Control Law)",
      "भारत के हर ज़िले में गुरुकुल स्कूल खोलना (Open Gurukul Schools in Every District)",
      "गौमाता को राष्ट्रमाता घोषित करना (Declare Gaumata as Rashtramata)"
    ]
  });

  // Data lists
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalRaised, setTotalRaised] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // New Press Release Form State
  const [newPrTitle, setNewPrTitle] = useState("");
  const [newPrTitleEn, setNewPrTitleEn] = useState("");
  const [newPrCategory, setNewPrCategory] = useState("Press Briefing");
  const [newPrDate, setNewPrDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPrLocation, setNewPrLocation] = useState("आगरा कलेक्ट्रेट, उत्तर प्रदेश");
  const [newPrSpokesperson, setNewPrSpokesperson] = useState("कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)");
  const [newPrImageUrl, setNewPrImageUrl] = useState("");
  const [newPrVideoUrl, setNewPrVideoUrl] = useState("");
  const [newPrContent, setNewPrContent] = useState("");
  const [newPrIsUrgent, setNewPrIsUrgent] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<"Karyakram" | "Rally">("Karyakram");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventTime, setNewEventTime] = useState("सायं 4:00 बजे से");
  const [timePickerValue, setTimePickerValue] = useState("16:00");
  const [newEventLocation, setNewEventLocation] = useState("कोठी मीना बाज़ार मैदान, आगरा");
  const [newEventSpeakers, setNewEventSpeakers] = useState("कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)");
  const [newEventDescription, setNewEventDescription] = useState("");

  const formatTimeToHindi = (time24: string) => {
    if (!time24) return "";
    const parts = time24.split(":");
    if (parts.length < 2) return time24;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h)) return time24;

    let period = "प्रातः";
    let displayHour = h;

    if (h === 0) {
      period = "रात्रि";
      displayHour = 12;
    } else if (h < 12) {
      period = "प्रातः";
      displayHour = h;
    } else if (h === 12) {
      period = "दोपहर";
      displayHour = 12;
    } else if (h < 17) {
      period = "दोपहर";
      displayHour = h - 12;
    } else if (h < 20) {
      period = "सायं";
      displayHour = h - 12;
    } else {
      period = "रात्रि";
      displayHour = h - 12;
    }

    const minutePart = m > 0 ? `:${m < 10 ? "0" + m : m}` : ":00";
    return `${period} ${displayHour}${minutePart} बजे से`;
  };

  const handleTimePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTimePickerValue(val);
    if (val) {
      setNewEventTime(formatTimeToHindi(val));
    }
  };

  // New Agenda Item input
  const [newAgendaInput, setNewAgendaInput] = useState("");

  // Member search input
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Admin Credentials Change State
  const [adminUsername, setAdminUsername] = useState<string>("admin");
  const [changeCurrentPass, setChangeCurrentPass] = useState<string>("");
  const [changeNewUser, setChangeNewUser] = useState<string>("admin");
  const [changeNewPass, setChangeNewPass] = useState<string>("");
  const [changeConfirmPass, setChangeConfirmPass] = useState<string>("");
  const [isChangingCreds, setIsChangingCreds] = useState<boolean>(false);

  useEffect(() => {
    // Check saved token in localStorage
    const savedToken = localStorage.getItem("sap_admin_token");
    if (savedToken) {
      verifyToken(savedToken);
    }
    fetchPartyInfo();
    fetchAllData();
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const isValid = await verifyAdminToken(token);
      if (isValid) {
        setIsAdminLoggedIn(true);
        setAdminToken(token);
      } else {
        localStorage.removeItem("sap_admin_token");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartyInfo = async () => {
    try {
      const res = await fetch("/api/party-info");
      const data = await res.json();
      if (data.success && data.partyInfo) {
        setPartyInfo(data.partyInfo);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      const currentToken = adminToken || localStorage.getItem("sap_admin_token") || "";
      const headers: Record<string, string> = currentToken ? { "X-Admin-Token": currentToken } : {};

      const [prRes, memRes, donRes, evtRes] = await Promise.all([
        fetch("/api/press-releases"),
        fetch("/api/members", { headers }),
        fetch("/api/donations", { headers }),
        fetch("/api/events")
      ]);

      const prData = await prRes.json();
      if (prData.pressReleases) setPressReleases(prData.pressReleases);

      const memData = await memRes.json();
      if (memData.members) setMembers(memData.members);

      const donData = await donRes.json();
      if (donData.recentDonations) {
        setDonations(donData.recentDonations);
        setTotalRaised(donData.totalRaised || 0);
      }

      const evtData = await evtRes.json();
      if (evtData.events) setEvents(evtData.events);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const data = await loginAdmin(usernameInput, passwordInput);

      if (data.success && data.token) {
        setIsAdminLoggedIn(true);
        setAdminToken(data.token);
        localStorage.setItem("sap_admin_token", data.token);
        if (data.username) {
          setAdminUsername(data.username);
          setChangeNewUser(data.username);
        }
        showNotification("एडमिन लॉगिन सफल!", "success");
      } else {
        setAuthError(data.error || "लॉगिन विफल। कृपया सही यूज़रनेम व पासवर्ड दर्ज करें।");
      }
    } catch (err: any) {
      setAuthError("लॉगिन विफल। कृपया सही यूज़रनेम व पासवर्ड दर्ज करें।");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangeAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeCurrentPass || !changeNewUser || !changeNewPass) {
      showNotification("कृपया सभी फ़ील्ड्स भरें।", "error");
      return;
    }

    if (changeNewPass !== changeConfirmPass) {
      showNotification("नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।", "error");
      return;
    }

    setIsChangingCreds(true);
    try {
      // Save locally for static/offline compatibility
      localStorage.setItem("sap_custom_admin_creds", JSON.stringify({
        username: changeNewUser.trim(),
        password: changeNewPass.trim()
      }));

      const res = await fetch("/api/admin/change-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify({
          currentPassword: changeCurrentPass,
          newUsername: changeNewUser,
          newPassword: changeNewPass
        })
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setAdminUsername(data.username || changeNewUser);
        }
      }

      setAdminUsername(changeNewUser.trim());
      setChangeCurrentPass("");
      setChangeNewPass("");
      setChangeConfirmPass("");
      showNotification("एडमिन यूज़रनेम एवं पासवर्ड सफलतापूर्वक अपडेट हो गए!", "success");
    } catch (err) {
      showNotification("एडमिन यूज़रनेम एवं पासवर्ड (स्थानीय स्टोरेज) में अपडेट हो गए!", "success");
    } finally {
      setIsChangingCreds(false);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminToken("");
    localStorage.removeItem("sap_admin_token");
    showNotification("आप एडमिन पोर्टल से बाहर आ गए हैं।", "success");
  };

  const showNotification = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4000);
  };

  // Save Party Info Update
  const handleSavePartyInfo = async () => {
    try {
      const res = await fetch("/api/party-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify(partyInfo)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("पार्टी ब्रैंडिंग व जानकारी सफलतापूर्वक अपडेट हो गई!", "success");
        if (onRefreshData) onRefreshData();
      } else {
        showNotification(data.error || "अपडेट विफल हो गया।", "error");
      }
    } catch (err) {
      showNotification("पार्टी जानकारी सेव करने में त्रुटि।", "error");
    }
  };

  // Agenda list management
  const handleAddAgenda = () => {
    if (!newAgendaInput.trim()) return;
    setPartyInfo({
      ...partyInfo,
      coreAgendasList: [...(partyInfo.coreAgendasList || []), newAgendaInput.trim()]
    });
    setNewAgendaInput("");
  };

  const handleRemoveAgenda = (index: number) => {
    const updated = [...(partyInfo.coreAgendasList || [])];
    updated.splice(index, 1);
    setPartyInfo({ ...partyInfo, coreAgendasList: updated });
  };

  // Handle Create Press Release
  const handleCreatePressRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrTitle || !newPrContent) {
      showNotification("कृपया शीर्षक और सामग्री दर्ज करें।", "error");
      return;
    }

    try {
      const res = await fetch("/api/press-releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify({
          title: newPrTitle,
          titleEn: newPrTitleEn,
          category: newPrCategory,
          date: newPrDate,
          location: newPrLocation,
          spokesperson: newPrSpokesperson,
          imageUrl: newPrImageUrl,
          videoUrl: newPrVideoUrl,
          content: newPrContent,
          isUrgent: newPrIsUrgent
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification("नई प्रेस विज्ञप्ति प्रकाशित कर दी गई!", "success");
        setNewPrTitle("");
        setNewPrTitleEn("");
        setNewPrContent("");
        setNewPrImageUrl("");
        setNewPrVideoUrl("");
        fetchAllData();
        if (onRefreshData) onRefreshData();
      } else {
        showNotification(data.error || "प्रकाशन में विफल।", "error");
      }
    } catch (err) {
      showNotification("प्रेस विज्ञप्ति अपलोड करने में त्रुटि।", "error");
    }
  };

  // Handle Delete Press Release
  const handleDeletePressRelease = async (id: string) => {
    if (!window.confirm("क्या आप इस प्रेस विज्ञप्ति को हटाना चाहते हैं?")) return;

    try {
      const res = await fetch(`/api/press-releases/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("प्रेस विज्ञप्ति हटा दी गई।", "success");
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showNotification("हटाने में त्रुटि।", "error");
    }
  };

  // Handle Add Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventLocation) {
      showNotification("कृपया कार्यक्रम/रैली शीर्षक एवं स्थान भरें।", "error");
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify({
          title: newEventTitle,
          titleHi: newEventTitle,
          type: newEventCategory,
          category: newEventCategory,
          date: newEventDate,
          displayDate: new Date(newEventDate).toLocaleDateString("hi-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          }),
          time: newEventTime,
          locationName: newEventLocation,
          address: newEventLocation,
          cityState: "उत्तर प्रदेश",
          description: newEventDescription || "समान अधिकार पार्टी का विशाल जन-समारोह।",
          featuredSpeakers: newEventSpeakers.split(",").map(s => s.trim()).filter(Boolean)
        })
      });

      // Also publish to Press Release under Karyakram or Rally category so it appears in Press Releases section
      await fetch("/api/press-releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify({
          title: newEventTitle,
          category: newEventCategory,
          date: newEventDate,
          location: newEventLocation,
          spokesperson: newEventSpeakers || "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
          content: `${newEventTitle} - दिनांक: ${newEventDate}, समय: ${newEventTime}, स्थान: ${newEventLocation}। ${newEventDescription || 'समान अधिकार पार्टी का विशाल आयोजन।'}`,
          isUrgent: true
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`नया ${newEventCategory === "Rally" ? "रैली" : "कार्यक्रम"} सफलतापूर्वक जोड़ा व प्रेस विज्ञप्ति अनुभाग में प्रकाशित हुआ!`, "success");
        setNewEventTitle("");
        setNewEventDescription("");
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showNotification("कार्यक्रम जोड़ने में त्रुटि।", "error");
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("क्या आप इस कार्यक्रम को हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("कार्यक्रम हटा दिया गया।", "success");
        fetchAllData();
      }
    } catch (err) {
      showNotification("कार्यक्रम हटाने में त्रुटि।", "error");
    }
  };

  // Handle Reset to Default Data
  const handleResetData = async () => {
    if (!window.confirm("क्या आप पार्टी का पूरा डेटा डिफ़ॉल्ट मूल स्थिति में रीसेट करना चाहते हैं?")) return;
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("समस्त डेटा रीसेट कर दिया गया!", "success");
        fetchPartyInfo();
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showNotification("रीसेट में त्रुटि।", "error");
    }
  };

  // Export Members CSV
  const handleExportMembersCSV = () => {
    if (members.length === 0) return;
    const headers = ["ID,Full Name,Phone,Email,District,Membership Tier,Joined Date\n"];
    const rows = members.map(m => `"${m.id}","${m.fullName}","${m.phone}","${m.email}","${m.precinct}","${m.membershipTier}","${m.joinedDate}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAP_Members_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Filter members
  const filteredMembers = members.filter(m =>
    m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.phone?.includes(memberSearchQuery) ||
    m.precinct?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // LOGIN SCREEN (Separate Standalone Page)
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-slate-800">
        
        {/* Top Back-to-Website Button */}
        {onNavigateToTab && (
          <div className="mb-6">
            <button
              onClick={() => onNavigateToTab("platform")}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-orange-200 text-xs font-bold border border-orange-500/30 shadow-md transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-400" />
              <span>← मुख्य वेबसाइट पर वापस जाएं (Back to Website)</span>
            </button>
          </div>
        )}

        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border-2 border-orange-200 text-slate-800 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider mb-2">
              प्रशासन प्रवेश द्वार (Admin Access Portal)
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-300 text-orange-950 text-xs font-black mb-3 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>पंजीकरण संख्या: 56/158/2024-ECI</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              समान अधिकार पार्टी - एडमिन लॉगिन
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-1">
              वेबसाइट डेटाबेस (Lite DB) अनुकूलन एवं सुरक्षित नियंत्रण केंद्र
            </p>
          </div>


          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                एडमिन यूज़रनेम (Username) *
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-bold bg-slate-50 focus:bg-white"
                placeholder="यूज़रनेम दर्ज करें"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                एडमिन पासवर्ड (Password) *
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-bold bg-slate-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>सत्यापित हो रहा है...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>प्रशासन पोर्टल में लॉगिन करें</span>
                </>
              )}
            </button>
          </form>

          {onNavigateToTab && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigateToTab("platform")}
                className="text-xs font-bold text-orange-600 hover:text-orange-800 underline cursor-pointer"
              >
                मुख्य सार्वजनिक वेबसाइट देखें (View Main Website)
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              समान अधिकार पार्टी आईटी सेल • आगरा / मथुरा केंद्रीय कार्यालय
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED-IN ADMIN DASHBOARD
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-8">
      {/* Admin Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-orange-500/20">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>एडमिन एक्सेस सक्रिय (Live Admin Active)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            वेबसाइट कस्टमर पोर्टल & पार्टी कंट्रोल पैनल
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
            पार्टी के नारे, संकल्प, बैंक विवरण, प्रेस विज्ञप्तियां, कार्यक्रम सूची एवं सदस्यता रिकॉर्ड्स को लाइव अनुकूलित व अपडेट करें।
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 shrink-0">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("platform")}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-white" />
              <span>वेबसाइट देखें</span>
            </button>
          )}

          <button
            onClick={fetchAllData}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-fade-in ${
            statusMsg.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex items-center overflow-x-auto space-x-2 pb-2 scrollbar-none border-b border-orange-200">
        <button
          onClick={() => setActiveAdminTab("branding")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "branding"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>1. ब्रैंडिंग व जानकारी (Branding & Info)</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("press")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "press"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. प्रेस विज्ञप्ति ({pressReleases.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("events")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "events"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>3. कार्यक्रम एवं रैली ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("members")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "members"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. कार्यकर्ता सूची ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("donations")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "donations"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>5. दान व UTR रिकॉर्ड्स</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("settings")}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === "settings"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>6. रीसेट एवं सिस्टम</span>
        </button>
      </div>

      {/* TAB 1: BRANDING & PARTY INFO */}
      {activeAdminTab === "branding" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                <Globe className="w-6 h-6 text-orange-600" />
                <span>पार्टी की मुख्य जानकारी एवं ब्रैंडिंग कस्टम-एडिट</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                यहाँ किए गए बदलाव पूरी वेबसाइट के हेडर, फुटर, संकल्प पृष्ठ एवं एआई असिस्टेंट में तुरंत दिखाई देंगे।
              </p>
            </div>

            <button
              onClick={handleSavePartyInfo}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>परिवर्तन सेव करें</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Party Names */}
            <div className="space-y-4 bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
              <h3 className="text-sm font-black text-orange-950 flex items-center space-x-2">
                <Building className="w-4 h-4 text-orange-600" />
                <span>पार्टी नाम एवं राष्ट्रीय अध्यक्ष</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पार्टी नाम (हिन्दी)
                </label>
                <input
                  type="text"
                  value={partyInfo.name || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Party Name (English)
                </label>
                <input
                  type="text"
                  value={partyInfo.nameEnglish || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, nameEnglish: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  राष्ट्रीय अध्यक्ष का नाम
                </label>
                <input
                  type="text"
                  value={partyInfo.leaderName || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, leaderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पद / पदनाम (Designation)
                </label>
                <input
                  type="text"
                  value={partyInfo.leaderRole || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, leaderRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>
            </div>

            {/* Slogans & Motto */}
            <div className="space-y-4 bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
              <h3 className="text-sm font-black text-orange-950 flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-orange-600" />
                <span>मुख्य नारे एवं ध्येय वाक्य</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मुख्य ओजस्वी नारा (Primary Slogan)
                </label>
                <input
                  type="text"
                  value={partyInfo.primarySlogan || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, primarySlogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  द्वितीय नारा (Secondary Slogan)
                </label>
                <input
                  type="text"
                  value={partyInfo.secondarySlogan || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, secondarySlogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ध्येय वाक्य (Motto)
                </label>
                <input
                  type="text"
                  value={partyInfo.motto || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, motto: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motto (English)
                </label>
                <input
                  type="text"
                  value={partyInfo.mottoEnglish || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, mottoEnglish: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Contact & Headquarters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>संपर्क नंबर 1</span>
              </label>
              <input
                type="text"
                value={partyInfo.contactPhone1 || ""}
                onChange={(e) => setPartyInfo({ ...partyInfo, contactPhone1: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>संपर्क नंबर 2</span>
              </label>
              <input
                type="text"
                value={partyInfo.contactPhone2 || ""}
                onChange={(e) => setPartyInfo({ ...partyInfo, contactPhone2: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-orange-600" />
                <span>राष्ट्रीय मुख्यालय (Headquarters)</span>
              </label>
              <input
                type="text"
                value={partyInfo.headquarters || ""}
                onChange={(e) => setPartyInfo({ ...partyInfo, headquarters: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs font-bold bg-slate-50"
              />
            </div>
          </div>

          {/* Bank Account Customization */}
          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 space-y-4">
            <h3 className="text-sm font-black text-amber-950 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-amber-700" />
              <span>दान एवं चंदा प्राप्त करने हेतु आधिकारिक बैंक खाता विवरण (SBI Bank Details)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  खाताधारक (Account Holder)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.accountHolder || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, accountHolder: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  बैंक नाम (Bank Name)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.bankName || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, bankName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  शाखा (Branch)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.branch || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, branch: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  खाता संख्या (Account Number)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.accountNo || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, accountNo: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  आईएफएससी कोड (IFSC Code)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.ifscCode || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, ifscCode: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-bold bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  UPI ID (PhonePe / GPay)
                </label>
                <input
                  type="text"
                  value={partyInfo.bankDetails?.upiId || ""}
                  onChange={(e) =>
                    setPartyInfo({
                      ...partyInfo,
                      bankDetails: { ...partyInfo.bankDetails, upiId: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Manage Core Agendas */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <span>पार्टी के मुख्य 5 संकल्प (Core Agendas List)</span>
            </h3>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newAgendaInput}
                onChange={(e) => setNewAgendaInput(e.target.value)}
                placeholder="नया संकल्प दर्ज करें..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />
              <button
                onClick={handleAddAgenda}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>जोड़ें</span>
              </button>
            </div>

            <div className="space-y-2">
              {(partyInfo.coreAgendasList || []).map((agenda: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{agenda}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAgenda(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSavePartyInfo}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-xl shadow-orange-500/30 transition-all cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>पार्टी जानकारी सेव करें</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PRESS RELEASES MANAGEMENT */}
      {activeAdminTab === "press" && (
        <div className="space-y-8">
          {/* Create New Press Release Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Plus className="w-6 h-6 text-orange-600" />
              <span>नई प्रेस विज्ञप्ति एवं समाचार प्रकाशित करें</span>
            </h2>

            <form onSubmit={handleCreatePressRelease} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शीर्षक (Title in Hindi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPrTitle}
                    onChange={(e) => setNewPrTitle(e.target.value)}
                    placeholder="उदा. आगरा कलेक्ट्रेट में महामहिम राष्ट्रपति महोदया के नाम ज्ञापन सौंपते कुलदीप शर्मा..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title in English
                  </label>
                  <input
                    type="text"
                    value={newPrTitleEn}
                    onChange={(e) => setNewPrTitleEn(e.target.value)}
                    placeholder="English title..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    श्रेणी (Category)
                  </label>
                  <select
                    value={newPrCategory}
                    onChange={(e) => setNewPrCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="Karyakram">🚩 कार्यक्रम (Karyakram)</option>
                    <option value="Rally">📣 रैली (Rally)</option>
                    <option value="Press Briefing">प्रेस ब्रीफिंग (Press Briefing)</option>
                    <option value="Demonstration">प्रदर्शन व धरना (Demonstration)</option>
                    <option value="Public Announcement">सार्वजनिक घोषणा (Public Announcement)</option>
                    <option value="National Agenda">राष्ट्रीय एजेंडा (National Agenda)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    तारीख (Date)
                  </label>
                  <input
                    type="date"
                    value={newPrDate}
                    onChange={(e) => setNewPrDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    स्थान (Location)
                  </label>
                  <input
                    type="text"
                    value={newPrLocation}
                    onChange={(e) => setNewPrLocation(e.target.value)}
                    placeholder="आगरा कलेक्ट्रेट / नई दिल्ली"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    प्रवक्ता / नेतृत्वकर्ता (Spokesperson)
                  </label>
                  <input
                    type="text"
                    value={newPrSpokesperson}
                    onChange={(e) => setNewPrSpokesperson(e.target.value)}
                    placeholder="कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मुख्य फोटो URL (Image URL)
                  </label>
                  <input
                    type="text"
                    value={newPrImageUrl}
                    onChange={(e) => setNewPrImageUrl(e.target.value)}
                    placeholder="/images/press_briefing.jpg या https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    प्रेस बाइट वीडियो URL (Video URL)
                  </label>
                  <input
                    type="text"
                    value={newPrVideoUrl}
                    onChange={(e) => setNewPrVideoUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/... या YouTube URL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  विस्तृत प्रेस विवरण (Detailed Content) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={newPrContent}
                  onChange={(e) => setNewPrContent(e.target.value)}
                  placeholder="प्रेस वक्तव्य एवं प्रमुख बिंदु यहाँ दर्ज करें..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={newPrIsUrgent}
                  onChange={(e) => setNewPrIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <label htmlFor="urgentCheck" className="text-xs font-bold text-red-600">
                  अति आवश्यक / ताज़ा खबर (Breaking Urgent Badge)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                प्रेस विज्ञप्ति तुरंत प्रकाशित करें
              </button>
            </form>
          </div>

          {/* Published Press Releases List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              प्रकाशित प्रेस विज्ञप्तियां ({pressReleases.length})
            </h3>

            <div className="space-y-3">
              {[...pressReleases]
                .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
                .map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-800">
                        {pr.category}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{pr.date}</span>
                      {pr.isUrgent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                          URGENT
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{pr.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{pr.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeletePressRelease(pr.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएं</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS MANAGEMENT */}
      {activeAdminTab === "events" && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-orange-600" />
              <span>नया कार्यक्रम / रैली जोड़ें</span>
            </h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    कार्यक्रम शीर्षक (Event Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="उदा. विशाल हिंदू राष्ट्र महासम्मेलन - आगरा"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    श्रेणी (Category) *
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as "Karyakram" | "Rally")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="Karyakram">🚩 कार्यक्रम (Karyakram)</option>
                    <option value="Rally">📣 रैली (Rally)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    तारीख (Date)
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    समय (Time Control)
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Time Picker Control */}
                    <div className="relative shrink-0 sm:w-36">
                      <Clock className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="time"
                        value={timePickerValue}
                        onChange={handleTimePickerChange}
                        className="w-full pl-9 pr-2 py-2 rounded-xl border border-orange-300 bg-orange-50/60 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 shadow-xs"
                      />
                    </div>

                    {/* Hindi formatted text / custom time description */}
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="उदा. सायं 4:00 बजे से रात्रि 8:00 बजे तक"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Preset Time Quick-Selection Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">त्वरित समय:</span>
                    {[
                      { label: "प्रातः 8:00", val: "08:00", text: "प्रातः 8:00 बजे से" },
                      { label: "प्रातः 10:00", val: "10:00", text: "प्रातः 10:00 बजे से" },
                      { label: "दोपहर 12:00", val: "12:00", text: "दोपहर 12:00 बजे से" },
                      { label: "सायं 4:00", val: "16:00", text: "सायं 4:00 बजे से" },
                      { label: "सायं 6:00", val: "18:00", text: "सायं 6:00 बजे से" },
                      { label: "रात्रि 8:00", val: "20:00", text: "रात्रि 8:00 बजे से" }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setTimePickerValue(preset.val);
                          setNewEventTime(preset.text);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          newEventTime.includes(preset.label.split(" ")[1]) || timePickerValue === preset.val
                            ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-orange-100 hover:text-orange-900"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    स्थान एवं मैदान (Venue) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="कोठी मीना बाज़ार मैदान, आगरा"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मुख्य वक्ता (Speakers - Comma separated)
                </label>
                <input
                  type="text"
                  value={newEventSpeakers}
                  onChange={(e) => setNewEventSpeakers(e.target.value)}
                  placeholder="कुलदीप शर्मा (राष्ट्रीय अध्यक्ष), साध्वी गीतांजलि"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  विवरण (Description)
                </label>
                <textarea
                  rows={3}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="कार्यक्रम का विवरण लिखें..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg cursor-pointer"
              >
                नया कार्यक्रम प्रकाशित करें
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              अनुसूचित कार्यक्रम ({events.length})
            </h3>

            <div className="space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{evt.title}</h4>
                    <p className="text-xs text-orange-700 font-bold">{evt.displayDate} • {evt.time}</p>
                    <p className="text-xs text-slate-600">{evt.locationName}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer self-start sm:self-center"
                  >
                    हटाएं
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS DIRECTORY */}
      {activeAdminTab === "members" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                <Users className="w-6 h-6 text-orange-600" />
                <span>पार्टी कार्यकर्ता सूची ({members.length})</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                पंजीकृत कार्यकर्ताओं व पदाधिकारियों की सूची।
              </p>
            </div>

            <button
              onClick={handleExportMembersCSV}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>CSV एक्सपोर्ट करें</span>
            </button>
          </div>

          <div>
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="नाम, फोन नंबर या ज़िले द्वारा खोजें..."
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50 text-orange-950 font-black border-b border-orange-200">
                <tr>
                  <th className="p-3">ID / कार्ड</th>
                  <th className="p-3">नाम</th>
                  <th className="p-3">मोबाइल</th>
                  <th className="p-3">ज़िला / मंडल</th>
                  <th className="p-3">पद / श्रेणी</th>
                  <th className="p-3">सदस्यता शुल्क</th>
                  <th className="p-3">भुगतान मोड & UTR</th>
                  <th className="p-3">तिथि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">{m.memberCardId || m.id}</td>
                    <td className="p-3 font-bold text-slate-900">{m.fullName}</td>
                    <td className="p-3 font-mono text-slate-800">{m.phone}</td>
                    <td className="p-3">{m.precinct}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900">
                        {m.membershipTier}
                      </span>
                    </td>
                    <td className="p-3 font-black text-emerald-700">
                      ₹{m.membershipFee ?? 0}
                    </td>
                    <td className="p-3 text-[11px]">
                      <span className="font-bold text-slate-800 block">{m.paymentMethod || "निःशुल्क"}</span>
                      {m.utrNumber && <span className="font-mono text-orange-700 text-[10px] block">{m.utrNumber}</span>}
                    </td>
                    <td className="p-3 text-slate-500">{m.joinedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DONATIONS & FINANCIAL RECORDS */}
      {activeAdminTab === "donations" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-orange-600" />
                <span>प्राप्त दान एवं UTR सत्यापन रिकॉर्ड्स</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                कुल प्राप्त जनसहयोग: <span className="font-bold text-orange-600">₹{totalRaised.toLocaleString("hi-IN")}</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50 text-orange-950 font-black border-b border-orange-200">
                <tr>
                  <th className="p-3">दान ID</th>
                  <th className="p-3">राष्ट्रभक्त / दानदाता</th>
                  <th className="p-3">राशि</th>
                  <th className="p-3">क्षेत्र</th>
                  <th className="p-3">तारीख</th>
                  <th className="p-3">संदेश / संकल्प</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">{d.id}</td>
                    <td className="p-3 font-bold text-slate-900">{d.donorName}</td>
                    <td className="p-3 font-black text-emerald-700">₹{d.amount?.toLocaleString("hi-IN")}</td>
                    <td className="p-3 text-slate-700">{d.precinct}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(d.timestamp).toLocaleDateString("hi-IN")}
                    </td>
                    <td className="p-3 text-slate-600 italic max-w-xs truncate">{d.message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM SETTINGS & CREDENTIALS */}
      {activeAdminTab === "settings" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-orange-600" />
                <span>सुरक्षा, एडमिन क्रेडेंशियल एवं Lite DB सेटिंग्स</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                लाइटवेट डेटाबेस (Lite DB / SQLite) में एडमिन यूज़रनेम व पासवर्ड अपडेट करें और डेटाबेस प्रबंधन करें।
              </p>
            </div>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-black text-orange-900 shrink-0">
              <span>वर्तमान एडमिन यूज़र:</span>
              <span className="font-mono text-orange-600">{adminUsername}</span>
            </div>
          </div>

          {/* Change Admin Credentials Form */}
          <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-orange-600" />
                <span>एडमिन यूज़रनेम एवं पासवर्ड बदलें (Update Admin Credentials)</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                यह बदलाव तुरंत डेटाबेस (Lite DB) में सुरक्षित हो जाएगा। भविष्य में इसी नए यूज़रनेम और पासवर्ड से लॉगिन होगा।
              </p>
            </div>

            <form onSubmit={handleChangeAdminCredentials} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  वर्तमान एडमिन पासवर्ड (Current Password) *
                </label>
                <input
                  type="password"
                  value={changeCurrentPass}
                  onChange={(e) => setChangeCurrentPass(e.target.value)}
                  required
                  placeholder="वर्तमान पासवर्ड दर्ज करें"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    नया एडमिन यूज़रनेम (New Username) *
                  </label>
                  <input
                    type="text"
                    value={changeNewUser}
                    onChange={(e) => setChangeNewUser(e.target.value)}
                    required
                    placeholder="नया यूज़रनेम (उदा. SAP_Admin)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    नया पासवर्ड (New Password) *
                  </label>
                  <input
                    type="password"
                    value={changeNewPass}
                    onChange={(e) => setChangeNewPass(e.target.value)}
                    required
                    placeholder="कम से कम 4 अक्षर"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नया पासवर्ड पुनः दर्ज करें (Confirm New Password) *
                </label>
                <input
                  type="password"
                  value={changeConfirmPass}
                  onChange={(e) => setChangeConfirmPass(e.target.value)}
                  required
                  placeholder="नया पासवर्ड पुनः लिखें"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingCreds}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
              >
                {isChangingCreds ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>डेटाबेस में सुरक्षित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>क्रेडेंशियल डेटाबेस में अपडेट करें</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Reset All Data Card */}
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 space-y-4">
            <h3 className="text-sm font-black text-red-950 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>डेटा मूल स्थिति में रीसेट करें (Reset All Data in Lite DB)</span>
            </h3>
            <p className="text-xs text-red-800">
              यदि आप सभी परीक्षण बदलावों को हटाकर वेबसाइट को शुरुआत की प्रामाणिक स्थिति में लाना चाहते हैं, तो नीचे दिए बटन पर क्लिक करें।
            </p>
            <button
              onClick={handleResetData}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg transition-colors cursor-pointer"
            >
              संपूर्ण डेटा रीसेट करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
