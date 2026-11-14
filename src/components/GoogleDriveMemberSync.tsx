import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  Check,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  LogOut,
  AlertCircle,
  X
} from "lucide-react";
import {
  DRIVE_LINK_STORAGE_KEY,
  DriveSyncResult,
  MemberExcelRow,
  downloadMembersExcelLocally,
  getGoogleDriveAccessToken,
  googleDriveSignIn,
  googleDriveSignOut,
  initGoogleDriveAuth
} from "../utils/googleDriveMemberSync";
import { syncMembersToGoogleDrive } from "../utils/googleDriveMemberSync";

interface GoogleDriveMemberSyncProps {
  rows: MemberExcelRow[];
  title?: string;
  description?: string;
  compact?: boolean;
}

export const GoogleDriveMemberSync: React.FC<GoogleDriveMemberSyncProps> = ({
  rows,
  title = "Google Drive Excel रिकॉर्ड (member.xlsx)",
  description = "सफल सदस्यता भुगतान विवरण (MemberName, Mobilenumber, District, MemAmt, Date) को Google Drive की member.xlsx फ़ाइल में सेव करें।",
  compact = false
}) => {
  const [needsAuth, setNeedsAuth] = useState<boolean>(!getGoogleDriveAccessToken());
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<DriveSyncResult | null>(null);
  const [driveLink, setDriveLink] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(DRIVE_LINK_STORAGE_KEY) || "";
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (user, _token) => {
        setGoogleUser(user);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(!getGoogleDriveAccessToken());
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      const { user } = await googleDriveSignIn();
      setGoogleUser(user);
      setNeedsAuth(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Google साइन-इन पूरा नहीं हो सका। कृपया पॉपअप अनुमति जांचें।");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleDriveSignOut();
    setGoogleUser(null);
    setNeedsAuth(true);
  };

  const handleRequestSync = () => {
    setErrorMsg(null);
    if (rows.length === 0) {
      setErrorMsg("सेव करने के लिए कोई सफल सदस्यता भुगतान रिकॉर्ड उपलब्ध नहीं है।");
      return;
    }
    if (needsAuth || !getGoogleDriveAccessToken()) {
      setErrorMsg("कृपया पहले 'Sign in with Google' बटन से Google Drive कनेक्ट करें।");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSync = async () => {
    setShowConfirmModal(false);
    setErrorMsg(null);
    setIsSyncing(true);
    try {
      const result = await syncMembersToGoogleDrive(rows, {
        targetDriveLink: driveLink
      });
      setSyncResult(result);
      setDriveLink(result.webViewLink);
      if (typeof window !== "undefined") {
        localStorage.setItem(DRIVE_LINK_STORAGE_KEY, result.webViewLink);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Google Drive में member.xlsx सेव करने में त्रुटि आई।");
      if (err?.message?.includes("Sign in")) {
        setNeedsAuth(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = () => {
    if (!driveLink) return;
    navigator.clipboard.writeText(driveLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDriveLinkInput = (val: string) => {
    setDriveLink(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(DRIVE_LINK_STORAGE_KEY, val);
    }
  };

  return (
    <div className={`rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 ${compact ? "p-4 space-y-3" : "p-5 space-y-4"} text-xs`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-950">{title}</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{description}</p>
          </div>
        </div>

        {!needsAuth && googleUser && (
          <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[160px]">
              {googleUser.email || googleUser.displayName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-600 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Preview of Fields */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
        <span className="font-bold text-slate-600 mr-1">Excel Columns:</span>
        {["MemberName", "Mobilenumber", "District", "MemAmt", "Date"].map((col) => (
          <span
            key={col}
            className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-900 font-bold"
          >
            {col}
          </span>
        ))}
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black">
          Records: {rows.length}
        </span>
      </div>

      {/* Optional / Live Google Drive Link */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700">
          Google Drive Link (member.xlsx फ़ाइल या फ़ोल्डर लिंक):
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={driveLink}
            onChange={(e) => handleDriveLinkInput(e.target.value)}
            placeholder="https://drive.google.com/file/d/... (खाली छोड़ने पर नई member.xlsx बनेगी)"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-[11px] text-slate-800 outline-none focus:border-emerald-500"
          />
          {driveLink && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
              <a
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Drive</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Official Sign in with Google + Save to Google Drive + Local Excel Download */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {needsAuth ? (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm cursor-pointer transition-all disabled:opacity-60"
          >
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-4 h-4 shrink-0 block"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>{isLoggingIn ? "कनेक्ट हो रहा है..." : "Sign in with Google"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRequestSync}
            disabled={isSyncing || rows.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-xs shadow-md cursor-pointer transition-all"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Google Drive में सेव हो रहा है...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Drive में member.xlsx अपडेट करें</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => rows.length > 0 && downloadMembersExcelLocally(rows)}
          disabled={rows.length === 0}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>member.xlsx डाउनलोड करें</span>
        </button>
      </div>

      {syncResult && (
        <div className="p-3 rounded-xl bg-white border border-emerald-300 text-emerald-950 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-black text-xs text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              Google Drive फ़ाइल ({syncResult.fileName}) सफलतापूर्वक अपडेट हुई! (नए रिकॉर्ड: {syncResult.addedRows}, कुल रिकॉर्ड: {syncResult.totalRows})
            </span>
          </div>
          <div className="text-[11px] font-mono break-all text-slate-700">
            Link:{" "}
            <a
              href={syncResult.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline font-bold"
            >
              {syncResult.webViewLink}
            </a>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mandatory Explicit User Confirmation Dialog before mutating/writing Drive data */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Google Drive अपडेट की पुष्टि करें (Confirm Update)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold">
                क्या आप अपनी Google Drive में <span className="font-mono text-emerald-700">member.xlsx</span> फ़ाइल बनाना/अपडेट करना चाहते हैं?
              </p>
              <p className="text-[11px] text-slate-600">
                नीचे दिए गए <strong>{rows.length}</strong> सफल सदस्यता भुगतान रिकॉर्ड Excel शीट में जोड़े जाएंगे (यदि फ़ाइल पहले से है, तो मौजूदा डेटा सुरक्षित रखते हुए नए रिकॉर्ड जोड़े जाएंगे):
              </p>

              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-black text-slate-800">
                    <tr>
                      <th className="p-2">MemberName</th>
                      <th className="p-2">Mobilenumber</th>
                      <th className="p-2">District</th>
                      <th className="p-2">MemAmt</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {rows.slice(0, 8).map((r, idx) => (
                      <tr key={`${r.Mobilenumber}-${idx}`}>
                        <td className="p-2 font-sans font-bold">{r.MemberName}</td>
                        <td className="p-2">{r.Mobilenumber}</td>
                        <td className="p-2 font-sans">{r.District}</td>
                        <td className="p-2 font-bold text-emerald-700">₹{r.MemAmt}</td>
                        <td className="p-2">{r.Date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 8 && (
                  <div className="p-1.5 text-center text-[10px] font-bold text-slate-500 bg-slate-50">
                    + {rows.length - 8} अन्य रिकॉर्ड...
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow cursor-pointer"
              >
                पुष्टि करें एवं Drive में सेव करें (Confirm & Save)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
