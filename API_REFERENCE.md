# BASEERA 360 - API Reference

Complete REST API documentation for BASEERA 360

**Base URL**: `https://api.baseera.ae/api`

---

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require a JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

### Auth Endpoints

#### POST /auth/login
Login and get JWT token

**Request:**
```json
{
  "email": "engineer@baseera.ae",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "engineer@baseera.ae",
      "firstName": "Ahmed",
      "lastName": "Al-Mansouri",
      "role": "ENGINEER",
      "organizationId": "org-123"
    }
  }
}
```

---

## Projects

### GET /projects
List all projects for the authenticated user's organization

**Query Parameters:**
- `limit` (number, default: 50) - Results per page
- `offset` (number, default: 0) - Pagination offset
- `status` (string) - Filter by status: ACTIVE, COMPLETED, ON_HOLD, ARCHIVED
- `sortBy` (string) - Sort field: createdAt, projectName, status
- `sortOrder` (string) - ASC or DESC

**Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj-123",
        "projectName": "Marina Tower Facade Inspection",
        "buildingName": "Marina Tower",
        "jobNumber": "MAR-2024-001",
        "facadeType": "Glass Curtain Wall",
        "clientName": "DAMAC Properties",
        "status": "ACTIVE",
        "latitude": 28.5244,
        "longitude": 55.2764,
        "address": "Downtown Dubai",
        "city": "Dubai",
        "country": "UAE",
        "teamMemberCount": 3,
        "totalMediaAssets": 245,
        "totalAnnotations": 42,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

### POST /projects
Create a new inspection project

**Request:**
```json
{
  "projectName": "Burj Khalifa Annual Inspection",
  "buildingName": "Burj Khalifa",
  "jobNumber": "BK-2024-001",
  "facadeType": "Mixed Materials",
  "clientName": "Emaar Properties",
  "clientEmail": "inspector@emaar.ae",
  "latitude": 28.4041,
  "longitude": 55.2664,
  "address": "1 Mohammed Bin Rashid Blvd",
  "city": "Dubai",
  "country": "UAE",
  "buildingHeightM": 828,
  "totalFloors": 163,
  "constructionYear": 2010,
  "description": "Annual facade inspection including facade cleanliness assessment"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj-456",
      "organizationId": "org-123",
      "projectName": "Burj Khalifa Annual Inspection",
      "status": "ACTIVE",
      "createdAt": "2024-05-12T15:45:00Z",
      "createdBy": "user-123"
    }
  }
}
```

### GET /projects/:projectId
Get detailed project information

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj-123",
      "projectName": "Marina Tower Facade Inspection",
      "buildingName": "Marina Tower",
      "jobNumber": "MAR-2024-001",
      "status": "ACTIVE"
    },
    "stats": {
      "mediaCount": 245,
      "annotationCount": 42,
      "criticalDefects": 3,
      "highDefects": 8,
      "thermalReadings": 1250,
      "teamMembers": 3,
      "lastUpdated": "2024-05-12T14:30:00Z"
    }
  }
}
```

### PATCH /projects/:projectId
Update project details

**Request:**
```json
{
  "status": "COMPLETED",
  "description": "Inspection completed successfully"
}
```

---

## Media Assets

### GET /media
List media assets for a project

**Query Parameters:**
- `projectId` (required) - Project UUID
- `mediaType` - Filter: IMAGE, THERMAL, VIDEO, MODEL_3D, PANORAMA
- `source` - Filter: DRONE_RGB, DRONE_THERMAL, GROUND, INTERNAL
- `buildingZoneId` - Filter by zone
- `afterDate` - ISO date, e.g., 2024-01-01T00:00:00Z
- `limit` (default: 100)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "media-123",
        "mediaType": "IMAGE",
        "source": "DRONE_RGB",
        "originalFilename": "north_facade_20240515.jpg",
        "storageUrl": "https://cdn.baseera.ae/media/north_facade_20240515.jpg",
        "thumbnailUrl": "https://cdn.baseera.ae/media/north_facade_20240515_thumb.jpg",
        "imageWidth": 5472,
        "imageHeight": 3648,
        "droneModel": "DJI Matrice 300 RTK",
        "flightAltitudeM": 85,
        "gpsLatitude": 28.5244,
        "gpsLongitude": 55.2664,
        "captureDate": "2024-05-15T14:45:00Z",
        "cameraMake": "DJI",
        "cameraModel": "Zenmuse H30T",
        "buildingZoneName": "North Facade",
        "annotationCount": 5,
        "maxSeverity": "HIGH",
        "uploadedBy": "user-123",
        "createdAt": "2024-05-15T15:00:00Z"
      }
    ],
    "total": 245,
    "limit": 100,
    "offset": 0
  }
}
```

### POST /media
Upload media asset

**Request (multipart/form-data):**
```
projectId: proj-123
buildingZoneId: zone-456
mediaType: IMAGE
source: DRONE_RGB
file: <binary file data>
flightAltitudeM: 85
droneModel: DJI Matrice 300 RTK
gpsLatitude: 28.5244
gpsLongitude: 55.2664
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "media-789",
      "storageUrl": "https://cdn.baseera.ae/media/upload_xyz.jpg",
      "thumbnailUrl": "https://cdn.baseera.ae/media/upload_xyz_thumb.jpg"
    }
  }
}
```

---

## Annotations (Defects)

### GET /annotations
List annotations for a project

