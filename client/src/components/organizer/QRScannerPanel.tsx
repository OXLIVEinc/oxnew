import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode === 'camera' && eventId) {
      startCamera();
    } else {
      stopCamera();
    }
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
          handleCheckIn(decodedText);
          stopCamera();
          setMode('manual');
        },
        () => {} // ignore errors during scanning
      );
    } catch (err) {
      toast({ title: 'Camera Error', description: 'Could not access camera. Try manual entry.', variant: 'destructive' });
      setMode('manual');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleCheckIn = async (qrCode: string) => {
    if (!eventId || scanning) return;
    setScanning(true);
    setResult(null);

    const normalizedCode = qrCode.trim().replace(/\s+/g, '');

    // Try matching by QR code first, then by check-in code
    let ticket: any = null;
    
    const { data: qrTicket } = await supabase
      .from('tickets')
      .select('id, user_id, checked_in, attendee_name, check_in_code')
      .eq('event_id', eventId)
      .ilike('qr_code', normalizedCode.toLowerCase())
      .maybeSingle();
    
    ticket = qrTicket;

    if (!ticket) {
      // Try check_in_code match (case-insensitive)
      const { data: codeTicket } = await supabase
        .from('tickets')
        .select('id, user_id, checked_in, attendee_name, check_in_code')
        .eq('event_id', eventId)
        .ilike('check_in_code', normalizedCode)
        .maybeSingle();
      ticket = codeTicket;
    }

    if (!ticket) {
      setResult({ success: false, message: 'Invalid ticket code. No matching ticket found.' });
      setScanning(false);
      return;
    }

    if (ticket.checked_in) {
      setResult({ success: false, message: 'This ticket has already been checked in.' });
      setScanning(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id);

    if (updateError) {
      setResult({ success: false, message: 'Failed to check in. Please try again.' });
    } else {
      const guestName = ticket.attendee_name || 'Guest';
      setResult({
        success: true,
        message: 'Check-in successful!',
        name: guestName,
      });
    }

    setManualCode('');
    setScanning(false);
  };

  if (!eventId) {
    return <div className="py-12 text-center text-gray-500">Select an event from the Events tab first</div>;
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-0 mb-6">
        <button
          onClick={() => setMode('camera')}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-[11px] uppercase font-medium border ${
            mode === 'camera' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black border-black'
          }`}
        >
          <Camera size={14} /> Camera Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-[11px] uppercase font-medium border border-l-0 ${
            mode === 'manual' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black border-black'
          }`}
        >
          <Keyboard size={14} /> Manual Entry
        </button>
      </div>

      {/* Camera Mode */}
      {mode === 'camera' && (
        <div className="border border-black p-4">
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <p className="text-center text-sm text-gray-500 mt-4">Point camera at QR code</p>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="border border-black p-6 space-y-4">
          <label className="block text-[11px] uppercase font-medium">Enter Ticket Code</label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste or type ticket code"
            className="w-full border border-black px-4 py-3 text-sm focus:outline-none"
          />
          <button
            onClick={() => handleCheckIn(manualCode)}
            disabled={scanning || !manualCode.trim()}
            className="w-full bg-[#1A1A1A] text-white px-6 py-3 text-[11px] uppercase font-medium hover:bg-[#FA76FF] hover:text-black transition-colors disabled:opacity-50"
          >
            {scanning ? 'Checking...' : 'Check In'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-6 border p-6 text-center ${
          result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
        }`}>
          <div className={`text-4xl mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {result.success ? '✓' : '✕'}
          </div>
          {result.name && <div className="text-lg font-medium mb-1">{result.name}</div>}
          <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
};
