'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { kitApi } from '@/lib/api';
import {
  ArrowLeft, BookOpen, HelpCircle, Check, RotateCcw, ChevronLeft, ChevronRight,
  Sparkles, Play, Award, Clock, Eye, RefreshCw, Zap, Keyboard
} from 'lucide-react';

export default function PracticePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [kitData, setKitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'flashcards' | 'interview'>('flashcards');

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  // Interview mode state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswerOutline, setShowAnswerOutline] = useState(false);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const loadKit = useCallback(async () => {
    try {
      const data = await kitApi.get(kitId);
      setKitData((data as any).kit);
    } catch (e) {
      console.error('Failed to load kit:', e);
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadKit();
  }, [user, router, loadKit]);

  // Timer effect for practice interview
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'flashcards') {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (e.code === 'ArrowRight') {
          handleNextCard();
        } else if (e.code === 'ArrowLeft') {
          handlePrevCard();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, cardIndex]);

  if (loading || !kitData) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center gap-3 text-slate-100">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Opening Practice Studio...</span>
      </div>
    );
  }

  const kit = kitData.kit;
  const flashcards = kit?.flashcards || [];
  const questions = kit?.questions || [];

  const currentCard = flashcards[cardIndex];
  const currentQuestion = questions[questionIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    if (cardIndex < flashcards.length - 1) setCardIndex((i) => i + 1);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (cardIndex > 0) setCardIndex((i) => i - 1);
  };

  const toggleMastered = (id: string) => {
    const next = new Set(masteredCards);
    if (next.has(id)) next.delete(id); else next.add(id);
    setMasteredCards(next);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startQuestion = () => {
    setTimer(0);
    setIsTimerRunning(true);
    setShowAnswerOutline(false);
    setUserAnswer('');
    setSelfScore(null);
  };

  const finishQuestion = () => {
    setIsTimerRunning(false);
    setShowAnswerOutline(true);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Header Bar */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/kits/${kitId}`} 
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">Practice Studio</h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase font-bold">
                  Zen Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">{kit?.role?.title || 'Interview Kit'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-white/10 rounded-xl">
            <button
              onClick={() => setMode('flashcards')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'flashcards' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 3D Flashcards ({flashcards.length})
            </button>
            <button
              onClick={() => setMode('interview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'interview' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Mock Rehearsal ({questions.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="max-w-4xl mx-auto px-6 py-10 relative">
        {/* Flashcard Studio */}
        {mode === 'flashcards' && (
          <div>
            {flashcards.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-400">No flashcards available in this kit.</div>
            ) : (
              <div className="space-y-6">
                {/* Top Status & Shortcuts Helper */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white font-bold">Card {cardIndex + 1} / {flashcards.length}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold font-mono">Mastered: {masteredCards.size}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-white/5">
                    <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>[Space] Flip • [←/→] Navigate</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 rounded-full"
                    style={{ width: `${((cardIndex + 1) / flashcards.length) * 100}%` }}
                  />
                </div>

                {/* 3D Flashcard Container */}
                <div 
                  className={`perspective-1000 min-h-[360px] cursor-pointer ${isFlipped ? 'flashcard-flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner relative w-full h-full min-h-[360px] glass-card p-8 flex flex-col justify-between border border-white/10 hover:border-indigo-500/50 shadow-2xl transition-all rounded-2xl select-none group">
                    {/* Top Flashcard Bar */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono uppercase font-bold tracking-wider text-indigo-400">
                        {isFlipped ? 'Answer Concept (Back)' : 'Question Prompt (Front)'}
                      </span>
                      <span className="text-slate-400 group-hover:text-indigo-300 transition-colors font-mono text-[11px]">
                        Click or press Space to Flip 🔄
                      </span>
                    </div>

                    {/* Card Body Text */}
                    <div className="my-10 text-center px-4">
                      <p className="text-xl md:text-2xl font-bold text-white leading-relaxed tracking-tight">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMastered(currentCard.id);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          masteredCards.has(currentCard.id)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {masteredCards.has(currentCard.id) ? 'Mastered Concept' : 'Mark as Mastered'}
                      </button>

                      {currentCard.requirement_ids?.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Req: {currentCard.requirement_ids.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevCard}
                    disabled={cardIndex === 0}
                    className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Flip Card
                  </button>

                  <button
                    onClick={handleNextCard}
                    disabled={cardIndex === flashcards.length - 1}
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-30"
                  >
                    Next Card <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mock Interview Rehearsal Mode */}
        {mode === 'interview' && (
          <div>
            {questions.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-400">No questions available in this kit.</div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                      {currentQuestion.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Question {questionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  {/* Timer Display */}
                  <div className="flex items-center gap-2 font-mono text-xs px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-emerald-400 font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{formatTimer(timer)}</span>
                  </div>
                </div>

                {/* Question Prompt Card */}
                <div className="glass-card p-8 border border-white/10 space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                    {currentQuestion.prompt}
                  </h2>

                  {!isTimerRunning && !showAnswerOutline && (
                    <button
                      onClick={startQuestion}
                      className="btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Practice Timer & Response
                    </button>
                  )}
                </div>

                {/* Response Notes Field */}
                {(isTimerRunning || showAnswerOutline) && (
                  <div className="glass-card p-6 border border-white/10 space-y-4">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Your Technical Bullet Points & Structure:
                    </label>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Outline your technical solution, trade-offs, and architecture response here..."
                      rows={5}
                      className="w-full p-4 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono leading-relaxed"
                    />

                    {isTimerRunning && (
                      <button
                        onClick={finishQuestion}
                        className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                      >
                        <Check className="w-4 h-4" /> Stop Timer & Reveal Ideal Answer
                      </button>
                    )}
                  </div>
                )}

                {/* Answer Outline & Self Grading */}
                {showAnswerOutline && (
                  <div className="glass-card p-6 border border-indigo-500/40 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Ideal Architect Outline
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                      {currentQuestion.answer_outline}
                    </p>

                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs font-semibold text-slate-400 mb-3">Rate Your Self Performance:</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => setSelfScore(score)}
                            className={`w-9 h-9 rounded-xl font-mono font-bold text-xs transition-all ${
                              selfScore === score
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400'
                                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Toolbar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      if (questionIndex > 0) {
                        setQuestionIndex(questionIndex - 1);
                        setShowAnswerOutline(false);
                        setIsTimerRunning(false);
                      }
                    }}
                    disabled={questionIndex === 0}
                    className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Question
                  </button>

                  <button
                    onClick={() => {
                      if (questionIndex < questions.length - 1) {
                        setQuestionIndex(questionIndex + 1);
                        setShowAnswerOutline(false);
                        setIsTimerRunning(false);
                      }
                    }}
                    disabled={questionIndex === questions.length - 1}
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-30"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
