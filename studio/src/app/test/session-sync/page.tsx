/**
 * Session Sync Test Page
 * 
 * Test cross-device session persistence and real-time feedback system.
 * Access via: /test/session-sync
 */

import { Metadata } from 'next';
import SessionPersistenceTest from '@/components/test/session-persistence-test';

export const metadata: Metadata = {
  title: 'Session Sync Test | SyncSenta',
  description: 'Test cross-device session persistence and real-time teacher feedback',
  robots: 'noindex, nofollow', // Prevent indexing of test pages
};

export default function SessionSyncTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SessionPersistenceTest />
    </div>
  );
}