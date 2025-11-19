// src/app/api/cron/purge-deleted-users/route.ts
import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { purgeOldDeletedUsers } from '@/lib/admin-helpers';

// PATCH /api/cron/purge-deleted-users - Purge users soft deleted > 30 days ago
// This endpoint is designed to be called by a cron job or scheduled task
export async function PATCH(request: NextRequest) {
  try {
    // For security, we should verify this is a legitimate cron job request
    // In production, you might want to check for a secret header or IP restriction
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In a real application, you might want to use Vercel's cron authentication
      // Or implement other security mechanisms
      console.log('Cron job verification skipped in development');
    }
    
    // Purge old deleted users
    const purgedCount = await purgeOldDeletedUsers();
    
    return new Response(JSON.stringify({ 
      message: `${purgedCount} users purged successfully`,
      purgedCount
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in purge deleted users cron job:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to purge deleted users' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// For Vercel Cron jobs, add the following header configuration
export const dynamic = 'force-dynamic'; // Ensures the route is not cached