import { Router } from "express";
import { getAdminCredentials, updateAdminCredentials } from "../database/repositories/adminRepository";
import { resetDatabaseToDefaults } from "../database/connection";
import { validateAdminLogin, generateAdminJwt, decodeAndValidateToken, comparePassword } from "../services/authService";
import { verifyAdmin, AuthenticatedRequest } from "../middleware/auth";
import { loginLimiter, mutationLimiter } from "../middleware/rateLimiter";

export const adminRouter = Router();

// POST /api/admin/login
adminRouter.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "यूज़रनेम और पासवर्ड दोनों आवश्यक हैं।"
      });
    }

    const isValid = await validateAdminLogin(String(username), String(password));
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "अवैध एडमिन यूज़रनेम या पासवर्ड।"
      });
    }

    const creds = await getAdminCredentials();
    const token = generateAdminJwt(creds.username);

    return res.json({
      success: true,
      token,
      message: "एडमिन लॉगिन सफल!",
      username: creds.username
    });
  } catch (err: any) {
    console.error("Admin Login Error:", err);
    return res.status(500).json({
      success: false,
      error: "लॉगिन प्रक्रिया में तकनीकी त्रुटि।"
    });
  }
});

// GET /api/admin/verify
adminRouter.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  const adminTokenHeader = req.headers["x-admin-token"] as string | undefined;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (adminTokenHeader) {
    token = adminTokenHeader.trim();
  }

  if (!token) {
    return res.json({ success: false, isAdmin: false });
  }

  const decoded = decodeAndValidateToken(token);
  if (decoded && decoded.role === "admin") {
    return res.json({
      success: true,
      isAdmin: true,
      username: decoded.username
    });
  }

  return res.json({ success: false, isAdmin: false });
});

// POST /api/admin/change-credentials
adminRouter.post("/change-credentials", verifyAdmin, mutationLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "वर्तमान पासवर्ड, नया यूज़रनेम और नया पासवर्ड आवश्यक हैं।"
      });
    }

    const creds = await getAdminCredentials();
    const isCurrentValid = await comparePassword(String(currentPassword), creds.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        error: "वर्तमान पासवर्ड अमान्य/गलत है।"
      });
    }

    const trimmedUser = String(newUsername).trim();
    const trimmedPass = String(newPassword).trim();

    if (trimmedUser.length < 3) {
      return res.status(400).json({
        success: false,
        error: "यूज़रनेम कम से कम 3 अक्षरों का होना चाहिए।"
      });
    }

    if (trimmedPass.length < 6) {
      return res.status(400).json({
        success: false,
        error: "सुरक्षा कारणों से नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।"
      });
    }

    await updateAdminCredentials(trimmedUser, trimmedPass);
    const newToken = generateAdminJwt(trimmedUser);

    return res.json({
      success: true,
      token: newToken,
      message: "एडमिन यूज़रनेम एवं पासवर्ड सफलतापूर्वक अपडेट हो गए!",
      username: trimmedUser
    });
  } catch (err: any) {
    console.error("Change credentials error:", err);
    return res.status(500).json({
      success: false,
      error: "एडमिन यूज़रनेम/पासवर्ड अपडेट में त्रुटि।"
    });
  }
});

// POST /api/admin/reset
adminRouter.post("/reset", verifyAdmin, mutationLimiter, async (_req: AuthenticatedRequest, res) => {
  try {
    await resetDatabaseToDefaults();
    return res.json({
      success: true,
      message: "समस्त डेटाबेस मूल डिफ़ॉल्ट स्थिति में रीसेट हो गया है।"
    });
  } catch (err) {
    console.error("Database reset error:", err);
    return res.status(500).json({
      success: false,
      error: "डेटाबेस रीसेट करने में त्रुटि।"
    });
  }
});
