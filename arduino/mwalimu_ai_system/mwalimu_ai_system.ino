/*
 * SYNCSENTA - AUTOMATED TEACHER SYSTEM
 * ======================================
 * 
 * Fully automated AI-powered system for Arduino Mastery Course
 * No manual teacher input - everything automated by AI
 * 
 * FEATURES:
 * - Automatic face recognition attendance
 * - AI-generated exams (SyncSenta agent)
 * - Automatic code assessment and grading
 * - Real-time progress tracking
 * - Cloud sync and notifications
 * 
 * HARDWARE:
 * - ESP32-CAM (AI-Thinker) with OV2640 camera
 * - 20x4 I2C LCD Display
 * - SD Card Module
 * - DS3231 RTC Module
 * - Buzzer, LEDs
 * 
 * AUTHOR: SyncSenta System
 * DATE: 2026
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "fb_gfx.h"
#include "fd_forward.h"      // Face detection
#include "fr_forward.h"      // Face recognition
#include <WiFi.h>
#include <HTTPClient.h>      // For AI API calls
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <SD_MMC.h>
#include <FS.h>
#include <ArduinoJson.h>     // For JSON parsing

// Include configuration and managers
#include "config.h"
#include "camera_pins.h"
#include "face_recognition.h"
#include "syncsenta_agent.h"
#include "attendance_auto.h"
#include "assessment_auto.h"
#include "display.h"
#include "storage.h"

// ===== GLOBAL OBJECTS =====
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);
RTC_DS3231 rtc;
HTTPClient http;

// ===== GLOBAL VARIABLES =====
bool systemReady = false;
bool autoAttendanceMode = true;  // Always on - automatic attendance
unsigned long lastFaceCheck = 0;
const unsigned long FACE_CHECK_INTERVAL = 2000;  // Check for faces every 2 seconds

// WiFi credentials - configure these
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// SyncSenta API endpoint - your AI backend
const char* AI_API_ENDPOINT = "https://your-ai-backend.com/api";
const char* AI_API_KEY = "YOUR_API_KEY";

// Face recognition
static mtmn_config_t mtmn_config = {0};
static face_id_list id_list = {0};

/*
 * SETUP FUNCTION
 * Initializes all hardware and connects to cloud services
 */
void setup() {
  Serial.begin(115200);
  Serial.println("=================================");
  Serial.println("SYNCSENTA - AUTOMATED TEACHER");
  Serial.println("=================================");
  Serial.println("Initializing system...");
  
  // Initialize pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(FLASH_LED, OUTPUT);
  
  // Yellow LED during initialization
  digitalWrite(LED_YELLOW, HIGH);
  
  // Initialize I2C for LCD and RTC
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Initialize LCD display
  lcd.init();
  lcd.backlight();
  displayWelcome();
  delay(2000);
  
  // Initialize RTC (Real-Time Clock)
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Init RTC...");
  if (!rtc.begin()) {
    Serial.println("ERROR: RTC not found!");
    lcd.setCursor(0, 1);
    lcd.print("RTC ERROR!");
    signalError();
    while (1);  // Halt system
  }
  
  // Set RTC time if power was lost
  if (rtc.lostPower()) {
    Serial.println("RTC lost power, setting time...");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  Serial.println("RTC initialized");
  
  // Initialize SD card for local data storage
  lcd.setCursor(0, 1);
  lcd.print("Init SD Card...");
  if (!SD_MMC.begin("/sdcard", true)) {  // 1-bit mode to save pins
    Serial.println("ERROR: SD card failed!");
    lcd.setCursor(0, 2);
    lcd.print("SD CARD ERROR!");
    signalError();
    while (1);  // Halt system
  }
  Serial.println("SD card initialized");
  
  // Create directory structure on SD card
  initializeStorage();
  
  // Initialize ESP32-CAM camera
  lcd.setCursor(0, 2);
  lcd.print("Init Camera...");
  if (!initCamera()) {
    Serial.println("ERROR: Camera failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("CAMERA ERROR!");
    signalError();
    while (1);  // Halt system
  }
  Serial.println("Camera initialized");
  
  // Initialize face recognition engine
  lcd.setCursor(0, 3);
  lcd.print("Init Face AI...");
  initFaceRecognition();
  loadFaceDatabase();  // Load enrolled student faces from SD card
  Serial.println("Face recognition ready");
  
  // Connect to WiFi for cloud services
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Connected");
    lcd.setCursor(0, 2);
    lcd.print(WiFi.localIP());
    
    // Test connection to SyncSenta backend
    lcd.setCursor(0, 3);
    lcd.print("Testing AI API...");
    if (testAIConnection()) {
      Serial.println("SyncSenta connected!");
      lcd.setCursor(0, 3);
      lcd.print("AI: Ready");
    } else {
      Serial.println("WARNING: AI API not reachable");
      lcd.setCursor(0, 3);
      lcd.print("AI: Offline Mode");
    }
  } else {
    Serial.println("\nWiFi failed - running offline");
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Offline Mode");
  }
  
  delay(2000);
  
  // System ready!
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, HIGH);
  signalSuccess();
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SYNCSENTA READY");
  lcd.setCursor(0, 1);
  lcd.print("Auto Attendance: ON");
  lcd.setCursor(0, 2);
  lcd.print("AI Grading: ON");
  lcd.setCursor(0, 3);
  lcd.print("Watching...");
  
  delay(2000);
  
  systemReady = true;
  Serial.println("=================================");
  Serial.println("System ready - fully automated");
  Serial.println("=================================");
  
  digitalWrite(LED_GREEN, LOW);
}

