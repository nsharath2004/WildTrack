-- =============================================================================
-- WildTrack - Wildlife Conservation and Management Database System
-- PES University - 5th Semester DBMS Mini-Project
-- File: database/dbms_queries.sql
-- Description: Comprehensive Demonstration of Core & Advanced SQL Concepts
--
-- Concepts Demonstrated:
--  1. DDL Statements (CREATE, ALTER, DROP, TRUNCATE)
--  2. DML Statements (INSERT, UPDATE, DELETE)
--  3. Basic SELECT with WHERE & Operators
--  4. Sorting with ORDER BY
--  5. GROUP BY with Aggregates (COUNT, SUM, AVG, MIN, MAX)
--  6. Filtering Aggregates with HAVING
--  7. Multi-Table INNER JOIN
--  8. Multi-Table LEFT JOIN
--  9. Multi-Table RIGHT JOIN
-- 10. Nested Subqueries (Scalar & Multi-Row IN)
-- 11. Correlated Subqueries (EXISTS & NOT EXISTS)
-- 12. Common Table Expressions (CTEs - Non-recursive)
-- 13. Recursive Common Table Expressions (Hierarchical / Date sequences)
-- 14. Conditional CASE Expressions
-- 15. Window Functions (DENSE_RANK, ROW_NUMBER)
-- 16. Transaction Safety (START TRANSACTION, SAVEPOINT, ROLLBACK)
-- 17. Stored Procedure Invocations
-- 18. Trigger Verification Execution
-- =============================================================================

USE wildlife_management;

-- -----------------------------------------------------------------------------
-- 1. DDL: Demonstration of ALTER TABLE to add and modify constraints
-- -----------------------------------------------------------------------------
-- Adds an optional column and index for microchip serials
ALTER TABLE Animals ADD COLUMN microchip_id VARCHAR(64) NULL AFTER tag_number;
ALTER TABLE Animals ADD INDEX idx_microchip (microchip_id);
-- Clean up added demo column
ALTER TABLE Animals DROP COLUMN microchip_id;


-- -----------------------------------------------------------------------------
-- 2. DML: Controlled INSERT, UPDATE, DELETE within a safe transaction
-- -----------------------------------------------------------------------------
START TRANSACTION;
-- Insert temporary observation
INSERT INTO Threats (threat_type, severity, location, threat_date, description, reported_by, status)
VALUES ('Pollution', 'Low', 'Demo Sector Checkpoint', CURDATE(), 'Disposable beverage can litter along road.', 'Demo User', 'Active');
SET @demo_threat_id = LAST_INSERT_ID();

-- Update status
UPDATE Threats SET status = 'Resolved' WHERE threat_id = @demo_threat_id;

-- Delete temporary demonstration row
DELETE FROM Threats WHERE threat_id = @demo_threat_id;
COMMIT;


-- -----------------------------------------------------------------------------
-- 3. SELECT with WHERE, LIKE, BETWEEN, and Boolean Operators
-- Demonstrates filtering sick/injured animals within adult age ranges
-- -----------------------------------------------------------------------------
SELECT 
    animal_id,
    animal_name,
    age,
    gender,
    health_status,
    tag_number
FROM Animals
WHERE health_status IN ('Injured', 'Sick', 'Under Treatment')
  AND age BETWEEN 3 AND 20
  AND animal_name NOT LIKE '%test%'
ORDER BY age DESC;


-- -----------------------------------------------------------------------------
-- 4. ORDER BY with multi-level sorting and NULL handling
-- -----------------------------------------------------------------------------
SELECT 
    project_name,
    budget,
    start_date,
    end_date,
    status
FROM Projects
ORDER BY budget DESC, start_date ASC;


-- -----------------------------------------------------------------------------
-- 5. GROUP BY and Aggregations (COUNT, SUM, AVG, MIN, MAX)
-- Calculates veterinary expenditure summary per animal
-- -----------------------------------------------------------------------------
SELECT 
    a.animal_name,
    s.common_name,
    COUNT(v.vet_id) AS total_treatments,
    SUM(v.cost) AS total_medical_cost_inr,
    ROUND(AVG(v.cost), 2) AS avg_treatment_cost_inr,
    MIN(v.cost) AS min_cost,
    MAX(v.cost) AS max_cost
