-- =============================================================================
-- WildTrack - Wildlife Conservation and Management Database System
-- PES University - 5th Semester DBMS Mini-Project
-- File: database/sample_data.sql
-- Description: Realistic, normalized sample dataset across all 12 tables
-- =============================================================================

USE wildlife_management;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE wildlife_audit_log;
TRUNCATE TABLE deleted_animals_log;
TRUNCATE TABLE Volunteers;
TRUNCATE TABLE Projects;
TRUNCATE TABLE Veterinary;
TRUNCATE TABLE Incidents;
TRUNCATE TABLE Threats;
TRUNCATE TABLE Sightings;
TRUNCATE TABLE Research;
TRUNCATE TABLE Researchers;
TRUNCATE TABLE Animals;
TRUNCATE TABLE Protected_Area;
TRUNCATE TABLE Species;
TRUNCATE TABLE Users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. USERS (Admin, Researcher, Forest Officer)
-- Passwords:
--   admin      -> admin123
--   researcher -> research123
--   officer    -> officer123
--   forest_lead -> officer123
-- =============================================================================
INSERT INTO Users (user_id, username, email, password_hash, full_name, role, badge_number, phone, is_active) VALUES
(1, 'admin', 'admin@wildtrack.pes.edu', 'scrypt:32768:8:1$IzqtYOebUI7aDZsZ$e056bea704210aeb6055662145564f29d2b3ee97d034bce76baae8e3ed896f4d10b25122a1bc50fa8205a63666534ade1ffe36e1f2bdbfdb935cf9753cb37c2e', 'Chief Conservator Sharath', 'Admin', 'WT-ADM-001', '+91-9876543210', 1),
(2, 'researcher', 'dr.anjali@wildtrack.pes.edu', 'scrypt:32768:8:1$DK3yiughBeoPN206$fc75d5e7236acb56458f7270404d2a6b05aa598dd0f1c1b9e414cc671ab9fcb7e8ee5e549a902896765a785ce16f99defc90f473c7ceff6349fb536e31dd5610', 'Dr. Anjali Menon', 'Researcher', 'WT-RES-014', '+91-9845012345', 1),
(3, 'officer', 'ranger.rajesh@wildtrack.pes.edu', 'scrypt:32768:8:1$yVNsEQGCkd5DaMSP$e51f2d9a9a51bb1d79c54ea9f4b448d99192d3b0cbf9ea8cb3cee9229152f2d41cb592b52fac6e3a76a329a8e553a8a1be9a416b1f1f80c6ddcb79801618e850', 'Range Officer Rajesh Gowda', 'Forest Officer', 'KA-FD-8821', '+91-9448098765', 1),
(4, 'forest_lead', 'warden.kavita@wildtrack.pes.edu', 'scrypt:32768:8:1$yVNsEQGCkd5DaMSP$e51f2d9a9a51bb1d79c54ea9f4b448d99192d3b0cbf9ea8cb3cee9229152f2d41cb592b52fac6e3a76a329a8e553a8a1be9a416b1f1f80c6ddcb79801618e850', 'Warden Kavita Nambiar', 'Forest Officer', 'KA-FD-5510', '+91-9448123456', 1);

-- =============================================================================
-- 2. SPECIES (Indian Wildlife Focus)
-- =============================================================================
INSERT INTO Species (species_id, common_name, scientific_name, category, conservation_status, description) VALUES
(1, 'Bengal Tiger', 'Panthera tigris tigris', 'Mammal', 'Endangered', 'Apex predator of the Indian subcontinent requiring contiguous deciduous forest habitats.'),
(2, 'Asian Elephant', 'Elephas maximus', 'Mammal', 'Endangered', 'Keystone megaherbivore essential for forest seed dispersal and path clearance.'),
(3, 'Indian Leopard', 'Panthera pardus fusca', 'Mammal', 'Vulnerable', 'Highly adaptable predator co-existing near buffer zones and rocky scrublands.'),
(4, 'Indian Rhinoceros', 'Rhinoceros unicornis', 'Mammal', 'Vulnerable', 'Greater one-horned rhino characterized by single horn and armor-plated skin folds.'),
(5, 'Chital (Spotted Deer)', 'Axis axis', 'Mammal', 'Least Concern', 'Primary herbivore and crucial prey base for big cat populations in Southern India.'),
(6, 'Indian Peafowl', 'Pavo cristatus', 'Bird', 'Least Concern', 'National bird of India widely distributed across deciduous and cultivated scrub.'),
(7, 'King Cobra', 'Ophiophagus hannah', 'Reptile', 'Vulnerable', 'World longest venomous snake endemic to Western Ghats rainforests.');

