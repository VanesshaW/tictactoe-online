"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AnimatedTicTacToe from '@/components/tictactoe-animation';

const MainPage = () => {
  const [entryCode, setEntryCode] = useState('');
  const [createGameError, setCreateGameError] = useState('');
  const [joinGameError, setJoinGameError] = useState('');
  const [fieldSize, setFieldSize] = useState('3');
  const router = useRouter();

  const handleCreateGame = async () => {
    try {
      const response = await fetch('https://tictactoe-online-server.vercel.app/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldSize: parseInt(fieldSize) }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
  
      const { gameId } = await response.json();
      
      router.push(`/game/${gameId}`);
      
    } catch (error) {
      setCreateGameError('Failed to create game. Please try again.');
    }
  };

  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className='hidden md:block w-1/3 mr-12 mt-16'><AnimatedTicTacToe /></div>
      <div className="w-full max-w-md space-y-6 p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Play Tic Tac Toe</h1>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Game</CardTitle>
            <CardDescription className="text-gray-400">Choose field size and start a new game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setFieldSize} defaultValue={fieldSize}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select field size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3x3</SelectItem>
                <SelectItem value="16">16x16</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateGame} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Create Game
            </Button>
          </CardContent>
          <CardFooter>
            {createGameError && (
              <Alert variant="destructive" className="bg-red-900 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{createGameError}</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>

        
      </div>
    </div>
  );
};

export default MainPage;
