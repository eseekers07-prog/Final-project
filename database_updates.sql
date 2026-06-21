-- These nullable veterinarian changes are already included in schema.sql.
-- Keep this file only for older databases that were created before optional vet assignment support.

ALTER TABLE appointments
  MODIFY vet_id INT UNSIGNED NULL;

ALTER TABLE vaccinations
  MODIFY adminstered_vet_id INT UNSIGNED NULL;

ALTER TABLE health_records
  MODIFY vet_id INT UNSIGNED NULL;
