import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";
import HeroWindow from "@/components/home/HeroWindow";
import TrustBar from "@/components/home/TrustBar";
import Departments from "@/components/home/Departments";
import BestSellers from "@/components/home/BestSellers";
import BrandMarquee from "@/components/home/BrandMarquee";
import ReviewSpotlight from "@/components/home/ReviewSpotlight";
import ClosingCTA from "@/components/home/ClosingCTA";
import PromoProducts from "@/components/home/PromoProducts";
import { getHomepageData } from "@/lib/homepage-data";

export default async function HomePage() {
  const data = await getHomepageData();

  const top = data.productSections.top;
  const closingProduct = data.productSections.featured[0] || top[0] || null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroWindow picks={data.categoryPicks} fallbackSlides={top} />
        <TrustBar />
        <Departments picks={data.categoryPicks} />
        <BestSellers products={top} />
        <PromoProducts promos={data.homePromos} />
        <BrandMarquee brands={data.brands} />
        <ReviewSpotlight review={data.latestReview} />
        <ClosingCTA product={closingProduct} />
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
