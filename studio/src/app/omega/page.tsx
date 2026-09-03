/**
 * Omega Agent Demo Page
 * 
 * Showcase the AI backbone of SyncSenta with real-time decision making,
 * cultural adaptations, and AWS integration roadmap.
 */

import { Metadata } from 'next';
import OmegaAgentDashboard from '@/components/omega/omega-agent-dashboard';

export const metadata: Metadata = {
  title: 'Omega Agent - AI Backbone | SyncSenta',
  description: 'Experience the intelligent AI backbone powering Grade 2 learning decisions, cultural adaptations, and cross-device synchronization in SyncSenta.',
  keywords: 'AI education, omega agent, machine learning, Grade 2, Kenya, CBC curriculum, cultural adaptation, neuro-symbolic AI',
};

export default function OmegaAgentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OmegaAgentDashboard />
    </div>
  );
}