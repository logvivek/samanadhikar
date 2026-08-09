import React, { useState } from "react";
import { PressRelease } from "../types";
import gouMataImg from "../assets/images/gou_mata.jpg";
import { 
  Newspaper, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  Flame, 
  X, 
  Share2, 
  Printer, 
  Play, 
  Film,
  Image as ImageIcon,
  ShieldCheck,
  Video,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Instagram,
  Facebook
} from "lucide-react";

interface PressReleasesProps {
  pressReleases: PressRelease[];
  onRefreshPressReleases?: () => void;
}

export const PressReleases: React.FC<PressReleasesProps> = ({
  pressReleases,
  onRefreshPressReleases
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePR, setActivePR] = useState<PressRelease | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Admin login status
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return !!localStorage.getItem("sap_admin_token");
  });

  React.useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem("sap_admin_token");
      setIsAdmin(!!token);
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, []);

  // New video input modal/toggle state
  const [isAddVideoOpen, setIsAddVideoOpen] = useState<boolean>(false);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newVideoTitle, setNewVideoTitle] = useState<string>("");
  const [isSubmittingVideo, setIsSubmittingVideo] = useState<boolean>(false);

  const categories = [
    { id: "All", label: "सभी विज्ञप्तियां (All)" },
    { id: "Karyakram", label: "🚩 कार्यक्रम (Karyakram)" },
    { id: "Rally", label: "📣 रैली (Rally)" },
    { id: "Shorts", label: "🎥 यूट्यूब शॉट्स (Shorts)" },
    { id: "Demonstration", label: "पदयात्रा एवं प्रदर्शन" },
    { id: "Press Briefing", label: "प्रेस वार्ता" },
    { id: "National Agenda", label: "राष्ट्रीय संकल्प" },
    { id: "Public Announcement", label: "सार्वजनिक घोषणा" }
  ];

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}?pr=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return null;
  };

  const isYouTubeUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getPressReleaseImage = (pr: PressRelease): string => {
    if (pr.videoUrl && isYouTubeUrl(pr.videoUrl)) {
      const match = pr.videoUrl.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    return pr.imageUrl || gouMataImg;
  };

  const handleAutoSyncShorts = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch("/api/sync-youtube-shorts", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(data.message || "यूट्यूब चैनल के सभी शॉट्स वीडियो सिंक हो गए हैं!");
        if (onRefreshPressReleases) {
          onRefreshPressReleases();
        }
      } else {
        setSyncStatusMsg("सिंक में त्रुटि हुई। पुनः प्रयास करें।");
      }
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("सर्वर कनेक्ट करने में त्रुटि।");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const handleAddCustomVideoShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    setIsSubmittingVideo(true);
    try {
      const res = await fetch("/api/sync-youtube-shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: newVideoUrl.trim(),
          title: newVideoTitle.trim() || "नवीनतम यूट्यूब शॉट्स वीडियो | समान अधिकार पार्टी",
          category: "Public Announcement"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg("नया वीडियो यूट्यूब शॉट्स प्रेस विज्ञप्ति में सफलतापूर्वक जुड़ गया!");
        setNewVideoUrl("");
        setNewVideoTitle("");
        setIsAddVideoOpen(false);
        if (onRefreshPressReleases) {
          onRefreshPressReleases();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVideo(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const filteredPressReleases = pressReleases.filter((pr) => {
    if (selectedCategory === "Shorts") {
      if (!pr.hasVideo && !pr.videoUrl) return false;
    } else if (selectedCategory !== "All" && pr.category !== selectedCategory) {
      return false;
    }

    const matchesSearch =
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section className="py-6 sm:py-8 bg-orange-50/40 text-slate-900 min-h-screen">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Official YouTube & Social Media Banner (Visible ONLY when logged in as Admin) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-slate-950 via-zinc-900 to-red-950 p-4 sm:p-5 rounded-2xl text-white shadow-xl shadow-slate-950/20 flex flex-col lg:flex-row items-center justify-between gap-4 border-2 border-red-500/40 relative overflow-hidden">
            {/* Subtle background glow accent */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1.5 text-center lg:text-left relative z-10">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[11px] font-black uppercase backdrop-blur-md border border-red-500/30 shadow-inner">
                <Video className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
                <span>आधिकारिक सोशल मीडिया चैनल व वीडियो</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                समान अधिकार पार्टी - आधिकारिक वीडियो, इंस्टाग्राम एवं फेसबुक
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0 relative z-10">
              <a
                href="https://www.youtube.com/@samanadhikarparty3851/shorts"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-950/40 transition-all flex items-center space-x-1.5 border border-red-400/50 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-white" />
                <span>यूट्यूब चैनल</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href="https://www.instagram.com/reel/DYJ8UasycpA/?igsh=enlmNnhvZHJ4b3No"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:brightness-110 text-white font-black text-xs shadow-md shadow-purple-950/40 transition-all flex items-center space-x-1.5 border border-pink-400/50 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5 text-white" />
                <span>इंस्टाग्राम रील</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href="https://www.facebook.com/story.php?story_fbid=2321858148348941&id=100015743341966&rdid=oy1RilLuQgfMA2bb#"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-950/40 transition-all flex items-center space-x-1.5 border border-blue-400/50 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Facebook className="w-3.5 h-3.5 text-white" />
                <span>फेसबुक पोस्ट</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>
            </div>
          </div>
        )}

        {/* Admin Quick Control Bar (Visible ONLY when logged in as Admin) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-3 sm:p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 border border-orange-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-300" />
              <span className="font-black text-xs sm:text-sm">एडमिन प्रबंधन नियंत्रण (Admin Portal Active)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAutoSyncShorts}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-white text-orange-950 font-black text-xs shadow hover:bg-orange-50 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "सिंक हो रहा है..." : "यूट्यूब शॉट्स सिंक करें"}</span>
              </button>

              <button
                onClick={() => setIsAddVideoOpen(!isAddVideoOpen)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-black text-xs shadow hover:bg-slate-800 transition-all flex items-center space-x-1.5 cursor-pointer border border-orange-300/30"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>नया वीडियो लिंक जोड़ें</span>
              </button>
            </div>
          </div>
        )}

        {/* Sync status toast notification */}
        {syncStatusMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-bold text-xs flex items-center space-x-2 shadow-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Form to Add Youtube Video manually (Only available to Admin) */}
        {isAdmin && isAddVideoOpen && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-red-300 shadow-xl space-y-3 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
              <div className="flex items-center space-x-2 text-red-600 font-black text-xs sm:text-sm">
                <Video className="w-4 h-4 text-red-600" />
                <span>यूट्यूब वीडियो / शॉट्स की लिंक जोड़ें (@samanadhikarparty3851)</span>
              </div>
              <button 
                onClick={() => setIsAddVideoOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomVideoShort} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-1">
                    यूट्यूब वीडियो / शॉट्स URL (YouTube URL)*
                  </label>
                  <input 
                    type="url"
                    required
                    placeholder="https://www.youtube.com/shorts/3i_JmO9G2xA"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-1">
                    शीर्षक / टाइटल (Video Title)
                  </label>
                  <input 
                    type="text"
                    placeholder="गौमाता को राष्ट्रमाता घोषित करने हेतु जन-आह्वान..."
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddVideoOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="px-5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSubmittingVideo ? "प्रकाशन हो रहा है..." : "वीडियो विज्ञप्ति में जोड़ें"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border-2 border-orange-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-orange-100 text-orange-950 text-[11px] font-black uppercase mb-1 border border-orange-300">
                <Flame className="w-3 h-3 text-orange-600 fill-orange-600" />
                <span>समान अधिकार पार्टी मीडिया सेल</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-orange-950 tracking-tight">
                प्रेस विज्ञप्ति एवं मीडिया समाचार (Press Releases)
              </h2>
              <p className="text-xs text-slate-700 font-bold mt-0.5">
                राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नेतृत्व में जारी आधिकारिक विज्ञप्तियां एवं मीडिया कवरेज।
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <span>प्रेस विज्ञप्ति व समाचार केवल सुरक्षित एडमिन पोर्टल द्वारा प्रकाशित किए जाते हैं।</span>
              </div>
            )}
          </div>

          {/* Search & Category Filter Bar (All options visible & compact) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 pt-1">
            <div className="relative min-w-[200px] lg:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-orange-600 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="विज्ञप्ति, स्थान या शब्द खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-orange-50/50 border border-orange-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-orange-500 text-white shadow-sm border border-orange-600"
                      : "bg-orange-50 text-slate-700 hover:text-orange-950 border border-orange-200 hover:bg-orange-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Karyakram & Rally Section */}
        {(selectedCategory === "All" || selectedCategory === "Karyakram" || selectedCategory === "Rally") && (
          <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg border-2 border-amber-300 relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-amber-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-amber-100 text-[10px] font-black uppercase tracking-wider border border-white/30">
                    विशेष आयोजन व जनांदोलन
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    🚩 कार्यक्रम एवं रैली अनुभाग (Karyakram & Rally Section)
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCategory(selectedCategory === "Karyakram" ? "All" : "Karyakram")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedCategory === "Karyakram" 
                      ? "bg-white text-orange-600 shadow-md" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  }`}
                >
                  🚩 कार्यक्रम ({pressReleases.filter(pr => pr.category === "Karyakram").length})
                </button>
                <button
                  onClick={() => setSelectedCategory(selectedCategory === "Rally" ? "All" : "Rally")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedCategory === "Rally" 
                      ? "bg-white text-red-600 shadow-md" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  }`}
                >
                  📣 रैलियां ({pressReleases.filter(pr => pr.category === "Rally").length})
                </button>
              </div>
            </div>

            {/* Display Grid of Karyakram & Rally items */}
            {pressReleases.filter(pr => pr.category === "Karyakram" || pr.category === "Rally").length === 0 ? (
              <div className="bg-white/10 rounded-xl p-5 text-center text-amber-100 font-bold text-xs">
                अभी तक कोई कार्यक्रम या रैली प्रकाशित नहीं हुई है। एडमिन पोर्टल से नया कार्यक्रम या रैली जोड़ें।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pressReleases
                  .filter(pr => {
                    if (selectedCategory === "Karyakram") return pr.category === "Karyakram";
                    if (selectedCategory === "Rally") return pr.category === "Rally";
                    return pr.category === "Karyakram" || pr.category === "Rally";
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActivePR(item)}
                      className="bg-white text-slate-900 rounded-xl p-4 shadow-md border-2 border-amber-200 hover:border-orange-500 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase text-white shadow-sm flex items-center space-x-1 ${
                          item.category === "Rally" ? "bg-red-600" : "bg-orange-500"
                        }`}>
                          {item.category === "Rally" ? "📣 विशाल रैली" : "🚩 मुख्य कार्यक्रम"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-600" />
                          <span>{item.date}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center space-x-1 text-orange-800">
                          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span className="truncate max-w-[180px]">{item.location}</span>
                        </span>
                        <span className="text-orange-600 font-black group-hover:underline flex items-center space-x-1">
                          <span>पूरा विवरण</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Press Release Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredPressReleases.map((pr) => (
            <article 
              key={pr.id}
              onClick={() => setActivePR(pr)}
              className="bg-white border-2 border-orange-200 rounded-xl overflow-hidden hover:border-orange-400 transition-all shadow-sm hover:shadow-md flex flex-col group cursor-pointer"
            >
              {/* Card Image */}
              <div className="relative h-40 sm:h-44 overflow-hidden bg-orange-100">
                <img
                  src={getPressReleaseImage(pr)}
                  alt={pr.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = "true";
                      target.src = pr.imageUrl || gouMataImg;
                    } else if (target.dataset.triedFallback === "true") {
                      target.dataset.triedFallback = "true2";
                      target.src = gouMataImg;
                    } else {
                      target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23fff7ed'/><rect x='20' y='20' width='760' height='460' rx='16' fill='%23ffedd5' stroke='%23fdba74' stroke-width='4'/><text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' fill='%23c2410c' font-size='36' font-family='sans-serif' font-weight='bold'>जय गौ माता</text><text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' fill='%239a3412' font-size='24' font-family='sans-serif'>समान अधिकार पार्टी</text></svg>";
                    }
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
                  {pr.isUrgent && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse shadow">
                      अति-महत्वपूर्ण
                    </span>
                  )}
                  {(pr.hasVideo || pr.videoUrl) && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white flex items-center space-x-1 shadow">
                      <Play className="w-2.5 h-2.5 text-white fill-white" />
                      <span>{isYouTubeUrl(pr.videoUrl) ? "शॉट्स" : "वीडियो"}</span>
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black text-white uppercase shadow ${
                    pr.category === "Rally" ? "bg-red-600" : pr.category === "Karyakram" ? "bg-orange-600" : "bg-orange-500"
                  }`}>
                    {pr.category === "Karyakram" ? "🚩 कार्यक्रम" : pr.category === "Rally" ? "📣 रैली" : pr.category}
                  </span>
                </div>

                {(pr.hasVideo || pr.videoUrl) && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/20 group-hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-bold">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-orange-300" />
                    <span>{pr.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-orange-300" />
                    <span>{pr.location}</span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                <div className="space-y-1.5">
                  <h3 className="font-black text-base text-orange-950 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {pr.title}
                  </h3>
                  
                  {pr.titleEn && (
                    <p className="text-[11px] text-slate-600 font-sans italic line-clamp-1">
                      {pr.titleEn}
                    </p>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 font-semibold">
                    {pr.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-orange-200 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-[11px] text-slate-800 font-bold">
                    <User className="w-3 h-3 text-orange-600" />
                    <span className="truncate max-w-[120px]">{pr.spokesperson}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePR(pr);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-black text-white bg-orange-500 hover:bg-orange-600 group-hover:bg-orange-600 shadow transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>विवरण</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPressReleases.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-orange-200 space-y-3 shadow-sm">
            <Newspaper className="w-12 h-12 text-orange-400 mx-auto opacity-50" />
            <p className="text-orange-950 text-sm font-bold">कोई प्रेस विज्ञप्ति नहीं मिली।</p>
            <p className="text-xs text-slate-600">नवीनतम प्रेस विज्ञप्तियां देखने के लिए खोज बदलें।</p>
          </div>
        )}

        {/* ================= MODAL: READ FULL PRESS RELEASE & PLAY VIDEO ================= */}
        {activePR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-orange-950/70 backdrop-blur-md overflow-y-auto">
            <div className="bg-white border-2 border-amber-400 rounded-3xl max-w-3xl w-full shadow-2xl relative my-6 text-left overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header Bar with Theme Alignment */}
              <div className="bg-gradient-to-r from-orange-900 via-amber-900 to-orange-950 text-white p-5 sm:p-6 relative border-b-2 border-amber-500/60 flex items-start justify-between gap-4">
                <div className="space-y-2 pr-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-orange-950 shadow-sm border border-amber-300">
                      {activePR.category === "Karyakram" ? "🚩 कार्यक्रम (Karyakram)" : activePR.category === "Rally" ? "📣 रैली (Rally)" : activePR.category}
                    </span>
                    <span className="text-xs font-bold text-amber-200/90">
                      {activePR.date} • {activePR.location}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-amber-50 leading-snug">
                    {activePR.title}
                  </h2>

                  {activePR.titleEn && (
                    <p className="text-xs text-orange-200/80 font-sans italic">
                      {activePR.titleEn}
                    </p>
                  )}
                </div>

                {/* Top Close Button */}
                <button
                  onClick={() => setActivePR(null)}
                  aria-label="बंद करें"
                  className="absolute top-4 right-4 text-amber-100 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 p-2 sm:px-3 sm:py-1.5 rounded-full transition-all cursor-pointer z-20 flex items-center space-x-1 hover:scale-105 active:scale-95"
                >
                  <X className="w-5 h-5 text-amber-300" />
                  <span className="hidden sm:inline text-xs font-bold text-amber-100">बंद करें</span>
                </button>
              </div>

              {/* Modal Body Container */}
              <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto bg-amber-50/20">

                {/* Video Player Section if Video is available */}
                {(activePR.videoUrl || activePR.hasVideo) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-red-600 uppercase">
                        <Play className="w-4 h-4 text-red-600 animate-pulse fill-red-600 shrink-0" />
                        <span>{isYouTubeUrl(activePR.videoUrl) ? "आधिकारिक यूट्यूब शॉट्स वीडियो (@samanadhikarparty3851)" : "प्रेस बाइट व वीडियो कवरेज"}</span>
                      </div>

                      {activePR.videoUrl && (
                        <a
                          href={activePR.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <span>यूट्यूब ऐप में खोलें</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    
                    <div className="rounded-2xl overflow-hidden bg-black border-2 border-amber-300 shadow-md">
                      {isYouTubeUrl(activePR.videoUrl) ? (
                        <div className="relative w-full pt-[56.25%] bg-black">
                          <iframe
                            src={getYouTubeEmbedUrl(activePR.videoUrl) || activePR.videoUrl}
                            title={activePR.title}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video 
                          controls 
                          controlsList="nodownload"
                          poster={getPressReleaseImage(activePR)}
                          className="w-full max-h-96 object-contain"
                        >
                          <source src={activePR.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} type="video/mp4" />
                          आपका ब्राउज़र वीडियो प्लेयर का समर्थन नहीं करता है।
                        </video>
                      )}
                    </div>

                    {activePR.videoCaption && (
                      <p className="text-xs text-orange-950 bg-amber-100/80 p-2.5 rounded-xl border border-amber-300/80 font-bold flex items-center space-x-1.5">
                        <Film className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>{activePR.videoCaption}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Full Image Banner */}
                {activePR.imageUrl && !(activePR.videoUrl || activePR.hasVideo) && (
                  <div className="rounded-2xl overflow-hidden max-h-80 border-2 border-amber-200 shadow-sm">
                    <img
                      src={activePR.imageUrl}
                      alt={activePR.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = "true";
                          target.src = gouMataImg;
                        }
                      }}
                    />
                  </div>
                )}

                {/* Photo Gallery Thumbnails */}
                {activePR.galleryImages && activePR.galleryImages.length > 1 && (
                  <div className="space-y-2 border-t border-amber-200 pt-3">
                    <div className="text-xs font-black text-orange-950 flex items-center space-x-1">
                      <ImageIcon className="w-4 h-4 text-orange-600" />
                      <span>प्रेस कवरेज गैलरी (Press Media Photos)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {activePR.galleryImages.map((img, idx) => (
                        <div key={idx} className="h-24 rounded-xl overflow-hidden border border-amber-200 shadow-sm">
                          <img 
                            src={img} 
                            alt={`Press Photo ${idx + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform" 
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedFallback) {
                                target.dataset.triedFallback = "true";
                                target.src = gouMataImg;
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Body */}
                <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/90 shadow-inner">
                  {activePR.content}
                </div>

              </div>

              {/* Footer / Actions */}
              <div className="p-4 sm:p-5 bg-amber-100/50 border-t-2 border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-700 font-bold">
                  प्रवक्ता / जारीकर्ता: <span className="font-black text-orange-950">{activePR.spokesperson}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs border border-amber-300 transition-colors cursor-pointer shadow-sm flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4 text-orange-600" />
                    <span>प्रिंट</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(activePR.id)}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-colors cursor-pointer shadow-sm flex items-center space-x-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{copiedId === activePR.id ? "लिंक कॉपी हुआ!" : "शेयर"}</span>
                  </button>

                  {/* Primary Footer Close Button */}
                  <button
                    onClick={() => setActivePR(null)}
                    className="px-4 py-2 rounded-xl bg-orange-950 hover:bg-black text-amber-200 hover:text-white font-black text-xs border border-orange-800 transition-all cursor-pointer shadow-md flex items-center space-x-1.5 hover:scale-105 active:scale-95"
                  >
                    <X className="w-4 h-4 text-amber-400" />
                    <span>बंद करें</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