-- =============================================================================
-- 3. PROTECTED AREAS
-- =============================================================================
INSERT INTO Protected_Area (area_id, area_name, location, area_size_km2, area_type, description, established_year) VALUES
(1, 'Bandipur National Park', 'Chamarajanagar, Karnataka', 874.20, 'National Park', 'Premier Project Tiger reserve located at the tri-junction of Karnataka, Tamil Nadu, and Kerala.', 1974),
(2, 'Nagarhole National Park', 'Kodagu-Mysuru, Karnataka', 643.39, 'National Park', 'Part of the Nilgiri Biosphere Reserve with very high density of Asiatic elephants and tigers.', 1988),
(3, 'Bannerghatta Biological Park', 'Bengaluru Urban, Karnataka', 104.27, 'National Park', 'Crucial elephant corridor and rescue reserve located south of Bengaluru tech hub.', 2002),
(4, 'Kaziranga National Park', 'Golaghat-Nagaon, Assam', 858.98, 'National Park', 'UNESCO World Heritage site hosting two-thirds of the world greater one-horned rhinos.', 1974),
(5, 'Bhadra Wildlife Sanctuary', 'Chikkamagaluru, Karnataka', 492.46, 'Wildlife Sanctuary', 'Dense moist-deciduous forest sanctuary in the central Western Ghats with robust tiger population.', 1951);

-- =============================================================================
-- 4. ANIMALS
-- =============================================================================
INSERT INTO Animals (animal_id, animal_name, species_id, age, gender, health_status, area_id, tag_number, notes) VALUES
(1, 'Raja', 1, 6, 'Male', 'Healthy', 1, 'BND-TIG-01', 'Dominant male tiger of Kalkere range. Radio-collared.'),
(2, 'Sundari', 1, 5, 'Female', 'Healthy', 1, 'BND-TIG-02', 'Litter of three cubs observed near Moyar river valley.'),
(3, 'Gajendra', 2, 28, 'Male', 'Healthy', 1, 'BND-ELE-10', 'Large tusker frequently visiting Gopalaswamy Betta buffer.'),
(4, 'Airavata', 2, 34, 'Male', 'Healthy', 2, 'NAG-ELE-04', 'Matriarch herd escort with distinctive left-tusk curvature.'),
(5, 'Bagheera', 3, 4, 'Male', 'Healthy', 2, 'NAG-LEO-07', 'Melanistic variant spotted along Kabini backwaters.'),
(6, 'Chitra', 3, 3, 'Female', 'Injured', 1, 'BND-LEO-12', 'Limping on right forepaw; wire snare abrasions monitored.'),
(7, 'Khadga', 4, 11, 'Male', 'Healthy', 4, 'KAZ-RHI-01', 'Adult bull rhino roaming Kohora grassland sector.'),
(8, 'Damini', 4, 9, 'Female', 'Healthy', 4, 'KAZ-RHI-02', 'Observed with healthy yearling calf near Bagori marsh.'),
(9, 'Bambi', 5, 4, 'Female', 'Healthy', 1, 'BND-DEE-45', 'Part of large herd grazing at Maddur range clearing.'),
(10, 'Mayura', 6, 2, 'Male', 'Healthy', 3, 'BNG-PEA-03', 'Resident display peacock at Bannerghatta herbivore safari.'),
(11, 'Takshaka', 7, 7, 'Male', 'Healthy', 5, 'BHD-COB-01', 'Large adult male king cobra rescued and tagged at Lakkavalli.'),
(12, 'Agni', 1, 8, 'Male', 'Sick', 2, 'NAG-TIG-08', 'Severe dehydration and tick-borne infection under antibiotic treatment.');

