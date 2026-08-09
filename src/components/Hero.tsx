import React from "react";
import { PARTY_INFO } from "../data/campaignData";
import { 
  Heart,
  Users, 
  Sparkles, 
  ArrowRight, 
  Flame,
  Newspaper,
  PhoneCall
} from "lucide-react";

interface HeroProps {
  onExplorePlatform: () => void;
  onJoinMembers: () => void;
  onOpenDonate: () => void;
  onOpenAiModal: () => void;
  onOpenPressRelease: () => void;
  totalRaised: number;
  donorCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  onExplorePlatform,
  onJoinMembers,
  onOpenDonate,
  onOpenAiModal,
  onOpenPressRelease,
  totalRaised,
  donorCount
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-100/90 via-orange-50/70 to-white text-slate-900 pt-6 pb-12 lg:pt-10 lg:pb-16 border-b border-orange-200">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Slogans, Bio & Actions */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-orange-100/90 border-2 border-orange-400 text-orange-600 text-lg sm:text-2xl font-black uppercase tracking-wider shadow-sm backdrop-blur-xs">
              <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 fill-orange-600 shrink-0" />
              <span className="text-orange-600">समान अधिकार पार्टी (Saman Adhikar Party)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.18] text-orange-600">
              <span className="block text-orange-600 text-2xl sm:text-3xl lg:text-4xl font-black drop-shadow-sm">
                "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा"
              </span>
              <span className="block text-orange-600 text-2xl sm:text-3xl lg:text-4xl font-black mt-2">
                {PARTY_INFO.motto}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-blue-950 font-bold leading-relaxed w-full bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-orange-200 shadow-sm">
              {PARTY_INFO.shortBio}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenPressRelease}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:scale-105 transition-all cursor-pointer"
              >
                <Newspaper className="w-4 h-4" />
                <span>प्रेस विज्ञप्ति एवं समाचार</span>
              </button>

              <button
                onClick={onOpenDonate}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-orange-600 hover:bg-orange-700 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>आर्थिक सहयोग (Donate)</span>
              </button>

              <button
                onClick={onJoinMembers}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-orange-950 bg-white/95 hover:bg-orange-50 border border-orange-300 shadow-sm transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-orange-600" />
                <span>सदस्यता लें</span>
              </button>

              <button
                onClick={onExplorePlatform}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold text-orange-900 hover:text-orange-950 bg-orange-100/90 hover:bg-orange-200 border border-orange-300 transition-all cursor-pointer"
              >
                <span>संकल्प पत्र</span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </button>
            </div>
          </div>

          {/* Right Column: Leader Info & Quick Contact */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Leader Highlight Banner */}
            <div className="bg-white border-2 border-orange-300 p-5 sm:p-7 rounded-3xl shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="text-center sm:text-left space-y-2.5 pt-1 flex-1">
                  <div className="inline-block text-xs text-orange-800 bg-orange-100 font-black uppercase px-3 py-1 rounded-lg border border-orange-200 shadow-xs">
                    {PARTY_INFO.leaderRole}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                    {PARTY_INFO.leaderName}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 font-bold">
                    <span className="text-orange-800">मुख्यालय: </span>{PARTY_INFO.headquarters}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pt-1">
                    समान अधिकार पार्टी के संस्थापक व राष्ट्रीय नेतृत्व। सामाजिक न्याय और सर्व समाज के विकास हेतु समर्पित।
                  </p>
                  
                  <div className="pt-2">
                    <button 
                      onClick={onExplorePlatform}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 inline-flex items-center space-x-1.5"
                    >
                      <span>नेतृत्व संदेश एवं संकल्प पढ़ें</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl text-slate-800 shadow-xs">
                <PhoneCall className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="text-slate-800 font-bold text-left">
                  <span className="text-orange-900 font-extrabold">सम्पर्क: </span>
                  <a href="tel:9412165541" className="text-orange-700 hover:underline font-extrabold">9412165541</a>,{" "}
                  <a href="tel:7310732088" className="text-orange-700 hover:underline font-extrabold">7310732088</a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
