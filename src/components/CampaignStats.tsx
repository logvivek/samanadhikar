import React from "react";
import { DonationRecord } from "../types";
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Heart, 
  PieChart, 
  DollarSign, 
  MapPin, 
  Flame,
  CheckCircle2 
} from "lucide-react";

interface CampaignStatsProps {
  onDonateClick: () => void;
  totalRaised: number;
  donorCount: number;
  recentDonations: DonationRecord[];
}

export const CampaignStats: React.FC<CampaignStatsProps> = ({
  onDonateClick,
  totalRaised,
  donorCount,
  recentDonations
}) => {
  const goal = 5000000;
  const percent = Math.min(100, Math.round((totalRaised / goal) * 100));

  return (
    <section className="py-12 bg-orange-50/40 text-slate-900 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-10 text-left">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>पारदर्शिता व जनसहयोग डैशबोर्ड</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-orange-950 tracking-tight">
            जन-आंदोलन एवं आर्थिक पारदर्शिता
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            समान अधिकार पार्टी कॉरपोरेट फंड नहीं लेती। हमारा प्रचार अभियान आपके स्वेच्छिक आर्थिक सहयोग से चलता है।
          </p>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border-2 border-orange-200 p-6 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-600 text-xs font-black uppercase">
              <span>कुल प्राप्त सहयोग राशि</span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-600">
              ₹{totalRaised.toLocaleString("hi-IN")}
            </div>
            <p className="text-xs text-slate-600 font-bold">
              राष्ट्रीय अभियान लक्ष्य का {percent}%
            </p>
          </div>

          <div className="bg-white border-2 border-orange-200 p-6 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-600 text-xs font-black uppercase">
              <span>कुल देशभक्त समर्थक</span>
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-950">
              {donorCount.toLocaleString("hi-IN")}
            </div>
            <p className="text-xs text-slate-600 font-bold">औसत दान राशि: ₹1,100</p>
          </div>

          <div className="bg-white border-2 border-orange-200 p-6 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-600 text-xs font-black uppercase">
              <span>नागरिक छोटे दान का अनुपात</span>
              <PieChart className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-600">
              98.5%
            </div>
            <p className="text-xs text-slate-600 font-bold">₹5,000 से कम के जन-सहयोग</p>
          </div>

          <div className="bg-white border-2 border-orange-200 p-6 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-600 text-xs font-black uppercase">
              <span>कॉरपोरेट चंदा</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-700">
              ₹0.00
            </div>
            <p className="text-xs text-slate-600 font-bold">100% स्वच्छ व पारदर्शी</p>
          </div>

        </div>

        {/* Financial Breakdown & Supporter Wall */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Fund Usage Allocation */}
          <div className="lg:col-span-5 bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-xl font-black text-orange-950 border-b border-orange-200 pb-3">
              सहयोग राशि का उपयोग
            </h3>

            <div className="space-y-4 text-sm font-bold">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800">पदयात्रा, जनसभा व रैली आयोजन</span>
                  <span className="text-orange-600 font-black">45%</span>
                </div>
                <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800">गुरुकुल प्रचार व पर्चा वितरण</span>
                  <span className="text-orange-600 font-black">30%</span>
                </div>
                <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "30%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800">प्रेस वार्ता व डिजिटल मीडिया सेल</span>
                  <span className="text-orange-600 font-black">15%</span>
                </div>
                <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800">कार्यालय व कानूनी प्रक्रिया</span>
                  <span className="text-orange-600 font-black">10%</span>
                </div>
                <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-orange-200">
              <button
                onClick={onDonateClick}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>अभियान हेतु स्वेच्छिक सहयोग दें</span>
              </button>
            </div>
          </div>

          {/* Supporter Wall */}
          <div className="lg:col-span-7 bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-200 pb-3">
              <h3 className="text-xl font-black text-orange-950">हाल के जन-सहयोगकर्ता</h3>
              <span className="text-xs text-emerald-800 font-black bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                लाइव फीड
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {recentDonations.map((d) => (
                <div key={d.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-orange-950 text-sm">
                        {d.isAnonymous ? "गुमनाम देशभक्त समर्थक" : d.donorName}
                      </span>
                      <span className="text-xs font-mono text-orange-700 font-black bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                        ₹{d.amount}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-600 font-bold">
                      {d.precinct || "आगरा"}
                    </span>
                  </div>

                  {d.message && (
                    <p className="text-xs text-slate-700 italic pt-1 font-semibold">
                      "{d.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