-- =============================================================================
-- 5. RESEARCHERS
-- =============================================================================
INSERT INTO Researchers (researcher_id, first_name, last_name, email, phone, specialization, institution, joining_date) VALUES
(1, 'Ramesh', 'Kumar', 'dr.ramesh@wii.gov.in', '+91-9448011223', 'Carnivore Ecology', 'Wildlife Institute of India', '2019-06-15'),
(2, 'Anjali', 'Menon', 'dr.anjali@wildtrack.pes.edu', '+91-9845012345', 'Elephant Demography', 'Centre for Ecological Sciences, IISc', '2020-08-01'),
(3, 'Praveen', 'Bhat', 'praveen.bhat@wcs.org', '+91-9741022334', 'Herpetology & Bioacoustics', 'Wildlife Conservation Society India', '2021-02-10'),
(4, 'Deepika', 'Roy', 'd.roy@assamwildlife.org', '+91-9650033445', 'Grassland Habitat Management', 'Aaranyak Research Foundation', '2018-11-20'),
(5, 'Suresh', 'Reddy', 'suresh.reddy@kfd.gov.in', '+91-9449044556', 'Wildlife Genetics & Forensics', 'National Centre for Biological Sciences', '2022-04-05');

-- =============================================================================
-- 6. RESEARCH PROJECTS
-- =============================================================================
INSERT INTO Research (research_id, title, description, researcher_id, start_date, end_date, status) VALUES
(1, 'Nilgiri Tiger Landscape Camera Trap Census', 'Systematic camera trap survey assessing tiger and leopard abundance across Bandipur-Nagarhole corridors.', 1, '2025-01-10', '2025-12-31', 'Active'),
(2, 'Western Ghats Elephant Migration Radio-Telemetry', 'Satellite collar telemetry tracking herd movements across human-dominated agricultural matrix in Kodagu.', 2, '2024-06-01', '2026-06-01', 'Active'),
(3, 'King Cobra Nesting Phenology in Western Ghats', 'Long-term monitoring of king cobra nest construction, temperature stability, and hatchling success rates.', 3, '2023-04-01', '2024-10-30', 'Completed'),
(4, 'Kaziranga Grassland Succession Dynamics', 'Analyzing invasive Mimosa diplotricha spread across floodplain wetlands and its impact on one-horned rhinos.', 4, '2025-03-01', NULL, 'Active'),
(5, 'Non-Invasive Scat DNA Profiling of Wild Felids', 'Genetic identification of individual leopards and tigers using microsatellite markers extracted from fecal samples.', 5, '2025-07-01', '2026-03-31', 'Planned');

-- =============================================================================
-- 7. SIGHTINGS
-- =============================================================================
INSERT INTO Sightings (sighting_id, animal_id, area_id, sighting_date, sighting_time, location_description, observed_by, notes) VALUES
(1, 1, 1, '2026-10-15', '06:45:00', 'Moyar gorge fireline junction 4', 'Forest Guard Manjunath', 'Adult male tiger resting near salt lick. Active and alert.'),
(2, 2, 1, '2026-10-18', '17:20:00', 'Kalkere waterhole compartment 12', 'Dr. Ramesh Kumar', 'Tigress with two cubs drinking water during evening patrol.'),
(3, 3, 1, '2026-10-20', '08:15:00', 'Gopalaswamy Betta foothills', 'Ranger Rajesh Gowda', 'Lone tusker feeding on bamboo foliage beside highway.'),
(4, 4, 2, '2026-10-22', '16:00:00', 'Kabini reservoir south shore', 'Naturalist Sunil Rao', 'Breeding herd of 14 elephants bathing in backwaters.'),
(5, 5, 2, '2026-10-24', '18:30:00', 'Antharasanthe range tree line', 'Dr. Anjali Menon', 'Black panther perched on Terminalia tomentosa branch.'),
(6, 6, 1, '2026-10-25', '09:00:00', 'Maddur road crossing milestone 14', 'Patrol Guard Ravi', 'Female leopard seen resting with visible paw discomfort.'),
(7, 7, 4, '2026-10-26', '07:10:00', 'Kohora central grassland watchtower', 'Ranger Deepika Roy', 'Adult male rhino grazing on Saccharum grasses.'),
(8, 8, 4, '2026-10-27', '11:40:00', 'Bagori range water body', 'Guard Biren Das', 'Female rhino wallowing with calf; no disturbance detected.'),
(9, 9, 1, '2026-10-28', '15:15:00', 'Moolehole open glade', 'Volunteer Sneha K', 'Herd of 30+ chital grazing quietly.'),
(10, 10, 3, '2026-10-29', '10:05:00', 'Safari track sector B', 'Staff Ramesh T', 'Peacock in full courtship display plumage.'),
(11, 11, 5, '2026-10-30', '14:20:00', 'Lakkavalli reservoir fringe', 'Praveen Bhat', 'King cobra specimen basking on fallen log near stream.'),
(12, 12, 2, '2026-10-31', '08:50:00', 'DB Kuppe range near border fence', 'Veterinarian Dr. Girish', 'Tiger appeared emaciated; immobilized for treatment.');

