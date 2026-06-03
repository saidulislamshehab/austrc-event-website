import SponsorsPage from "@/components/pages/SponsorsPage";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const groupedSponsors = sponsors.length > 0 ? {
    gold: sponsors.filter((s) => s.tier === "gold"),
    silver: sponsors.filter((s) => s.tier === "silver"),
    bronze: sponsors.filter((s) => s.tier === "bronze"),
  } : undefined;

  return <SponsorsPage dbSponsors={groupedSponsors} />;
}
