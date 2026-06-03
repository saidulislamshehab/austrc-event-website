import PastEventsPage from "@/components/pages/PastEventsPage";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const pastEvents = await prisma.pastEvent.findMany({
    orderBy: { date: "desc" },
  });

  return <PastEventsPage dbPastEvents={pastEvents} />;
}
