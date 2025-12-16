import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Fetch the first (and should be only) settings record
        let settings = await prisma.generalSettings.findFirst();

        // If no settings exist, create default settings
        if (!settings) {
            settings = await prisma.generalSettings.create({
                data: {
                    bannerEnabled: false,
                    paymentTimeLimit: 5,
                    printSize: 'a4',
                },
            });
        }

        return new Response(JSON.stringify({
            bannerEnabled: settings.bannerEnabled,
            bannerImage: settings.bannerImage,
            paymentTimeLimit: settings.paymentTimeLimit,
            businessAddress: settings.businessAddress ? JSON.parse(settings.businessAddress) : null,
            businessEmail: settings.businessEmail,
            businessLogoUrl: settings.businessLogoUrl,
            printSize: settings.printSize,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin or superadmin
        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();

        // Get existing settings or create if doesn't exist
        let settings = await prisma.generalSettings.findFirst();

        const updateData: any = {};
        if (data.bannerEnabled !== undefined) updateData.bannerEnabled = data.bannerEnabled;
        if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage;
        if (data.paymentTimeLimit !== undefined) updateData.paymentTimeLimit = data.paymentTimeLimit;
        if (data.businessAddress !== undefined) updateData.businessAddress = JSON.stringify(data.businessAddress);
        if (data.businessEmail !== undefined) updateData.businessEmail = data.businessEmail;
        if (data.businessLogoUrl !== undefined) updateData.businessLogoUrl = data.businessLogoUrl;
        if (data.printSize !== undefined) updateData.printSize = data.printSize;

        if (settings) {
            // Update existing settings
            settings = await prisma.generalSettings.update({
                where: { id: settings.id },
                data: updateData,
            });
        } else {
            // Create new settings
            settings = await prisma.generalSettings.create({
                data: {
                    bannerEnabled: data.bannerEnabled ?? false,
                    bannerImage: data.bannerImage,
                    paymentTimeLimit: data.paymentTimeLimit ?? 5,
                    businessAddress: data.businessAddress ? JSON.stringify(data.businessAddress) : null,
                    businessEmail: data.businessEmail,
                    businessLogoUrl: data.businessLogoUrl,
                    printSize: data.printSize ?? 'a4',
                },
            });
        }

        // Parse businessAddress back to object for response
        const businessAddress = settings.businessAddress ? JSON.parse(settings.businessAddress) : null;

        return new Response(JSON.stringify({
            message: 'Settings updated successfully',
            settings: {
                bannerEnabled: settings.bannerEnabled,
                bannerImage: settings.bannerImage,
                paymentTimeLimit: settings.paymentTimeLimit,
                businessAddress: businessAddress,
                businessEmail: settings.businessEmail,
                businessLogoUrl: settings.businessLogoUrl,
                printSize: settings.printSize,
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
