/**
 * Omega Agent Dashboard Component
 * 
 * Real-time visualization of the Omega Agent's decision-making process,
 * cultural adaptations, and learning recommendations.
 */

'use client';

import { useEffect, useState } from 'react';
import { useGrade2OmegaAgent } from '@/hooks/use-omega-agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';  // Remove if not available
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Zap, 
  Target, 
  Globe, 
  Activity, 
  TrendingUp, 
  MessageSquare, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Tablet,
  Monitor,
  WifiOff,
  Wifi,
  RefreshCw
} from 'lucide-react';

interface DemoScenario {
  name: string;
  description: string;
  input: {
    currentProgress: number;
    timeSpent: number;
    strugglingAreas: string[];
    recentActivity: string;
  };
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    name: 'Excellent Progress',
    description: 'Student mastering Grade 2 counting with cultural examples',
    input: {
      currentProgress: 95,
      timeSpent: 180,
      strugglingAreas: [],
      recentActivity: 'matatu-counting'
    }
  },
  {
    name: 'Needs Support',
    description: 'Student struggling with basic shapes recognition',
    input: {
      currentProgress: 35,
      timeSpent: 450,
      strugglingAreas: ['shape-recognition', 'visual-discrimination'],
      recentActivity: 'safari-shapes'
    }
  },
  {
    name: 'Steady Learning',
    description: 'Consistent progress in Kiswahili phonics',
    input: {
      currentProgress: 70,
      timeSpent: 240,
      strugglingAreas: [],
      recentActivity: 'herufi-sounds'
    }
  }
];

