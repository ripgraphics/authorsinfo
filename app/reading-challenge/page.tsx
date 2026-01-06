'use client';

import React from 'react';
import { ChallengeDashboard } from '@/components/challenge-dashboard';

export default function ReadingChallengePage() {
  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Reading Challenges</h1>
        <p className="text-muted-foreground mt-2">Track your reading goals and compete with friends.</p>
      </div>
      <ChallengeDashboard />
    </div>
  );
}
