// Chess.com Game Review Clone Client Controller

let gameState = {
  reviewData: null,
  currentPly: 0,
  isFlipped: false,
  showBestArrow: true,
  isPlaying: false,
  playInterval: null,
  retryMode: false,
  retrySelectedSquare: null,
};

// Coordinate helpers
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

// DOM elements
const boardGrid = document.getElementById("boardGrid");
const arrowsSvg = document.getElementById("arrowsSvg");
const evalFill = document.getElementById("evalFill");
const evalLabel = document.getElementById("evalLabel");

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  setupEventListeners();
  loadSampleList();
  // Auto-load default sample game (Opera Game)
  fetchSampleGame("opera_game.pgn");
});

function setupEventListeners() {
  document.getElementById("btnFirst").addEventListener("click", () => goToPly(0));
  document.getElementById("btnPrev").addEventListener("click", () => goToPly(gameState.currentPly - 1));
  document.getElementById("btnNext").addEventListener("click", () => goToPly(gameState.currentPly + 1));
  document.getElementById("btnLast").addEventListener("click", () => {
    if (gameState.reviewData) goToPly(gameState.reviewData.moves.length);
  });

  document.getElementById("btnPlay").addEventListener("click", toggleAutoplay);
  document.getElementById("btnFlip").addEventListener("click", toggleFlip);
  document.getElementById("btnToggleArrow").addEventListener("click", toggleBestArrow);
  document.getElementById("btnRetry").addEventListener("click", startRetryMode);

  document.getElementById("btnNextKey").addEventListener("click", nextKeyMoment);
  document.getElementById("btnPrevKey").addEventListener("click", prevKeyMoment);

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") goToPly(gameState.currentPly - 1);
    else if (e.key === "ArrowRight") goToPly(gameState.currentPly + 1);
    else if (e.key === " ") {
      e.preventDefault();
      toggleAutoplay();
    }
  });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => (p.style.display = "none"));
      e.target.classList.add("active");
      const targetPane = document.getElementById(e.target.dataset.tab);
      if (targetPane) targetPane.style.display = "block";
    });
  });

  // Modals
  document.getElementById("btnNewReview").addEventListener("click", () => {
    document.getElementById("modalNewReview").classList.add("active");
  });
  document.getElementById("btnSampleGames").addEventListener("click", () => {
    document.getElementById("modalSampleGames").classList.add("active");
  });
  document.getElementById("btnCloseNewReview").addEventListener("click", () => {
    document.getElementById("modalNewReview").classList.remove("active");
  });
  document.getElementById("btnCloseSampleGames").addEventListener("click", () => {
    document.getElementById("modalSampleGames").classList.remove("active");
  });
  document.getElementById("btnStartReview").addEventListener("click", startReviewFromPgn);
  document.getElementById("btnExportPgn").addEventListener("click", exportAnnotatedPgn);
}

// ---------------------------------------------------------------------------
// Board & Piece Rendering
// ---------------------------------------------------------------------------
function initBoard() {
  boardGrid.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const fileIdx = gameState.isFlipped ? 7 - f : f;
      const rankIdx = gameState.isFlipped ? 7 - r : r;
      const sqName = FILES[fileIdx] + RANKS[rankIdx];
      const isLight = (fileIdx + rankIdx) % 2 === 0;

      const sqEl = document.createElement("div");
      sqEl.className = `square ${isLight ? "light" : "dark"}`;
      sqEl.dataset.square = sqName;

      // Coordinates
      if (f === 0) {
        const rankLabel = document.createElement("span");
        rankLabel.className = "coord-rank";
        rankLabel.textContent = RANKS[rankIdx];
        sqEl.appendChild(rankLabel);
      }
      if (r === 7) {
        const fileLabel = document.createElement("span");
        fileLabel.className = "coord-file";
        fileLabel.textContent = FILES[fileIdx];
        sqEl.appendChild(fileLabel);
      }

      sqEl.addEventListener("click", () => handleSquareClick(sqName));
      boardGrid.appendChild(sqEl);
    }
  }
}

