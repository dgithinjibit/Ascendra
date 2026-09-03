/**
 * MeTTa System Verification Test
 * 
 * Tests and verifies that all MeTTa systems are working correctly:
 * - UI Generation through symbolic reasoning
 * - API Processing through MeTTa programs
 * - Authentication with cultural awareness
 * - Knowledge graph symbolic operations
 * - Cultural adaptation engine
 * - Competency tracking system
 */

import { MeTTaSession } from '@/lib/omega-agent/metta-core';
import MeTTaUIGenerator from '@/lib/metta-ui/ui-generator';
import MeTTaAuthAgent from '@/lib/metta-auth/auth-agent';
import MeTTaKnowledgeGraph from '@/lib/metta-db/knowledge-graph';
import TotalMeTTaTransformation from './total-transformation';

export interface VerificationResult {
  systemName: string;
  testsPassed: number;
  totalTests: number;
  successRate: number;
  errors: string[];
  details: TestDetail[];
}

export interface TestDetail {
  testName: string;
  passed: boolean;
  executionTime: number;
  output?: any;
  error?: string;
}

/**
 * Comprehensive MeTTa System Verification
 */
export class MeTTaVerificationTest {
  private mettaSession: MeTTaSession;
  private uiGenerator: MeTTaUIGenerator;
  private authAgent: MeTTaAuthAgent;
  private knowledgeGraph: MeTTaKnowledgeGraph;
  private transformation: TotalMeTTaTransformation;

  constructor() {
    this.mettaSession = new MeTTaSession();
    this.uiGenerator = new MeTTaUIGenerator(this.mettaSession);
    this.authAgent = new MeTTaAuthAgent(this.mettaSession);
    this.knowledgeGraph = new MeTTaKnowledgeGraph(this.mettaSession);
    this.transformation = new TotalMeTTaTransformation();
  }

  /**
   * Run comprehensive verification of all MeTTa systems
   */
  async runCompleteVerification(): Promise<VerificationResult[]> {
    console.log("🚀 Starting Complete MeTTa System Verification...\n");

    const results: VerificationResult[] = [];

    // Test 1: MeTTa Core Session
    results.push(await this.testMeTTaCoreSession());

    // Test 2: UI Generation System
    results.push(await this.testUIGenerationSystem());

    // Test 3: Authentication System
    results.push(await this.testAuthenticationSystem());

    // Test 4: Knowledge Graph System
    results.push(await this.testKnowledgeGraphSystem());

    // Test 5: Cultural Integration
    results.push(await this.testCulturalIntegration());

    // Test 6: Complete System Integration
    results.push(await this.testCompleteIntegration());

    // Print summary
    this.printVerificationSummary(results);

    return results;
  }

