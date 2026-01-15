import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import DroneTrackingPreview from '@/components/DroneTrackingPreview';
import CRVRatesCard from '@/components/CRVRatesCard';
import PointsBreakdown from '@/components/PointsBreakdown';
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
        
        {/* CRV Rates & Points Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Earn Cash <span className="text-primary">&</span> Level Up
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <CRVRatesCard />
              <PointsBreakdown showRates={true} />
            </div>
          </div>
        </section>
        
        <CRVCalculator />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