function renderFen(fen) {
  clearHighlights();
  clearBadges();
  clearArrows();

  const [piecePlacement] = fen.split(" ");
  const rows = piecePlacement.split("/");

  const squaresMap = {};
  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const char of rows[r]) {
      if (/\d/.test(char)) {
        file += parseInt(char, 10);
      } else {
        const sq = FILES[file] + (8 - r);
        squaresMap[sq] = char;
        file++;
      }
    }
  }

  document.querySelectorAll(".square").forEach((sqEl) => {
    // Preserve coords
    const coords = sqEl.querySelectorAll(".coord-rank, .coord-file");
    sqEl.innerHTML = "";
    coords.forEach((c) => sqEl.appendChild(c));

    const piece = squaresMap[sqEl.dataset.square];
    if (piece) {
      const svgContainer = document.createElement("div");
      svgContainer.className = "piece-svg";
      svgContainer.innerHTML = getPieceSvg(piece);
      sqEl.appendChild(svgContainer);
    }
  });
}

function toggleFlip() {
  gameState.isFlipped = !gameState.isFlipped;
  initBoard();
  if (gameState.reviewData) {
    updateBoardToCurrentPly();
  }
}

// ---------------------------------------------------------------------------
// Navigation & Review Playback
// ---------------------------------------------------------------------------
function goToPly(plyIndex) {
  if (!gameState.reviewData || !gameState.reviewData.moves) return;
  const maxPly = gameState.reviewData.moves.length;
  gameState.currentPly = Math.max(0, Math.min(maxPly, plyIndex));
  gameState.retryMode = false;
  gameState.retrySelectedSquare = null;

  updateBoardToCurrentPly();
}

function updateBoardToCurrentPly() {
  const moves = gameState.reviewData.moves;
  let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let activeMove = null;

  if (gameState.currentPly > 0 && gameState.currentPly <= moves.length) {
    activeMove = moves[gameState.currentPly - 1];
    fen = activeMove.fen_after;
  }

  renderFen(fen);

  if (activeMove) {
    highlightSquares(activeMove.from_square, activeMove.to_square);
    drawBadgeOnSquare(activeMove.to_square, activeMove.badge, activeMove.classification);

    // Draw played blunder arrow if mistake/blunder
    if (["blunder", "mistake", "miss"].includes(activeMove.classification)) {
      drawArrow(activeMove.from_square, activeMove.to_square, "#fa412d");
    }

    // Draw Stockfish best move arrow
    if (gameState.showBestArrow && activeMove.best_move_uci) {
      const bestFrom = activeMove.best_move_uci.substring(0, 2);
      const bestTo = activeMove.best_move_uci.substring(2, 4);
      if (bestFrom !== activeMove.from_square || bestTo !== activeMove.to_square) {
        drawArrow(bestFrom, bestTo, "#81b64c");
      }
    }

    updateEvalBar(activeMove.eval_after, activeMove.mate_after);
    updateCoachCard(activeMove);
  } else {
    updateEvalBar(0.0, null);
    resetCoachCard();
  }

  highlightMoveListRow(gameState.currentPly);
  drawEvalGraph();
}

function toggleBestArrow() {
  gameState.showBestArrow = !gameState.showBestArrow;
  document.getElementById("btnToggleArrow").textContent = gameState.showBestArrow ? "Hide Best Move" : "Show Best Move";
  if (gameState.reviewData) updateBoardToCurrentPly();
}

function toggleAutoplay() {
  gameState.isPlaying = !gameState.isPlaying;
  const btn = document.getElementById("btnPlay");
  if (gameState.isPlaying) {
    btn.textContent = "⏸";
    gameState.playInterval = setInterval(() => {
      if (!gameState.reviewData || gameState.currentPly >= gameState.reviewData.moves.length) {
        toggleAutoplay();
        return;
      }
      goToPly(gameState.currentPly + 1);
    }, 1200);
  } else {
    btn.textContent = "▶";
    clearInterval(gameState.playInterval);
  }
}

