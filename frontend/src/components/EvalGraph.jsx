import React, { useRef, useEffect } from 'react';

export default function EvalGraph({ moves, currentPly, onSeekPly }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !moves || moves.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Midline (0.0 evaluation)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    const stepX = width / moves.length;
    const points = [];

    // Calculate curve points
    moves.forEach((m, idx) => {
      const x = idx * stepX + stepX / 2;
      const prob = m.win_prob_after || 50;
      // 100% win prob -> y = 4px, 0% win prob -> y = height - 4px
      const y = height - (prob / 100) * (height - 8) - 4;
      points.push({ x, y, classification: m.classification, ply: m.ply });
    });

    // Draw shaded area under / above curve
    // White advantage area (above midY)
    ctx.beginPath();
    ctx.moveTo(0, midY);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(width, midY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw main evaluation line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Key Moment dots along the curve
    points.forEach((pt) => {
      if (['brilliant', 'great', 'blunder', 'miss'].includes(pt.classification)) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        if (pt.classification === 'brilliant') {
          ctx.fillStyle = '#1baaa0'; // cyan
        } else if (pt.classification === 'great') {
          ctx.fillStyle = '#5c8bb0'; // blue
        } else {
          ctx.fillStyle = '#fa412d'; // red
        }
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Current ply vertical cursor
    if (currentPly > 0 && currentPly <= points.length) {
      const curPt = points[currentPly - 1];
      ctx.strokeStyle = '#81b64c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curPt.x, 0);
      ctx.lineTo(curPt.x, height);
      ctx.stroke();

      // Outer glowing cursor dot
      ctx.beginPath();
      ctx.arc(curPt.x, curPt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#81b64c';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [moves, currentPly]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !moves || moves.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ply = Math.max(1, Math.min(moves.length, Math.round((clickX / rect.width) * moves.length)));
    onSeekPly(ply);
  };

  return (
    <div 
      className="p-3.5 rounded-xl border shadow-md"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
          Evaluation Advantage Flow
        </span>
        <span className="text-[10px] text-stone-400 font-medium">Click chart to seek</span>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={90}
        onClick={handleCanvasClick}
        className="w-full h-[90px] block cursor-crosshair rounded-lg bg-black/20"
      />
    </div>
  );
}
