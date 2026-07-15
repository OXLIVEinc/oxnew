// client/src/components/organizer/QRScannerPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { checkInTicket, checkInByCode } from '@/lib/api/tickets';
import { getApiErrorMessage } from '@/lib/api/http';
import { useToast } from '@/hooks/use-toast';
import { Camera, Keyboard } from 'lucide-react';

interface QRScannerPanelProps {
  eventId: string | null;
}

export const QRScannerPanel: React.FC<QRScannerPanelProps> = ({ eventId }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => () => { stopCamera(); }, []);

  useEffect(() => {
    if (mode === 'camera' && eventId) startCamera();
    else stopCamera();
  }, [mode, eventId]);

  const startCamera = async () => {
    if (!scannerRef.current) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleTokenCheckIn(decodedText);
          stopCamera();
          setMode('manual');
        },
        () => {}
      );
    } catch {
      toast({ title: 'Camera Error', description: 'Could not access camera. Try manual entry.', variant: 'destructive' });
      setMode('manual');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); html5QrCodeRef.current = null; } catch { /* noop */ }
    }
  };

  const handleTokenCheckIn = async (token: string) => {
    if (!eventId || scanning) return;
    setScanning(true);
    setResult(null);
    try {
      const ticket = await checkInTicket(token);
      setResult({ success: true, message: 'Check-in successful!', name: (ticket as any).attendeeName || 'Guest' });
    } catch (err) {
      setResult({ success: false, message: getApiErrorMessage(err, 'Invalid or already used ticket.') });
    } finally {
      setScanning(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!eventId || scanning || !manualCode.trim()) return;
    setScanning(true);
    setResult(null);
    try {
      const ticket = await checkInByCode(manualCode.trim());
      setResult({ success: true, message: 'Check-in successful!', name: (ticket as any).attendeeName || 'Guest' });
    } catch (err) {
      setResult({ success: false, message: getApiErrorMessage(err, 'Invalid ticket code.') });
    } finally {
      setManualCode('');
      setScanning(false);
    }
  };

  if (!eventId) {
    return <div className="py-12 text-center text-muted-foreground">Select an event from the Events tab first</div>;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-0 mb-6">
        <button
          onClick={() => setMode('camera')}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-[11px] uppercase font-medium border ${
            mode === 'camera' ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'
          }`}
        >
          <Camera size={14} /> Camera Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-[11px] uppercase font-medium border border-l-0 ${
            mode === 'manual' ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'
          }`}
        >
          <Keyboard size={14} /> Manual Entry
        </button>
      </div>

      {mode === 'camera' && (
        <div className="border border-border p-4 rounded-lg">
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <p className="text-center text-sm text-muted-foreground mt-4">Point camera at QR code</p>
        </div>
      )}

      {mode === 'manual' && (
        <div className="border border-border p-6 space-y-4 rounded-lg">
          <label className="block text-[11px] uppercase font-medium">Enter Check-in Code</label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. OX-A1B2C3"
            className="w-full border border-border rounded px-4 py-3 text-sm focus:outline-none bg-background"
          />
          <button
            onClick={handleManualCheckIn}
            disabled={scanning || !manualCode.trim()}
            className="w-full bg-foreground text-background px-6 py-3 text-[11px] uppercase font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {scanning ? 'Checking...' : 'Check In'}
          </button>
        </div>
      )}

      {result && (
        <div className={`mt-6 border p-6 text-center rounded-lg ${result.success ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}`}>
          <div className={`text-4xl mb-2 ${result.success ? 'text-green-600' : 'text-destructive'}`}>
            {result.success ? '✓' : '✕'}
          </div>
          {result.name && <div className="text-lg font-medium mb-1">{result.name}</div>}
          <div className={`text-sm ${result.success ? 'text-green-700' : 'text-destructive'}`}>{result.message}</div>
        </div>
      )}
    </div>
  );
};