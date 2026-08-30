import rateLimit from "express-rate-limit";
import { CONFIG } from "../config";

/**
 * Strict rate limiter for Admin Login to prevent brute-force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMITS.LOGIN_WINDOW_MS,
  max: CONFIG.RATE_LIMITS.LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: "बहुत अधिक लॉगिन प्रयास। सुरक्षा कारणों से कृपया 15 मिनट बाद पुनः प्रयास करें।"
  }
});

/**
 * Rate limiter for sensitive admin state mutations (password changes, database resets)
 */
export const mutationLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMITS.MUTATION_WINDOW_MS,
  max: CONFIG.RATE_LIMITS.MUTATION_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: "अनुरोध सीमा पार हो गई है। कृपया थोड़ी देर बाद प्रयास करें।"
  }
});

/**
 * Rate limiter for donation submissions and Cashfree order generation
 */
export const donationLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMITS.DONATION_WINDOW_MS,
  max: CONFIG.RATE_LIMITS.DONATION_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: "अत्यधिक भुगतान अनुरोध। कृपया कुछ समय प्रतीक्षा करें।"
  }
});

/**
 * General rate limiter for public API endpoints
 */
export const publicLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMITS.PUBLIC_API_WINDOW_MS,
  max: CONFIG.RATE_LIMITS.PUBLIC_API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: "सर्वर व्यस्त है। कृपया 1 मिनट बाद पुनः प्रयास करें।"
  }
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: "फ़ाइल अपलोड सीमा समाप्त। कृपया 10 मिनट बाद पुनः प्रयास करें।"
  }
});
