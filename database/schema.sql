-- =============================================================================
-- WildTrack - Wildlife Conservation and Management Database System
-- PES University - 5th Semester DBMS Mini-Project
-- File: database/schema.sql
-- Description: Complete 3NF relational schema with 12 domain tables + 2 audit tables
-- Integrity: Primary Keys, Foreign Keys, Unique Keys, Check Constraints, NOT NULLs, Indexes
-- =============================================================================

CREATE DATABASE IF NOT EXISTS wildlife_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wildlife_management;

-- Drop existing tables in reverse dependency order if recreating
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS deleted_animals_log;
DROP TABLE IF EXISTS wildlife_audit_log;
DROP TABLE IF EXISTS Volunteers;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS Veterinary;
DROP TABLE IF EXISTS Incidents;
DROP TABLE IF EXISTS Threats;
DROP TABLE IF EXISTS Sightings;
DROP TABLE IF EXISTS Research;
DROP TABLE IF EXISTS Researchers;
DROP TABLE IF EXISTS Animals;
DROP TABLE IF EXISTS Protected_Area;
DROP TABLE IF EXISTS Species;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- TABLE 1: Users (Role-Based Access Control: Admin, Researcher, Forest Officer)
-- =============================================================================
CREATE TABLE IF NOT EXISTS Users (
    user_id             INT             AUTO_INCREMENT PRIMARY KEY,
    username            VARCHAR(60)     NOT NULL UNIQUE,
    email               VARCHAR(150)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,
    full_name           VARCHAR(120)    NOT NULL,
    role                ENUM('Admin', 'Researcher', 'Forest Officer') NOT NULL DEFAULT 'Forest Officer',
    badge_number        VARCHAR(40)     NULL UNIQUE,
    phone               VARCHAR(25)     NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_username (username),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 2: Species
-- =============================================================================
CREATE TABLE IF NOT EXISTS Species (
    species_id          INT             AUTO_INCREMENT PRIMARY KEY,
    common_name         VARCHAR(100)    NOT NULL,
    scientific_name     VARCHAR(150)    NOT NULL UNIQUE,
    category            ENUM('Mammal','Bird','Reptile','Amphibian','Fish','Invertebrate') NOT NULL,
    conservation_status ENUM('Least Concern','Near Threatened','Vulnerable','Endangered','Critically Endangered','Extinct in Wild','Extinct') NOT NULL,
    description         TEXT,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_species_category (category),
    INDEX idx_species_status (conservation_status)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 3: Protected_Area
-- =============================================================================
CREATE TABLE IF NOT EXISTS Protected_Area (
    area_id             INT             AUTO_INCREMENT PRIMARY KEY,
    area_name           VARCHAR(150)    NOT NULL UNIQUE,
    location            VARCHAR(200)    NOT NULL,
    area_size_km2       DECIMAL(10,2)   NOT NULL,
    area_type           ENUM('National Park','Wildlife Sanctuary','Biosphere Reserve','Forest Reserve') NOT NULL,
    description         TEXT,
    established_year    INT             NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_area_size CHECK (area_size_km2 > 0),
    CONSTRAINT chk_est_year CHECK (established_year >= 1800 AND established_year <= 2100),
    INDEX idx_area_type (area_type)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 4: Animals
-- =============================================================================
CREATE TABLE IF NOT EXISTS Animals (
    animal_id           INT             AUTO_INCREMENT PRIMARY KEY,
    animal_name         VARCHAR(100)    NOT NULL,
    species_id          INT             NOT NULL,
    age                 INT             NOT NULL,
    gender              ENUM('Male','Female','Unknown')    NOT NULL DEFAULT 'Unknown',
    health_status       ENUM('Healthy','Injured','Sick','Under Treatment','Deceased') NOT NULL DEFAULT 'Healthy',
    area_id             INT             NOT NULL,
    tag_number          VARCHAR(50)     NOT NULL UNIQUE,
    notes               TEXT,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_animals_species
        FOREIGN KEY (species_id) REFERENCES Species(species_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_animals_area
        FOREIGN KEY (area_id) REFERENCES Protected_Area(area_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_animal_age CHECK (age >= 0 AND age <= 150),
    INDEX idx_animals_species (species_id),
    INDEX idx_animals_area (area_id),
    INDEX idx_animals_health (health_status)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 5: Researchers
-- =============================================================================
CREATE TABLE IF NOT EXISTS Researchers (
    researcher_id       INT             AUTO_INCREMENT PRIMARY KEY,
    first_name          VARCHAR(80)     NOT NULL,
    last_name           VARCHAR(80)     NOT NULL,
    email               VARCHAR(150)    NOT NULL UNIQUE,
    phone               VARCHAR(25),
    specialization      VARCHAR(150)    NOT NULL,
    institution         VARCHAR(200),
    joining_date        DATE            NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_researcher_email (email)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 6: Research
-- =============================================================================
CREATE TABLE IF NOT EXISTS Research (
    research_id         INT             AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    researcher_id       INT             NOT NULL,
    start_date          DATE            NOT NULL,
    end_date            DATE            NULL,
    status              ENUM('Planned','Active','Completed','Suspended') NOT NULL DEFAULT 'Planned',
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_research_researcher
        FOREIGN KEY (researcher_id) REFERENCES Researchers(researcher_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_research_dates CHECK (end_date IS NULL OR end_date >= start_date),
    INDEX idx_research_status (status),
    INDEX idx_research_researcher (researcher_id)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 7: Sightings
-- =============================================================================
CREATE TABLE IF NOT EXISTS Sightings (
    sighting_id         INT             AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT             NOT NULL,
    area_id             INT             NOT NULL,
    sighting_date       DATE            NOT NULL,
    sighting_time       TIME            NOT NULL,
    location_description VARCHAR(250),
    observed_by         VARCHAR(150)    NOT NULL,
    notes               TEXT,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sightings_animal
        FOREIGN KEY (animal_id) REFERENCES Animals(animal_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sightings_area
        FOREIGN KEY (area_id) REFERENCES Protected_Area(area_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_sightings_date (sighting_date),
    INDEX idx_sightings_animal (animal_id),
    INDEX idx_sightings_area (area_id)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 8: Threats
-- =============================================================================
CREATE TABLE IF NOT EXISTS Threats (
    threat_id           INT             AUTO_INCREMENT PRIMARY KEY,
    threat_type         ENUM('Poaching','Habitat Loss','Disease','Human-Wildlife Conflict','Climate Change','Pollution','Invasive Species') NOT NULL,
    severity            ENUM('Low','Medium','High','Critical') NOT NULL,
    location            VARCHAR(200)    NOT NULL,
    threat_date         DATE            NOT NULL,
    description         TEXT,
    reported_by         VARCHAR(150)    NOT NULL,
    status              ENUM('Active','Resolved','Monitoring') NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_threats_severity (severity),
    INDEX idx_threats_status (status),
    INDEX idx_threats_date (threat_date)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 9: Incidents
-- =============================================================================
CREATE TABLE IF NOT EXISTS Incidents (
    incident_id         INT             AUTO_INCREMENT PRIMARY KEY,
    incident_title      VARCHAR(200)    NOT NULL,
    animal_id           INT             NULL,
    threat_id           INT             NULL,
    incident_date       DATE            NOT NULL,
    description         TEXT,
    location            VARCHAR(200)    NOT NULL,
    severity            ENUM('Low','Medium','High','Critical') NOT NULL,
    status              ENUM('Open','Under Investigation','Resolved','Closed') NOT NULL DEFAULT 'Open',
    resolved_date       DATE            NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_animal
        FOREIGN KEY (animal_id) REFERENCES Animals(animal_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_incidents_threat
        FOREIGN KEY (threat_id) REFERENCES Threats(threat_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_incident_dates CHECK (resolved_date IS NULL OR resolved_date >= incident_date),
    INDEX idx_incidents_status (status),
    INDEX idx_incidents_severity (severity),
    INDEX idx_incidents_date (incident_date)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 10: Veterinary
-- =============================================================================
CREATE TABLE IF NOT EXISTS Veterinary (
    vet_id              INT             AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT             NOT NULL,
    diagnosis           VARCHAR(300)    NOT NULL,
    treatment           TEXT            NOT NULL,
    veterinarian_name   VARCHAR(150)    NOT NULL,
    treatment_date      DATE            NOT NULL,
    follow_up_date      DATE            NULL,
    medication          VARCHAR(300),
    cost                DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    notes               TEXT,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vet_animal
        FOREIGN KEY (animal_id) REFERENCES Animals(animal_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_vet_cost CHECK (cost >= 0),
    CONSTRAINT chk_vet_dates CHECK (follow_up_date IS NULL OR follow_up_date >= treatment_date),
    INDEX idx_vet_animal (animal_id),
    INDEX idx_vet_date (treatment_date)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 11: Projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS Projects (
    project_id          INT             AUTO_INCREMENT PRIMARY KEY,
    project_name        VARCHAR(200)    NOT NULL UNIQUE,
    description         TEXT,
    budget              DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    start_date          DATE            NOT NULL,
    end_date            DATE            NULL,
    status              ENUM('Planning','Active','Completed','Suspended') NOT NULL DEFAULT 'Planning',
    project_lead        VARCHAR(150)    NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_budget CHECK (budget >= 0),
    CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR end_date >= start_date),
    INDEX idx_projects_status (status)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 12: Volunteers
-- =============================================================================
CREATE TABLE IF NOT EXISTS Volunteers (
    volunteer_id        INT             AUTO_INCREMENT PRIMARY KEY,
    first_name          VARCHAR(80)     NOT NULL,
    last_name           VARCHAR(80)     NOT NULL,
    email               VARCHAR(150)    NOT NULL UNIQUE,
    phone               VARCHAR(25),
    area_id             INT             NULL,
    join_date           DATE            NOT NULL,
    skills              TEXT,
    status              ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_volunteers_area
        FOREIGN KEY (area_id) REFERENCES Protected_Area(area_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_volunteers_area (area_id),
    INDEX idx_volunteers_status (status)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 13: wildlife_audit_log (Trigger-driven Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS wildlife_audit_log (
    log_id              INT             AUTO_INCREMENT PRIMARY KEY,
    action_type         VARCHAR(50)     NOT NULL,
    table_name          VARCHAR(50)     NOT NULL,
    record_id           INT             NOT NULL,
    description         TEXT,
    action_time         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_time (action_time)
) ENGINE=InnoDB;

-- =============================================================================
-- TABLE 14: deleted_animals_log (Historical Deletion Archive)
-- =============================================================================
CREATE TABLE IF NOT EXISTS deleted_animals_log (
    log_id              INT             AUTO_INCREMENT PRIMARY KEY,
    original_animal_id  INT             NOT NULL,
    animal_name         VARCHAR(100),
    species_id          INT,
    age                 INT,
    gender              ENUM('Male','Female','Unknown'),
    health_status       ENUM('Healthy','Injured','Sick','Under Treatment','Deceased'),
    area_id             INT,
    tag_number          VARCHAR(50),
    notes               TEXT,
    original_created_at TIMESTAMP       NULL,
    deleted_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_deleted_animal (original_animal_id),
    INDEX idx_deleted_time (deleted_at)
) ENGINE=InnoDB;