-- =============================================================================
-- 8. THREATS
-- =============================================================================
INSERT INTO Threats (threat_id, threat_type, severity, location, threat_date, description, reported_by, status) VALUES
(1, 'Poaching', 'Critical', 'Bandipur South Buffer Zone (Omkar range)', '2026-10-10', 'Discovery of 3 steel clutch-wire snares anchored to teak trees along game trail.', 'Special Tiger Protection Force', 'Active'),
(2, 'Human-Wildlife Conflict', 'High', 'Nagarhole Border - Machur Village', '2026-10-14', 'Crop raiding by solitary bull elephant causing paddy damage and boundary wall breach.', 'Range Forest Officer Rajesh', 'Active'),
(3, 'Habitat Loss', 'Medium', 'Bannerghatta Outer Ring buffer zone', '2026-10-18', 'Unauthorized granite quarry blasting causing ground vibrations within 500m of elephant corridor.', 'Bannerghatta Nature Club', 'Monitoring'),
(4, 'Disease', 'Critical', 'Nagarhole National Park (DB Kuppe)', '2026-10-22', 'Canine Distemper Virus (CDV) antibodies detected in feral dog pack adjacent to core tiger habitat.', 'Wildlife Vet Dr. Girish', 'Active'),
(5, 'Invasive Species', 'Medium', 'Bandipur National Park', '2026-10-25', 'Rapid Lantana camara infestation choking native edible grass regeneration across 200 hectares.', 'Conservator Office', 'Active'),
(6, 'Pollution', 'Low', 'Moyar River downstream checkpost', '2026-10-28', 'Plastic and tourist litter accumulation near bridge crossing.', 'Volunteer Clean-up Squad', 'Resolved');

-- =============================================================================
-- 9. INCIDENTS
-- =============================================================================
INSERT INTO Incidents (incident_id, incident_title, animal_id, threat_id, incident_date, description, location, severity, status, resolved_date) VALUES
(1, 'Wire Snare Injury to Female Leopard Chitra', 6, 1, '2026-10-25', 'Leopard BND-LEO-12 suffered deep soft tissue lacerations around right forelimb from rusted snare wire.', 'Bandipur Omkar Section 8', 'Critical', 'Under Investigation', NULL),
(2, 'Elephant Crop Depredation at Machur Farmstead', 3, 2, '2026-10-14', 'Bull elephant broke solar fencing and consumed 1.5 acres of ripened sugarcane; non-lethal chili smoke used to guide animal back.', 'Machur Village, Hunsur Border', 'High', 'Resolved', '2026-10-15'),
(3, 'Tiger Agni Immobilization and Medical Rescue', 12, 4, '2026-10-31', 'Severely debilitated male tiger tranquilized after bloodwork confirmed haemoprotozoan parasitic infestation.', 'Nagarhole DB Kuppe Sector', 'Critical', 'Open', NULL),
(4, 'Tourist Vehicle Lane Violation Incident', NULL, NULL, '2026-10-12', 'Private tourist vehicle entered closed anti-poaching track without permit; vehicle impounded.', 'Bandipur Gundre Checkpost', 'Low', 'Resolved', '2026-10-12'),
(5, 'Illegal Night Cattle Grazing in Core Forest', NULL, 3, '2026-10-26', 'Interception of 45 domestic cattle grazing inside national park interior; cattle impounded and fines issued.', 'Bannerghatta Kalkere Beat', 'Medium', 'Resolved', '2026-10-27');

