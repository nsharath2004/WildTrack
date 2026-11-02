-- =============================================================================
-- WildTrack - Wildlife Conservation and Management Database System
-- PES University - 5th Semester DBMS Mini-Project
-- File: database/views.sql
-- Description: 5 High-performance analytical Views for reporting
-- =============================================================================

USE wildlife_management;

-- 1. Detailed Animal Profile with Species & Sanctuary details
CREATE OR REPLACE VIEW v_animal_details AS
SELECT 
    a.animal_id,
    a.animal_name,
    a.tag_number,
    a.age,
    a.gender,
    a.health_status,
    s.species_id,
    s.common_name AS species_name,
    s.scientific_name,
    s.category,
    s.conservation_status,
    pa.area_id,
    pa.area_name AS protected_area_name,
    pa.location AS area_location,
    pa.area_type,
    a.created_at AS registered_at
FROM Animals a
INNER JOIN Species s ON a.species_id = s.species_id
INNER JOIN Protected_Area pa ON a.area_id = pa.area_id;

-- 2. Endangered Species Monitoring View
CREATE OR REPLACE VIEW v_endangered_species AS
SELECT 
    s.species_id,
    s.common_name,
    s.scientific_name,
    s.category,
    s.conservation_status,
    COUNT(a.animal_id) AS tracked_population_count
FROM Species s
LEFT JOIN Animals a ON s.species_id = a.species_id
WHERE s.conservation_status IN ('Endangered', 'Critically Endangered', 'Vulnerable', 'Extinct in Wild')
GROUP BY s.species_id, s.common_name, s.scientific_name, s.category, s.conservation_status;

-- 3. Chronological Sightings Feed with Animal and Sanctuary Context
CREATE OR REPLACE VIEW v_recent_sightings AS
SELECT 
    si.sighting_id,
    si.sighting_date,
    si.sighting_time,
    si.location_description,
    si.observed_by,
    si.notes,
    a.animal_id,
    a.animal_name,
    a.tag_number,
    s.common_name AS species_name,
    s.conservation_status,
    pa.area_id,
    pa.area_name AS protected_area_name
FROM Sightings si
INNER JOIN Animals a ON si.animal_id = a.animal_id
INNER JOIN Species s ON a.species_id = s.species_id
INNER JOIN Protected_Area pa ON si.area_id = pa.area_id;

-- 4. Active Threats and Associated Emergency Incidents
CREATE OR REPLACE VIEW v_active_threats AS
SELECT 
    t.threat_id,
    t.threat_type,
    t.severity,
    t.location,
    t.threat_date,
    t.status,
    t.reported_by,
    t.description,
    COUNT(i.incident_id) AS linked_incidents_count
FROM Threats t
LEFT JOIN Incidents i ON t.threat_id = i.threat_id
WHERE t.status = 'Active'
GROUP BY t.threat_id, t.threat_type, t.severity, t.location, t.threat_date, t.status, t.reported_by, t.description;

-- 5. Volunteer Deployments across National Parks
CREATE OR REPLACE VIEW v_volunteer_assignments AS
SELECT 
    v.volunteer_id,
    CONCAT(v.first_name, ' ', v.last_name) AS volunteer_name,
    v.email,
    v.phone,
    v.skills,
    v.status AS volunteer_status,
    pa.area_id,
    COALESCE(pa.area_name, 'Unassigned / Standby') AS assigned_area_name,
    pa.area_type
FROM Volunteers v
LEFT JOIN Protected_Area pa ON v.area_id = pa.area_id;
