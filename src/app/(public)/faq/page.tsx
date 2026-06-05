import FAQPage from "@/components/pages/FAQPage";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { displayOrder: "asc" },
  });

  // console.log(faqs)

  return <FAQPage dbFAQs={faqs} />;
}
