import React, { useState, useEffect } from "react";
import { CAMPAIGN_EVENTS, PRECINCTS_LIST, PARTY_INFO } from "../data/campaignData";
import { CampaignEvent, EventTicket } from "../types";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  CheckCircle2, 
  X, 
  QrCode, 
  Share2, 
  Sparkles,
  Ticket,
  Flame,
  User,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key
} from "lucide-react";

interface EventSchedulesProps {
  onAskAiEvent: (eventTitle: string) => void;
}

export const EventSchedules: React.FC<EventSchedulesProps> = ({
  onAskAiEvent
}) => {
  const [eventsList, setEventsList] = useState<CampaignEvent[]>(CAMPAIGN_EVENTS);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // RSVP Modal State
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<CampaignEvent | null>(null);
  const [attendeeName, setAttendeeName] = useState<string>("");
  const [attendeeEmail, setAttendeeEmail] = useState<string>("");
  const [attendeePhone, setAttendeePhone] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issuedTicket, setIssuedTicket] = useState<EventTicket | null>(null);

  // Admin Auth & Actions State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("sap_admin_token"));
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminAuthError, setAdminAuthError] = useState<string>("");
  const [isAdminSubmitting, setIsAdminSubmitting] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"create_event" | "delete_event" | null>(null);
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState<string | null>(null);

  // Add Event Form State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventDate, setNewEventDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newEventTime, setNewEventTime] = useState<string>("सायं 4:00 बजे से");
  const [newEventLocation, setNewEventLocation] = useState<string>("आगरा HQ / जिला कार्यालय");
  const [newEventDescription, setNewEventDescription] = useState<string>("");
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);

  useEffect(() => {
    fetchEvents();
    if (adminToken) {
      fetch("/api/admin/verify", {
        headers: { "X-Admin-Token": adminToken }
      })
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin) {
            setIsAdminLoggedIn(true);
          } else {
            localStorage.removeItem("sap_admin_token");
            setAdminToken(null);
            setIsAdminLoggedIn(false);
          }
        })
        .catch(() => {});
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success && data.events) {
        setEventsList(data.events);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    setIsAdminSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("sap_admin_token", data.token);
        setAdminToken(data.token);
        setIsAdminLoggedIn(true);
        setIsAdminModalOpen(false);
        setAdminAuthError("");

        if (pendingAction === "create_event") {
          setIsAddEventModalOpen(true);
        } else if (pendingAction === "delete_event" && pendingDeleteEventId) {
          executeDeleteEvent(pendingDeleteEventId, data.token);
        }
        setPendingAction(null);
        setPendingDeleteEventId(null);
      } else {
        setAdminAuthError(data.error || "लॉगिन विफल रहा। यूजरनेम व पासवर्ड जांचें।");
      }
    } catch (err) {
      setAdminAuthError("सर्वर से संपर्क करने में त्रुटि।");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleOpenAddEvent = () => {
    if (isAdminLoggedIn) {
      setIsAddEventModalOpen(true);
    } else {
      setPendingAction("create_event");
      setAdminAuthError("नया कार्यक्रम जोड़ने के लिए एडमिन (Admin) लॉगिन क्रेडेंशियल आवश्यक हैं।");
      setIsAdminModalOpen(true);
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (isAdminLoggedIn) {
      if (window.confirm("क्या आप निश्चित रूप से इस कार्यक्रम को सूची से हटाना चाहते हैं?")) {
        executeDeleteEvent(id, adminToken || undefined);
      }
    } else {
      setPendingAction("delete_event");
      setPendingDeleteEventId(id);
      setAdminAuthError("कार्यक्रम हटाने के लिए एडमिन लॉगिन क्रेडेंशियल आवश्यक हैं।");
      setIsAdminModalOpen(true);
    }
  };

  const executeDeleteEvent = async (id: string, token?: string) => {
    try {
      const activeToken = token || adminToken || localStorage.getItem("sap_admin_token") || "";
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": activeToken }
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      } else {
        alert(data.error || "कार्यक्रम हटाने में विफल।");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    setIsCreatingEvent(true);
    try {
      const activeToken = adminToken || localStorage.getItem("sap_admin_token") || "";
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": activeToken
        },
        body: JSON.stringify({
          title: newEventTitle,
          titleHi: newEventTitle,
          date: newEventDate,
          displayDate: newEventDate,
          time: newEventTime,
          locationName: newEventLocation,
          address: newEventLocation,
          description: newEventDescription
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
        setIsAddEventModalOpen(false);
        setNewEventTitle("");
        setNewEventDescription("");
      } else {
        alert(data.error || "कार्यक्रम जोड़ने में विफल। एडमिन लॉगिन की जाँच करें।");
      }
    } catch (err) {
      console.error(err);
      alert("सर्वर त्रुटि। पुनः प्रयास करें।");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const eventTypes = ["All", "पदयात्रा", "प्रेस वार्ता", "धर्म संसद", "कार्यकर्ता सम्मेलन", "सत्याग्रह"];

  const filteredEvents = CAMPAIGN_EVENTS.filter((evt) => {
    const matchesType = selectedType === "All" || evt.type === selectedType;
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.cityState.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleOpenRsvp = (evt: CampaignEvent) => {
    setActiveRsvpEvent(evt);
    setIssuedTicket(null);
    setAttendeeName("");
    setAttendeeEmail("");
    setAttendeePhone("");
    setGuestsCount(1);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRsvpEvent || !attendeeName || !attendeePhone) {
      alert("कृपया अपना नाम और मोबाइल नंबर दर्ज करें।");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeRsvpEvent.id,
          eventTitle: activeRsvpEvent.title,
          attendeeName,
          attendeeEmail,
          guestsCount
        })
      });

      const data = await response.json();

      if (data.success) {
        setIssuedTicket(data.ticket);
      } else {
        alert("RSVP पंजीकरण में त्रुटि।");
      }
    } catch (err) {
      console.error(err);
      alert("अनुरोध विफल रहा। पुनः प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 bg-orange-50/40 text-slate-900 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-10">
        
        {/* Section Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>समान अधिकार पार्टी - आगामी कार्यक्रम व रैली अनुसूची</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-orange-950 tracking-tight">
            जनसभा, पदयात्रा एवं प्रेस वार्ता अनुसूची
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नेतृत्व में आयोजित होने वाले आगामी जन-आंदोलन कार्यक्रमों में भाग लें।
          </p>
        </div>

        {/* Filter Controls & Admin Add Event Button */}
        <div className="bg-white border border-orange-200 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedType === type
                    ? "bg-orange-500 text-white shadow-md font-black"
                    : "bg-orange-50 text-slate-700 hover:text-orange-900 border border-orange-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="w-full md:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="स्थान, शहर या कार्यक्रम खोजें..."
                className="w-full px-4 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <button
              onClick={handleOpenAddEvent}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md flex items-center space-x-1 shrink-0 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">नया कार्यक्रम प्रकाशित करें</span>
              <span className="sm:hidden">जोड़ें</span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsList.filter((evt) => {
            const matchesType = selectedType === "All" || evt.type === selectedType;
            const matchesSearch = 
              evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              evt.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              evt.cityState.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
          }).map((event) => {
            return (
              <div
                key={event.id}
                className="bg-white border-2 border-orange-200 hover:border-orange-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between transition-all group relative"
              >
                {/* Event Header Banner */}
                <div className="p-5 bg-gradient-to-br from-orange-100 via-orange-50/80 to-white border-b border-orange-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-black uppercase bg-orange-500 text-white shadow-sm">
                      {event.type}
                    </span>

                    <div className="flex items-center space-x-2">
                      {event.isVirtual ? (
                        <span className="flex items-center space-x-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[10px]">
                          <Video className="w-3.5 h-3.5" />
                          <span>लाइव</span>
                        </span>
                      ) : (
                        <span className="text-orange-900 font-extrabold text-[11px]">
                          {event.precinctDistrict}
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors cursor-pointer"
                        title="कार्यक्रम हटाएं (Delete Event - Admin credentials required)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-orange-950 group-hover:text-orange-600 transition-colors">
                    {event.title}
                  </h3>

                  {/* Date & Time Badge */}
                  <div className="space-y-1.5 text-xs text-slate-800 font-bold">
                    <div className="flex items-center space-x-2 text-orange-700 font-black">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{event.displayDate}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700">
                      <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-start space-x-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-slate-950">{event.locationName}</div>
                        <div className="text-[11px] text-slate-600">{event.address}, {event.cityState}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Description Body */}
                <div className="p-5 space-y-4 text-left flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {event.description}
                  </p>

                  {/* Speakers */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-orange-800">मुख्य वक्ता:</div>
                    <div className="flex flex-wrap gap-1">
                      {event.featuredSpeakers.map((spk, idx) => (
                        <span key={idx} className="text-[11px] bg-orange-50 border border-orange-200 text-orange-950 px-2 py-0.5 rounded-md font-extrabold">
                          {spk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>पंजीकरण संख्या</span>
                      <span className="font-black text-orange-950">
                        {event.rsvpCount} / {event.capacity}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden border border-orange-200">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (event.rsvpCount / event.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onAskAiEvent(`समान अधिकार पार्टी के ${event.title} कार्यक्रम के बारे में बताएं जो ${event.displayDate} को ${event.cityState} में है।`)}
                      className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs text-orange-950 border border-orange-200 font-extrabold flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>एआई जानकारी</span>
                    </button>

                    <button
                      onClick={() => handleOpenRsvp(event)}
                      className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>निःशुल्क पास (RSVP)</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* RSVP Modal */}
        {activeRsvpEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white border-2 border-orange-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-left">
              
              <button
                onClick={() => setActiveRsvpEvent(null)}
                className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 p-2 rounded-xl bg-orange-50 border border-orange-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {issuedTicket ? (
                /* Ticket Pass View */
                <div className="space-y-5 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-black text-orange-950">कार्यक्रम का पास कन्फर्म हो गया!</h3>

                  {/* Visual Pass Card */}
                  <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl p-5 text-left space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-orange-950 tracking-widest bg-white/90 px-2 py-0.5 rounded shadow-sm">
                          आधिकारिक प्रवेश पास
                        </span>
                        <h4 className="text-base font-black text-white mt-2">{issuedTicket.eventTitle}</h4>
                      </div>
                      <QrCode className="w-11 h-11 text-orange-950 shrink-0 bg-white p-1 rounded-lg shadow-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white pt-2 border-t border-white/30">
                      <div>
                        <span className="text-orange-100 block text-[10px]">प्रतिभागी Name:</span>
                        <span className="font-extrabold text-white">{issuedTicket.attendeeName}</span>
                      </div>
                      <div>
                        <span className="text-orange-100 block text-[10px]">सीट संख्या:</span>
                        <span className="font-extrabold text-white">{issuedTicket.guestsCount} सीट</span>
                      </div>
                      <div>
                        <span className="text-orange-100 block text-[10px]">पास संख्या:</span>
                        <span className="font-black text-white">{issuedTicket.ticketNumber}</span>
                      </div>
                      <div>
                        <span className="text-orange-100 block text-[10px]">जारी तिथि:</span>
                        <span className="text-white">{issuedTicket.issuedDate}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveRsvpEvent(null)}
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    संपन्न (Done)
                  </button>
                </div>
              ) : (
                /* RSVP Form */
                <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider">
                      कार्यक्रम सीट बुक करें
                    </span>
                    <h3 className="text-lg font-black text-orange-950">{activeRsvpEvent.title}</h3>
                    <p className="text-xs text-slate-700 font-bold mt-1">
                      {activeRsvpEvent.displayDate} • {activeRsvpEvent.time}
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">पूरा नाम (Full Name) *</label>
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="उदा. अमित शर्मा"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">मोबाइल नंबर *</label>
                    <input
                      type="tel"
                      required
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      placeholder="98370XXXXX"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">सीटों की संख्या (Guests)</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    >
                      <option value={1}>1 सीट (केवल मैं)</option>
                      <option value={2}>2 सीटें</option>
                      <option value={3}>3 सीटें</option>
                      <option value={5}>5+ पारिवारिक वर्ग</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? "पास जारी हो रहा है..." : "निःशुल्क पास (RSVP) कन्फर्म करें"}
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* ================= MODAL: ADMIN AUTHENTICATION PROMPT ================= */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white border-2 border-orange-300 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left space-y-4 text-slate-900">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 p-2 rounded-xl bg-orange-50 border border-orange-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-orange-200 pb-3">
                <ShieldAlert className="w-7 h-7 text-orange-600" />
                <div>
                  <h3 className="text-lg font-black text-orange-950">एडमिन क्रेडेंशियल आवश्यक</h3>
                  <p className="text-xs text-slate-600 font-bold">केवल अधिकृत एडमिन ही सामग्री जोड़/हटा सकते हैं</p>
                </div>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-950 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    एडमिन यूजरनेम (Username) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-orange-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="यूज़रनेम दर्ज करें"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    पासवर्ड (Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-orange-600 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>{isAdminSubmitting ? "सत्यापित हो रहा है..." : "एडमिन लॉगिन करें (Login as Admin)"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD NEW EVENT ================= */}
        {isAddEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            <div className="bg-white border-2 border-orange-300 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative text-left text-slate-900 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-orange-200 bg-orange-50/50 shrink-0">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-black text-orange-950">नया कार्यक्रम प्रकाशित करें</h3>
                    <p className="text-xs text-slate-600 font-bold">आगामी रैली, जनसभा या प्रेस वार्ता जोड़ें</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  title="बंद करें (Close)"
                  className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-orange-200 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <X className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">बंद करें</span>
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                <form id="addEventForm" onSubmit={handleCreateEventSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      कार्यक्रम का शीर्षक (Event Title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="उदा. विशाल पदयात्रा एवं जनसभा"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800">दिनांक (Date)</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800">समय (Time)</label>
                      <input
                        type="text"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        placeholder="सायं 4:00 बजे से"
                        className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">स्थान (Location / Address)</label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      placeholder="उदा. आगरा सदर मैदान / मथुरा ज़िला कार्यालय"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">कार्यक्रम विवरण (Description)</label>
                    <textarea
                      rows={3}
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="कार्यक्रम का उद्देश्य व मुख्य बिंदु लिखें..."
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-orange-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  form="addEventForm"
                  disabled={isCreatingEvent}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreatingEvent ? "कार्यक्रम जोड़ा जा रहा है..." : "कार्यक्रम प्रकाशित करें"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
