import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FEE_MAP: Record<string, number> = {
  "Robo Soccer": 500,
  "Line Follower": 400,
  "Drone Race": 1000,
  "Sumo Bot": 600,
  "Combat Robotics": 1500,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("DASHBOARD API SESSION:", JSON.stringify(session));
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Basic Stats
    const totalRegistrations = await prisma.registration.count();
    const pendingApprovals = await prisma.registration.count({
      where: { status: "pending" },
    });
    const activeSegments = await prisma.segment.count({
      where: { status: "active" },
    });

    // 2. Revenue Calculation (Paid registrations * Segment fee)
    const paidRegistrations = await prisma.registration.findMany({
      where: { paymentStatus: "paid" },
      select: {
        segment: {
          select: {
            name: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    paidRegistrations.forEach((reg) => {
      const segmentName = reg.segment?.name || "";
      const fee = FEE_MAP[segmentName] ?? 500;
      totalRevenue += fee;
    });

    // 3. Additional Info
    const totalUsers = await prisma.user.count();
    const unpaidRegistrations = await prisma.registration.count({
      where: { paymentStatus: "unpaid" },
    });
    const totalSponsors = await prisma.sponsor.count();
    const totalFAQ = await prisma.fAQ.count();

    // 4. Registration Trends (Last 7 Days)
    const registrationTrends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      const count = await prisma.registration.count({
        where: {
          createdAt: {
            gte: d,
            lt: nextDay,
          },
        },
      });

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      registrationTrends.push({
        name: dayName,
        registrations: count,
      });
    }

    // 5. Recent Activities
    const recentActivities = await prisma.activity.findMany({
      orderBy: { time: "desc" },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalRegistrations,
        totalRevenue,
        pendingApprovals,
        activeSegments,
      },
      additionalInfo: {
        totalUsers,
        unpaidRegistrations,
        totalSponsors,
        totalFAQ,
      },
      registrationTrends,
      recentActivities,
    });
  } catch (error) {
    console.error("Failed to fetch admin dashboard stats:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