function nextKeyMoment() {
  if (!gameState.reviewData || !gameState.reviewData.key_moments) return;
  const next = gameState.reviewData.key_moments.find((p) => p > gameState.currentPly);
  if (next !== undefined) goToPly(next);
}

function prevKeyMoment() {
  if (!gameState.reviewData || !gameState.reviewData.key_moments) return;
  const prev = [...gameState.reviewData.key_moments].reverse().find((p) => p < gameState.currentPly);
  if (prev !== undefined) goToPly(prev);
}

// ---------------------------------------------------------------------------
// Board Highlights & Badges
// ---------------------------------------------------------------------------
function highlightSquares(fromSq, toSq) {
  clearHighlights();
  const fEl = document.querySelector(`.square[data-square="${fromSq}"]`);
  const tEl = document.querySelector(`.square[data-square="${toSq}"]`);
  if (fEl) fEl.classList.add("highlight");
  if (tEl) tEl.classList.add("highlight");
}

function clearHighlights() {
  document.querySelectorAll(".square.highlight, .square.selected").forEach((el) => {
    el.classList.remove("highlight", "selected");
  });
}

function drawBadgeOnSquare(sqName, badgeText, classification) {
  const sqEl = document.querySelector(`.square[data-square="${sqName}"]`);
  if (!sqEl) return;

  const badgeEl = document.createElement("div");
  badgeEl.className = `square-badge badge-${classification}`;
  badgeEl.textContent = badgeText;
  sqEl.appendChild(badgeEl);
}

function clearBadges() {
  document.querySelectorAll(".square-badge").forEach((el) => el.remove());
}

// ---------------------------------------------------------------------------
// Arrow Drawing
// ---------------------------------------------------------------------------
function clearArrows() {
  arrowsSvg.innerHTML = "";
}

function getSquareCenter(sqName) {
  const file = sqName.charCodeAt(0) - 97; // 0 to 7
  const rank = 8 - parseInt(sqName[1], 10); // 0 to 7
  const col = gameState.isFlipped ? 7 - file : file;
  const row = gameState.isFlipped ? 7 - rank : rank;
  return {
    x: col * 70 + 35,
    y: row * 70 + 35,
  };
}

function drawArrow(fromSq, toSq, color) {
  const p1 = getSquareCenter(fromSq);
  const p2 = getSquareCenter(toSq);

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headLen = 14;

  const startX = p1.x + Math.cos(angle) * 12;
  const startY = p1.y + Math.sin(angle) * 12;
  const endX = p2.x - Math.cos(angle) * 12;
  const endY = p2.y - Math.sin(angle) * 12;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", startX);
  line.setAttribute("y1", startY);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", endY);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "8");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("opacity", "0.85");

  // Arrowhead polygon
  const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const pA = `${endX},${endY}`;
  const pB = `${endX - headLen * Math.cos(angle - Math.PI / 6)},${endY - headLen * Math.sin(angle - Math.PI / 6)}`;
  const pC = `${endX - headLen * Math.cos(angle + Math.PI / 6)},${endY - headLen * Math.sin(angle + Math.PI / 6)}`;
  arrowHead.setAttribute("points", `${pA} ${pB} ${pC}`);
  arrowHead.setAttribute("fill", color);
  arrowHead.setAttribute("opacity", "0.85");

  arrowsSvg.appendChild(line);
  arrowsSvg.appendChild(arrowHead);
}

// ---------------------------------------------------------------------------
// Eval Bar & Coach Card
// ---------------------------------------------------------------------------
function updateEvalBar(evalPawns, mate) {
  let percent = 50;
  let labelText = "0.0";

  if (mate !== null) {
    percent = mate > 0 ? 100 : 0;
    labelText = `M${Math.abs(mate)}`;
  } else {
    // Sigmoid mapping
    percent = 50 + (evalPawns / 10.0) * 50;
    percent = Math.max(3, Math.min(97, percent));
    labelText = (evalPawns >= 0 ? "+" : "") + evalPawns.toFixed(1);
  }

  evalFill.style.height = `${percent}%`;
  evalLabel.textContent = labelText;

  if (percent > 50) {
    evalLabel.className = "eval-bar-label bottom-label";
  } else {
    evalLabel.className = "eval-bar-label top-label";
  }
}

