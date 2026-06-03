import Home from "@/components/pages/Home";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const segments = await prisma.segment.findMany({
    where: { status: "active" },
    orderBy: { id: "asc" },
  });

  const sponsors = await prisma.sponsor.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const pastEvents = await prisma.pastEvent.findMany({
    orderBy: { date: "desc" },
  });

  const faqs = await prisma.fAQ.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const groupedSponsors = sponsors.length > 0 ? {
    gold: sponsors.filter((s) => s.tier === "gold"),
    silver: sponsors.filter((s) => s.tier === "silver"),
    bronze: sponsors.filter((s) => s.tier === "bronze"),
  } : undefined;

  const photos = pastEvents.length > 0
    ? (pastEvents.map((evt) => evt.imageUrl).filter(Boolean) as string[])
    : undefined;

  return (
    <Home
      dbSegments={segments}
      dbSponsors={groupedSponsors}
      dbPhotos={photos}
      dbFAQs={faqs}
    />
  );
}
