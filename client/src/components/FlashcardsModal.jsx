import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Brain, Plus, ChevronLeft, ChevronRight, Eye, EyeOff,
  Trash2, CheckCircle2, XCircle, RotateCcw, X, Shuffle
} from 'lucide-react';

export const FlashcardsModal = ({ initialCards = [], onClose }) => {
  const { socket, currentRoom } = useSocket();
  const { user } = useAuth();
  const [cards, setCards] = useState(initialCards);
  const [mode, setMode] = useState('manage'); // 'manage' | 'quiz'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 });
  const [quizDone, setQuizDone] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);

  // Add card form
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    if (!socket) return;

    const onCreated = (card) => setCards(prev => [...prev, card]);
    const onDeleted = (cardId) => setCards(prev => prev.filter(c => c._id !== cardId));

    socket.on('flashcard_created', onCreated);
    socket.on('flashcard_deleted', onDeleted);

    return () => {
      socket.off('flashcard_created', onCreated);
      socket.off('flashcard_deleted', onDeleted);
    };
  }, [socket]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || !socket || !currentRoom) return;
    socket.emit('flashcard_create', {
      roomCode: currentRoom,
      question: question.trim(),
      answer: answer.trim(),
      createdBy: user?.username || 'Unknown'
    });
    setQuestion('');
    setAnswer('');
  };

  const handleDelete = (cardId) => {
    if (socket && currentRoom) {
      socket.emit('flashcard_delete', { cardId, roomCode: currentRoom });
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setShowAnswer(false);
    setQuizScore({ correct: 0, wrong: 0 });
    setQuizDone([]);
  };

  const startQuiz = () => {
    if (cards.length === 0) return;
    setCurrentIdx(0);
    setFlipped(false);
    setShowAnswer(false);
    setQuizScore({ correct: 0, wrong: 0 });
    setQuizDone([]);
    setMode('quiz');
  };

  const markResult = (isCorrect) => {
    setQuizScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1)
    }));
    setQuizDone(prev => [...prev, currentIdx]);
    setFlipped(false);
    setShowAnswer(false);
    setTimeout(() => {
      setCurrentIdx(prev => prev + 1);
    }, 300);
  };

  const remaining = cards.filter((_, i) => !quizDone.includes(i));
  const quizFinished = quizDone.length >= cards.length && cards.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 94, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Brain size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Flashcards & Quiz Mode</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => { setMode('manage'); }}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: mode === 'manage' ? 'var(--accent-primary)' : 'transparent', color: mode === 'manage' ? '#fff' : 'var(--text-secondary)' }}
            >
              Manage Cards
            </button>
            <button
              onClick={startQuiz}
              className="btn-secondary"
              disabled={cards.length === 0}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: mode === 'quiz' ? 'var(--accent-success)' : 'transparent', color: mode === 'quiz' ? '#fff' : cards.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)' }}
            >
              Start Quiz ({cards.length})
            </button>
          </div>
        </div>

        {/* ── MANAGE MODE ── */}
        {mode === 'manage' && (
          <div>
            {/* Add Card Form */}
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Question</label>
                <input type="text" required placeholder="What is Big-O of binary search?" className="glass-input" style={{ fontSize: '0.88rem' }} value={question} onChange={e => setQuestion(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Answer</label>
                <input type="text" required placeholder="O(log n)" className="glass-input" style={{ fontSize: '0.88rem' }} value={answer} onChange={e => setAnswer(e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button onClick={handleShuffle} type="button" className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                  <Shuffle size={14} /> Shuffle
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                  <Plus size={14} /> Add Card
                </button>
              </div>
            </form>

            {/* Card List */}
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Brain size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No flashcards yet. Add the first one above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                {cards.map((card, i) => (
                  <div key={card._id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                    gap: '0.75rem', alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px', fontSize: '0.87rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Q</div>
                      <div style={{ fontWeight: '600' }}>{card.question}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', marginBottom: '0.1rem' }}>A</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{card.answer}</div>
                    </div>
                    <button onClick={() => handleDelete(card._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ MODE ── */}
        {mode === 'quiz' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Score Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-success)', fontWeight: '700' }}>
                <CheckCircle2 size={18} /> {quizScore.correct} Correct
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontWeight: '700' }}>
                <XCircle size={18} /> {quizScore.wrong} Wrong
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {quizDone.length}/{cards.length} done
              </span>
            </div>

            {quizFinished ? (
              /* Results Screen */
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>
                  {quizScore.correct === cards.length ? '🏆' : quizScore.correct >= cards.length / 2 ? '🎯' : '📚'}
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Quiz Complete!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  You scored <strong style={{ color: 'var(--accent-success)' }}>{quizScore.correct}</strong> out of <strong>{cards.length}</strong>
                  {' '}({Math.round((quizScore.correct / cards.length) * 100)}%)
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={startQuiz} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                    <RotateCcw size={16} /> Retry Quiz
                  </button>
                  <button onClick={() => setMode('manage')} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                    Back to Cards
                  </button>
                </div>
              </div>
            ) : (
              /* Flashcard Viewer */
              <div style={{ width: '100%', maxWidth: '460px' }}>
                {/* Progress bar */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${(quizDone.length / cards.length) * 100}%`, transition: 'width 0.4s ease' }} />
                </div>

                {/* Card */}
                <div
                  onClick={() => setShowAnswer(!showAnswer)}
                  style={{
                    background: showAnswer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    border: showAnswer ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    transition: 'all 0.3s ease',
                    marginBottom: '1rem'
                  }}
                >
                  {!showAnswer ? (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Question {currentIdx + 1} of {cards.length}</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: '700', lineHeight: 1.4 }}>{cards[currentIdx]?.question}</p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Eye size={14} /> Click to reveal answer
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Answer</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent-success)', lineHeight: 1.4 }}>{cards[currentIdx]?.answer}</p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <EyeOff size={14} /> Rate yourself below
                      </span>
                    </>
                  )}
                </div>

                {/* Rating Buttons */}
                {showAnswer && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button onClick={() => markResult(false)} className="btn-secondary" style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.9rem' }}>
                      <XCircle size={18} /> Got it Wrong
                    </button>
                    <button onClick={() => markResult(true)} className="btn-primary" style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem', background: 'var(--accent-success)' }}>
                      <CheckCircle2 size={18} /> Got it Right!
                    </button>
                  </div>
                )}

                {!showAnswer && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button onClick={() => setShowAnswer(true)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
                      <Eye size={16} /> Reveal Answer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
