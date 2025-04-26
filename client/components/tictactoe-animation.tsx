import React, { useState, useEffect, useCallback } from 'react';

const AnimatedTicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [moveSequence, setMoveSequence] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [winningLine, setWinningLine] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  // @ts-expect-error
  const checkWinner = useCallback((board) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return lines[i];
      }
    }
    return null;
  }, []);

  const generateMoveSequence = useCallback(() => {
    // @ts-expect-error
    const sequence = Array(9).fill().map((_, index) => index);
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    // @ts-expect-error
    setMoveSequence(generateMoveSequence());
    setCurrentMoveIndex(0);
    setWinningLine(null);
    setGameOver(false);
  }, [generateMoveSequence]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (gameOver) {
      const timeoutId = setTimeout(resetGame, 2000);
      return () => clearTimeout(timeoutId);
    }

    const intervalId = setInterval(() => {
      if (currentMoveIndex < moveSequence.length) {
        setBoard((prevBoard) => {
          const newBoard = [...prevBoard];
          const move = moveSequence[currentMoveIndex];
          newBoard[move] = currentMoveIndex % 2 === 0 ? 'X' : 'O';

          const winner = checkWinner(newBoard);
          if (winner) {
            // @ts-expect-error
            setWinningLine(winner);
            setGameOver(true);
          } else if (currentMoveIndex === moveSequence.length - 1) {
            setGameOver(true);
          }

          return newBoard;
        });
        setCurrentMoveIndex((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentMoveIndex, moveSequence, gameOver, checkWinner, resetGame]);

  const renderWinningLine = () => {
    if (!winningLine) return null;
    // @ts-expect-error
    const [start, _, end] = winningLine;
    const startCol = start % 3;
    const startRow = Math.floor(start / 3);
    const endCol = end % 3;
    const endRow = Math.floor(end / 3);

    const x1 = startCol * 100 + 50;
    const y1 = startRow * 100 + 50;
    const x2 = endCol * 100 + 50;
    const y2 = endRow * 100 + 50;

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ff0000"
        strokeWidth="8"
        strokeLinecap="round"
        className="winning-line"
      />
    );
  };

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <linearGradient id="boardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="300" height="300" fill="url(#boardGradient)" rx="15" ry="15"/>
      
      <line x1="100" y1="20" x2="100" y2="280" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      <line x1="200" y1="20" x2="200" y2="280" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      <line x1="20" y1="100" x2="280" y2="100" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      <line x1="20" y1="200" x2="280" y2="200" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      
      {board.map((value, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = col * 100 + 50;
        const y = row * 100 + 50;

        if (value === 'X') {
          return (
            <g key={index} filter="url(#glow)">
              <line x1={x-25} y1={y-25} x2={x+25} y2={y+25} stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
              <line x1={x-25} y1={y+25} x2={x+25} y2={y-25} stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
            </g>
          );
        } else if (value === 'O') {
          return (
            <circle key={index} cx={x} cy={y} r="30" stroke="#34d399" strokeWidth="8" fill="none" filter="url(#glow)" />
          );
        }
        return null;
      })}

      {renderWinningLine()}
    </svg>
  );
};

export default AnimatedTicTacToe;
