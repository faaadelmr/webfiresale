// background-jobs.ts - Server-side background job manager
// This file provides functions to process expired items and cancelled orders
// These should be run periodically via a scheduled task or cron job

import prisma from '@/lib/prisma';

export class BackgroundJobManager {
  /**
   * Process expired items (flash sales and auctions) and cancelled orders.
   * This function should be called periodically by an external scheduler.
   */
  static async processJobs() {
    try {
      console.log('Running background jobs...');

      // Process expired flash sales and auctions
      const expiredItemsCount = await this.processExpiredItems();
      console.log(`Processed ${expiredItemsCount} expired items`);

      // Process expired reservations
      const expiredReservationsCount = await this.processExpiredReservations();
      console.log(`Processed ${expiredReservationsCount} expired reservations`);

      console.log('Background jobs completed successfully');

      return {
        success: true,
        processedExpiredItems: expiredItemsCount,
        processedExpiredReservations: expiredReservationsCount,
        message: 'Background jobs completed successfully'
      };
    } catch (error) {
      console.error('Error running background jobs:', error);
      return {
        success: false,
        processedExpiredItems: 0,
        error: (error as Error).message,
        message: 'Error running background jobs'
      };
    }
  }

  /**
   * Process expired flash sales and auctions
   * - Mark them as ended/expired
   * - Restore unsold stock to product inventory
   */
  static async processExpiredItems(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    // Process expired flash sales
    const expiredFlashSales = await prisma.flashSale.findMany({
      where: {
        endDate: { lt: now },
        status: 'active'
      }
    });

    for (const flashSale of expiredFlashSales) {
      const unsoldQuantity = flashSale.limitedQuantity - flashSale.sold;

      await prisma.$transaction(async (tx) => {
        // Update flash sale status to ended
        await tx.flashSale.update({
          where: { id: flashSale.id },
          data: { status: 'ended' }
        });

        // Restore unsold quantity to product
        if (unsoldQuantity > 0) {
          await tx.product.update({
            where: { id: flashSale.productId },
            data: {
              quantityAvailable: {
                increment: unsoldQuantity
              }
            }
          });
          console.log(`Restored ${unsoldQuantity} units to product ${flashSale.productId} from flash sale ${flashSale.id}`);
        }
      });

      processedCount++;
    }

    // Process expired auctions
    const expiredAuctions = await prisma.auction.findMany({
      where: {
        endDate: { lt: now },
        status: 'active'
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    for (const auction of expiredAuctions) {
      await prisma.$transaction(async (tx) => {
        if (auction.bids.length > 0) {
          // Auction ended with bids - mark as sold
          await tx.auction.update({
            where: { id: auction.id },
            data: {
              status: 'sold',
              currentBid: auction.bids[0].amount
            }
          });
          console.log(`Auction ${auction.id} ended with winner, marked as sold`);
        } else {
          // Auction ended without bids - restore stock
          await tx.auction.update({
            where: { id: auction.id },
            data: { status: 'ended' }
          });

          await tx.product.update({
            where: { id: auction.productId },
            data: {
              quantityAvailable: {
                increment: 1 // Auctions reserve 1 item
              }
            }
          });
          console.log(`Restored 1 unit to product ${auction.productId} from auction ${auction.id} (no bids)`);
        }
      });

      processedCount++;
    }

    return processedCount;
  }

  /**
   * Process expired stock reservations
   */
  static async processExpiredReservations(): Promise<number> {
    const now = new Date();

    const result = await prisma.stockReservation.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: now }
      },
      data: {
        status: 'expired'
      }
    });

    return result.count;
  }

  /**
   * Schedule background jobs to run automatically.
   * Note: In a real application, you would use a proper job scheduler
   * like cron jobs, or a service like Cloud Scheduler.
   * This is for demonstration purposes only.
   */
  static scheduleJobs() {
    // Process immediately when scheduled
    this.processJobs();

    // Then run every 5 minutes
    setInterval(async () => {
      await this.processJobs();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// For server-side applications, you would initialize the schedule on app startup
// However, in a serverless environment like Next.js, we can't maintain long-running processes
// So the preferred approach is to use external schedulers to call the API endpoint