/*
 * MAIN LOOP
 * Continuously monitors for students and processes automatically
 */
void loop() {
  if (!systemReady) return;
  
  unsigned long currentTime = millis();
  
  // Check for faces every 2 seconds (automatic attendance)
  if (currentTime - lastFaceCheck >= FACE_CHECK_INTERVAL) {
    lastFaceCheck = currentTime;
    checkForStudents();
  }
  
  // Check for pending AI assessments
  processAIAssessments();
  
  // Sync data to cloud periodically
  static unsigned long lastSync = 0;
  if (currentTime - lastSync >= 60000) {  // Every minute
    lastSync = currentTime;
    syncToCloud();
  }
  
  delay(100);
}

/*
 * CHECK FOR STUDENTS
 * Automatically detects and recognizes student faces
 * Logs attendance without any manual input
 */
void checkForStudents() {
  // Capture frame from camera
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  // Convert to RGB matrix for face detection
  dl_matrix3du_t *image_matrix = dl_matrix3du_alloc(1, fb->width, fb->height, 3);
  if (!image_matrix) {
    esp_camera_fb_return(fb);
    return;
  }
  
  fmt2rgb888(fb->buf, fb->len, fb->format, image_matrix->item);
  
  // Detect faces in frame
  box_array_t *detected = face_detect(image_matrix, &mtmn_config);
  
  if (detected && detected->len > 0) {
    // Face detected! Try to recognize
    dl_matrix3du_t *aligned_face = NULL;
    int matched_id = recognize_face(&id_list, image_matrix, detected, &aligned_face);
    
    if (matched_id >= 0) {
      // Student recognized!
      String studentName = getStudentNameById(matched_id);
      float confidence = getRecognitionConfidence();
      
      // Log attendance automatically
      logAttendanceAuto(matched_id, studentName, confidence);
      
      // Display on LCD
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Welcome!");
      lcd.setCursor(0, 1);
      lcd.print(studentName);
      lcd.setCursor(0, 2);
      DateTime now = rtc.now();
      char timeStr[9];
      sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
      lcd.print("Time: ");
      lcd.print(timeStr);
      lcd.setCursor(0, 3);
      lcd.print("Attendance logged");
      
      signalSuccess();
      
      // Check if student has pending assessments
      checkPendingAssessments(matched_id);
      
      delay(3000);
      
      // Return to watching mode
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SYNCSENTA");
      lcd.setCursor(0, 1);
      lcd.print("Watching...");
      
    } else {
      // Unknown face detected
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Unknown Person");
      lcd.setCursor(0, 1);
      lcd.print("Please register");
      signalWarning();
      delay(2000);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Watching...");
    }
    
    if (aligned_face) {
      dl_matrix3du_free(aligned_face);
    }
    
    free(detected);
  }
  
  dl_matrix3du_free(image_matrix);
  esp_camera_fb_return(fb);
}

/*
 * PROCESS AI ASSESSMENTS
 * Checks for student code submissions and sends to SyncSenta for grading
 */
void processAIAssessments() {
  // Check SD card for new code submissions
  File submissionsDir = SD_MMC.open("/submissions");
  if (!submissionsDir) return;
  
  File file = submissionsDir.openNextFile();
  while (file) {
    if (!file.isDirectory()) {
      String filename = file.name();
      
      // Check if this submission needs AI grading
      if (filename.endsWith(".ino") && !isAlreadyGraded(filename)) {
        Serial.print("Found new submission: ");
        Serial.println(filename);
        
        // Read the code
        String code = "";
        while (file.available()) {
          code += (char)file.read();
        }
        
        // Send to SyncSenta for assessment
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("AI Grading...");
        lcd.setCursor(0, 1);
        lcd.print(filename);
        
        AIAssessmentResult result = sendToSyncSenta(code, filename);
        
        if (result.success) {
          // Save grade to database
          saveAIGrade(filename, result.score, result.feedback);
          
          lcd.setCursor(0, 2);
          lcd.print("Score: ");
          lcd.print(result.score);
          lcd.print("/100");
          lcd.setCursor(0, 3);
          lcd.print("Grade saved!");
          
          signalSuccess();
          delay(2000);
        } else {
          lcd.setCursor(0, 2);
          lcd.print("AI Error");
          signalError();
          delay(1000);
        }
      }
    }
    file = submissionsDir.openNextFile();
  }
  
  submissionsDir.close();
}

/*
 * SYNC TO CLOUD
 * Uploads attendance and assessment data to cloud backend
 */
void syncToCloud() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("Syncing data to cloud...");
  
  // Upload attendance records
  uploadAttendanceData();
  
  // Upload assessment results
  uploadAssessmentData();
  
  // Download any updates from cloud
  downloadCloudUpdates();
  
  Serial.println("Cloud sync complete");
}

/*
 * SIGNAL FUNCTIONS
 * Visual and audio feedback
 */
void signalSuccess() {
  digitalWrite(LED_GREEN, HIGH);
  tone(BUZZER_PIN, 1000, 100);
  delay(100);
  digitalWrite(LED_GREEN, LOW);
}

void signalError() {
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 200, 300);
  delay(300);
  digitalWrite(LED_RED, LOW);
}

void signalWarning() {
  digitalWrite(LED_YELLOW, HIGH);
  tone(BUZZER_PIN, 500, 200);
  delay(200);
  digitalWrite(LED_YELLOW, LOW);
}
