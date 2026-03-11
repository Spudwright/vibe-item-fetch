import { Package, Truck, Building2, Wallet } from 'lucide-react';

const steps = [
  {
    icon: Package,
    title: 'Request Pickup',
    description: 'Scan your bottles and cans, enter your address, and schedule a convenient pickup time.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Truck,
    title: 'We Collect',
    description: 'An autonomous driving vehicle comes to your location and collects your containers.',
    color: 'bg-secondary/20 text-secondary-foreground',
  },
  {
    icon: Building2,
    title: 'Redemption',
    description: 'Items are delivered to Ammex Recycling in LA and redeemed for full CRV value.',
    color: 'bg-accent/20 text-accent-foreground',
  },
  {
    icon: Wallet,
    title: 'Get Paid',
    description: 'Your share (50-60% of CRV) is sent directly to you. More volume = higher percentage!',
    color: 'bg-primary/10 text-primary',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How CanDo Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From your doorstep to cash in your pocket—we handle everything in between.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-6 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-shadow group"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full eco-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shadow-eco">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (hidden on last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* Fee Explanation */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h3 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
              <span className="crv-badge">CRV</span>
              Transparent Pricing
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p>
                  <strong className="text-foreground">Under $100 redeemed:</strong> We keep 50% of CRV value 
                  (e.g., 10¢ bottle → you get 5¢)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <p>
                  <strong className="text-foreground">$100+ redeemed:</strong> Our fee drops to 40% 
                  (e.g., 10¢ bottle → you get 6¢)
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Fee covers pickup, transport, redemption processing, and secure payment transfer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
