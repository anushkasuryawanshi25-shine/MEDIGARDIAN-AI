import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  CheckCircle2, 
  Star, 
  Target, 
  Calendar, 
  User, 
  MessageCircle, 
  Trash2, 
  Activity, 
  ShieldCheck, 
  Crown,
  Heart
} from 'lucide-react';

export default function GamificationTab({ 
  points, 
  streaks, 
  badges, 
  level, 
  challenges, 
  encouragements, 
  adherenceRate,
  vitalsLog,
  onClearEncouragement,
  onClaimChallengePoints
}) {
  const [leaderboardFilter, setLeaderboardFilter] = useState('points'); // 'points' | 'streak' | 'adherence'

  // Level progression configurations
  const levelNames = {
    1: 'Health Beginner',
    2: 'Health Explorer',
    3: 'Health Achiever',
    4: 'Health Guardian',
    5: 'Health Champion',
    6: 'Health Master'
  };

  const levelThresholds = {
    1: { min: 0, max: 200 },
    2: { min: 201, max: 500 },
    3: { min: 501, max: 1000 },
    4: { min: 1001, max: 2000 },
    5: { min: 2001, max: 4000 },
    6: { min: 4001, max: 100000 }
  };

  const currentMinMax = levelThresholds[level] || { min: 0, max: 1000 };
  const nextLevelMin = currentMinMax.max + 1;
  const xpInCurrentLevel = Math.max(0, points - currentMinMax.min);
  const xpRequiredForLevel = currentMinMax.max - currentMinMax.min;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForLevel) * 100));

  // 9 Badge configurations
  const badgeConfig = [
    { id: 'FIRST_DOSE_CHAMPION', name: 'First Dose Champion', emoji: '🥉', desc: 'Take medicines correctly for 3 days', condition: '3 days adherence' },
    { id: 'CONSISTENCY_STAR', name: 'Consistency Star', emoji: '🥈', desc: '7-day medication streak achieved', condition: '7 days streak' },
    { id: 'MEDICATION_HERO', name: 'Medication Hero', emoji: '🥇', desc: '15-day medication streak achieved', condition: '15 days streak' },
    { id: 'MEDICATION_CHAMPION', name: 'Medication Champion', emoji: '🏆', desc: '30-day medication streak achieved', condition: '30 days streak' },
    { id: 'HEALTH_GUARDIAN', name: 'Health Guardian', emoji: '💎', desc: '60-day medication streak achieved', condition: '60 days streak' },
    { id: 'HEALTH_MASTER', name: 'Health Master', emoji: '👑', desc: '100-day medication streak achieved', condition: '100 days streak' },
    { id: 'HEALTH_TRACKER', name: 'Health Tracker', emoji: '📋', desc: 'Regularly log health parameters in Vitals', condition: 'Log vitals 3+ times' },
    { id: 'REPORT_EXPERT', name: 'Report Expert', emoji: '📖', desc: 'Generate medical reports in Health Passport', condition: 'Print health digest' },
    { id: 'WELLNESS_WARRIOR', name: 'Wellness Warrior', emoji: '❤️', desc: 'Maintain an adherence score of 90% or above', condition: '90%+ adherence rate' }
  ];

  // Calculate Consistency Score (0-100)
  const calculateConsistencyScore = () => {
    // 1. Adherence Score (40% weight)
    const adWeight = (adherenceRate || 0) * 0.4;
    
    // 2. Vitals Logs updates (20% weight - max 5 logs for full weight)
    const vitalsWeight = Math.min(100, (vitalsLog?.length || 0) * 20) * 0.2;
    
    // 3. Streak Maintenance (30% weight - max 15 days streak for full weight)
    const streakWeight = Math.min(100, (streaks?.current || 0) * 6.6) * 0.3;
    
    // 4. Diet/Challenges Completion (10% weight - based on completed challenges)
    const completedChallenges = challenges?.filter(c => c.completed).length || 0;
    const totalChallenges = challenges?.length || 1;
    const challengeWeight = ((completedChallenges / totalChallenges) * 100) * 0.1;

    return Math.round(adWeight + vitalsWeight + streakWeight + challengeWeight);
  };

  const consistencyScore = calculateConsistencyScore();

  // Mock Leaderboard Data sorted dynamically
  const mockLeaderboard = [
    { name: 'Arthur Pendelton (You)', points: points, streak: streaks?.current || 0, adherence: adherenceRate, isUser: true },
    { name: 'Clara Oswald', points: 820, streak: 26, adherence: 96, isUser: false },
    { name: 'Marcus Aurelius', points: 490, streak: 12, adherence: 90, isUser: false },
    { name: 'Florence Nightingale', points: 340, streak: 9, adherence: 88, isUser: false },
    { name: 'Albert Einstein', points: 215, streak: 5, adherence: 84, isUser: false }
  ];

  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => {
    if (leaderboardFilter === 'points') return b.points - a.points;
    if (leaderboardFilter === 'streak') return b.streak - a.streak;
    return b.adherence - a.adherence;
  });

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        
        {/* Level Progression Progress Bar Card */}
        <div className="card span-8" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(2, 132, 199, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--primary)'
              }}>
                <Crown size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Patient Level Status</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Level {level}: {levelNames[level] || 'Health Beginner'}
                </h3>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary-hover)' }}>{points} XP</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Health Points Earned</span>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>XP Progress: <strong>{xpInCurrentLevel} / {xpRequiredForLevel} XP</strong></span>
              {level < 6 ? (
                <span>Next Level: <strong>{nextLevelMin - points} XP needed</strong></span>
              ) : (
                <span>Highest Level Achieved</span>
              )}
            </div>
            <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${progressPercent}%`, 
                backgroundColor: 'var(--primary)', 
                borderRadius: '10px',
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                backgroundSize: '1rem 1rem',
                transition: 'width 0.4s ease-out'
              }} />
            </div>
          </div>
        </div>

        {/* Streaks Widget Card */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Flame size={20} style={{ color: '#ea580c' }} />
              Medication Streak Tracker
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>
              Take all daily medicines on time to keep your streak alive!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ea580c', display: 'flex', gap: '4px', alignItems: 'center', lineHeight: '1' }}>
                {streaks?.current || 0} <span style={{ fontSize: '1.4rem' }}>🔥</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '6px' }}>CURRENT STREAK</span>
            </div>
            
            <div style={{ height: '40px', width: '2px', backgroundColor: 'var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>
                {streaks?.longest || 0}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '6px' }}>LONGEST STREAK</span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--background)', padding: '10px 14px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
            🎯 Next Milestone: <strong>{streaks?.current >= 30 ? (streaks?.current >= 60 ? (streaks?.current >= 100 ? 'Highest Milestone' : '100 Days') : '60 Days') : '30 Days'}</strong>
          </div>
        </div>

        {/* Health Consistency Score Gauge */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-secondary)', width: '100%', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            Health Consistency Score
          </h4>
          
          {/* Radial score circle */}
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="var(--border)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke={consistencyScore >= 80 ? 'var(--success)' : (consistencyScore >= 50 ? 'var(--warning)' : 'var(--danger)')}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - consistencyScore / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{consistencyScore}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>/ 100</span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
            Calculated from <strong>Adherence</strong>, <strong>Vitals Checks</strong>, <strong>Streaks</strong>, and <strong>Challenges</strong>.
          </div>
        </div>

        {/* Daily Challenges Card */}
        <div className="card span-8" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Target size={20} style={{ color: 'var(--primary)' }} />
            Active Challenges & Tasks
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {challenges?.map((challenge) => (
              <div 
                key={challenge.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  backgroundColor: challenge.completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--background)',
                  border: challenge.completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {challenge.completed ? (
                    <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-dark)', flexShrink: 0 }} />
                  )}
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: challenge.completed ? 'line-through' : 'none' }}>
                      {challenge.text}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                      {challenge.type} Challenge
                    </span>
                  </div>
                </div>

                <div>
                  {challenge.completed ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success-hover)', fontWeight: '700', backgroundColor: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                      Claimed!
                    </span>
                  ) : (
                    <button
                      onClick={() => onClaimChallengePoints && onClaimChallengePoints(challenge.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700', gap: '4px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      +{challenge.points} XP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badge Gallery */}
        <div className="card span-12" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Award size={22} style={{ color: 'var(--primary)' }} />
            Achievement Badges Gallery
          </h4>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '16px' 
          }}>
            {badgeConfig.map((badge) => {
              const isUnlocked = badges?.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: isUnlocked ? 'var(--card-bg)' : 'var(--background)',
                    border: isUnlocked ? '2px solid var(--primary)' : '1px dashed var(--border-dark)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    boxShadow: isUnlocked ? '0 10px 15px -3px rgba(2, 132, 199, 0.05)' : 'none',
                    opacity: isUnlocked ? 1 : 0.65
                  }}
                  className={isUnlocked ? 'badge-card-unlocked' : ''}
                >
                  <div style={{ 
                    fontSize: '2.8rem', 
                    marginBottom: '12px', 
                    filter: isUnlocked ? 'none' : 'grayscale(100%)',
                    transform: isUnlocked ? 'scale(1.05)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {badge.emoji}
                  </div>
                  <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {badge.name}
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                    {badge.desc}
                  </p>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: '700', 
                    color: isUnlocked ? 'var(--success-hover)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    backgroundColor: isUnlocked ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}>
                    {isUnlocked ? '✓ Unlocked' : `Locked: ${badge.condition}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hackathon Leaderboard Cards */}
        <div className="card span-6" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Trophy size={20} style={{ color: '#eab308' }} />
              Community Leaderboard
            </h4>
            
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--background)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setLeaderboardFilter('points')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: leaderboardFilter === 'points' ? 'var(--primary)' : 'transparent',
                  color: leaderboardFilter === 'points' ? 'white' : 'var(--text-secondary)'
                }}
              >
                XP Points
              </button>
              <button 
                onClick={() => setLeaderboardFilter('streak')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: leaderboardFilter === 'streak' ? 'var(--primary)' : 'transparent',
                  color: leaderboardFilter === 'streak' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Streaks
              </button>
              <button 
                onClick={() => setLeaderboardFilter('adherence')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: leaderboardFilter === 'adherence' ? 'var(--primary)' : 'transparent',
                  color: leaderboardFilter === 'adherence' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Adherence
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedLeaderboard.map((player, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: player.isUser ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: player.isUser ? 'rgba(2, 132, 199, 0.05)' : 'var(--card-bg)'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: idx === 0 ? '#eab308' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : 'var(--text-muted)')), width: '20px' }}>
                    #{idx + 1}
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: player.isUser ? 'var(--primary-hover)' : 'var(--text-primary)' }}>
                    {player.name}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  <span>🏆 {player.points} pts</span>
                  <span>🔥 {player.streak} d</span>
                  <span>❤️ {player.adherence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Caregiver Encouragement Board */}
        <div className="card span-6" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
            Caregiver Encouragement Board
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            {encouragements?.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 10px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                border: '1px dashed var(--border-dark)',
                borderRadius: '12px'
              }}>
                No messages from your family group yet. They can send you notes from the Family Circle tab!
              </div>
            ) : (
              encouragements?.map((note) => (
                <div 
                  key={note.id}
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Heart size={12} fill="var(--primary)" />
                      Message from {note.from}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "{note.message}"
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'flex-start', marginTop: '4px' }}>
                      Received {note.date}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onClearEncouragement && onClearEncouragement(note.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--danger-hover)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Dismiss message"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
