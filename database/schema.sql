-- ============================================================================
-- BASEERA 360 - Production PostgreSQL Schema
-- Facade Inspection, Defect Mapping & Building Condition Assessment Platform
-- ============================================================================
-- Design Principles:
-- - Normalized for data integrity
-- - JSONB for flexible metadata & thermal data
-- - UUID for distributed systems
-- - Soft deletes for audit trails
-- - Role-based access control (RBAC)
-- - Geospatial support (PostGIS optional)
-- - Audit timestamps on all entities

-- ============================================================================
-- 1. ENUMS & TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'ENGINEER', 'CLIENT', 'VIEWER');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED');
CREATE TYPE defect_type AS ENUM (
  'CRACK', 'CORROSION', 'SPALLING', 'EFFLORESCENCE', 
  'WATER_INGRESS', 'MISSING_SEALANT', 'PAINT_FAILURE', 
  'JOINT_FAILURE', 'STRUCTURAL_DAMAGE', 'THERMAL_ANOMALY', 'OTHER'
);
CREATE TYPE severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE media_type AS ENUM ('IMAGE', 'THERMAL', 'VIDEO', 'MODEL_3D', 'PANORAMA');
CREATE TYPE model_format AS ENUM ('OBJ', 'FBX', 'IFC', 'GLTF');
CREATE TYPE image_source AS ENUM ('DRONE_RGB', 'DRONE_THERMAL', 'GROUND', 'INTERNAL');
CREATE TYPE annotation_status AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- ============================================================================
-- 2. CORE USER & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'VIEWER',
  organization_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  phone VARCHAR(20),
  profile_picture_url TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,  -- Soft delete
  metadata JSONB DEFAULT '{}' -- Additional user data
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization_id ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  headquarters_location VARCHAR(255),  -- e.g., "Dubai, UAE"
  website VARCHAR(255),
  subscription_tier VARCHAR(50),  -- 'FREE', 'PRO', 'ENTERPRISE'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE user_project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id)
);

CREATE INDEX idx_user_project_roles_user_id ON user_project_roles(user_id);
CREATE INDEX idx_user_project_roles_project_id ON user_project_roles(project_id);

