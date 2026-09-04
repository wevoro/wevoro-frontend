'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * SCRUM-118: capture the caregiver's actual signature.
 *
 * The first build auto-applied a generated seal with no input from the signer.
 * Alfonza's note in the 2026-08-31 meeting was that it should read as a real
 * signature, so this takes a drawn one — mouse or finger — and that drawing is
 * what gets burned onto the PDF next to the WeVoro mark.
 *
 * Captured once per packet and reused on every document; the caregiver is never
 * asked to draw it again.
 */
interface DrawSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signerName: string;
  onAdopt: (dataUrl: string) => void;
}

const DrawSignatureModal: React.FC<DrawSignatureModalProps> = ({
  open,
  onOpenChange,
  signerName,
  onAdopt,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);
  const [hasInk, setHasInk] = React.useState(false);

  // Size the bitmap to the element so strokes are not stretched, and scale for
  // retina so the line does not look furry.
  const prepare = React.useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.max(1, Math.round(rect.width * dpr));
    c.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1C1C1C';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      prepare();
      setHasInk(false);
    }, 60);
    return () => clearTimeout(t);
  }, [open, prepare]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointFrom(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const adopt = () => {
    const c = canvasRef.current;
    if (!c || !hasInk) return;
    onAdopt(c.toDataURL('image/png'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='text-start text-[20px] font-semibold text-[#1C1C1C]'>
            Draw your signature
          </DialogTitle>
        </DialogHeader>

        <p className='text-[14px] leading-[21px] text-[#5E6864]'>
          Sign with your mouse or finger. This is used on every document in this
          packet, so you only draw it once.
        </p>

        <div className='rounded-xl border border-dashed border-[#008000] bg-[#F7FDF9] p-2'>
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className='h-[180px] w-full cursor-crosshair touch-none rounded-lg bg-white'
          />
          <div className='mt-2 flex items-center justify-between px-1'>
            <span className='text-[12px] text-[#5E6864]'>
              {signerName || 'Your signature'}
            </span>
            <button
              type='button'
              onClick={clear}
              className='text-[13px] font-medium text-[#5E6864] hover:text-[#E94435]'
            >
              Clear
            </button>
          </div>
        </div>

        <p className='text-[12px] leading-[17px] text-[#5E6864]'>
          Your signature is placed on the document alongside the WeVoro mark,
          with the date, your name and a signature ID.
        </p>

        <div className='mt-1 flex items-center justify-end gap-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={adopt}
            disabled={!hasInk}
            className='bg-[#008000] text-white hover:bg-[#016b01]'
          >
            Adopt signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrawSignatureModal;
