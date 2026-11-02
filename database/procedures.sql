-- =============================================================================
-- WildTrack - Wildlife Conservation and Management Database System
-- PES University - 5th Semester DBMS Mini-Project
-- File: database/procedures.sql
-- Description: Stored Procedures with Input/Output Parameters and ACID Transactions
-- =============================================================================

USE wildlife_management;

DROP PROCEDURE IF EXISTS GetAnimalsByArea;
DROP PROCEDURE IF EXISTS GetSpeciesStats;
DROP PROCEDURE IF EXISTS GetThreatSummary;
DROP PROCEDURE IF EXISTS AddAnimalWithSighting;
DROP PROCEDURE IF EXISTS GetResearcherProjects;

DELIMITER $$

-- 1. Get all animals residing within a specific protected area
CREATE PROCEDURE GetAnimalsByArea(IN p_area_id INT)
BEGIN
    SELECT 
        a.animal_id,
        a.animal_name,
        a.tag_number,
        a.age,
        a.gender,
        a.health_status,
        s.common_name AS species_name,
        s.conservation_status,
        pa.area_name
    FROM Animals a
    INNER JOIN Species s ON a.species_id = s.species_id
    INNER JOIN Protected_Area pa ON a.area_id = pa.area_id
    WHERE a.area_id = p_area_id
    ORDER BY a.animal_name ASC;
END$$

-- 2. Aggregate census statistics by species
CREATE PROCEDURE GetSpeciesStats()
BEGIN
    SELECT 
        s.species_id,
        s.common_name,
        s.category,
        s.conservation_status,
        COUNT(a.animal_id) AS total_animals,
        COALESCE(AVG(a.age), 0) AS average_age
    FROM Species s
    LEFT JOIN Animals a ON s.species_id = a.species_id
    GROUP BY s.species_id, s.common_name, s.category, s.conservation_status
    ORDER BY total_animals DESC;
END$$

-- 3. Threat summary breakdown by type and severity
CREATE PROCEDURE GetThreatSummary()
BEGIN
    SELECT 
        threat_type,
        severity,
        COUNT(*) AS total_reports,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_threats,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_threats
    FROM Threats
    GROUP BY threat_type, severity
    ORDER BY total_reports DESC;
END$$

-- 4. ACID Transaction: Atomically register a new animal and its intake sighting
CREATE PROCEDURE AddAnimalWithSighting(
    IN p_animal_name        VARCHAR(100),
    IN p_species_id         INT,
    IN p_age                INT,
    IN p_gender             VARCHAR(20),
    IN p_health_status      VARCHAR(30),
    IN p_area_id            INT,
    IN p_tag_number         VARCHAR(50),
    IN p_notes              TEXT,
    IN p_sighting_date      DATE,
    IN p_sighting_time      TIME,
    IN p_location_desc      VARCHAR(250),
    IN p_observed_by        VARCHAR(150),
    OUT p_new_animal_id     INT,
    OUT p_status_message    VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_new_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback on any SQL exception
        ROLLBACK;
        SET p_new_animal_id = -1;
        SET p_status_message = 'TRANSACTION_FAILED: Error during atomic animal and sighting insertion. Rolled back.';
    END;

    START TRANSACTION;

    -- Step 1: Insert Animal
    INSERT INTO Animals (animal_name, species_id, age, gender, health_status, area_id, tag_number, notes)
    VALUES (p_animal_name, p_species_id, p_age, p_gender, p_health_status, p_area_id, p_tag_number, p_notes);

    SET v_new_id = LAST_INSERT_ID();

    -- Step 2: Insert Initial Sighting
    INSERT INTO Sightings (animal_id, area_id, sighting_date, sighting_time, location_description, observed_by, notes)
    VALUES (v_new_id, p_area_id, p_sighting_date, p_sighting_time, p_location_desc, p_observed_by, CONCAT('Initial rescue/tagging intake sighting: ', COALESCE(p_notes, '')));

    COMMIT;

    SET p_new_animal_id = v_new_id;
    SET p_status_message = 'SUCCESS: Animal and inaugural sighting registered atomically under ACID transaction.';
END$$

-- 5. List all research projects led by a researcher
CREATE PROCEDURE GetResearcherProjects(IN p_researcher_id INT)
BEGIN
    SELECT 
        r.research_id,
        r.title,
        r.description,
        r.start_date,
        r.end_date,
        r.status,
        CONCAT(res.first_name, ' ', res.last_name) AS researcher_name,
        res.specialization,
        res.institution
    FROM Research r
    INNER JOIN Researchers res ON r.researcher_id = res.researcher_id
    WHERE r.researcher_id = p_researcher_id
    ORDER BY r.start_date DESC;
END$$

DELIMITER ;
