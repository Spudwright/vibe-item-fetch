import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import DroneTrackingPreview from '@/components/DroneTrackingPreview';
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
        <CRVCalculator />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
