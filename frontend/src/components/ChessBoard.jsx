import React from 'react';
import { getPieceImg, getPieceSvg } from '../utils/pieces.js';

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export default function ChessBoard({
  fen,
  activeMove,
  isFlipped,
  boardTheme,
  showBestArrow = true,
  isRetryMode = false,
  selectedSquare = null,
  onSquareClick = () => {},
}) {
  // Parse FEN into 64-square map
  const squaresMap = React.useMemo(() => {
    const map = {};
    if (!fen) return map;
    const [piecePlacement] = fen.split(" ");
    const rows = piecePlacement.split("/");

    for (let r = 0; r < 8; r++) {
      let file = 0;
      for (const char of rows[r]) {
        if (/\d/.test(char)) {
          file += parseInt(char, 10);
        } else {
          const sq = FILES[file] + (8 - r);
          map[sq] = char;
          file++;
        }
      }
    }
    return map;
  }, [fen]);

  // Percentage coordinate math for SVG arrows (0 to 100 scale)
  const getSquareCenter = (sq) => {
    if (!sq || sq.length < 2) return { x: 50, y: 50 };
    const file = sq.charCodeAt(0) - 97; // 0 to 7
    const rank = 8 - parseInt(sq[1], 10); // 0 to 7
    const col = isFlipped ? 7 - file : file;
    const row = isFlipped ? 7 - rank : rank;
    return {
      x: col * 12.5 + 6.25,
      y: row * 12.5 + 6.25,
    };
  };

  const renderArrow = (fromSq, toSq, color) => {
    if (!fromSq || !toSq || fromSq === toSq) return null;
    const p1 = getSquareCenter(fromSq);
    const p2 = getSquareCenter(toSq);

    const file1 = fromSq.charCodeAt(0) - 97;
    const rank1 = 8 - parseInt(fromSq[1], 10);
    const file2 = toSq.charCodeAt(0) - 97;
    const rank2 = 8 - parseInt(toSq[1], 10);

    const col1 = isFlipped ? 7 - file1 : file1;
    const row1 = isFlipped ? 7 - rank1 : rank1;
    const col2 = isFlipped ? 7 - file2 : file2;
    const row2 = isFlipped ? 7 - rank2 : rank2;

    const dc = col2 - col1;
    const dr = row2 - row1;
    const isKnight = (Math.abs(dc) === 1 && Math.abs(dr) === 2) || (Math.abs(dc) === 2 && Math.abs(dr) === 1);

    const filterStyle = { filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.45))' };

    if (isKnight) {
      // Authentic Chess.com L-shaped knight arrow
      const isVerticalFirst = Math.abs(dr) === 2;
      const cornerX = isVerticalFirst ? p1.x : p2.x;
      const cornerY = isVerticalFirst ? p2.y : p1.y;

      const u2x = isVerticalFirst ? Math.sign(dc) : 0;
      const u2y = isVerticalFirst ? 0 : Math.sign(dr);

      const u1x = isVerticalFirst ? 0 : Math.sign(dc);
      const u1y = isVerticalFirst ? Math.sign(dr) : 0;

      const headLen = 3.6;
      const headHalfWidth = 2.6;
      const shaftWidth = 2.2;

      const tipX = p2.x - u2x * 1.3;
      const tipY = p2.y - u2y * 1.3;

      const headBaseX = tipX - u2x * headLen;
      const headBaseY = tipY - u2y * headLen;

      const v2x = -u2y;
      const v2y = u2x;

      const wing1X = headBaseX + v2x * headHalfWidth;
      const wing1Y = headBaseY + v2y * headHalfWidth;
      const wing2X = headBaseX - v2x * headHalfWidth;
      const wing2Y = headBaseY - v2y * headHalfWidth;

      const startX = p1.x + u1x * 2.0;
      const startY = p1.y + u1y * 2.0;

      const cornerBeforeX = cornerX - u1x * 2.5;
      const cornerBeforeY = cornerY - u1y * 2.5;
      const cornerAfterX = cornerX + u2x * 2.5;
      const cornerAfterY = cornerY + u2y * 2.5;

      const shaftPath = `M ${startX.toFixed(2)} ${startY.toFixed(2)} ` +
        `L ${cornerBeforeX.toFixed(2)} ${cornerBeforeY.toFixed(2)} ` +
        `Q ${cornerX.toFixed(2)} ${cornerY.toFixed(2)} ${cornerAfterX.toFixed(2)} ${cornerAfterY.toFixed(2)} ` +
        `L ${headBaseX.toFixed(2)} ${headBaseY.toFixed(2)}`;

      const headPoints = `${tipX.toFixed(2)},${tipY.toFixed(2)} ` +
        `${wing1X.toFixed(2)},${wing1Y.toFixed(2)} ` +
        `${wing2X.toFixed(2)},${wing2Y.toFixed(2)}`;

      return (
        <g key={`${fromSq}-${toSq}-${color}`} opacity="0.86" style={filterStyle}>
          <path
            d={shaftPath}
            fill="none"
            stroke={color}
            strokeWidth={shaftWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon points={headPoints} fill={color} />
        </g>
      );
    }

    // Standard Straight Arrow (Pawn, Bishop, Rook, Queen, King moves)
    // Rendered as a single contiguous polygon with crisp shoulders and smooth rounded base
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.5) return null;

    const ux = dx / dist;
    const uy = dy / dist;
    const vx = -uy;
    const vy = ux;

    const ws = 1.1; // half shaft width (full = 2.2)
    const hl = Math.min(3.7, dist * 0.42); // arrowhead length
    const hw = Math.min(2.6, hl * 0.72);  // arrowhead half width (full = 5.2)

    const tipOffset = 1.3;
    const tipX = p2.x - ux * tipOffset;
    const tipY = p2.y - uy * tipOffset;

    const headBaseX = tipX - ux * hl;
    const headBaseY = tipY - uy * hl;

    const startX = p1.x + ux * 2.0;
    const startY = p1.y + uy * 2.0;

    // Arrowhead wings
    const wingLX = headBaseX + vx * hw;
    const wingLY = headBaseY + vy * hw;
    const wingRX = headBaseX - vx * hw;
    const wingRY = headBaseY - vy * hw;

    // Arrowhead shoulders (where head meets shaft)
    const shoulLX = headBaseX + vx * ws;
    const shoulLY = headBaseY + vy * ws;
    const shoulRX = headBaseX - vx * ws;
    const shoulRY = headBaseY - vy * ws;

    // Shaft base corners
    const baseLX = startX + vx * ws;
    const baseLY = startY + vy * ws;
    const baseRX = startX - vx * ws;
    const baseRY = startY - vy * ws;

    // Rear curve control point (smooth circular cap at the base of the shaft)
    const rearControlX = startX - ux * (ws * 1.35);
    const rearControlY = startY - uy * (ws * 1.35);

    const pathD = `M ${tipX.toFixed(2)} ${tipY.toFixed(2)} ` +
      `L ${wingLX.toFixed(2)} ${wingLY.toFixed(2)} ` +
      `L ${shoulLX.toFixed(2)} ${shoulLY.toFixed(2)} ` +
      `L ${baseLX.toFixed(2)} ${baseLY.toFixed(2)} ` +
      `Q ${rearControlX.toFixed(2)} ${rearControlY.toFixed(2)} ${baseRX.toFixed(2)} ${baseRY.toFixed(2)} ` +
      `L ${shoulRX.toFixed(2)} ${shoulRY.toFixed(2)} ` +
      `L ${wingRX.toFixed(2)} ${wingRY.toFixed(2)} Z`;

    return (
      <g key={`${fromSq}-${toSq}-${color}`} opacity="0.86" style={filterStyle}>
        <path d={pathD} fill={color} />
      </g>
    );
  };

  return (
    <div className="w-full max-w-[min(92vw,440px)] aspect-square lg:w-auto lg:h-full lg:max-h-[min(48vh,420px)] relative rounded-xl overflow-hidden shadow-2xl border border-neutral-800/80 select-none bg-[#111720] mx-auto">
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {Array.from({ length: 64 }).map((_, idx) => {
          const r = Math.floor(idx / 8);
          const f = idx % 8;

          const fileIdx = isFlipped ? 7 - f : f;
          const rankIdx = isFlipped ? 7 - r : r;
          const sqName = FILES[fileIdx] + RANKS[rankIdx];
          const isLight = (fileIdx + rankIdx) % 2 === 0;

          // Square Highlights
          const isFrom = activeMove && activeMove.from_square === sqName;
          const isTo = activeMove && activeMove.to_square === sqName;
          const isSelected = selectedSquare === sqName;
          const piece = squaresMap[sqName];

          let bgColor = isLight ? (boardTheme?.lightSq || '#eaecd0') : (boardTheme?.darkSq || '#739552');
          if (isSelected) {
            bgColor = boardTheme?.selectedSq || '#f6eb68';
          } else if (isFrom || isTo) {
            bgColor = boardTheme?.highlightSq || '#b9ca43';
          }

          // Badge on destination square
          const showBadge = activeMove && activeMove.to_square === sqName && !isRetryMode;

          return (
            <div
              key={sqName}
              onClick={() => onSquareClick(sqName)}
              className="w-full h-full relative flex items-center justify-center cursor-pointer transition-colors duration-150"
              style={{ backgroundColor: bgColor }}
            >
              {/* Coordinates: rank on leftmost column */}
              {f === 0 && (
                <span
                  className="absolute top-0.5 left-1 text-[9px] md:text-[11px] font-extrabold pointer-events-none opacity-80"
                  style={{ color: isLight ? boardTheme?.darkSq : boardTheme?.lightSq }}
                >
                  {RANKS[rankIdx]}
                </span>
              )}
              {/* Coordinates: file on bottom row */}
              {r === 7 && (
                <span
                  className="absolute bottom-0.5 right-1 text-[9px] md:text-[11px] font-extrabold pointer-events-none opacity-80"
                  style={{ color: isLight ? boardTheme?.darkSq : boardTheme?.lightSq }}
                >
                  {FILES[fileIdx]}
                </span>
              )}

              {/* Chess Piece Vector Image (Chess.com Neo) */}
              {piece && (
                <img
                  src={getPieceImg(piece)}
                  alt={piece}
                  className="w-[88%] h-[88%] object-contain pointer-events-none select-none z-10 drop-shadow-sm transition-transform active:scale-95"
                  draggable="false"
                  onError={(e) => {
                    // Fallback to SVG if image fails
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              )}
              {piece && (
                <div 
                  className="w-[84%] h-[84%] pointer-events-none z-10 transition-transform active:scale-95 hidden items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: getPieceSvg(piece) }}
                />
              )}

              {/* Move Badge Overlay */}
              {showBadge && (
                <div
                  className={`absolute top-0.5 right-0.5 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black text-white shadow-lg z-20 animate-badge ${
                    activeMove.classification === 'brilliant' ? 'animate-brilliant' : ''
                  }`}
                  style={{ backgroundColor: activeMove.color || '#81b64c' }}
                  title={`${activeMove.classification_name} (${activeMove.symbol})`}
                >
                  {activeMove.badge}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG Arrows Layer (Using 0-100 viewBox for exact percentage alignment) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Played move blunder arrow */}
        {activeMove && ['blunder', 'mistake', 'miss'].includes(activeMove.classification) && !isRetryMode && (
          renderArrow(activeMove.from_square, activeMove.to_square, '#fa412d')
        )}

        {/* Stockfish best move arrow */}
        {showBestArrow && activeMove && activeMove.best_move_uci && !isRetryMode && (
          (() => {
            const bestFrom = activeMove.best_move_uci.substring(0, 2);
            const bestTo = activeMove.best_move_uci.substring(2, 4);
            if (bestFrom !== activeMove.from_square || bestTo !== activeMove.to_square) {
              return renderArrow(bestFrom, bestTo, '#81b64c');
            }
            return null;
          })()
        )}
      </svg>
    </div>
  );
}
