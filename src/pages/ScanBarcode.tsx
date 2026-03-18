import { useState, useRef, useCallback, useEffect } from 'react';
import { ScanLine, Camera, CheckCircle2, XCircle, RotateCcw, Keyboard, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidUPC } from '@/lib/crv-utils';
import { supabase } from '@/integrations/supabase/client';

// Known CRV-eligible UPC prefixes (common beverage manufacturers)
const CRV_ELIGIBLE_PREFIXES = [
  '012000', '049000', '078000', '018200', '041800', '085239',
  '016000', '024100', '038900', '048500', '072140', '073360',
  '070847', '036632', '081871', '052000', '050700',
];

type ProductInfo = {
  title: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  imageUrl: string | null;
};

type ScanResult = {
  barcode: string;
  eligible: boolean;
  product: ProductInfo | null;
  loading: boolean;
} | null;

const isBeverageCategory = (category: string | null, title: string | null): boolean => {
  const beverageKeywords = [
    'beverage', 'drink', 'soda', 'water', 'juice', 'tea', 'coffee',
    'energy', 'cola', 'lemonade', 'sparkling', 'beer', 'wine',
    'kombucha', 'smoothie', 'milk', 'shake', 'sport', 'electrolyte',
  ];
  const combined = `${category || ''} ${title || ''}`.toLowerCase();
  return beverageKeywords.some(kw => combined.includes(kw));
};

const checkLocalEligibility = (barcode: string): boolean => {
  const prefix = barcode.substring(0, 6);
  return CRV_ELIGIBLE_PREFIXES.includes(prefix);
};

const ScanBarcode = () => {
  const [mode, setMode] = useState<'choose' | 'camera' | 'manual'>('choose');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const logScan = async (barcode: string, eligible: boolean, product: ProductInfo | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('scan_logs').insert({
        user_id: user?.id || null,
        barcode,
        product_title: product?.title || null,
        product_brand: product?.brand || null,
        product_category: product?.category || null,
        product_size: product?.size || null,
        crv_eligible: eligible,
      } as any);
    } catch {
      // Silent fail — logging shouldn't block UX
    }
  };

  const lookupBarcode = async (barcode: string) => {
    const localEligible = checkLocalEligibility(barcode);
    setResult({ barcode, eligible: localEligible, product: null, loading: true });

    try {
      const { data, error } = await supabase.functions.invoke('lookup-upc', {
        body: { barcode },
      });

      if (error) throw error;

      if (data?.found) {
        const product: ProductInfo = {
          title: data.title,
          brand: data.brand,
          category: data.category,
          size: data.size,
          imageUrl: data.images?.[0] || null,
        };

        const eligible = localEligible || isBeverageCategory(data.category, data.title);
        setResult({ barcode, eligible, product, loading: false });
        logScan(barcode, eligible, product);
      } else {
        setResult({ barcode, eligible: localEligible, product: null, loading: false });
        logScan(barcode, localEligible, null);
      }
    } catch {
      // Lookup failed — fall back to local check
      setResult({ barcode, eligible: localEligible, product: null, loading: false });
    }
  };

  const startCamera = async () => {
    setMode('camera');
    setScanning(true);
    setCameraError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8'] });
        intervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                stopCamera();
                setScanning(false);
                lookupBarcode(code);
              }
            } catch {
              // Detection frame failed, continue
            }
          }
        }, 300);
      } else {
        setTimeout(() => {
          setCameraError('Your browser doesn\'t support automatic barcode detection. Please enter the code manually.');
          setScanning(false);
          stopCamera();
          setMode('manual');
        }, 2000);
      }
    } catch {
      setCameraError('Unable to access camera. Please check permissions or enter the code manually.');
      setScanning(false);
      setMode('manual');
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    if (!isValidUPC(manualCode)) {
      setResult({ barcode: manualCode, eligible: false, product: null, loading: false });
      return;
    }
    lookupBarcode(manualCode);
  };

  const resetScanner = () => {
    stopCamera();
    setResult(null);
    setManualCode('');
    setScanning(false);
    setCameraError(null);
    setMode('choose');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-14 h-14 eco-gradient rounded-2xl flex items-center justify-center shadow-eco mb-4">
                <ScanLine className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Scan Container
              </h1>
              <p className="text-muted-foreground text-sm">
                Scan or enter a barcode to check if your container is CRV-eligible.
              </p>
            </div>

            {/* Result Display */}
            {result && (
              <div className="mb-6 animate-fade-in">
                {result.loading ? (
                  <div className="bg-card rounded-2xl shadow-card p-8 text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Looking up product info…</p>
                  </div>
                ) : result.eligible ? (
                  <div className="bg-card rounded-2xl shadow-card border-2 border-primary p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">CRV Eligible!</h2>

                    {/* Product details */}
                    {result.product ? (
                      <div className="mb-4 space-y-1">
                        {result.product.imageUrl && (
                          <img
                            src={result.product.imageUrl}
                            alt={result.product.title || 'Product'}
                            className="w-20 h-20 object-contain mx-auto rounded-lg mb-2"
                          />
                        )}
                        {result.product.title && (
                          <p className="text-sm font-medium text-foreground">{result.product.title}</p>
                        )}
                        {result.product.brand && (
                          <p className="text-xs text-muted-foreground">Brand: {result.product.brand}</p>
                        )}
                        {result.product.size && (
                          <p className="text-xs text-muted-foreground">Size: {result.product.size}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-2">Beverage Container (recognized manufacturer)</p>
                    )}

                    <p className="text-xs text-muted-foreground mb-4">UPC: {result.barcode}</p>
                    <div className="flex gap-3">
                      <Button variant="eco" className="flex-1" onClick={() => window.location.href = '/request'}>
                        Request Pickup
                      </Button>
                      <Button variant="outline" size="icon" onClick={resetScanner}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl shadow-card border-2 border-destructive/50 p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <XCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">Not CRV Eligible</h2>

                    {/* Still show product info if found */}
                    {result.product?.title && (
                      <p className="text-sm font-medium text-foreground mb-1">{result.product.title}</p>
                    )}

                    <p className="text-sm text-muted-foreground mb-2">
                      This container doesn't appear to qualify for California CRV redemption.
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">UPC: {result.barcode}</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={resetScanner}>
                        <RotateCcw className="w-4 h-4" />
                        Scan Another
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode Selection */}
            {!result && mode === 'choose' && (
              <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
                <Button variant="eco" className="w-full h-14 text-base" onClick={startCamera}>
                  <Camera className="w-5 h-5" />
                  Scan with Camera
                </Button>
                <Button variant="outline" className="w-full h-14 text-base" onClick={() => setMode('manual')}>
                  <Keyboard className="w-5 h-5" />
                  Enter Code Manually
                </Button>
              </div>
            )}

            {/* Camera View */}
            {!result && mode === 'camera' && (
              <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-black">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-primary rounded-xl relative">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Point your camera at the barcode</p>
                  <Button variant="outline" onClick={resetScanner}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {!result && mode === 'manual' && (
              <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
                {cameraError && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{cameraError}</p>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">UPC Barcode (12 digits)</label>
                  <Input
                    placeholder="e.g. 012000001611"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    maxLength={12}
                    inputMode="numeric"
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <Button
                  variant="eco"
                  className="w-full"
                  onClick={handleManualSubmit}
                  disabled={manualCode.length < 12}
                >
                  <ScanLine className="w-4 h-4" />
                  Check Eligibility
                </Button>
                <Button variant="ghost" className="w-full" onClick={resetScanner}>
                  ← Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScanBarcode;