-- =============================================================================
-- 10. VETERINARY RECORDS
-- =============================================================================
INSERT INTO Veterinary (vet_id, animal_id, diagnosis, treatment, veterinarian_name, treatment_date, follow_up_date, medication, cost, notes) VALUES
(1, 6, 'Wire snare laceration with localized cellulitis on right carpus', 'Wound debridement under standing sedation; topical antiseptic dressing and tetanus toxoid booster.', 'Dr. Girish Venkat', '2026-10-25', '2026-11-05', 'Enrofloxacin 10% injection, Meloxicam anti-inflammatory', 8500.00, 'Animal released into holding boma for observation.'),
(2, 12, 'Haemoprotozoan infection (Babesia canis) with acute dehydration', 'IV fluid resuscitation; intramuscular antiprotozoal administration and broad-spectrum antibiotic cover.', 'Dr. Girish Venkat', '2026-10-31', '2026-11-07', 'Diminazene aceturate, Ringer Lactate 5L, Multivitamin complex', 14200.00, 'Prognosis guarded. Continuous CCTV monitoring in quarantine ward.'),
(3, 3, 'Tusk root abscess and secondary gingival inflammation', 'Ultrasonic cleaning of drainage tract and long-acting antibiotic paste packing under dart sedation.', 'Dr. Manjunath Swamy', '2026-09-12', '2026-10-12', 'Ceftiofur sodium, Flunixin meglumine', 19500.00, 'Fully resolved during follow-up inspection. Normal chewing resumed.'),
(4, 9, 'Superficial horn gore injury from inter-herd mating clash', 'Topical fly-repellent spray, wound cleaning, and single long-acting antibiotic dose.', 'Dr. Manjunath Swamy', '2026-10-02', NULL, 'Oxytetracycline LA spray', 1200.00, 'Minor abrasion healed without complications.');

-- =============================================================================
-- 11. CONSERVATION PROJECTS
-- =============================================================================
INSERT INTO Projects (project_id, project_name, description, budget, start_date, end_date, status, project_lead) VALUES
(1, 'Project Tiger Corridor Securing Initiative', 'Acquisition and restoration of private coffee plantation corridors linking Bandipur with Wayanad sanctuaries.', 25000000.00, '2024-04-01', '2027-03-31', 'Active', 'PCCF Sharath V'),
(2, 'Smart Acoustic Monitoring for Anti-Poaching', 'Deployment of solar-powered solar acoustic gunshot and chainsaw detection nodes across sensitive core beats.', 6500000.00, '2025-01-01', '2026-12-31', 'Active', 'Conservator Suresh Kumar'),
(3, 'Village Solar Fence Solarization and Trenching', 'Erection of 42 km of solar power fencing and elephant-proof trenches along vulnerable crop frontiers.', 12000000.00, '2023-08-01', '2025-05-31', 'Active', 'Range Officer Rajesh Gowda'),
(4, 'Lantana Weed Eradication & Native Grassland Revival', 'Mechanical uprooting of Lantana camara followed by reseeding of native Cynodon and Themeda fodder grasses.', 4500000.00, '2024-11-01', '2026-06-30', 'Active', 'Dr. Ramesh Kumar'),
(5, 'Community Eco-Guide & Youth Anti-Snare Patrols', 'Training 60 tribal youth as eco-tourism guides and community snare patrol rangers.', 1800000.00, '2025-02-01', '2025-08-31', 'Completed', 'Warden Kavita Nambiar');

-- =============================================================================
-- 12. VOLUNTEERS
-- =============================================================================
INSERT INTO Volunteers (volunteer_id, first_name, last_name, email, phone, area_id, join_date, skills, status) VALUES
(1, 'Sneha', 'Kulkarni', 'sneha.k@gmail.com', '+91-9880112233', 1, '2024-03-15', 'Wildlife Photography, GIS Mapping, First Aid', 'Active'),
(2, 'Arun', 'Prakash', 'arun.prakash@outlook.com', '+91-9742223344', 1, '2024-05-20', 'Foot Patrols, Anti-Snare Searching, Kannada Translation', 'Active'),
(3, 'Meera', 'Nair', 'meera.nair@yahoo.com', '+91-9633334455', 2, '2025-01-10', 'Veterinary Nursing, Data Entry, Python', 'Active'),
(4, 'Karthik', 'Somanna', 'karthik.s@gmail.com', '+91-9448445566', 2, '2023-11-01', 'Off-road Driving, Drone Piloting, Wildlife Rescue', 'Active'),
(5, 'Divya', 'Hegde', 'divya.hegde@hotmail.com', '+91-9550556677', 3, '2025-06-12', 'Public Outreach, School Conservation Education', 'Active'),
(6, 'Rohan', 'Baruah', 'rohan.b@gmail.com', '+91-9435667788', 4, '2024-02-18', 'Boat Navigation, Flood Relief, Bird Identification', 'Active');
