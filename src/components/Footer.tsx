import React from "react";
import { Heart, Mail, Phone, MapPin, ShieldCheck, Flame, Youtube, Instagram, Facebook } from "lucide-react";
import { PARTY_INFO } from "../data/campaignData";

interface FooterProps {
  onNavClick: (tab: string) => void;
  onOpenDonate: () => void;
  onOpenAi: () => void;
  onOpenMemberModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavClick,
  onOpenDonate,
  onOpenAi,
  onOpenMemberModal
}) => {
  const handleMemberClick = () => {
    if (onOpenMemberModal) {
      onOpenMemberModal();
    } else {
      onNavClick("members");
    }
  };
  return (
    <footer className="bg-orange-950 text-white border-t border-orange-800 text-left">
      
      {/* Upper CTA Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 py-10 px-4 sm:px-6 lg:px-8 border-b border-orange-400">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow">
              समान अधिकार और हिंदू राष्ट्र के लिए हमारे साथ आएं!
            </h3>
            <p className="text-xs sm:text-sm text-orange-950 font-bold">
              समान अधिकार पार्टी का सदस्य बनें अथवा अपने स्वेच्छा सहयोग से आंदोलन को गति प्रदान करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleMemberClick}
              className="px-5 py-2.5 rounded-xl bg-orange-950 hover:bg-orange-900 border border-orange-800 text-white font-black text-xs shadow-lg cursor-pointer"
            >
              पार्टी से जुड़ें (Member)
            </button>

            <button
              onClick={onOpenDonate}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-orange-950 font-black text-xs shadow-xl cursor-pointer"
            >
              आर्थिक सहयोग (Donate)
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        
        {/* Col 1: Brand & Bio */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="font-black text-base text-amber-300">{PARTY_INFO.name}</span>
          </div>

          <p className="text-xs text-orange-100/90 leading-relaxed font-medium">
            {PARTY_INFO.motto}। आरक्षण उन्मूलन, हिंदू राष्ट्र, जनसंख्या नियंत्रण, गुरुकुल शिक्षा व गौमाता की रक्षा हेतु समर्पित।
          </p>

          <div className="text-xs text-amber-200/90 space-y-1 pt-1 font-bold">
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>केंद्रीय कार्यालय: {PARTY_INFO.headquarters}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>हेल्पलाइन: {PARTY_INFO.contactPhone1} / {PARTY_INFO.contactPhone2}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Policy Platforms */}
        <div className="space-y-2">
          <h4 className="font-black text-amber-400 text-xs uppercase tracking-wider">मुख्य 5 संकल्प</h4>
          <ul className="space-y-1.5 text-xs text-orange-100/90 font-medium">
            <li><button onClick={() => onNavClick("platform")} className="hover:text-amber-300 cursor-pointer">आरक्षण प्रणाली खत्म करें</button></li>
            <li><button onClick={() => onNavClick("platform")} className="hover:text-amber-300 cursor-pointer">भारत को हिंदू राष्ट्र घोषित करें</button></li>
            <li><button onClick={() => onNavClick("platform")} className="hover:text-amber-300 cursor-pointer">जनसंख्या नियंत्रण कानून लागू हो</button></li>
            <li><button onClick={() => onNavClick("platform")} className="hover:text-amber-300 cursor-pointer">हर जिले में गुरुकुल स्कूल खोलना</button></li>
            <li><button onClick={() => onNavClick("platform")} className="hover:text-amber-300 cursor-pointer">गौमाता को राष्ट्रमाता का दर्जा</button></li>
          </ul>
        </div>

        {/* Col 3: Quick Navigation */}
        <div className="space-y-2">
          <h4 className="font-black text-amber-400 text-xs uppercase tracking-wider">त्वरित लिंक</h4>
          <ul className="space-y-1.5 text-xs text-orange-100/90 font-medium">
            <li><button onClick={() => onNavClick("press")} className="hover:text-amber-300 cursor-pointer">प्रेस विज्ञप्ति व मीडिया कवरेज</button></li>
            <li><button onClick={() => onNavClick("events")} className="hover:text-amber-300 cursor-pointer">पदयात्रा व जनसभा अनुसूची</button></li>
            <li><button onClick={handleMemberClick} className="hover:text-amber-300 cursor-pointer">डिजिटल पार्टी ID कार्ड बनाएं</button></li>
            <li><button onClick={onOpenDonate} className="hover:text-amber-300 cursor-pointer">बैंक खाता व UPI दान पोर्टल</button></li>
            <li><button onClick={onOpenAi} className="hover:text-amber-300 cursor-pointer">पार्टी AI सहायक से सवाल पूछें</button></li>
          </ul>
        </div>

        {/* Col 4: Official Legal Notice & Social Links */}
        <div className="space-y-3">
          <h4 className="font-black text-amber-400 text-xs uppercase tracking-wider">सोशल मीडिया व संपर्क</h4>
          
          <div className="flex items-center space-x-2 pt-1">
            <a
              href="https://www.youtube.com/@samanadhikarparty3851/shorts"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="यूट्यूब"
              className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md"
            >
              <Youtube className="w-4 h-4" />
            </a>

            <a
              href="https://www.instagram.com/reel/DYJ8UasycpA/?igsh=enlmNnhvZHJ4b3No"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="इंस्टाग्राम"
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 hover:brightness-110 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md"
            >
              <Instagram className="w-4 h-4" />
            </a>

            <a
              href="https://www.facebook.com/story.php?story_fbid=2321858148348941&id=100015743341966&rdid=oy1RilLuQgfMA2bb#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="फेसबुक"
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          <div className="border border-orange-800 bg-orange-900/60 p-3 rounded-xl text-center space-y-1.5 text-xs text-orange-100">
            <div className="border border-amber-400/40 py-1 px-2 rounded font-black text-amber-300 uppercase tracking-wider text-[10px]">
              समान अधिकार पार्टी केंद्रीय समिति द्वारा अधिकृत
            </div>
            <p className="text-[10px] text-orange-200/80 leading-tight">
              राष्ट्रीय अध्यक्ष: Kuldeep Sharma। भारत के निर्वाचन आयोग मान्यता प्राप्त समान अधिकार पार्टी अधिकृत अभियान पोर्टल।
            </p>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="bg-orange-950 border-t border-orange-900 py-4 px-4 text-center text-[11px] text-orange-200/70 font-semibold">
        <p>© 2026 समान अधिकार पार्टी (Saman Adhikar Party). सर्वाधिकार सुरक्षित। समान अधिकार, श्रेष्ठ भारत।</p>
      </div>

    </footer>
  );
};
