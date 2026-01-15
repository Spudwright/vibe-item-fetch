import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import DroneTrackingPreview from '@/components/DroneTrackingPreview';
import CRVRatesCard from '@/components/CRVRatesCard';
import CRVCalculator from '@/components/CRVCalculator';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <DroneTrackingPreview />
        
        {/* CRV Rates Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container max-w-2xl mx-auto">
            <CRVRatesCard />
          </div>
        </section>
        
        <CRVCalculator />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
