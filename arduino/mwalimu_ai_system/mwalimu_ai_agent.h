/*
 * SYNCSENTA AGENT
 * ================
 * 
 * Integration with SyncSenta backend for:
 * - Automatic exam generation
 * - Code assessment and grading
 * - Student progress analysis
 * - Personalized feedback
 * 
 * The AI agent handles all teacher tasks automatically
 */

#ifndef SYNCSENTA_AGENT_H
#define SYNCSENTA_AGENT_H

#include <HTTPClient.h>
#include <ArduinoJson.h>

// External variables from main file
extern HTTPClient http;
extern const char* AI_API_ENDPOINT;
extern const char* AI_API_KEY;

/*
 * AI ASSESSMENT RESULT STRUCTURE
 * Contains the grading results from SyncSenta
 */
struct AIAssessmentResult {
  bool success;              // Whether AI grading succeeded
  int score;                 // Score out of 100
  String feedback;           // Detailed feedback from AI
  String strengths;          // What student did well
  String improvements;       // Areas for improvement
  bool passedTests;          // Whether code passed automated tests
};

/*
 * TEST AI CONNECTION
 * Verifies that SyncSenta backend is reachable
 * Returns: true if connected, false otherwise
 */
bool testAIConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  http.begin(String(AI_API_ENDPOINT) + "/health");
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  int httpCode = http.GET();
  http.end();
  
  return (httpCode == 200);
}

/*
 * SEND CODE TO SYNCSENTA FOR ASSESSMENT
 * Submits student code to AI for automatic grading
 * 
 * Parameters:
 *   code - The Arduino code to assess
 *   filename - Name of the file (contains student ID and project info)
 * 
 * Returns: AIAssessmentResult with score and feedback
 */
AIAssessmentResult sendToSyncSenta(String code, String filename) {
  AIAssessmentResult result;
  result.success = false;
  result.score = 0;
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("No WiFi - cannot contact AI");
    result.feedback = "Offline mode - manual grading required";
    return result;
  }
  
  // Parse filename to extract student ID and project day
  // Format: studentID_day_projectname.ino
  int firstUnderscore = filename.indexOf('_');
  int secondUnderscore = filename.indexOf('_', firstUnderscore + 1);
  
  String studentId = filename.substring(0, firstUnderscore);
  String dayStr = filename.substring(firstUnderscore + 1, secondUnderscore);
  int projectDay = dayStr.toInt();
  
  // Create JSON payload for AI
  StaticJsonDocument<4096> doc;
  doc["student_id"] = studentId;
  doc["project_day"] = projectDay;
  doc["code"] = code;
  doc["language"] = "arduino";
  doc["course"] = "Arduino Mastery";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send to SyncSenta API
  http.begin(String(AI_API_ENDPOINT) + "/assess");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  Serial.println("Sending code to SyncSenta...");
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode == 200) {
    // Parse AI response
    String response = http.getString();
    
    StaticJsonDocument<2048> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      result.success = true;
      result.score = responseDoc["score"];
      result.feedback = responseDoc["feedback"].as<String>();
      result.strengths = responseDoc["strengths"].as<String>();
      result.improvements = responseDoc["improvements"].as<String>();
      result.passedTests = responseDoc["passed_tests"];
      
      Serial.println("AI Assessment complete:");
      Serial.print("  Score: ");
      Serial.println(result.score);
      Serial.print("  Feedback: ");
      Serial.println(result.feedback);
    } else {
      Serial.println("Failed to parse AI response");
      result.feedback = "AI response parsing error";
    }
  } else {
    Serial.print("AI API error: ");
    Serial.println(httpCode);
    result.feedback = "AI service unavailable";
  }
  
  http.end();
  return result;
}

/*
 * GENERATE EXAM FOR STUDENT
 * Requests SyncSenta to generate a personalized exam
 * based on student's progress and weak areas
 * 
 * Parameters:
 *   studentId - Student identifier
 *   projectDay - Which day of the course (1-10)
 * 
 * Returns: JSON string with exam questions
 */
