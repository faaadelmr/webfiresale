import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
    try {
        const settings = await prisma.generalSettings.findFirst();
        return NextResponse.json({ theme: settings?.theme || 'light' });
    } catch (error) {
        console.error('Error fetching theme:', error);
        return NextResponse.json(
            { error: 'Failed to fetch theme' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Authorization check - only admin/superadmin can change global theme
        if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { theme } = await req.json();

        if (!theme) {
            return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
        }

        // Get existing settings or create new
        const existingSettings = await prisma.generalSettings.findFirst();

        let updatedSettings;
        if (existingSettings) {
            updatedSettings = await prisma.generalSettings.update({
                where: { id: existingSettings.id },
                data: { theme }
            });
        } else {
            updatedSettings = await prisma.generalSettings.create({
                data: { theme }
            });
        }

        return NextResponse.json({
            success: true,
            theme: updatedSettings.theme,
            message: 'Global theme updated successfully'
        });

    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json(
            { error: 'Failed to update theme' },
            { status: 500 }
        );
    }
}
