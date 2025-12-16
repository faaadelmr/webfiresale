import { NextRequest } from 'next/server';
import { BackgroundJobManager } from '@/lib/background-jobs';

export async function GET(request: NextRequest) {
  try {
    const result = await BackgroundJobManager.processJobs();

    return Response.json({
      success: result.success,
      message: result.message,
      processedExpiredItems: result.processedExpiredItems
    });
  } catch (error) {
    console.error('Error processing background jobs:', error);
    return Response.json({
      success: false,
      message: 'Error processing background jobs',
      error: (error as Error).message
    }, { status: 500 });
  }
}