String generateExamForStudent(String studentId, int projectDay) {
  if (WiFi.status() != WL_CONNECTED) {
    return "{\"error\": \"offline\"}";
  }
  
  // Create request for AI-generated exam
  StaticJsonDocument<512> doc;
  doc["student_id"] = studentId;
  doc["project_day"] = projectDay;
  doc["exam_type"] = "adaptive";  // AI adapts to student level
  doc["question_count"] = 10;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Request exam from SyncSenta
  http.begin(String(AI_API_ENDPOINT) + "/generate-exam");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  Serial.println("Requesting AI-generated exam...");
  int httpCode = http.POST(jsonPayload);
  
  String examJson = "{}";
  if (httpCode == 200) {
    examJson = http.getString();
    Serial.println("Exam generated successfully");
  } else {
    Serial.print("Exam generation failed: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return examJson;
}

/*
 * GET STUDENT PROGRESS ANALYSIS
 * Requests AI analysis of student's overall progress
 * 
 * Parameters:
 *   studentId - Student identifier
 * 
 * Returns: JSON string with progress analysis
 */
String getProgressAnalysis(String studentId) {
  if (WiFi.status() != WL_CONNECTED) {
    return "{\"error\": \"offline\"}";
  }
  
  // Request progress analysis from AI
  http.begin(String(AI_API_ENDPOINT) + "/analyze-progress/" + studentId);
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  Serial.println("Requesting progress analysis...");
  int httpCode = http.GET();
  
  String analysisJson = "{}";
  if (httpCode == 200) {
    analysisJson = http.getString();
    Serial.println("Progress analysis received");
  } else {
    Serial.print("Analysis failed: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return analysisJson;
}

/*
 * GET AI RECOMMENDATIONS
 * Gets personalized learning recommendations from AI
 * 
 * Parameters:
 *   studentId - Student identifier
 * 
 * Returns: String with recommendations
 */
String getAIRecommendations(String studentId) {
  if (WiFi.status() != WL_CONNECTED) {
    return "Offline - no recommendations available";
  }
  
  // Request recommendations from AI
  http.begin(String(AI_API_ENDPOINT) + "/recommendations/" + studentId);
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  int httpCode = http.GET();
  
  String recommendations = "";
  if (httpCode == 200) {
    StaticJsonDocument<1024> doc;
    String response = http.getString();
    deserializeJson(doc, response);
    
    recommendations = doc["recommendations"].as<String>();
  }
  
  http.end();
  return recommendations;
}

/*
 * SUBMIT EXAM ANSWERS
 * Sends student's exam answers to AI for grading
 * 
 * Parameters:
 *   studentId - Student identifier
 *   examId - Exam identifier
 *   answers - JSON string with student answers
 * 
 * Returns: Score out of 100
 */
int submitExamAnswers(String studentId, String examId, String answers) {
  if (WiFi.status() != WL_CONNECTED) {
    return -1;  // Error code
  }
  
  // Create submission payload
  StaticJsonDocument<2048> doc;
  doc["student_id"] = studentId;
  doc["exam_id"] = examId;
  doc["answers"] = answers;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Submit to AI for grading
  http.begin(String(AI_API_ENDPOINT) + "/grade-exam");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(AI_API_KEY));
  
  Serial.println("Submitting exam for AI grading...");
  int httpCode = http.POST(jsonPayload);
  
  int score = 0;
  if (httpCode == 200) {
    StaticJsonDocument<512> responseDoc;
    String response = http.getString();
    deserializeJson(responseDoc, response);
    
    score = responseDoc["score"];
    Serial.print("Exam graded - Score: ");
    Serial.println(score);
  }
  
  http.end();
  return score;
}

#endif // SYNCSENTA_AGENT_H