function updateCoachCard(move) {
  document.getElementById("coachBadgePill").style.display = "inline-block";
  document.getElementById("coachBadgePill").className = `coach-badge-pill badge-${move.classification}`;
  document.getElementById("coachBadgePill").textContent = `${move.badge} ${move.classification_name}`;

  const scoreStr = move.mate_after ? `M${move.mate_after}` : (move.eval_after >= 0 ? "+" : "") + move.eval_after.toFixed(2);
  document.getElementById("coachMoveText").textContent = `${move.move_number}.${move.turn === "black" ? ".." : ""} ${move.san} [${scoreStr}]`;
  document.getElementById("coachSpeech").textContent = move.commentary;

  // Show "Retry Mistake" button on errors
  const isError = ["inaccuracy", "mistake", "miss", "blunder"].includes(move.classification);
  document.getElementById("btnRetry").style.display = isError ? "inline-flex" : "none";
}

function resetCoachCard() {
  document.getElementById("coachBadgePill").style.display = "none";
  document.getElementById("coachMoveText").textContent = "Starting Position";
  document.getElementById("coachSpeech").textContent = "Navigate through the moves or press Play to start the game review.";
  document.getElementById("btnRetry").style.display = "none";
}

// ---------------------------------------------------------------------------
// "Retry Mistake" Interactive Puzzle Mode
// ---------------------------------------------------------------------------
function startRetryMode() {
  if (!gameState.reviewData || gameState.currentPly === 0) return;
  const move = gameState.reviewData.moves[gameState.currentPly - 1];

  gameState.retryMode = true;
  gameState.retrySelectedSquare = null;

  // Set board to position BEFORE blunder
  renderFen(move.fen_before);
  clearBadges();
  clearArrows();

  document.getElementById("coachBadgePill").className = "coach-badge-pill badge-best";
  document.getElementById("coachBadgePill").textContent = "Retry Mistake";
  document.getElementById("coachMoveText").textContent = `Find the best move for ${move.turn}!`;
  document.getElementById("coachSpeech").textContent = "What move should you have played here? Click a piece on the board and move it to the target square.";
}

function handleSquareClick(sqName) {
  if (!gameState.retryMode) return;
  const move = gameState.reviewData.moves[gameState.currentPly - 1];

  if (!gameState.retrySelectedSquare) {
    // Select from-square
    const sqEl = document.querySelector(`.square[data-square="${sqName}"]`);
    if (sqEl && sqEl.querySelector(".piece-svg")) {
      gameState.retrySelectedSquare = sqName;
      sqEl.classList.add("selected");
    }
  } else {
    // Make move
    const fromSq = gameState.retrySelectedSquare;
    const toSq = sqName;
    gameState.retrySelectedSquare = null;
    clearHighlights();

    const playedUci = fromSq + toSq;
    fetch("/api/check-retry-move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen_before: move.fen_before,
        played_uci: playedUci,
        expected_best_uci: move.best_move_uci,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.is_best) {
          document.getElementById("coachSpeech").innerHTML = `<strong style="color:var(--color-green);">${res.message}</strong>`;
          drawArrow(fromSq, toSq, "#81b64c");
        } else {
          document.getElementById("coachSpeech").innerHTML = `<span style="color:var(--color-orange);">${res.message}</span>`;
        }
      });
  }
}

