import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productId, rating, comment } = body;

        if (!productId || !rating) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                userId: session.user.id,
                productId,
                rating: Number(rating),
                comment,
            },
        });

        return NextResponse.json({ message: "Review submitted successfully", review });
    } catch (error) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
