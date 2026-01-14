import { ArrowRight, Recycle, DollarSign, Truck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 eco-gradient-light" />
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <MapPin className="w-4 h-4" />
            Now serving Los Angeles County
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in text-balance">
            Turn Your Bottles Into{' '}
            <span className="relative">
              <span className="relative z-10 text-primary">Cash</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-accent/40 -z-0 rounded" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in text-balance">
            We pick up your CRV-eligible recyclables, redeem them at certified LA centers, 
            and send you the cash. No sorting, no driving, no hassle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Link to="/request">
              <Button variant="eco" size="xl" className="w-full sm:w-auto">
                Schedule a Pickup
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/driver">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <Truck className="w-5 h-5" />
                Become a Driver
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto animate-fade-in">
            <div className="p-4 rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <Recycle className="w-6 h-6 text-primary" />
              </div>
              <p className="font-display text-2xl md:text-3xl font-bold text-foreground">50K+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Items Recycled</p>
            </div>
            <div className="p-4 rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/20">
                <DollarSign className="w-6 h-6 text-accent-foreground" />
              </div>
              <p className="font-display text-2xl md:text-3xl font-bold text-foreground">$12K+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Paid to Users</p>
            </div>
            <div className="p-4 rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary/30">
                <Truck className="w-6 h-6 text-secondary-foreground" />
              </div>
              <p className="font-display text-2xl md:text-3xl font-bold text-foreground">200+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Active Drivers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