**Query Parameters:**
- `projectId` (required) - Project UUID
- `defectTypes` - Comma-separated: CRACK, CORROSION, SPALLING, WATER_INGRESS, etc.
- `severities` - Comma-separated: LOW, MEDIUM, HIGH, CRITICAL
- `statuses` - Comma-separated: OPEN, IN_PROGRESS, RESOLVED
- `buildingZoneId` - Filter by zone
- `assignedTo` - Filter by user ID
- `minCost`, `maxCost` - Cost range in USD
- `limit` (default: 100)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "annotations": [
      {
        "id": "ann-123",
        "projectId": "proj-123",
        "defectType": "CRACK",
        "severity": "HIGH",
        "status": "IN_PROGRESS",
        "title": "Diagonal facade crack - North Wall",
        "description": "4-meter diagonal crack spanning levels 15-18",
        "rootCause": "Differential thermal movement",
        "recommendedAction": "Structural assessment and sealant repair with monitoring",
        "estimatedCostUsd": 15000,
        "priorityLevel": 1,
        "buildingZoneName": "North Facade",
        "imagePixelX": 1250,
        "imagePixelY": 450,
        "createdBy": "user-123",
        "assignedTo": "user-456",
        "commentCount": 3,
        "tags": ["urgent", "structural"],
        "createdAt": "2024-05-10T09:00:00Z",
        "updatedAt": "2024-05-12T14:30:00Z"
      }
    ],
    "total": 42,
    "limit": 100,
    "offset": 0,
    "summary": {
      "CRACK": { "CRITICAL": 2, "HIGH": 5, "MEDIUM": 3, "LOW": 1 },
      "CORROSION": { "CRITICAL": 0, "HIGH": 3, "MEDIUM": 4, "LOW": 2 }
    }
  }
}
```

### POST /annotations
Create a new annotation

**Request:**
```json
{
  "projectId": "proj-123",
  "buildingZoneId": "zone-456",
  "defectType": "CRACK",
  "severity": "HIGH",
  "title": "Facade crack near window",
  "description": "Horizontal crack approximately 2 meters wide",
  "rootCause": "Structural movement",
  "recommendedAction": "Immediate inspection and repair",
  "estimatedCostUsd": 8500,
  "priorityLevel": 2,
  "primaryMediaAssetId": "media-123",
  "imagePixelX": 1250,
  "imagePixelY": 450,
  "tags": ["urgent", "near_window"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "annotation": {
      "id": "ann-789",
      "projectId": "proj-123",
      "defectType": "CRACK",
      "severity": "HIGH",
      "status": "OPEN",
      "createdAt": "2024-05-12T16:00:00Z"
    }
  }
}
```

### PATCH /annotations/:annotationId
Update annotation

**Request:**
```json
{
  "severity": "CRITICAL",
  "status": "IN_PROGRESS",
  "assignedTo": "user-456",
  "recommendedAction": "Emergency structural repair required"
}
```

### POST /annotations/:annotationId/comments
Add comment to annotation

**Request:**
```json
{
  "comment": "Structural engineer visited site. Recommends immediate attention.",
  "attachmentUrl": "https://cdn.baseera.ae/docs/structural_report.pdf"
}
```

---

## Thermal Analysis

### GET /thermal
Get thermal readings and anomalies

**Query Parameters:**
- `projectId` (required)
- `minTemperature` - Celsius, e.g., 35
- `maxTemperature` - Celsius, e.g., 50

**Response (200):**
```json
{
  "success": true,
  "data": {
    "readings": [
      {
        "id": "tr-123",
        "mediaAssetId": "media-789",
        "pixelX": 2156,
        "pixelY": 1840,
        "temperatureCelsius": 42.5,
        "temperatureFahrenheit": 108.5,
        "anomalyType": "HEAT_LOSS",
        "confidenceScore": 0.92,
        "relatedAnnotation": "Insulation failure - Level 20",
        "captureDate": "2024-05-15T14:45:00Z"
      }
    ],
    "statistics": {
      "minTemp": 18.2,
      "maxTemp": 48.7,
      "avgTemp": 32.1,
      "anomaliesDetected": 15
    }
  }
}
```

---

## Reports

### POST /reports
Generate inspection report

**Request:**
```json
{
  "projectId": "proj-123",
  "reportName": "Q2 2024 Facade Inspection Report",
  "reportType": "INSPECTION",
  "includeDefectTypes": ["CRACK", "CORROSION", "WATER_INGRESS"],
  "includeSeverityLevels": ["MEDIUM", "HIGH", "CRITICAL"],
  "includeBuildingZones": ["zone-123", "zone-456"],
  "includePhotos": true,
  "includeThermalData": true,
  "includeHeatmaps": true,
  "includeRecommendations": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "report-123",
      "reportName": "Q2 2024 Facade Inspection Report",
      "pdfFileUrl": "https://cdn.baseera.ae/reports/Q2_2024_Report.pdf",
      "generatedAt": "2024-05-12T17:00:00Z",
      "defectSummary": {
        "totalDefects": 42,
        "byCritical": 3,
        "byHigh": 8,
        "byMedium": 18,
        "byLow": 13
      },
      "costEstimate": {
        "total": 142500,
        "byDefectType": {
          "CRACK": 52000,
          "CORROSION": 35000,
          "WATER_INGRESS": 55500
        }
      }
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email and password are required",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User role 'CLIENT' is not authorized for this action"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with ID proj-invalid not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 300
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

All API endpoints are rate limited to **100 requests per 15 minutes** per IP address.

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-05-12T16:15:00Z
```

---

**API Version**: 1.0.0 | **Last Updated**: May 2024
