# WhatsApp Ride-Hailing Bot

## Overview

A WhatsApp bot application for scheduling and managing car rides, built with Node.js. The bot handles ride requests through WhatsApp conversations, provides automatic geocoding of addresses, calculates routes and prices, and manages ride scheduling with automated reminders and driver notifications.

### Recent Changes (October 2025)
- **Migrated to official SDKs**: Now using `opencage-api-client` and `openrouteservice-js` instead of direct HTTP calls
- Implemented robust error handling for driver location with fallback to São Paulo coordinates
- Added complete scheduling system with natural language parsing in Portuguese ("hoje 14:00", "amanhã 18:30")
- Configured automated reminders (1 hour before ride) and driver notifications via node-cron
- Enhanced error handling with specific messages for rate limiting, invalid keys, and route not found errors
- All functionality tested and validated by architect review

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Messaging Layer
- **WhatsApp Integration**: Uses `@whiskeysockets/baileys` library for WhatsApp Web connection
- **QR Code Authentication**: Terminal-based QR code display for initial setup using `qrcode-terminal`
- **Multi-file Auth State**: Persistent authentication sessions to avoid repeated QR scans
- **Conversation State Machine**: Tracks user conversation flow through predefined states (IDLE, WAITING_ORIGIN, WAITING_DESTINATION, WAITING_CONFIRMATION, WAITING_SCHEDULE)

**Design Rationale**: Baileys provides a lightweight, protocol-compliant WhatsApp client without requiring official API access. The state machine pattern ensures conversations follow a logical flow and prevents mixed-up user inputs.

### Location Services
- **Geocoding**: OpenCage API via official SDK (`opencage-api-client`) converts text addresses to geographic coordinates
- **IP Geolocation**: Automatic driver location detection using ipapi.co service
- **Coordinate Processing**: Handles both shared location messages and text-based addresses

**Design Rationale**: Dual location input methods (GPS coordinates and text addresses) provide flexibility for different user preferences. OpenCage was chosen for its generous free tier and reliable geocoding accuracy. The official SDK provides better error handling and automatic API key management from environment variables.

### Routing & Pricing
- **Route Calculation**: OpenRouteService API via official SDK (`openrouteservice-js`) computes driving routes and distances
- **Dynamic Pricing**: Distance-based fare calculation with configurable base fare, per-kilometer rate, and minimum fare
- **Multi-leg Routes**: Supports driver-to-client and client-to-destination route calculations

**Design Rationale**: Separating routing from geocoding allows for provider flexibility. The official SDK provides structured error responses (HTTP status codes and internal error codes), lazy initialization for better performance, and better TypeScript support. The pricing model is simple but extensible, with all constants defined in configuration for easy adjustment.

### Data Storage
- **In-Memory Storage**: Custom `MemoryStorage` class using JavaScript Maps
- **No External Database**: All data (conversations, rides, scheduled rides) stored in application memory
- **Stateless Between Restarts**: Data is lost on application restart

**Design Rationale**: In-memory storage provides maximum speed and simplicity for prototype/MVP stage. Trade-off: No persistence means data loss on crashes or restarts. This approach minimizes external dependencies and deployment complexity.

### Scheduling System
- **Cron-based Reminders**: `node-cron` library handles scheduled ride reminders
- **Automated Notifications**: Sends reminders to both passengers and drivers
- **Time-based Triggers**: Flexible scheduling with configurable reminder intervals

**Design Rationale**: Node-cron provides a lightweight, in-process scheduling solution without requiring external job queue infrastructure.

### Logging & Monitoring
- **Structured Logging**: Pino logger for high-performance JSON logging
- **Console Output**: Development-friendly formatted logs
- **Error Tracking**: Comprehensive error catching and logging throughout services

**Design Rationale**: Pino offers minimal performance overhead while maintaining structured logs suitable for production monitoring tools.

## External Dependencies

### Third-Party APIs
1. **OpenCage Geocoding API** (`https://opencagedata.com/`)
   - Purpose: Convert text addresses to latitude/longitude coordinates
   - Configuration: Requires `OPENCAGE_API_KEY` environment variable
   - Rate Limits: Free tier typically allows 2,500 requests/day

2. **OpenRouteService Directions API** (`https://openrouteservice.org/`)
   - Purpose: Calculate driving routes and distances between coordinates
   - Configuration: Requires `OPENROUTESERVICE_API_KEY` environment variable
   - Rate Limits: Free tier typically allows 2,000 requests/day

3. **ipapi.co IP Geolocation Service**
   - Purpose: Automatic driver location detection from IP address
   - Configuration: No API key required for basic usage
   - Fallback: Defaults to São Paulo coordinates if service unavailable

### NPM Packages
- **@whiskeysockets/baileys**: WhatsApp Web protocol implementation
- **opencage-api-client**: Official OpenCage Geocoding SDK (v2.0.1+)
- **openrouteservice-js**: Official OpenRouteService SDK (v0.4.1+)
- **axios**: HTTP client for IP geolocation requests
- **node-cron**: Job scheduling for ride reminders
- **pino**: High-performance logging
- **qrcode-terminal**: QR code display in terminal

### Environment Configuration
Required variables in `.env` file:
- `OPENCAGE_API_KEY`: OpenCage API authentication
- `OPENROUTESERVICE_API_KEY`: OpenRouteService API authentication
- `DRIVER_PHONE`: WhatsApp number for driver notifications
- `DRIVER_IP`: IP address for driver location detection (or "auto" for automatic detection)

### Runtime Requirements
- Node.js 20 or higher
- Internet connection for WhatsApp Web and external APIs
- Terminal access for QR code scanning during initial setup