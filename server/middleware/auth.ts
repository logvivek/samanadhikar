import { Request, Response, NextFunction } from "express";
import { JwtAdminPayload } from "../types";
import { generateAdminJwt, decodeAndValidateToken, verifyAdminToken } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  adminUser?: JwtAdminPayload;
}

export { generateAdminJwt, decodeAndValidateToken };

/**
 * Middleware to verify Admin JWT Token from Authorization or X-Admin-Token headers
 */
export function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminTokenHeader = req.headers["x-admin-token"] as string | undefined;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (adminTokenHeader) {
    token = adminTokenHeader.trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "एडमिन प्रमाणीकरण टोकन अनुपस्थित है। कृपया पुनः एडमिन लॉगिन करें।"
    });
  }

  try {
    const decoded = verifyAdminToken(token);
    if (decoded && decoded.role === "admin") {
      req.adminUser = decoded;
      return next();
    }
    return res.status(403).json({
      success: false,
      error: "अमान्य एडमिन टोकन अधिकार।"
    });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "एडमिन सत्र (Session) समाप्त हो गया है। कृपया पुनः लॉगिन करें।"
      });
    }
    return res.status(401).json({
      success: false,
      error: "अमान्य एडमिन टोकन। सुरक्षा कारणों से अनुरोध अस्वीकृत किया गया।"
    });
  }
}
