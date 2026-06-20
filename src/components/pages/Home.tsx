import { About } from '@/components/About';
import { CTABanner } from '@/components/CTABanner';
import { FAQ } from '@/components/FAQ';
import { Hero } from '@/components/Hero';
import { Highlights } from '@/components/Highlights';
import { PrizePool } from '@/components/PrizePool';
import { Segments } from '@/components/Segments';
import { SponsorsCarousel } from '@/components/SponsorsCarousel';
import { Testimonials } from '@/components/Testimonials';
import { Ticker } from '@/components/Ticker';

export default function Home({
  dbSegments,
  dbSponsors,
  dbFAQs,
  dbPhotos,
  dbReviews,
}: {
  dbSegments?: any[];
  dbSponsors?: any;
  dbFAQs?: any[];
  dbPhotos?: string[];
  dbReviews?: any[];
}) {
  return (
    <>
      <Hero />
      <Ticker />
      <Segments dbSegments={dbSegments} />
      <About />
      <PrizePool />
      <SponsorsCarousel />
      <Highlights dbPhotos={dbPhotos} />
      <Testimonials dbTestimonials={dbReviews} />
      <CTABanner />
      <FAQ dbFAQs={dbFAQs} />
    </>
  );
}