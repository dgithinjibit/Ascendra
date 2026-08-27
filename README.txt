SYNCSENTA - AUTOMATED TEACHER SYSTEM
======================================

Production-ready AI-powered system for Arduino Mastery Course.

ARDUINO HARDWARE SYSTEM:
-------------------------
Location: arduino/syncsenta_system/

Fully automated system using ESP32-CAM with face recognition.
No manual teacher input needed - AI handles everything.

Features:
- Automatic attendance (face recognition)
- AI-generated exams
- Automatic code grading
- Progress tracking
- Cloud sync

Hardware Cost: ~$54
See arduino/README.txt for details.

PROJECT STRUCTURE:
------------------
arduino/                    # Hardware system (ESP32-CAM)
  syncsenta_system/       # Main code
  README.txt               # Complete documentation

ai-agents/                 # AI backend agents
api/                       # API services
studio/                    # Web dashboard
scripts/                   # Deployment scripts
sql/                       # Centralized SQL migrations and helpers

DEPLOYMENT:
-----------
1. Hardware: Upload arduino code to ESP32-CAM
2. Backend: Deploy AI agents to cloud
3. Frontend: Deploy studio dashboard

For hardware setup, see arduino/README.txt
