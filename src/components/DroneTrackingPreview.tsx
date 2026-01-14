import { motion } from 'framer-motion';
import { MapPin, Navigation, Package, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const DroneTrackingPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/request-pickup');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Navigation className="w-4 h-4" />
                Real-Time Tracking
              </span>
              
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Track Your Drone in Real-Time
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8">
                Watch your CANDO ground drone navigate to your location. Get live updates on arrival time and pickup status—all from your phone.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Live Location</h4>
                    <p className="text-muted-foreground text-sm">See exactly where your drone is on an interactive map</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl terracotta-gradient flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">ETA Updates</h4>
                    <p className="text-muted-foreground text-sm">Get accurate arrival time estimates as the drone approaches</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Status Notifications</h4>
                    <p className="text-muted-foreground text-sm">Receive updates when your pickup is collected and delivered</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleGetStarted} variant="eco" size="lg" className="group">
                {user ? 'Schedule a Pickup' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Map Preview Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-muted to-card shadow-elevated overflow-hidden">
                {/* Grid lines to simulate map */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Animated "streets" */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-0 right-0 h-2 bg-primary/10 rounded-full" />
                  <div className="absolute top-2/4 left-0 right-0 h-3 bg-primary/15 rounded-full" />
                  <div className="absolute top-3/4 left-0 right-0 h-2 bg-primary/10 rounded-full" />
                  <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-primary/10 rounded-full" />
                  <div className="absolute left-2/4 top-0 bottom-0 w-3 bg-primary/15 rounded-full" />
                  <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-primary/10 rounded-full" />
                </div>

                {/* Pickup Location Marker */}
                <motion.div
                  className="absolute top-1/4 right-1/4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  viewport={{ once: true }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-secondary rotate-45" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-secondary/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-xs font-medium text-foreground mt-2 text-center">Your Location</p>
                </motion.div>

                {/* Animated Drone */}
                <motion.div
                  className="absolute"
                  initial={{ left: '20%', top: '70%' }}
                  animate={{ 
                    left: ['20%', '35%', '50%', '65%', '75%'],
                    top: ['70%', '55%', '45%', '35%', '25%']
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                >
                  <div className="relative">
                    <motion.div
                      className="w-14 h-14 eco-gradient rounded-full flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                      </svg>
                    </motion.div>
                    {/* Trail effect */}
                    <motion.div
                      className="absolute -z-10 w-3 h-3 bg-primary/40 rounded-full"
                      style={{ left: '-10px', top: '20px' }}
                      animate={{ opacity: [0.4, 0], scale: [1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                {/* Path line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <motion.path
                    d="M 80 280 Q 140 220 200 180 Q 260 140 300 100"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.3 }}
                    viewport={{ once: true }}
                  />
                </svg>
              </div>

              {/* Floating info card */}
              <motion.div
                className="absolute -bottom-4 -left-4 md:left-4 bg-card rounded-xl p-4 shadow-elevated border border-border"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 eco-gradient rounded-full flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Drone Status</p>
                    <p className="font-semibold text-foreground">En Route</p>
                  </div>
                  <div className="ml-4 pl-4 border-l border-border">
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="font-semibold text-primary">3 min</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DroneTrackingPreview;
