"use client"

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertCircle, Home, Copy, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

const GamePage = ({ params }: { params: any }) => {
  const [game, setGame] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [clickLog, setClickLog] = useState([]);
  const [isMuted, setIsMuted] = useState(true); // Added state for controlling audio
  const router = useRouter();
  const { gameId } = params;
  const joinRequestMade = useRef(false);

  const fetchGameState = useCallback(async () => {
    if (!playerId) return;
    try {
      const response = await fetch(`https://tictactoe-online-server.vercel.app/api/game/${gameId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }
      const gameData = await response.json();
      setGame(gameData);
      
      // Update player symbol if it's not set
      if (!playerSymbol) {
        if (gameData.playerX === playerId) {
          setPlayerSymbol('X');
        } else if (gameData.playerO === playerId) {
          setPlayerSymbol('O');
        }
      }
    } catch (error) {
      setError('Failed to fetch game state. Please try again.');
    }
  }, [gameId, playerId, playerSymbol]);

  const joinOrReconnectToGame = useCallback(async () => {
    if (joinRequestMade.current) return;
    
    const storedPlayerId = sessionStorage.getItem(`playerId_${gameId}`);
    const storedPlayerSymbol = sessionStorage.getItem(`playerSymbol_${gameId}`);

    if (storedPlayerId && storedPlayerSymbol) {
      setPlayerId(storedPlayerId);
      setPlayerSymbol(storedPlayerSymbol);
      joinRequestMade.current = true;
      return;
    }

    try {
      joinRequestMade.current = true;
      const response = await fetch(`https://tictactoe-online-server.vercel.app/api/join-game/${gameId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to join game');
      }
      const data = await response.json();
      setPlayerId(data.playerId);
      setPlayerSymbol(data.symbol);
      sessionStorage.setItem(`playerId_${gameId}`, data.playerId);
      sessionStorage.setItem(`playerSymbol_${gameId}`, data.symbol);
    } catch (error) {
      setError('Failed to join game. Please try again.');
      joinRequestMade.current = false;
    }
  }, [gameId]);

  useLayoutEffect(() => {
    joinOrReconnectToGame();
  }, []);

  useEffect(() => {
    if (playerId) {
      fetchGameState();
      const intervalId = setInterval(fetchGameState, 1000); // Poll every 1 seconds
      return () => clearInterval(intervalId);
    }
  }, [playerId, fetchGameState]);

  const handleCellClick = async (index: string | number) => {
    // Log the click regardless of whether it's a valid move
    

    if (!game || game.winner || game.board[index] !== null || !playerId || game.currentPlayer !== playerSymbol) {
      return;
    }

    try {
      const response = await fetch(`https://tictactoe-online-server.vercel.app/api/make-move/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: playerId, position: index }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make move');
      }

      fetchGameState();
    } catch (error) {
      setError((error as Error).message || 'Failed to make move. Please try again.');
    }
  };

  const renderCell = (value: string | null, index: React.SetStateAction<null> | React.Key | undefined) => {
    const size = Math.sqrt(game.board.length);
    const col = Number(index) % size;
    const row = Math.floor(Number(index) / size);
    const x = col * 100 + 50;
    const y = row * 100 + 50;

    return (
      <g 
        // @ts-expect-error
        key={index} 
        onClick={() => handleCellClick(Number(index))} 
        // @ts-expect-error
        onMouseEnter={() => setHoveredCell(index)} 
        onMouseLeave={() => setHoveredCell(null)}
        style={{ cursor: 'pointer' }}
      >
        {value === 'X' && (
          <g filter="url(#glow)">
            <line x1={x-25} y1={y-25} x2={x+25} y2={y+25} stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
            <line x1={x-25} y1={y+25} x2={x+25} y2={y-25} stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}
        {value === 'O' && (
          <circle cx={x} cy={y} r="30" stroke="#34d399" strokeWidth="8" fill="none" filter="url(#glow)" />
        )}
        {value === null && (
          <rect 
            x={col * 100 + 5} 
            y={row * 100 + 5} 
            width="90" 
            height="90" 
            fill={hoveredCell === index ? "rgba(255,255,255,0.1)" : "transparent"}
            rx="10" 
            ry="10"
          />
        )}
      </g>
    );
  };

  const copyGameCode = () => {
    // Replace with your actual domain
    navigator.clipboard.writeText(`https://tictactoe-online-git-main-vanesshaws-projects.vercel.app/game/${gameId}`);
    toast({
      title: "Game code copied!",
      description: "The game link has been copied to your clipboard.",
    });
  };

  const handlePlayAgain = async () => {
    try {
        const response = await fetch('https://tictactoe-online-server.vercel.app/api/create-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fieldSize: size}),
        });
    
        if (!response.ok) {
          throw new Error('Failed to create game');
        }
    
        const { gameId } = await response.json();
        
        router.push(`/game/${gameId}`);
        
      } catch (error) {
        setError('Failed to create game. Please try again.');
      }
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const size = Math.sqrt(game.board.length);
  const viewBoxSize = size * 100;
  const requiredToWin = size === 3 ? 3 : 5;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
      {/* YouTube background music - add your video ID below */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center bg-gray-800 p-2 rounded-lg">
          <Button 
            onClick={() => setIsMuted(!isMuted)} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isMuted ? "🔇 Unmute Music" : "🔊 Mute Music"}
          </Button>
        </div>
        <iframe
          className="w-0 h-0 invisible"
          src={`https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=dQw4w9WgXcQ`}
          allow="autoplay; encrypted-media"
          title="Background Music"
        ></iframe>
      </div>

      <div className="w-full max-w-2xl mb-4 flex justify-between items-center">
        <Button 
          onClick={() => router.push('/')} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Home className="mr-2 h-4 w-4" /> Back to Home
        </Button>
        {game.winner && (
            <Button 
              onClick={handlePlayAgain} 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Play Again
            </Button>
        )}
        {!game.winner && (
            <div className='flex items-center'>
            <span className='mr-4'>Join this game:</span>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex items-center p-2">
              <span className="mr-2 text-white">{'tictactoe-online-git-main-vanesshaws-projects.vercel.app/game/...'}</span>
                <Button onClick={copyGameCode} variant="ghost" className="bg-gray-700 border-gray-600 text-white" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            </div>
        )}
        
      </div>

      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white text-center">Tic Tac Toe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="mb-4 text-white">
            {playerSymbol && `You are player: ${playerSymbol}`}
            {game.currentPlayer === playerSymbol ? " (Your turn)" : ""}
          </div>
          <div className="mb-4 text-white">
            {`${requiredToWin} in a row required to win`}
          </div>
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full max-w-md">
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
            
            <rect width={viewBoxSize} height={viewBoxSize} fill="url(#boardGradient)" rx="15" ry="15"/>
            
            {[...Array(size - 1)].map((_, i) => (
              <React.Fragment key={i}>
                <line 
                  x1={(i + 1) * 100} y1="20" 
                  x2={(i + 1) * 100} y2={viewBoxSize - 20} 
                  stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"
                />
                <line 
                  x1="20" y1={(i + 1) * 100} 
                  x2={viewBoxSize - 20} y2={(i + 1) * 100} 
                  stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6"
                />
              </React.Fragment>
            ))}
            
            {game.board.map((value: any, index: any) => renderCell(value, index))}
          </svg>

          {game.winner && (
            <Alert className="mt-4 bg-green-900 border-green-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Game Over</AlertTitle>
              <AlertDescription>
                {game.winner === 'draw' ? "It's a draw!" : `Player ${game.winner} wins!`}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-900 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamePage;