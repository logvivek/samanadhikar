import React, { useState } from "react";
import gouMataImg from "../assets/images/gou_mata.jpg";
import { 
  Heart, 
  Users, 
  Calendar, 
  BookOpen, 
  Bot, 
  Menu, 
  X, 
  Sparkles,
  TrendingUp,
  Newspaper,
  PhoneCall,
  Flame,
  ShieldCheck
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDonateModal: () => void;
  onOpenMemberModal: () => void;
  onOpenAiModal: () => void;
  totalRaised: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDonateModal,
  onOpenMemberModal,
  onOpenAiModal,
  totalRaised
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "platform", label: "संकल्प", sub: "Agendas", icon: BookOpen },
    { id: "press", label: "प्रेस विज्ञप्ति", sub: "Press", icon: Newspaper, isNew: true },
    { id: "events", label: "कार्यक्रम", sub: "Events", icon: Calendar },
    { id: "members", label: "सदस्यता", sub: "Join", icon: Users },
    { id: "donate", label: "सहयोग", sub: "Donate", icon: Heart },
  ];

  const menuNavItems = [
    ...navItems,
    { id: "admin", label: "प्रशासन", sub: "Admin", icon: ShieldCheck },
  ];

  const handleNavClick = (id: string) => {
    if (id === "donate") {
      onOpenDonateModal();
    } else if (id === "members") {
      onOpenMemberModal();
    } else {
      setActiveTab(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-200 text-slate-800 shadow-sm">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-xs py-1.5 px-4 text-white font-medium shadow-sm">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-orange-700 tracking-wider shadow-sm">
              <Flame className="w-3 h-3 text-orange-600 fill-orange-600 animate-pulse" />
              <span>समान अधिकार पार्टी</span>
            </span>
            <span className="font-bold text-white hidden sm:inline drop-shadow-sm">
              "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा" • राष्ट्रीय अध्यक्ष: कुलदीप शर्मा
            </span>
          </div>

          <div className="flex items-center space-x-3 text-orange-50">
            <a 
              href="tel:9412165541" 
              className="flex items-center space-x-1 hover:text-white transition-colors text-xs font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white" />
              <span>9412165541</span>
            </a>
            
            <button
              onClick={onOpenAiModal}
              className="inline-flex items-center space-x-1 text-xs text-orange-950 font-bold bg-white hover:bg-orange-50 px-2.5 py-0.5 rounded-full shadow transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-orange-600" />
              <span>पार्टी एआई असिस्टेंट</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick("platform")}
            className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-md group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src="/images/gou_mata.jpg" 
                alt="जय गौ माता - कामधेनु" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = "true";
                    target.src = gouMataImg || "/images/gou_mata_kamadhenu.jpg";
                  } else {
                    target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23ea580c'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24' font-family='sans-serif' font-weight='bold'>SAP</text></svg>";
                  }
                }}
                className="w-full h-full object-contain p-0.5 rounded-[10px] bg-white shadow-inner"
              />
            </div>
            <div className="shrink-0 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-orange-600 whitespace-nowrap">
                  समान अधिकार पार्टी
                </span>
                <span className="text-[9px] sm:text-[10px] font-black text-white bg-orange-600 px-1 py-0.2 rounded uppercase tracking-wider shadow-sm shrink-0">
                  SAP
                </span>
                <span className="hidden md:inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shrink-0 whitespace-nowrap">
                  <span>जय गौ माता</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-orange-800 tracking-wide whitespace-nowrap">
                SAMAN ADHIKAR PARTY <span className="hidden 2xl:inline">• राष्ट्रीय कार्यालय: आगरा / मथुरा</span>
              </p>
            </div>
          </div>

          {/* Desktop & Laptop Navigation Links - Adaptive & Non-overlapping */}
          <nav className="hidden lg:flex items-center space-x-1 shrink min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center space-x-1 px-2 py-1.5 2xl:px-3 2xl:py-2 rounded-xl text-[11px] xl:text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 border border-orange-600"
                      : "text-slate-700 hover:text-orange-900 hover:bg-orange-50/80 border border-transparent hover:border-orange-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 ${isActive ? "text-white" : "text-orange-600"}`} />
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                  {item.isNew && (
                    <span className="ml-1 px-1 py-0.2 text-[8px] 2xl:text-[9px] font-black bg-red-600 text-white rounded-full animate-bounce shrink-0">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden xl:flex items-center space-x-1.5 shrink-0">
            <button
              onClick={onOpenAiModal}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="hidden 2xl:inline">प्रश्न पूछें</span>
            </button>

            <button
              onClick={() => handleNavClick("members")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-orange-950 hover:text-orange-700 bg-white hover:bg-orange-50 border border-orange-300 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              सदस्य बनें
            </button>

            <button
              onClick={onOpenDonateModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>सहयोग</span>
            </button>
          </div>

          {/* Universal Hamburger Menu Toggle Button (Visible on ALL devices for easy access) */}
          <div className="flex items-center space-x-2 ml-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 focus:outline-none transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1"
              title="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-orange-600" /> : <Menu className="w-6 h-6 text-orange-600" />}
              <span className="text-xs font-bold text-orange-950 hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide-down Responsive Navigation Drawer (Works on laptop, tablet & mobile) */}
      {mobileMenuOpen && (
        <div className="bg-white border-b-2 border-orange-300 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-orange-100">
            <span className="text-xs font-black text-orange-800 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {menuNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md border border-orange-600"
                      : item.id === "admin"
                      ? "text-slate-900 bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300 shadow-sm"
                      : "text-slate-800 bg-orange-50/50 hover:bg-orange-100 hover:text-orange-900 border border-orange-200/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : item.id === "admin" ? "text-amber-800" : "text-orange-600"}`} />
                    <span>{item.label} {item.sub ? `(${item.sub})` : ""}</span>
                  </div>
                  {item.isNew && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full">
                      NEW
                    </span>
                  )}
                  {item.id === "admin" && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-amber-800 text-white rounded-full">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-orange-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                onOpenAiModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-orange-950 text-xs font-bold border border-amber-200 shadow-sm cursor-pointer"
            >
              <Bot className="w-4 h-4 text-orange-600" />
              <span>एआई असिस्टेंट</span>
            </button>

            <button
              onClick={() => {
                handleNavClick("members");
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-950 text-xs font-bold border border-orange-300 shadow-sm cursor-pointer"
            >
              <Users className="w-4 h-4 text-orange-600" />
              <span>सदस्य बनें</span>
            </button>

            <button
              onClick={() => {
                onOpenDonateModal();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>आर्थिक सहयोग</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
