export interface LoginResult {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export async function loginAdmin(usernameInput: string, passwordInput: string): Promise<LoginResult> {
  const username = usernameInput.trim();
  const password = passwordInput.trim();

  if (!username || !password) {
    return {
      success: false,
      error: "यूज़रनेम और पासवर्ड दोनों आवश्यक हैं।"
    };
  }

  try {
    const res = await fetchWithRetry("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && data?.token) {
      return {
        success: true,
        token: data.token,
        username: data.username || username
      };
    }

    return {
      success: false,
      error: data?.error || (res.ok ? "अवैध एडमिन यूज़रनेम या पासवर्ड।" : `सर्वर त्रुटि (${res.status}): कृपया पुनः प्रयास करें।`)
    };
  } catch (err: any) {
    console.error("Login request failed:", err);
    const detail = err?.message ? ` (${err.message})` : "";
    return {
      success: false,
      error: `सर्वर से संपर्क नहीं हो सका। कृपया पेज रिफ्रेश कर पुनः प्रयास करें${detail}`
    };
  }
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string" || token.trim().length < 10) {
    return false;
  }

  try {
    const res = await fetchWithRetry("/api/admin/verify", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Admin-Token": token
      }
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      return Boolean(data?.success && data?.isAdmin);
    }
  } catch (e) {
    console.warn("Token verification request failed:", e);
  }

  return false;
}