FROM Animals a
INNER JOIN Species s ON a.species_id = s.species_id
INNER JOIN Veterinary v ON a.animal_id = v.animal_id
GROUP BY a.animal_id, a.animal_name, s.common_name
ORDER BY total_medical_cost_inr DESC;


-- -----------------------------------------------------------------------------
-- 6. HAVING Clause on Aggregate Metrics
-- Finds protected areas that have recorded more than 2 total sightings
-- -----------------------------------------------------------------------------
SELECT 
    pa.area_name,
    pa.area_type,
    COUNT(si.sighting_id) AS sightings_count
FROM Protected_Area pa
INNER JOIN Sightings si ON pa.area_id = si.area_id
GROUP BY pa.area_id, pa.area_name, pa.area_type
HAVING COUNT(si.sighting_id) >= 2
ORDER BY sightings_count DESC;


-- -----------------------------------------------------------------------------
-- 7. INNER JOIN: Combining Animals, Species, and Protected Area
-- Matches tracked specimens strictly with their registered taxonomies and parks
-- -----------------------------------------------------------------------------
SELECT 
    a.animal_name,
    a.tag_number,
    s.common_name,
    s.conservation_status,
    pa.area_name,
    pa.location
FROM Animals a
INNER JOIN Species s ON a.species_id = s.species_id
INNER JOIN Protected_Area pa ON a.area_id = pa.area_id
WHERE a.health_status = 'Healthy'
ORDER BY pa.area_name, a.animal_name;


-- -----------------------------------------------------------------------------
-- 8. LEFT JOIN: Finding Species that have ZERO tracked animals
-- Preserves all species records, returning NULL for animals if none exist
-- -----------------------------------------------------------------------------
SELECT 
    s.species_id,
    s.common_name,
    s.scientific_name,
    s.category,
    s.conservation_status,
    COUNT(a.animal_id) AS registered_count
FROM Species s
LEFT JOIN Animals a ON s.species_id = a.species_id
GROUP BY s.species_id, s.common_name, s.scientific_name, s.category, s.conservation_status
ORDER BY registered_count ASC, s.common_name ASC;


-- -----------------------------------------------------------------------------
-- 9. RIGHT JOIN: Demonstrates preservation of all Protected Areas even if
--    no volunteers are currently assigned to them
-- -----------------------------------------------------------------------------
SELECT 
    v.first_name,
    v.last_name,
    v.skills,
    pa.area_id,
    pa.area_name,
    pa.area_size_km2
FROM Volunteers v
RIGHT JOIN Protected_Area pa ON v.area_id = pa.area_id
ORDER BY pa.area_name;


-- -----------------------------------------------------------------------------
-- 10. Nested Subquery (Scalar): Find the animal(s) with age above average
-- -----------------------------------------------------------------------------
SELECT 
    animal_name,
    age,
    gender,
    health_status,
    tag_number
FROM Animals
WHERE age > (SELECT AVG(age) FROM Animals)
ORDER BY age DESC;


-- -----------------------------------------------------------------------------
-- 11. Correlated Subquery with EXISTS:
-- Find researchers who are currently leading at least one 'Active' research project
-- -----------------------------------------------------------------------------
SELECT 
    r.researcher_id,
    CONCAT(r.first_name, ' ', r.last_name) AS researcher_name,
    r.email,
    r.specialization,
    r.institution
FROM Researchers r
WHERE EXISTS (
    SELECT 1 
    FROM Research res 
    WHERE res.researcher_id = r.researcher_id 
      AND res.status = 'Active'
)
ORDER BY r.last_name;


-- -----------------------------------------------------------------------------
-- 12. Correlated Subquery with NOT EXISTS:
-- Find protected areas that currently have NO active critical threats
-- -----------------------------------------------------------------------------
SELECT 
    pa.area_id,
    pa.area_name,
    pa.location,
    pa.area_size_km2
FROM Protected_Area pa
WHERE NOT EXISTS (
    SELECT 1 
    FROM Threats t 
    WHERE t.location LIKE CONCAT('%', pa.area_name, '%')
      AND t.severity = 'Critical'
      AND t.status = 'Active'
);


