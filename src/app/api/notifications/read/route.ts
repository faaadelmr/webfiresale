import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userId = session.user.id;
        const reads = await prisma.notificationRead.findMany({
            where: { userId },
            select: { notificationId: true }
        });

        return new Response(JSON.stringify(reads.map(r => r.notificationId)), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error fetching notification reads:", error);
        return new Response(JSON.stringify({ error: 'Failed to fetch reads' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const userId = session.user.id;
        const body = await request.json();
        const { notificationId, notificationIds } = body;

        if (Array.isArray(notificationIds)) {
            // Bulk mark as read
            await prisma.$transaction(
                notificationIds.map(id =>
                    prisma.notificationRead.upsert({
                        where: { userId_notificationId: { userId, notificationId: id } },
                        create: { userId, notificationId: id },
                        update: {}
                    })
                )
            );
        } else if (notificationId) {
            // Single mark as read
            await prisma.notificationRead.upsert({
                where: { userId_notificationId: { userId, notificationId: notificationId } },
                create: { userId, notificationId: notificationId },
                update: {}
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error marking notification read:", error);
        return new Response(JSON.stringify({ error: 'Failed to mark read' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
