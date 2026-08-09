import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { CandidatePlatform } from "./components/CandidatePlatform";
import { EventSchedules } from "./components/EventSchedules";
import { DonationPortal } from "./components/DonationPortal";
import { MemberPortal } from "./components/MemberPortal";
import { PressReleases } from "./components/PressReleases";
import { CampaignStats } from "./components/CampaignStats";
import { AICampaignAssistant } from "./components/AICampaignAssistant";
import { AdminPortal } from "./components/AdminPortal";
import { Footer } from "./components/Footer";
import { DonationReceipt, DonationRecord, PressRelease } from "./types";
import { X, QrCode, Users } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("platform");
  const [isDonateModalOpen, setIsDonateModalOpen] = useState<boolean>(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string>("");

  // Live stats from backend
  const [totalRaised, setTotalRaised] = useState<number>(458500);
  const [donorCount, setDonorCount] = useState<number>(3844);
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([]);

  // Press Releases State
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);

  useEffect(() => {
    fetchDonationsData();
    fetchPressReleasesData();
  }, []);

  const fetchDonationsData = async () => {
    try {
      const res = await fetch("/api/donations");
      const data = await res.json();
      if (data.totalRaised) {
        setTotalRaised(data.totalRaised);
        setDonorCount(data.donorCount);
        setRecentDonations(data.recentDonations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPressReleasesData = async () => {
    try {
      const res = await fetch("/api/press-releases");
      const data = await res.json();
      if (data.pressReleases) {
        setPressReleases(data.pressReleases);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPressRelease = async (prData: Partial<PressRelease>, token?: string): Promise<boolean> => {
    try {
      const adminToken = token || localStorage.getItem("sap_admin_token") || "";
      const res = await fetch("/api/press-releases", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify(prData)
      });
      const data = await res.json();
      if (data.success) {
        fetchPressReleasesData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeletePressRelease = async (id: string, token?: string) => {
    try {
      const adminToken = token || localStorage.getItem("sap_admin_token") || "";
      const res = await fetch(`/api/press-releases/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchPressReleasesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAiWithQuery = (query: string) => {
    setAiInitialQuery(query);
    setIsAiModalOpen(true);
  };

  const handleDonationSuccess = (receipt: DonationReceipt) => {
    fetchDonationsData();
  };

  return (
    <div className="min-h-screen bg-slate-900/95 2xl:py-2 font-sans text-slate-900 selection:bg-orange-500 selection:text-white flex justify-center items-start">
      <div className="w-full max-w-[1920px] min-h-screen bg-orange-50/30 shadow-2xl border-x border-orange-200/60 overflow-hidden flex flex-col transition-all">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDonateModal={() => setIsDonateModalOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        onOpenAiModal={() => {
          setAiInitialQuery("");
          setIsAiModalOpen(true);
        }}
        totalRaised={totalRaised}
      />

      {/* Main Hero Banner (Public Pages Only) */}
      {activeTab !== "admin" && (
        <Hero
          onExplorePlatform={() => setActiveTab("platform")}
          onJoinMembers={() => setIsMemberModalOpen(true)}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenPressRelease={() => setActiveTab("press")}
          onOpenAiModal={() => {
            setAiInitialQuery("");
            setIsAiModalOpen(true);
          }}
          totalRaised={totalRaised}
          donorCount={donorCount}
        />
      )}

      {/* Dynamic Tab Views */}
      <main className="flex-1">
        {activeTab === "platform" && (
          <CandidatePlatform
            onAskAi={handleOpenAiWithQuery}
            onDonateClick={() => setIsDonateModalOpen(true)}
          />
        )}

        {activeTab === "press" && (
          <PressReleases
            pressReleases={pressReleases}
            onRefreshPressReleases={fetchPressReleasesData}
          />
        )}

        {activeTab === "events" && (
          <EventSchedules
            onAskAiEvent={handleOpenAiWithQuery}
          />
        )}

        {activeTab === "members" && (
          <MemberPortal />
        )}

        {activeTab === "stats" && (
          <CampaignStats
            onDonateClick={() => setIsDonateModalOpen(true)}
            totalRaised={totalRaised}
            donorCount={donorCount}
            recentDonations={recentDonations}
          />
        )}

        {activeTab === "donate" && (
          <div className="py-8 px-4 max-w-5xl mx-auto">
            <DonationPortal
              totalRaised={totalRaised}
              donorCount={donorCount}
              onDonationSuccess={(receipt) => {
                handleDonationSuccess(receipt);
              }}
            />
          </div>
        )}

        {activeTab === "admin" && (
          <AdminPortal
            onRefreshData={fetchPressReleasesData}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer (Public Pages Only) */}
      {activeTab !== "admin" && (
        <Footer
          onNavClick={setActiveTab}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenMemberModal={() => setIsMemberModalOpen(true)}
          onOpenAi={() => {
            setAiInitialQuery("");
            setIsAiModalOpen(true);
          }}
        />
      )}
      </div>

      {/* Dedicated Sadasya Bane (Member Registration) Popup Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-orange-300 overflow-y-auto flex flex-col">
            
            {/* Sticky Header with prominent Close button */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-orange-200 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black text-orange-950">समान अधिकार पार्टी - सदस्य पंजीकरण एवं डिजिटल ID फॉर्म</h3>
                  <p className="text-[10px] text-slate-500 font-bold hidden sm:block">Saman Adhikar Party - Official Membership Portal</p>
                </div>
              </div>

              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                title="पॉपअप बंद करें (Close Popup)"
              >
                <span>बंद करें</span>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-3 sm:p-6 flex-1">
              <MemberPortal onCloseModal={() => setIsMemberModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Donation Modal */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-orange-300 overflow-y-auto flex flex-col">
            
            {/* Sticky Header with prominent Close button */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-orange-200 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  <QrCode className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black text-orange-950">समान अधिकार पार्टी - सहयोग एवं UPI गेटवे</h3>
                  <p className="text-[10px] text-slate-500 font-bold hidden sm:block">भारतीय स्टेट बैंक आधिकारिक खाता (SBI Official Account)</p>
                </div>
              </div>

              <button
                onClick={() => setIsDonateModalOpen(false)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                title="पॉपअप बंद करें (Close Popup)"
              >
                <span>बंद करें</span>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-3 sm:p-6 flex-1">
              <DonationPortal
                totalRaised={totalRaised}
                donorCount={donorCount}
                onDonationSuccess={(receipt) => {
                  handleDonationSuccess(receipt);
                }}
                onCloseModal={() => setIsDonateModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Policy Assistant Modal */}
      <AICampaignAssistant
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialQuery={aiInitialQuery}
        onDonateClick={() => {
          setIsAiModalOpen(false);
          setIsDonateModalOpen(true);
        }}
      />

    </div>
  );
}