// ---------------------------------------------------------------------------
// Move List & Breakdown Table
// ---------------------------------------------------------------------------
function renderReviewResult(data) {
  gameState.reviewData = data;
  gameState.currentPly = 0;

  // Metadata
  document.getElementById("gameTitle").textContent = `${data.white.name} vs ${data.black.name}`;
  document.getElementById("gameOpening").textContent = `${data.eco_code} • ${data.opening_name}`;
  document.getElementById("gameResult").textContent = data.headers.Result || "*";

  // Player cards
  document.getElementById("whiteName").textContent = data.white.name;
  document.getElementById("whiteRating").textContent = data.white.rating || "Unrated";
  document.getElementById("whiteAccuracy").textContent = `${data.white.accuracy.toFixed(1)}%`;
  document.getElementById("whitePerfElo").textContent = `~${data.white.estimated_elo} Elo`;

  document.getElementById("blackName").textContent = data.black.name;
  document.getElementById("blackRating").textContent = data.black.rating || "Unrated";
  document.getElementById("blackAccuracy").textContent = `${data.black.accuracy.toFixed(1)}%`;
  document.getElementById("blackPerfElo").textContent = `~${data.black.estimated_elo} Elo`;

  // Move classification table
  renderClassificationTable(data.white.counts, data.black.counts);

  // Move list
  renderMoveList(data.moves);

  // Eval Graph
  drawEvalGraph();

  // Reset to first move
  goToPly(1);
}

function renderClassificationTable(whiteCounts, blackCounts) {
  const cats = [
    { key: "brilliant", name: "Brilliant", sym: "!!" },
    { key: "great", name: "Great Find", sym: "!" },
    { key: "best", name: "Best", sym: "★" },
    { key: "excellent", name: "Excellent", sym: "✓✓" },
    { key: "good", name: "Good", sym: "✓" },
    { key: "book", name: "Book", sym: "📖" },
    { key: "inaccuracy", name: "Inaccuracy", sym: "?!" },
    { key: "mistake", name: "Mistake", sym: "?" },
    { key: "miss", name: "Miss", sym: "❌" },
    { key: "blunder", name: "Blunder", sym: "??" },
    { key: "forced", name: "Forced", sym: "⇥" },
  ];

  const tbody = document.getElementById("breakdownBody");
  tbody.innerHTML = "";

  cats.forEach((cat) => {
    const wVal = whiteCounts[cat.key] || 0;
    const bVal = blackCounts[cat.key] || 0;

    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `
      <div class="cat-label">
        <span class="cat-chip badge-${cat.key}">${cat.sym}</span>
        <span>${cat.name}</span>
      </div>
      <div class="count-val" style="color:${wVal > 0 ? "inherit" : "#555"}">${wVal}</div>
      <div class="count-val" style="color:${bVal > 0 ? "inherit" : "#555"}">${bVal}</div>
    `;
    tbody.appendChild(row);
  });
}

function renderMoveList(moves) {
  const container = document.getElementById("moveListContainer");
  container.innerHTML = "";

  for (let i = 0; i < moves.length; i += 2) {
    const wMove = moves[i];
    const bMove = moves[i + 1];
    const moveNum = Math.floor(i / 2) + 1;

    const row = document.createElement("div");
    row.className = "move-row";

    let wHtml = `<div class="move-col" data-ply="${wMove.ply}">
      <span>${wMove.san}</span>
      <span class="move-badge-mini badge-${wMove.classification}">${wMove.symbol}</span>
    </div>`;

    let bHtml = "";
    if (bMove) {
      bHtml = `<div class="move-col" data-ply="${bMove.ply}">
        <span>${bMove.san}</span>
        <span class="move-badge-mini badge-${bMove.classification}">${bMove.symbol}</span>
      </div>`;
    }

    row.innerHTML = `<span style="color:#777; font-weight:700;">${moveNum}.</span> ${wHtml} ${bHtml}`;
    container.appendChild(row);
  }

  // Click on move jumps to ply
  container.querySelectorAll(".move-col").forEach((col) => {
    col.addEventListener("click", () => {
      const ply = parseInt(col.dataset.ply, 10);
      goToPly(ply);
    });
  });
}

