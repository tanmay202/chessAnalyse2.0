// Tactical & Positional Insights Generator based on current board state
import { Chess } from 'chess.js';

export function generateInsights(fen, evalScore = 0.0, moveNumber = 1) {
  if (!fen) return [];

  const chess = new Chess(fen);
  const turn = chess.turn(); // 'w' | 'b'
  const isWhite = turn === 'w';
  const player = isWhite ? 'White' : 'Black';
  const opponent = isWhite ? 'Black' : 'White';
  const insights = [];

  // 1. Opening Setup / Development
  if (moveNumber <= 10) {
    insights.push({
      id: 'opening',
      icon: 'book',
      title: 'Good opening setup',
      desc: 'Both sides are following classical developing moves, aiming for piece coordination and king safety.',
    });
  } else if (moveNumber > 30) {
    insights.push({
      id: 'endgame',
      icon: 'flag',
      title: 'Endgame phase',
      desc: 'Fewer pieces remain on the board; king activity and pawn promotion become the decisive factors.',
    });
  } else {
    insights.push({
      id: 'middlegame',
      icon: 'zap',
      title: 'Active middlegame',
      desc: 'Pieces are fully mobilized. Tactical themes, open diagonals, and outpost squares dictate the flow.',
    });
  }

  // 2. Center Control (e4, d4, e5, d5)
  const centerSquares = ['e4', 'd4', 'e5', 'd5'];
  let whiteCenterPawns = 0;
  let blackCenterPawns = 0;

  centerSquares.forEach(sq => {
    const piece = chess.get(sq);
    if (piece && piece.type === 'p') {
      if (piece.color === 'w') whiteCenterPawns++;
      else blackCenterPawns++;
    }
  });

  if (whiteCenterPawns > blackCenterPawns) {
    insights.push({
      id: 'center',
      icon: 'target',
      title: 'Center control',
      desc: 'White establishes central space advantage with pawns, restricting Black piece mobility.',
    });
  } else if (blackCenterPawns > whiteCenterPawns) {
    insights.push({
      id: 'center',
      icon: 'target',
      title: 'Center control',
      desc: 'Black controls key central squares, anchoring solid central piece posts.',
    });
  } else {
    insights.push({
      id: 'center',
      icon: 'target',
      title: 'Contested center',
      desc: 'Neither side has undisputed central dominance; tension remains along the central files.',
    });
  }

  // 3. Piece Activity
  if (evalScore > 1.5) {
    insights.push({
      id: 'activity',
      icon: 'knight',
      title: 'Piece activity advantage',
      desc: "White's pieces occupy aggressive forward squares and create severe attacking vectors.",
    });
  } else if (evalScore < -1.5) {
    insights.push({
      id: 'activity',
      icon: 'knight',
      title: 'Piece activity advantage',
      desc: "Black's pieces enjoy greater dynamic mobility and coordination across the board.",
    });
  } else {
    insights.push({
      id: 'activity',
      icon: 'knight',
      title: 'Balanced piece activity',
      desc: `${player}'s pieces are well placed and ready for further development and tactical play.`,
    });
  }

  // 4. King Safety & Threats
  if (chess.inCheck()) {
    insights.push({
      id: 'threats',
      icon: 'shield',
      title: 'King in check!',
      desc: `${player}'s king is under direct assault and must respond to the check immediately.`,
    });
  } else if (Math.abs(evalScore) > 3.0) {
    insights.push({
      id: 'threats',
      icon: 'shield',
      title: 'Decisive tactical edge',
      desc: `${evalScore > 0 ? 'White' : 'Black'} has tactical control with imminent breakthrough opportunities.`,
    });
  } else {
    insights.push({
      id: 'threats',
      icon: 'shield',
      title: 'No immediate threats',
      desc: 'The position is tactically stable with no hanging pieces or unavoidable threats.',
    });
  }

  return insights;
}
