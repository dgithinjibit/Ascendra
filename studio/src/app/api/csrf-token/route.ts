/**
 * CSRF Token API Endpoint
 * 
 * Provides CSRF tokens to client-side code.
 * GET /api/csrf-token returns a fresh token.
 */

import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf-protection';

export async function GET() {
  try {
    const token = await getCsrfToken();
    
    return NextResponse.json(
      { 
        token,
        message: 'CSRF token generated successfully',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        message: 'An error occurred while generating the security token.',
      },
      { status: 500 }
    );
  }
}
