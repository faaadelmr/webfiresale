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

        // Validate rating bounds (1-5 stars)
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // Check for duplicate review
        const existingReview = await prisma.review.findFirst({
            where: {
                userId: session.user.id,
                productId,
            },
        });

        if (existingReview) {
            return NextResponse.json({ message: "You have already reviewed this product" }, { status: 409 });
        }

        // Sanitize comment (basic XSS prevention)
        const sanitizedComment = comment
            ? comment.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 1000)
            : null;

        // Create review
        const review = await prisma.review.create({
            data: {
                userId: session.user.id,
                productId,
                rating: Math.round(numericRating),
                comment: sanitizedComment,
            },
        });

        return NextResponse.json({ message: "Review submitted successfully", review });
    } catch (error) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