-- -----------------------------------------------------------------------------
-- 13. Common Table Expression (CTE):
-- Multi-step data shaping: computes reserve population density index
-- -----------------------------------------------------------------------------
WITH AreaAnimalStats AS (
    SELECT 
        pa.area_id,
        pa.area_name,
        pa.area_size_km2,
        COUNT(a.animal_id) AS total_animals
    FROM Protected_Area pa
    LEFT JOIN Animals a ON pa.area_id = a.area_id
    GROUP BY pa.area_id, pa.area_name, pa.area_size_km2
),
DensityRankings AS (
    SELECT 
        area_name,
        area_size_km2,
        total_animals,
        ROUND((total_animals / area_size_km2) * 100, 4) AS animal_density_per_100km2,
        DENSE_RANK() OVER (ORDER BY (total_animals / area_size_km2) DESC) AS density_rank
    FROM AreaAnimalStats
)
SELECT * FROM DensityRankings;


-- -----------------------------------------------------------------------------
-- 14. Recursive CTE:
-- Generates date series for the last 7 days and joins daily sighting counts
-- -----------------------------------------------------------------------------
WITH RECURSIVE DateRange AS (
    SELECT CURDATE() - INTERVAL 6 DAY AS calendar_date
    UNION ALL
    SELECT calendar_date + INTERVAL 1 DAY
    FROM DateRange
    WHERE calendar_date < CURDATE()
)
SELECT 
    dr.calendar_date,
    DAYNAME(dr.calendar_date) AS day_of_week,
    COUNT(s.sighting_id) AS sightings_logged
FROM DateRange dr
LEFT JOIN Sightings s ON dr.calendar_date = s.sighting_date
GROUP BY dr.calendar_date
ORDER BY dr.calendar_date ASC;


-- -----------------------------------------------------------------------------
-- 15. Conditional CASE Statement:
-- Categorizes animals into life-stage management tiers
-- -----------------------------------------------------------------------------
SELECT 
    a.animal_name,
    s.common_name,
    a.age,
    CASE 
        WHEN a.age < 3 THEN 'Juvenile / Sub-Adult (High Care)'
        WHEN a.age BETWEEN 3 AND 15 THEN 'Prime Breeding Adult'
        ELSE 'Geriatric / Senior Monitor'
    END AS life_stage_category,
    CASE
        WHEN a.health_status = 'Healthy' THEN 'Routine Patrol Monitoring'
        WHEN a.health_status IN ('Injured', 'Sick') THEN 'Urgent Field Vet Intervention'
        ELSE 'Quarantine / Palliative Observation'
    END AS clinical_protocol
FROM Animals a
INNER JOIN Species s ON a.species_id = s.species_id
ORDER BY a.age ASC;


-- -----------------------------------------------------------------------------
-- 16. Window Functions: DENSE_RANK and ROW_NUMBER
-- Ranks animals within each species by age
-- -----------------------------------------------------------------------------
SELECT 
    s.common_name AS species,
    a.animal_name,
    a.gender,
    a.age,
    ROW_NUMBER() OVER (PARTITION BY s.species_id ORDER BY a.age DESC) AS age_rank_in_species,
    DENSE_RANK() OVER (ORDER BY a.age DESC) AS overall_age_rank
FROM Animals a
INNER JOIN Species s ON a.species_id = s.species_id;


-- -----------------------------------------------------------------------------
-- 17. Stored Procedure Invocations
-- -----------------------------------------------------------------------------
-- Test Procedure 1: Animals by Area (Bandipur, ID=1)
CALL GetAnimalsByArea(1);

-- Test Procedure 2: Species aggregate stats
CALL GetSpeciesStats();

-- Test Procedure 3: Threat summary
CALL GetThreatSummary();

-- Test Procedure 4: ACID Transaction demonstration
SET @out_id = 0;
SET @out_msg = '';
CALL AddAnimalWithSighting(
    'Dhruv', 1, 4, 'Male', 'Healthy', 1, 'BND-TIG-99', 
    'Translocated tiger under telemetry monitoring', 
    CURDATE(), CURTIME(), 'Bandipur Northern Range', 'Field Vet Officer',
    @out_id, @out_msg
);
SELECT @out_id AS created_animal_id, @out_msg AS transaction_status;

-- Clean up test demo animal (cascades sighting and triggers audit)
DELETE FROM Animals WHERE animal_id = @out_id;


-- -----------------------------------------------------------------------------
-- 18. Trigger Verification Check
-- Verifies that wildlife_audit_log and deleted_animals_log captured events
-- -----------------------------------------------------------------------------
SELECT * FROM wildlife_audit_log ORDER BY log_id DESC LIMIT 5;
SELECT * FROM deleted_animals_log ORDER BY log_id DESC LIMIT 5;