export default function OmegaAgentDashboard() {
  const {
    isInitialized,
    isThinking,
    lastDecision,
    error,
    makeDecision,
    getGrade2Activity,
    processGrade2Progress,
    adaptToDevice
  } = useGrade2OmegaAgent();

  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet' | 'desktop'>('desktop');
  const [realtimeData, setRealtimeData] = useState({
    studentsActive: 1247,
    decisionsPerMinute: 23,
    culturalAdaptations: 156,
    averageEngagement: 87
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        studentsActive: prev.studentsActive + Math.floor(Math.random() * 10 - 5),
        decisionsPerMinute: Math.max(1, prev.decisionsPerMinute + Math.floor(Math.random() * 6 - 3)),
        culturalAdaptations: prev.culturalAdaptations + Math.floor(Math.random() * 3),
        averageEngagement: Math.min(100, Math.max(70, prev.averageEngagement + Math.floor(Math.random() * 4 - 2)))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRunScenario = async (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    await makeDecision(scenario.input);
  };

  const handleDeviceChange = (newDevice: 'phone' | 'tablet' | 'desktop') => {
    setDeviceType(newDevice);
    adaptToDevice(newDevice);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Omega Agent Dashboard</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real-time visualization of SyncSenta's AI backbone making intelligent learning decisions 
          for Grade 2 Kenyan students with cultural context and cross-device synchronization.
        </p>
        <div className="mt-4">
          <Badge variant={isInitialized ? 'default' : 'secondary'} className="mr-2">
            {isInitialized ? '🧠 Agent Active' : '⏳ Initializing'}
          </Badge>
          {error && <Badge variant="destructive">❌ {error}</Badge>}
        </div>
      </div>

      {/* Real-time System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{realtimeData.studentsActive}</p>
            <p className="text-xs text-gray-600">Active Grade 2 Students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{realtimeData.decisionsPerMinute}</p>
            <p className="text-xs text-gray-600">AI Decisions/Min</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Globe className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{realtimeData.culturalAdaptations}</p>
            <p className="text-xs text-gray-600">Cultural Adaptations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{realtimeData.averageEngagement}%</p>
            <p className="text-xs text-gray-600">Avg Engagement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Decision Engine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Decision Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Scenarios */}
            <div>
              <h4 className="font-medium mb-3">Test Learning Scenarios</h4>
              <div className="space-y-2">
                {DEMO_SCENARIOS.map((scenario, index) => (
                  <Button
                    key={index}
                    variant={selectedScenario.name === scenario.name ? 'default' : 'outline'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleRunScenario(scenario)}
                    disabled={isThinking}
                  >
                    <div className="text-left">
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-xs text-gray-500">{scenario.description}</div>
                    </div>
                    {isThinking && selectedScenario.name === scenario.name && (
                      <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Input */}
            <div className="bg-gray-50 p-3 rounded border">
              <h5 className="font-medium text-sm mb-2">Current Input Context</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Progress:</span>
                  <span className="ml-1 font-medium">{selectedScenario.input.currentProgress}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="ml-1 font-medium">{Math.floor(selectedScenario.input.timeSpent / 60)}m {selectedScenario.input.timeSpent % 60}s</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Activity:</span>
                  <span className="ml-1 font-medium">{selectedScenario.input.recentActivity}</span>
                </div>
                {selectedScenario.input.strugglingAreas.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Struggling:</span>
                    <span className="ml-1 text-red-600 font-medium">{selectedScenario.input.strugglingAreas.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Decision Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Decision Output
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastDecision ? (
              <>
                {/* Next Activity */}
                {lastDecision.nextActivity && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Recommended Activity</span>
                    </div>
                    <p className="text-blue-700 font-medium">{lastDecision.nextActivity}</p>
                  </div>
                )}

                {/* Difficulty Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Difficulty Level</span>
                    <span className="text-sm text-gray-600">{lastDecision.difficulty.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${lastDecision.difficulty * 20}%` }}
                    ></div>
                  </div>
                </div>

                {/* Cultural Adaptations */}
                {lastDecision.culturalAdaptation.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      Kenyan Cultural Context
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {lastDecision.culturalAdaptation.map((adaptation, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {adaptation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Alert */}
                {lastDecision.teacherAlert && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Teacher Alert</span>
                    </div>
                    <p className="text-yellow-700 text-sm">{lastDecision.teacherAlert}</p>
                  </div>
                )}

                {/* AI Reasoning */}
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">AI Reasoning</span>
                  </div>
                  <p className="text-purple-700 text-sm">{lastDecision.reasoning}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a scenario above to see AI decision-making in action</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cross-Device Adaptation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Cross-Device Adaptation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium">Current Device:</span>
            <div className="flex gap-2">
              {[
                { type: 'phone' as const, icon: Smartphone, label: 'Phone' },
                { type: 'tablet' as const, icon: Tablet, label: 'Tablet' }, 
                { type: 'desktop' as const, icon: Monitor, label: 'Desktop' }
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={deviceType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDeviceChange(type)}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <h5 className="font-medium text-sm mb-2">Device-Specific Adaptations</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">UI Elements:</span>
                <p className="font-medium">
                  {deviceType === 'phone' ? 'Large touch buttons, vertical layout' :
                   deviceType === 'tablet' ? 'Medium buttons, flexible grid' :
                   'Full keyboard support, multi-column'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Input Methods:</span>
                <p className="font-medium">
                  {deviceType === 'phone' ? 'Touch, voice, camera' :
                   deviceType === 'tablet' ? 'Touch, drawing, voice' :
                   'Keyboard, mouse, audio'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Screen Size:</span>
                <p className="font-medium">
                  {deviceType === 'phone' ? 'Small (mobile-first)' :
                   deviceType === 'tablet' ? 'Medium (responsive)' :
                   'Large (desktop layout)'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AWS Integration Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AWS Integration Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm mb-2">Current Implementation</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Omega Agent Core (TypeScript)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Redis Session Sync (Upstash)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Real-time Feedback (Supabase)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Grade 2 Cultural Context
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-2">AWS Enhancement Plan</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Amazon Personalize (ML recommendations)
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  SageMaker (MeTTa model training)
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Bedrock (Foundation models)
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Polly (Kiswahili voice synthesis)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}