  private async testMeTTaCoreSession(): Promise<VerificationResult> {
    console.log("🧠 Testing MeTTa Core Session...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Basic MeTTa fact addition
    try {
      this.mettaSession.addSessionFact("(test-fact user student grade 2)");
      tests.push({
        testName: "Basic fact addition",
        passed: true,
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      const errorMsg = `Basic fact addition failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Basic fact addition",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: MeTTa query processing
    try {
      const queryResult = await this.mettaSession.processInteraction({
        type: 'test_query',
        query: '(query-test-fact user student grade 2)',
        context: { test: true }
      });

      tests.push({
        testName: "Query processing",
        passed: queryResult !== null,
        executionTime: Date.now() - startTime,
        output: queryResult
      });
    } catch (error) {
      const errorMsg = `Query processing failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Query processing",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 3: Cultural context integration
    try {
      this.mettaSession.addSessionFact("(cultural-context kenyan (languages english kiswahili))");
      const culturalQuery = await this.mettaSession.processInteraction({
        type: 'cultural_test',
        query: '(get-cultural-languages kenyan)',
        context: { cultural: true }
      });

      tests.push({
        testName: "Cultural context integration",
        passed: culturalQuery !== null,
        executionTime: Date.now() - startTime,
        output: culturalQuery
      });
    } catch (error) {
      const errorMsg = `Cultural context integration failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Cultural context integration",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ MeTTa Core: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "MeTTa Core Session",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private async testUIGenerationSystem(): Promise<VerificationResult> {
    console.log("🎨 Testing UI Generation System...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Basic UI element generation
    try {
      const uiContext = {
        userId: "test-student-001",
        userRole: "student" as const,
        culturalBackground: ["kenyan"],
        competencyLevels: { mathematics: 2.0, kiswahili: 2.1 },
        learningStyle: ["visual"],
        accessibilityNeeds: [],
        deviceCapabilities: ["mobile"],
        currentActivity: "dashboard",
        educationalObjectives: ["numeracy", "literacy"]
      };

      const uiElement = await this.uiGenerator.generateUI(uiContext, "student-dashboard");
      
      tests.push({
        testName: "Basic UI generation",
        passed: uiElement !== null && uiElement.id !== undefined,
        executionTime: Date.now() - startTime,
        output: { elementId: uiElement?.id, type: uiElement?.type }
      });
    } catch (error) {
      const errorMsg = `Basic UI generation failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Basic UI generation",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: Cultural adaptation in UI
    try {
      const culturalContext = {
        userId: "test-student-kenyan",
        userRole: "student" as const,
        culturalBackground: ["kenyan"],
        competencyLevels: { mathematics: 2.0 },
        learningStyle: ["cultural"],
        accessibilityNeeds: [],
        deviceCapabilities: ["tablet"],
        currentActivity: "counting-activity",
        educationalObjectives: ["cultural-mathematics"]
      };

      const culturalUI = await this.uiGenerator.generateUI(culturalContext, "counting-activity");
      
      tests.push({
        testName: "Cultural UI adaptation",
        passed: culturalUI !== null && culturalUI.culturalContext.includes("kenyan"),
        executionTime: Date.now() - startTime,
        output: { culturalContext: culturalUI?.culturalContext }
      });
    } catch (error) {
      const errorMsg = `Cultural UI adaptation failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Cultural UI adaptation",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ UI Generation: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "UI Generation System",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private async testAuthenticationSystem(): Promise<VerificationResult> {
    console.log("🔐 Testing Authentication System...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Basic authentication
    try {
      const authResult = await this.authAgent.authenticateUser(
        { userId: "test-student", role: "student" },
        { deviceType: "tablet", trustLevel: "medium", networkSecurity: "secure" },
        { culturalMarkers: ["kenyan"] }
      );

      tests.push({
        testName: "Basic authentication",
        passed: authResult.success === true,
        executionTime: Date.now() - startTime,
        output: { success: authResult.success }
      });
    } catch (error) {
      const errorMsg = `Basic authentication failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Basic authentication",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: Cultural authentication patterns
    try {
      const culturalAuth = await this.authAgent.authenticateUser(
        { userId: "kenyan-student", role: "student" },
        { deviceType: "mobile", trustLevel: "medium", networkSecurity: "secure" },
        { culturalMarkers: ["kenyan"], detectedLanguage: "sw" }
      );

      tests.push({
        testName: "Cultural authentication",
        passed: culturalAuth.success === true,
        executionTime: Date.now() - startTime,
        output: { culturalPersonalization: culturalAuth.culturalPersonalization }
      });
    } catch (error) {
      const errorMsg = `Cultural authentication failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Cultural authentication",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ Authentication: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "Authentication System",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private async testKnowledgeGraphSystem(): Promise<VerificationResult> {
    console.log("🕸️ Testing Knowledge Graph System...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Knowledge node creation
    try {
      const studentNode = await this.knowledgeGraph.createKnowledgeNode(
        "student",
        { id: "test-student", grade: "2", name: "Test Student" },
        ["kenyan"]
      );

      tests.push({
        testName: "Knowledge node creation",
        passed: studentNode.id !== undefined && studentNode.type === "student",
        executionTime: Date.now() - startTime,
        output: { nodeId: studentNode.id, type: studentNode.type }
      });
    } catch (error) {
      const errorMsg = `Knowledge node creation failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Knowledge node creation",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: Cultural relationship creation
    try {
      const teacherNode = await this.knowledgeGraph.createKnowledgeNode(
        "teacher",
        { id: "test-teacher", subject: "mathematics" },
        ["kenyan"]
      );

      const relationship = await this.knowledgeGraph.createRelationship(
        "test-student",
        "test-teacher",
        "learns-from",
        ["kenyan"]
      );

      tests.push({
        testName: "Cultural relationship creation",
        passed: relationship.type === "learns-from",
        executionTime: Date.now() - startTime,
        output: { relationshipType: relationship.type }
      });
    } catch (error) {
      const errorMsg = `Cultural relationship creation failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Cultural relationship creation",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ Knowledge Graph: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "Knowledge Graph System",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private async testCulturalIntegration(): Promise<VerificationResult> {
    console.log("🌍 Testing Cultural Integration...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Kenyan cultural context recognition
    try {
      const culturalQuery = await this.mettaSession.processInteraction({
        type: 'cultural_recognition_test',
        query: '(recognize-cultural-context kenyan (greetings hujambo) (values family-respect))',
        context: { cultural: "kenyan" }
      });

      tests.push({
        testName: "Kenyan cultural recognition",
        passed: culturalQuery !== null,
        executionTime: Date.now() - startTime,
        output: culturalQuery
      });
    } catch (error) {
      const errorMsg = `Kenyan cultural recognition failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Kenyan cultural recognition",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: Language support integration
    try {
      const languageQuery = await this.mettaSession.processInteraction({
        type: 'language_support_test',
        query: '(test-language-support (primary english) (secondary kiswahili) (mixing natural))',
        context: { language: "bilingual" }
      });

      tests.push({
        testName: "Language support integration",
        passed: languageQuery !== null,
        executionTime: Date.now() - startTime,
        output: languageQuery
      });
    } catch (error) {
      const errorMsg = `Language support integration failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Language support integration",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ Cultural Integration: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "Cultural Integration",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private async testCompleteIntegration(): Promise<VerificationResult> {
    console.log("🔗 Testing Complete System Integration...");
    const startTime = Date.now();
    const tests: TestDetail[] = [];
    const errors: string[] = [];

    // Test 1: Cross-system integration
    try {
      const integrationResult = await this.transformation.verifyTransformationComplete();
      
      tests.push({
        testName: "Cross-system integration",
        passed: integrationResult.success === true,
        executionTime: Date.now() - startTime,
        output: { overallScore: integrationResult.overallScore }
      });
    } catch (error) {
      const errorMsg = `Cross-system integration failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Cross-system integration",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    // Test 2: Transformation completeness
    try {
      const transformationMetrics = this.transformation.getFinalTransformationMetrics();
      const isComplete = transformationMetrics.completionStatus.totalTransformationComplete;
      
      tests.push({
        testName: "Transformation completeness",
        passed: isComplete === true,
        executionTime: Date.now() - startTime,
        output: { transformationComplete: isComplete }
      });
    } catch (error) {
      const errorMsg = `Transformation completeness check failed: ${error}`;
      errors.push(errorMsg);
      tests.push({
        testName: "Transformation completeness",
        passed: false,
        executionTime: Date.now() - startTime,
        error: errorMsg
      });
    }

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`✅ Complete Integration: ${passedTests}/${tests.length} tests passed\n`);

    return {
      systemName: "Complete System Integration",
      testsPassed: passedTests,
      totalTests: tests.length,
      successRate: (passedTests / tests.length) * 100,
      errors,
      details: tests
    };
  }

  private printVerificationSummary(results: VerificationResult[]): void {
    console.log("📊 VERIFICATION SUMMARY");
    console.log("=" .repeat(50));
    
    let totalTests = 0;
    let totalPassed = 0;

    results.forEach(result => {
      const status = result.successRate === 100 ? "✅ PASS" : result.successRate >= 80 ? "⚠️ PARTIAL" : "❌ FAIL";
      console.log(`${status} ${result.systemName}: ${result.testsPassed}/${result.totalTests} (${result.successRate.toFixed(1)}%)`);
      
      totalTests += result.totalTests;
      totalPassed += result.testsPassed;

      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   ❌ ${error}`));
      }
    });

    const overallSuccessRate = (totalPassed / totalTests) * 100;
    console.log("=" .repeat(50));
    console.log(`🎯 OVERALL VERIFICATION: ${totalPassed}/${totalTests} (${overallSuccessRate.toFixed(1)}%)`);
    
    if (overallSuccessRate >= 95) {
      console.log("🎉 TRANSFORMATION VERIFICATION: ✅ COMPLETE SUCCESS!");
    } else if (overallSuccessRate >= 80) {
      console.log("⚠️ TRANSFORMATION VERIFICATION: MOSTLY SUCCESSFUL");
    } else {
      console.log("❌ TRANSFORMATION VERIFICATION: NEEDS IMPROVEMENT");
    }
  }
}

export default MeTTaVerificationTest;