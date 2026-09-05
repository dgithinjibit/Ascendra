/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * Tokens are generated per-session and validated on state-changing requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Get or create CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!token) {
    token = generateCsrfToken();
    // Set cookie with secure flags
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }
  
  return token;
}

/**
 * Validate CSRF token from request
 * 
 * Checks both header and request body for token
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const expectedToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!expectedToken) {
    return false;
  }
  
  // Check header first (preferred method)
  let providedToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  // If not in header, check request body (for form submissions)
  if (!providedToken && request.body) {
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        providedToken = body._csrf;
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        providedToken = formData.get('_csrf') as string;
      }
    } catch (error) {
      // If body parsing fails, token is invalid
      return false;
    }
  }
  
  if (!providedToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedToken),
    Buffer.from(providedToken)
  );
}

/**
 * CSRF protection middleware for API routes
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await withCsrfProtection(request);
 *   if (!csrfCheck.success) {
 *     return csrfCheck.response;
 *   }
 *   
 *   // Your API logic here
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export async function withCsrfProtection(
  request: NextRequest
): Promise<{ success: boolean; response?: NextResponse }> {
  // Only validate CSRF for state-changing methods
  const method = request.method.toUpperCase();
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!stateChangingMethods.includes(method)) {
    return { success: true };
  }
  
  // Skip CSRF for API routes that use other authentication (e.g., API keys)
  const hasApiKey = request.headers.get('x-api-key');
  if (hasApiKey) {
    return { success: true };
  }
  
  const isValid = await validateCsrfToken(request);
  
  if (!isValid) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
        },
        { status: 403 }
      ),
    };
  }
  
  return { success: true };
}

/**
 * Create a CSRF-protected API route handler
 * 
 * Usage:
 * ```typescript
 * export const POST = withCsrfProtectedHandler(async (request: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCsrfProtectedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const csrfCheck = await withCsrfProtection(request);
    
    if (!csrfCheck.success && csrfCheck.response) {
      return csrfCheck.response;
    }
    
    return handler(request);
  };
}

/**
 * React hook to get CSRF token for client-side requests
 * 
 * Usage in component:
 * ```typescript
 * const csrfToken = await fetch('/api/csrf-token').then(r => r.json()).then(d => d.token);
 * 
 * // Include in fetch headers
 * fetch('/api/some-action', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': csrfToken,
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getCsrfTokenForClient(): string {
  // Extract token from cookie (accessible in browser)
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith(`${CSRF_TOKEN_COOKIE}=`));
  
  if (!csrfCookie) {
    throw new Error('CSRF token not found. Please refresh the page.');
  }
  
  return csrfCookie.split('=')[1];
}

/**
 * API route to get CSRF token
 * 
 * Create this file: app/api/csrf-token/route.ts
 * ```typescript
 * import { NextResponse } from 'next/server';
 * import { getCsrfToken } from '@/lib/csrf-protection';
 * 
 * export async function GET() {
 *   const token = await getCsrfToken();
 *   return NextResponse.json({ token });
 * }
 * ```
 */