function highlightMoveListRow(currentPly) {
  document.querySelectorAll(".move-col").forEach((col) => {
    col.classList.remove("active");
    if (parseInt(col.dataset.ply, 10) === currentPly) {
      col.classList.add("active");
      col.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

// ---------------------------------------------------------------------------
// Interactive Evaluation Advantage Canvas Graph
// ---------------------------------------------------------------------------
function drawEvalGraph() {
  const canvas = document.getElementById("evalCanvas");
  if (!canvas || !gameState.reviewData) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const moves = gameState.reviewData.moves;

  ctx.clearRect(0, 0, width, height);

  // Background midline
  const midY = height / 2;
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  if (moves.length === 0) return;

  const stepX = width / moves.length;

  // Plot eval curve
  ctx.beginPath();
  ctx.moveTo(0, midY);

  const points = [];
  moves.forEach((m, idx) => {
    const x = idx * stepX;
    // Map win prob (0 to 100) to height
    const prob = m.win_prob_after;
    const y = height - (prob / 100.0) * height;
    points.push({ x, y, classification: m.classification, ply: m.ply });
    ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw pivotal key moment dots
  points.forEach((pt) => {
    if (["brilliant", "great", "blunder", "miss"].includes(pt.classification)) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = pt.classification === "brilliant" ? "#1baaa0" : (pt.classification === "great" ? "#5c8bb0" : "#fa412d");
      ctx.fill();
    }
  });

  // Current ply cursor
  if (gameState.currentPly > 0 && gameState.currentPly <= points.length) {
    const currPt = points[gameState.currentPly - 1];
    ctx.strokeStyle = "#81b64c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currPt.x, 0);
    ctx.lineTo(currPt.x, height);
    ctx.stroke();
  }

  // Click on canvas to seek
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedPly = Math.round((clickX / rect.width) * moves.length);
    goToPly(clickedPly);
  };
}

// ---------------------------------------------------------------------------
// API Calls: Sample Games & Custom Review
// ---------------------------------------------------------------------------
function loadSampleList() {
  fetch("/api/sample-games")
    .then((r) => r.json())
    .then((data) => {
      const listEl = document.getElementById("sampleList");
      listEl.innerHTML = "";
      data.games.forEach((g) => {
        const item = document.createElement("div");
        item.className = "sample-item";
        item.innerHTML = `
          <div style="font-weight:700;">${g.title}</div>
          <div style="font-size:12px; color:#aaa; margin-top:3px;">${g.event} • ${g.eco} ${g.opening} [${g.result}]</div>
        `;
        item.addEventListener("click", () => {
          document.getElementById("modalSampleGames").classList.remove("active");
          fetchSampleGame(g.filename);
        });
        listEl.appendChild(item);
      });
    });
}

function fetchSampleGame(filename) {
  fetch(`/api/load-sample/${filename}`)
    .then((r) => r.json())
    .then((data) => {
      runReview(data.pgn);
    });
}

function startReviewFromPgn() {
  const pgn = document.getElementById("pgnInput").value.trim();
  const depth = parseInt(document.getElementById("depthSelect").value, 10);
  if (!pgn) return;

  document.getElementById("modalNewReview").classList.remove("active");
  runReview(pgn, depth);
}

function runReview(pgnText, depth = 12) {
  document.getElementById("coachSpeech").textContent = "Analyzing game with Stockfish engine... Please wait...";
  fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pgn: pgnText, depth }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        alert("Error analyzing game: " + data.error);
        return;
      }
      gameState.lastPgn = pgnText;
      renderReviewResult(data);
    })
    .catch((err) => {
      alert("Failed to analyze game: " + err);
    });
}

function exportAnnotatedPgn() {
  if (!gameState.reviewData || !gameState.lastPgn) {
    alert("No reviewed game to export!");
    return;
  }

  fetch("/api/export-pgn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pgn: gameState.lastPgn,
      review: gameState.reviewData,
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      const blob = new Blob([data.annotated_pgn], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "game_review_annotated.pgn";
      a.click();
    });
}
