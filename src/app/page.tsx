'use client';

import { useStore } from '@/lib/store';
import { VowFlow } from '@/components/VowFlow';
import { MissedDayInquiry } from '@/components/MissedDayInquiry';
import { PracticeSession } from '@/components/PracticeSession';

export default function Home() {
  const { isFirstTime, needsMissedDayInquiry } = useStore();

  // First time user - collect vow
  if (isFirstTime()) {
    return <VowFlow />;
  }

  // Missed day - inquiry before practice
  if (needsMissedDayInquiry()) {
    return <MissedDayInquiry />;
  }

  // Regular practice session
  return <PracticeSession />;
}