-- ============================================================================
-- 3. PROJECTS & BUILDINGS
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  building_name VARCHAR(255) NOT NULL,
  job_number VARCHAR(50) NOT NULL UNIQUE,
  facade_type VARCHAR(100),  -- e.g., 'Glass Curtain Wall', 'Stone Facade'
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  
  -- Location & Spatial
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  
  -- Building Details
  building_height_m DECIMAL(10, 2),
  total_floors INT,
  construction_year INT,
  last_inspection_date DATE,
  
  -- Project Management
  status project_status DEFAULT 'ACTIVE',
  start_date DATE,
  end_date DATE,
  
  -- Description & Metadata
  description TEXT,
  custom_fields JSONB DEFAULT '{}',  -- Flexible custom data
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_organization_id ON projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_job_number ON projects(job_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Building Elevation/Zone Classification
CREATE TABLE building_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  zone_name VARCHAR(100) NOT NULL,  -- e.g., 'North Facade', 'East Zone'
  zone_type VARCHAR(50),  -- 'ELEVATION', 'SECTION', 'FLOOR'
  floor_number INT,
  phase VARCHAR(50),  -- e.g., 'Phase 1', 'Phase 2'
  description TEXT,
  sequence_order INT,  -- For ordering in UI
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_building_zones_project_id ON building_zones(project_id);
CREATE INDEX idx_building_zones_floor ON building_zones(floor_number);

-- ============================================================================
-- 4. MEDIA LIBRARY (Images, Thermal, Videos, 3D Models, Panoramas)
-- ============================================================================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  source image_source,  -- Only for images/thermal
  
  -- File Information
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,  -- S3/Azure path
  file_size_mb DECIMAL(10, 2),
  mime_type VARCHAR(50),
  storage_url TEXT NOT NULL,  -- CDN URL for fast access
  
  -- Image-specific metadata
  image_width INT,
  image_height INT,
  camera_make VARCHAR(100),
  camera_model VARCHAR(100),
  
  -- Drone metadata
  drone_model VARCHAR(100),
  flight_altitude_m DECIMAL(10, 2),
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_altitude_m DECIMAL(10, 2),
  yaw_angle DECIMAL(6, 2),  -- Drone heading
  pitch_angle DECIMAL(6, 2),
  roll_angle DECIMAL(6, 2),
  
  -- Image capture details
  capture_date TIMESTAMP,
  exposure_time VARCHAR(50),
  iso_speed INT,
  f_number DECIMAL(4, 2),
  focal_length_mm DECIMAL(8, 2),
  
  -- Thermal-specific
  thermal_min_temp DECIMAL(8, 2),  -- For R-JPEG thermal images
  thermal_max_temp DECIMAL(8, 2),
  thermal_palette VARCHAR(50),  -- 'IRON', 'RAINBOW', 'GRAYSCALE'
  
  -- Classification
  building_zone_id UUID REFERENCES building_zones(id),
  sequence_number INT,  -- For ordered gallery
  
  -- Processing Status
  is_processed BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,  -- Small preview
  
  -- Metadata (flexible storage for EXIF, thermal data, etc.)
  exif_data JSONB DEFAULT '{}',
  thermal_data JSONB DEFAULT '{}',  -- For R-JPEG temperature grid
  custom_metadata JSONB DEFAULT '{}',
  
  -- Audit
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_media_assets_project_id ON media_assets(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_type ON media_assets(media_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_building_zone_id ON media_assets(building_zone_id);
CREATE INDEX idx_media_assets_capture_date ON media_assets(capture_date);
CREATE INDEX idx_media_assets_source ON media_assets(source);

-- ============================================================================
-- 5. THERMAL ANALYSIS
-- ============================================================================

CREATE TABLE thermal_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  
  -- Point location on thermal image
  pixel_x INT NOT NULL,
  pixel_y INT NOT NULL,
  
  -- Temperature data
  temperature_celsius DECIMAL(8, 2) NOT NULL,
  temperature_fahrenheit DECIMAL(8, 2),
  
  -- Analysis
  thermal_index DECIMAL(5, 2),  -- Deviation from average
  anomaly_type VARCHAR(50),  -- 'HEAT_LOSS', 'MOISTURE', 'INSULATION_FAILURE'
  confidence_score DECIMAL(3, 2),  -- 0.0 to 1.0
  
  -- Related Annotation
  annotation_id UUID REFERENCES annotations(id),
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_thermal_readings_media_asset_id ON thermal_readings(media_asset_id);
CREATE INDEX idx_thermal_readings_annotation_id ON thermal_readings(annotation_id);

-- ============================================================================
-- 6. 3D MODELS & POINT CLOUDS
-- ============================================================================

CREATE TABLE model_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Model Details
  model_name VARCHAR(255) NOT NULL,
  model_format model_format NOT NULL,
  description TEXT,
  
  -- File Information
  file_path VARCHAR(512) NOT NULL,  -- S3/Azure path
  file_size_mb DECIMAL(10, 2),
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Model Metadata
  vertices_count INT,  -- Number of vertices
  faces_count INT,
  texture_count INT,
  
  -- Bounding Box (for frustum culling)
  bounds_min_x DECIMAL(12, 4),
  bounds_min_y DECIMAL(12, 4),
  bounds_min_z DECIMAL(12, 4),
  bounds_max_x DECIMAL(12, 4),
  bounds_max_y DECIMAL(12, 4),
  bounds_max_z DECIMAL(12, 4),
  
  -- Level of Detail versions
  lod_low_url TEXT,    -- For distant viewing
  lod_medium_url TEXT,
  lod_high_url TEXT,   -- Full detail
  
  -- Georeference
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  utm_zone INT,
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processing_status VARCHAR(50),  -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  
  building_zone_id UUID REFERENCES building_zones(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_model_3d_project_id ON model_3d(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_model_3d_building_zone_id ON model_3d(building_zone_id);

-- ============================================================================
-- 7. 360 PANORAMAS
-- ============================================================================

CREATE TABLE panoramas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Panorama Details
  panorama_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- File Information
  equirectangular_image_url TEXT NOT NULL,  -- 360 image stored on CDN
  preview_image_url TEXT,
  
  -- Panorama Metadata
  capture_date TIMESTAMP,
  capture_latitude DECIMAL(10, 8),
  capture_longitude DECIMAL(11, 8),
  capture_altitude_m DECIMAL(10, 2),
  
  -- Camera info
  camera_model VARCHAR(100),
  horizontal_fov INT DEFAULT 360,  -- Field of view
  vertical_fov INT DEFAULT 180,
  
  -- Spatial position in building
  building_zone_id UUID REFERENCES building_zones(id),
  floor_number INT,
  
  -- Linking (connections between panoramas)
  sequence_order INT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_panoramas_project_id ON panoramas(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_panoramas_building_zone_id ON panoramas(building_zone_id);

-- Panorama hotspots / navigation links
CREATE TABLE panorama_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panorama_id UUID NOT NULL REFERENCES panoramas(id) ON DELETE CASCADE,
  
  -- Hotspot position (in spherical coordinates)
  yaw DECIMAL(6, 2) NOT NULL,    -- 0-360 degrees
  pitch DECIMAL(6, 2) NOT NULL,  -- -90 to 90 degrees
  
  -- Hotspot Type & Data
  hotspot_type VARCHAR(50) NOT NULL,  -- 'LINK', 'INFO', 'ANNOTATION', 'MEASUREMENT'
  label VARCHAR(255),
  
  -- Link targets
  linked_panorama_id UUID REFERENCES panoramas(id),  -- For navigation
  linked_annotation_id UUID REFERENCES annotations(id),  -- For defect info
  external_url TEXT,
  
  -- Display properties
  icon_type VARCHAR(50),
  color VARCHAR(7),  -- Hex color
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_panorama_hotspots_panorama_id ON panorama_hotspots(panorama_id);
CREATE INDEX idx_panorama_hotspots_linked_annotation ON panorama_hotspots(linked_annotation_id);

-- Panorama measurements (distances, areas)
CREATE TABLE panorama_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panorama_id UUID NOT NULL REFERENCES panoramas(id) ON DELETE CASCADE,
  
  measurement_type VARCHAR(50) NOT NULL,  -- 'DISTANCE', 'AREA', 'ANGLE'
  measurement_value DECIMAL(12, 4),
  unit VARCHAR(20),  -- 'M', 'CM', 'MM', 'SQ_M'
  
  -- Measurement points (stored as JSON array of {yaw, pitch})
  measurement_points JSONB NOT NULL,
  
  label VARCHAR(255),
  description TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_panorama_measurements_panorama_id ON panorama_measurements(panorama_id);

-- ============================================================================
-- 8. CORE ANNOTATION & DEFECT SYSTEM
-- ============================================================================

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_zone_id UUID REFERENCES building_zones(id),
  
  -- Defect Classification
  defect_type defect_type NOT NULL,
  severity severity_level NOT NULL DEFAULT 'MEDIUM',
  status annotation_status DEFAULT 'OPEN',
  
  -- Description & Analysis
  title VARCHAR(255) NOT NULL,
  description TEXT,
  root_cause TEXT,
  
  -- Recommended Action
  recommended_action TEXT,
  estimated_cost_usd DECIMAL(12, 2),
  priority_level INT DEFAULT 3,  -- 1 (highest) to 5 (lowest)
  
  -- Multi-Media Linking
  primary_media_asset_id UUID REFERENCES media_assets(id),
  
  -- Spatial References
  -- For 2D image annotations
  image_pixel_x INT,
  image_pixel_y INT,
  
  -- For 3D model annotations
  model_3d_id UUID REFERENCES model_3d(id),
  model_coordinate_x DECIMAL(12, 4),
  model_coordinate_y DECIMAL(12, 4),
  model_coordinate_z DECIMAL(12, 4),
  
  -- For 360 panorama annotations
  panorama_id UUID REFERENCES panoramas(id),
  panorama_yaw DECIMAL(6, 2),
  panorama_pitch DECIMAL(6, 2),
  
  -- Ownership & Workflow
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  
  -- Dates
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Tags & Classification
  tags TEXT[],  -- Array of tags for filtering
  
  -- Extensible metadata
  custom_fields JSONB DEFAULT '{}'
);

CREATE INDEX idx_annotations_project_id ON annotations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_defect_type ON annotations(defect_type);
CREATE INDEX idx_annotations_severity ON annotations(severity);
CREATE INDEX idx_annotations_status ON annotations(status);
CREATE INDEX idx_annotations_building_zone_id ON annotations(building_zone_id);
CREATE INDEX idx_annotations_created_by ON annotations(created_by);
CREATE INDEX idx_annotations_assigned_to ON annotations(assigned_to);
CREATE INDEX idx_annotations_primary_media ON annotations(primary_media_asset_id);
CREATE INDEX idx_annotations_model_3d ON annotations(model_3d_id);
CREATE INDEX idx_annotations_panorama ON annotations(panorama_id);

-- Annotation Comments & Discussion Thread
CREATE TABLE annotation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'COMMENT',  -- 'COMMENT', 'UPDATE', 'STATUS_CHANGE'
  
  -- Attachments
  attachment_url TEXT,  -- Optional image/file
  
  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_annotation_comments_annotation_id ON annotation_comments(annotation_id);
CREATE INDEX idx_annotation_comments_created_by ON annotation_comments(created_by);

-- Annotation version history (for audit trail)
CREATE TABLE annotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  
  -- Changed fields
  changed_fields JSONB NOT NULL,  -- {field_name: {old_value, new_value}}
  change_type VARCHAR(50),  -- 'CREATED', 'UPDATED', 'STATUS_CHANGED'
  
  -- Who made the change
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_annotation_history_annotation_id ON annotation_history(annotation_id);

-- ============================================================================
-- 9. MEDIA ANNOTATION LINKING
-- ============================================================================

CREATE TABLE annotation_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  
  -- For image annotations: pixel coordinates
  pixel_x INT,
  pixel_y INT,
  
  -- For sequence/ordering
  sequence_order INT,
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(annotation_id, media_asset_id)
);

CREATE INDEX idx_annotation_media_links_annotation_id ON annotation_media_links(annotation_id);
CREATE INDEX idx_annotation_media_links_media_asset_id ON annotation_media_links(media_asset_id);

-- ============================================================================
-- 10. DEFECT MAPPING & SEVERITY TRACKING
-- ============================================================================

CREATE TABLE defect_severity_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Severity criteria
  severity_level severity_level NOT NULL,
  description VARCHAR(500),
  
  -- Threshold ranges
  affected_area_min_sqm DECIMAL(10, 4),
  affected_area_max_sqm DECIMAL(10, 4),
  
  -- Color coding for visualization
  color_code VARCHAR(7),  -- Hex color
  
  -- Remedial guidelines
  recommended_action_template TEXT,
  estimated_cost_min DECIMAL(12, 2),
  estimated_cost_max DECIMAL(12, 2),
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. REPORTS & EXPORTS
-- ============================================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Report Details
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50),  -- 'INSPECTION', 'THERMAL', 'SUMMARY', 'CUSTOM'
  
  -- Filters Applied
  include_defect_types defect_type[],
  include_severity_levels severity_level[],
  include_building_zones UUID[],
  
  -- Content
  description TEXT,
  cover_image_url TEXT,
  
  -- File Output
  pdf_file_url TEXT,
  doc_file_url TEXT,
  
  -- Metadata
  generated_at TIMESTAMP,
  include_photos BOOLEAN DEFAULT TRUE,
  include_thermal_data BOOLEAN DEFAULT TRUE,
  include_heatmaps BOOLEAN DEFAULT TRUE,
  include_recommendations BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_reports_project_id ON reports(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_created_by ON reports(created_by);

-- ============================================================================
-- 12. AUDIT LOG & ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type VARCHAR(50) NOT NULL,  -- 'UPLOAD', 'ANNOTATE', 'COMMENT', 'REPORT_GENERATE'
  action_description TEXT,
  entity_type VARCHAR(50),  -- 'MEDIA', 'ANNOTATION', 'PROJECT', 'MODEL'
  entity_id UUID,
  
  -- Actor
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Additional Context
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================================
-- 13. NOTIFICATIONS & ALERTS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50),  -- 'ANNOTATION_ASSIGNED', 'COMMENT_REPLY', 'REPORT_READY'
  
  -- Related Entity
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Delivery
  delivery_method VARCHAR(50) DEFAULT 'IN_APP',  -- 'IN_APP', 'EMAIL', 'SMS'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 14. INTEGRATIONS & WEBHOOKS (For Future Extensibility)
-- ============================================================================

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Webhook Configuration
  event_type VARCHAR(100) NOT NULL,  -- 'annotation.created', 'report.generated'
  endpoint_url TEXT NOT NULL,
  
  -- Security
  is_active BOOLEAN DEFAULT TRUE,
  secret_key VARCHAR(255),
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ============================================================================
-- 15. API KEYS (For Third-Party Integrations)
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Key Details
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  secret_key VARCHAR(255),
  
  -- Permissions
  allowed_scopes TEXT[],  -- e.g., ['read:project', 'write:annotation']
  
  -- Usage
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);

-- ============================================================================
-- VIEWS (For Common Queries)
-- ============================================================================

-- Active projects with member count
CREATE VIEW v_projects_with_stats AS
SELECT 
  p.id,
  p.project_name,
  p.building_name,
  p.job_number,
  p.status,
  p.created_at,
  COUNT(DISTINCT upr.user_id) as team_member_count,
  COUNT(DISTINCT ma.id) as total_media_assets,
  COUNT(DISTINCT a.id) as total_annotations
FROM projects p
LEFT JOIN user_project_roles upr ON p.id = upr.project_id
LEFT JOIN media_assets ma ON p.id = ma.project_id AND ma.deleted_at IS NULL
LEFT JOIN annotations a ON p.id = a.project_id AND a.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Active annotations summary
CREATE VIEW v_annotation_summary AS
SELECT 
  project_id,
  defect_type,
  severity,
  status,
  COUNT(*) as count
FROM annotations
WHERE deleted_at IS NULL
GROUP BY project_id, defect_type, severity, status;

-- Defect heatmap data
CREATE VIEW v_defect_heatmap AS
SELECT 
  a.project_id,
  a.building_zone_id,
  a.defect_type,
  a.severity,
  COUNT(*) as defect_count
FROM annotations a
WHERE a.deleted_at IS NULL
GROUP BY a.project_id, a.building_zone_id, a.defect_type, a.severity;

-- ============================================================================
-- INITIAL SETUP & SEQUENCES
-- ============================================================================

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all main tables
CREATE TRIGGER trigger_users_update BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_projects_update BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_media_assets_update BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_model_3d_update BEFORE UPDATE ON model_3d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_panoramas_update BEFORE UPDATE ON panoramas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_annotations_update BEFORE UPDATE ON annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_annotation_comments_update BEFORE UPDATE ON annotation_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- OPTIONAL: PostGIS SETUP (For Advanced Geospatial Features)
-- ============================================================================
-- Uncomment if you want advanced geospatial queries:
-- 
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;
--
-- ALTER TABLE projects ADD COLUMN location GEOMETRY(POINT, 4326);
-- ALTER TABLE media_assets ADD COLUMN gps_location GEOMETRY(POINT, 4326);
-- ALTER TABLE panoramas ADD COLUMN capture_location GEOMETRY(POINT, 4326);
--
-- CREATE INDEX idx_projects_location ON projects USING GIST(location);
-- CREATE INDEX idx_media_gps_location ON media_assets USING GIST(gps_location);

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE projects IS 'Facade inspection projects with building and location details';
COMMENT ON TABLE media_assets IS 'Multi-modal media storage: RGB images, thermal, videos, etc.';
COMMENT ON TABLE annotations IS 'Core defect annotation system with spatial references';
COMMENT ON TABLE model_3d IS '3D building models in various formats (OBJ, FBX, IFC, GLTF)';
COMMENT ON TABLE panoramas IS '360-degree panoramic images for immersive inspection';
COMMENT ON TABLE thermal_readings IS 'Individual thermal data points extracted from thermal images';
COMMENT ON TABLE reports IS 'Generated inspection reports in PDF/DOC formats';

-- End of schema
