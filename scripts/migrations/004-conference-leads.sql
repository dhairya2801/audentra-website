-- Add a distinct source. Retain all existing demo/newsletter records and jobs.
ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_source_check;
ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_source_check CHECK (source IN ('newsletter','product-walkthrough','conference'));
