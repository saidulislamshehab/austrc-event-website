import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { teamName, institution, teamLeader, email, phone, members, segment } = body;

    if (!teamName || !institution || !teamLeader || !email || !phone || !segment) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Resolve user ID
    let userId: number;

    if (session?.user?.id) {
      userId = parseInt(session.user.id);
    } else {
      // Find or create user by email
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: teamLeader,
            role: "user",
            university: institution,
            phone: phone,
            avatarUrl:
              "https://res.cloudinary.com/dxyhzgrul/image/upload/v1780398181/silver-membership-icon-default-avatar-profile-icon-membership-icon-social-media-user-image-vector-illustration_561158-4215_bdeofc.jpg",
          } as any,
        });
      }
      userId = user.id;
    }

    // 2. Update user's profile details if empty
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone,
        university: institution,
      } as any,
    });

    // 3. Resolve segment
    let dbSegment = await prisma.segment.findFirst({
      where: {
        name: {
          contains: segment,
          mode: "insensitive",
        },
      },
    });

    // Fallback: If not found, check standard list or take first segment
    if (!dbSegment) {
      dbSegment = await prisma.segment.findFirst();
    }

    if (!dbSegment) {
      return NextResponse.json({ message: "No active competition segments found" }, { status: 400 });
    }

    // 4. Check if already registered for this segment
    const existing = await prisma.registration.findFirst({
      where: {
        userId,
        segmentId: dbSegment.id,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: `You are already registered for ${dbSegment.name} (Team: ${existing.teamName})`,
      }, { status: 400 });
    }

    // 5. Generate unique QR Token
    const qrToken = "ARC-" + crypto.randomBytes(6).toString("hex").toUpperCase();

    // 6. Create Registration
    const registration = await prisma.registration.create({
      data: {
        userId,
        segmentId: dbSegment.id,
        teamName,
        status: "pending",
        paymentStatus: "unpaid",
        qrToken,
      },
    });

    // 7. Log recent activity
    await (prisma as any).activity.create({
      data: {
        title: "New registration",
        desc: `Team "${teamName}" registered for ${dbSegment.name}.`,
        icon: "Users",
        color: "text-green-500",
      },
    });

    return NextResponse.json({
      success: true,
      data: registration,
      message: "Registration submitted successfully!",
    }, { status: 201 });
  } catch (error) {
    console.error("Public registration API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
