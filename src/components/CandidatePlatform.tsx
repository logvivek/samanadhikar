import React, { useState } from "react";
import gouMataImg from "../assets/images/gou_mata.jpg";
import { POLICY_PILLARS, PARTY_INFO } from "../data/campaignData";
import { PolicyPillar } from "../types";
import { 
  Scale, 
  ShieldAlert, 
  Users, 
  BookOpen, 
  Heart, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  Check, 
  HelpCircle,
  Award,
  Flame,
  Landmark
} from "lucide-react";

interface CandidatePlatformProps {
  onAskAi: (policyTopic: string) => void;
  onDonateClick: () => void;
}

export const CandidatePlatform: React.FC<CandidatePlatformProps> = ({
  onAskAi,
  onDonateClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>("pol-reservation");
  const [lang, setLang] = useState<"hi" | "en">("hi");

  const categories = [
    { id: "All", label: "सभी संकल्प (All Agendas)" },
    { id: "Reservation", label: "आरक्षण उन्मूलन" },
    { id: "Hindu Rashtra", label: "हिंदू राष्ट्र" },
    { id: "Population", label: "जनसंख्या नियंत्रण" },
    { id: "Gurukul", label: "गुरुकुल शिक्षा" },
    { id: "Gaumata", label: "गौमाता व मंदिर" }
  ];

  const getIcon = (category: string) => {
    switch (category) {
      case "Reservation": return <Scale className="w-6 h-6 text-orange-600" />;
      case "Hindu Rashtra": return <ShieldAlert className="w-6 h-6 text-orange-600" />;
      case "Population": return <Users className="w-6 h-6 text-orange-600" />;
      case "Gurukul": return <BookOpen className="w-6 h-6 text-orange-600" />;
      case "Gaumata": return <Heart className="w-6 h-6 text-rose-600" />;
      default: return <Landmark className="w-6 h-6 text-orange-600" />;
    }
  };

  const filteredPolicies = POLICY_PILLARS.filter((policy) => {
    const matchesCategory = selectedCategory === "All" || policy.category === selectedCategory;
    const matchesSearch = 
      policy.titleHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.keyStanceHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.detailedPointsHi.some(pt => pt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedPolicyId(expandedPolicyId === id ? null : id);
  };

  return (
    <section className="py-12 bg-orange-50/40 text-slate-900 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>समान अधिकार पार्टी - आधिकारिक संकल्प पत्र</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black text-orange-950 tracking-tight">
            हमारे 5 प्रमुख राष्ट्रव्यापी संकल्प
          </h2>
          
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            समान अधिकार लाना है, श्रेष्ठ भारत बनाना है! राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी का मुख्य ध्येय।
          </p>

          {/* Language Toggle */}
          <div className="inline-flex items-center p-1 bg-white border border-orange-300 rounded-xl text-xs font-bold shadow-sm">
            <button
              onClick={() => setLang("hi")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${lang === "hi" ? "bg-orange-500 text-white font-black" : "text-slate-700"}`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${lang === "en" ? "bg-orange-500 text-white font-black" : "text-slate-700"}`}
            >
              English
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-orange-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-orange-500 text-white shadow-md border border-orange-600"
                      : "bg-orange-50 text-slate-700 hover:bg-orange-100 hover:text-orange-900 border border-orange-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Keyword Search Input (Hidden as requested) */}
            <div className="hidden relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-orange-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="खोजें (उदा. आरक्षण, गुरुकुल, जनसंख्या)..."
                className="w-full pl-10 pr-4 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Policy Cards Grid */}
        <div className="space-y-6">
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-orange-200 space-y-3 shadow-sm">
              <p className="text-slate-700 text-sm font-bold">खोज शब्द "{searchQuery}" से संबंधित कोई संकल्प नहीं मिला।</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="text-xs font-black text-orange-600 hover:underline"
              >
                सभी संकल्प देखें
              </button>
            </div>
          ) : (
            filteredPolicies.map((policy) => {
              const isExpanded = expandedPolicyId === policy.id;

              return (
                <div
                  key={policy.id}
                  className="bg-white border-2 border-orange-200 hover:border-orange-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => toggleExpand(policy.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/80 hover:bg-orange-50/80 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-orange-100/80 rounded-xl border border-orange-200 shrink-0">
                        {getIcon(policy.category)}
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded shadow-sm">
                            {policy.category}
                          </span>
                          <span className="text-[11px] text-orange-800 font-extrabold">
                            समान अधिकार पार्टी मुख्य संकल्प
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-orange-950">
                          {lang === "hi" ? policy.titleHi : policy.titleEn}
                        </h3>

                        <p className="text-xs text-slate-700 font-bold">
                          {lang === "hi" ? policy.subtitleHi : policy.subtitleEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskAi(`समान अधिकार पार्टी के ${policy.titleHi} संकल्प के बारे में विस्तृत जानकारी दें।`);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        <span>एआई प्रश्न पूछें</span>
                      </button>

                      <div className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body Content */}
                  {isExpanded && (
                    <div className="border-t border-orange-200 p-6 sm:p-8 space-y-6 bg-orange-50/30 text-left">
                      
                      {/* Key Stance & Expected Impact */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border border-orange-200 p-4 rounded-2xl space-y-2 shadow-sm">
                          <h4 className="text-xs font-black uppercase text-orange-700 tracking-wider">
                            {lang === "hi" ? "राष्ट्रीय अध्यक्ष जी का मुख्य दृष्टिकोण" : "National President's Key Position"}
                          </h4>
                          <p className="text-slate-900 text-sm font-bold leading-relaxed">
                            "{lang === "hi" ? policy.keyStanceHi : policy.keyStanceEn}"
                          </p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 shadow-sm">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                            {lang === "hi" ? "राष्ट्र एवं समाज पर प्रभाव" : "National Impact"}
                          </h4>
                          <p className="text-emerald-950 text-xs sm:text-sm font-bold leading-relaxed">
                            {lang === "hi" ? policy.expectedImpactHi : policy.expectedImpactEn}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Commitments */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-orange-900 tracking-wider">
                          {lang === "hi" ? "मुख्य नीतियां एवं कार्ययोजना" : "Key Policy Provisions"}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {(lang === "hi" ? policy.detailedPointsHi : policy.detailedPointsEn).map((pt, idx) => (
                            <div key={idx} className="flex items-start space-x-3 bg-white border border-orange-200 p-3 rounded-xl shadow-sm">
                              <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs text-slate-800 font-bold">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sponsored Bill Proposals */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-orange-900 tracking-wider">
                          {lang === "hi" ? "संसद में पारित कराने हेतु प्रस्तावित कानून" : "Proposed Parliamentary Acts"}
                        </h4>

                        <div className="flex flex-wrap gap-2">
                          {(lang === "hi" ? policy.billProposalsHi : policy.billProposalsEn).map((bill, idx) => (
                            <div key={idx} className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-orange-200 text-xs font-bold text-orange-950 shadow-sm">
                              <FileText className="w-3.5 h-3.5 text-orange-600" />
                              <span>{bill}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Frequently Asked Questions */}
                      {policy.faq && policy.faq.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-black uppercase text-orange-900 tracking-wider flex items-center space-x-2">
                            <HelpCircle className="w-4 h-4 text-orange-600" />
                            <span>{policy.category} - अक्सर पूछे जाने वाले प्रश्न (FAQ)</span>
                          </h4>

                          <div className="space-y-2">
                            {policy.faq.map((item, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-orange-200 space-y-1 shadow-sm">
                                <p className="text-xs font-black text-orange-950">
                                  प्रश्न: {lang === "hi" ? item.q : (item.qEn || item.q)}
                                </p>
                                <p className="text-xs text-slate-700 font-medium">
                                  उत्तर: {lang === "hi" ? item.a : (item.aEn || item.a)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card Action Bar */}
                      <div className="pt-4 border-t border-orange-200 flex flex-wrap items-center justify-between gap-3">
                        <button
                          onClick={() => onAskAi(`समान अधिकार पार्टी के ${policy.titleHi} संकल्प के बारे में और जानकारी दीजिए।`)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-950 text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-orange-600" />
                          <span>इस विषय पर पार्टी एआई से प्रश्न पूछें</span>
                        </button>

                        <button
                          onClick={onDonateClick}
                          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow transition-colors cursor-pointer"
                        >
                          अभियान हेतु सहयोग राशि प्रदान करें
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};
