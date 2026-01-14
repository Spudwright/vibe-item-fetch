import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle, Shield, MapPin, DollarSign, Recycle } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Terms of Service
              </h1>
              <p className="text-muted-foreground">
                Please read these terms carefully before using ReVert LA.
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 space-y-8">
              {/* Intro */}
              <p className="text-muted-foreground">
                This app facilitates pickups of CRV-eligible recyclables (aluminum cans, glass bottles, 
                plastic bottles) in Los Angeles under California's Beverage Container Recycling Program.
              </p>

              {/* CRV Compliance */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-primary" />
                  CRV Compliance
                </h2>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">No Over-Redemption:</strong> Do not submit 
                      non-eligible items (e.g., out-of-state containers without "CA CRV" label) or 
                      falsify quantities. Violations may result in immediate account suspension.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Manual Verification:</strong> Drivers will 
                      inspect items at pickup to confirm eligibility (label, material, condition). 
                      Refunds are based on actual verified amounts per CalRecycle rates (5¢ for 
                      containers under 24oz, 10¢ for 24oz and above).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Fraud Prevention:</strong> Users agree to 
                      comply with CA Penal Code §641.4 (CRV fraud). App logs may be shared with 
                      authorities if misuse is suspected.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Recycle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Redemption Limits:</strong> App does not 
                      handle direct payments. Items are delivered to certified centers like Ammex 
                      Recycling for official redemption, then payouts are processed to users.
                    </div>
                  </li>
                </ul>
              </section>

              {/* Fee Structure */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  Fee Structure
                </h2>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lifetime redemptions under $100:</span>
                    <span className="font-semibold text-foreground">50% service fee</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lifetime redemptions $100+:</span>
                    <span className="font-semibold text-foreground">40% service fee</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Fee covers pickup service, transport to central hub, redemption processing, 
                    and secure payment transfer. Example: A 10¢ bottle yields 5¢ to user (under 
                    $100 tier) or 6¢ to user ($100+ tier).
                  </p>
                </div>
              </section>

              {/* Privacy */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Privacy and Consent
                </h2>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Location Data:</strong> Addresses are shared 
                      only for pickup routing (via Google Maps API). We do not store geolocation 
                      history or sell data to third parties.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Consent:</strong> By using the app, you 
                      consent to data processing per CCPA. You may opt-out via account deletion.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Recycle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Barcode Scanning:</strong> Optional feature. 
                      No images are stored—processing occurs in-browser only.
                    </div>
                  </li>
                </ul>
              </section>

              {/* Disclaimer */}
              <section className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  App provided as-is; no liability for errors, disputes, or misdirected pickups. 
                  For full California recycling rules, visit{' '}
                  <a 
                    href="https://calrecycle.ca.gov/bevcontainer/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    calrecycle.ca.gov/bevcontainer
                  </a>.
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Last updated: January 2024
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
