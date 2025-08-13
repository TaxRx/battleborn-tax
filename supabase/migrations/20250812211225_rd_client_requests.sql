-- public.rd_client_requests definition

-- Drop table

-- DROP TABLE public.rd_client_requests;

CREATE TABLE IF NOT EXISTS public.rd_client_requests (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_year_id uuid NOT NULL,
	"type" text NOT NULL,
	status text NOT NULL,
	requested_at timestamptz DEFAULT now() NOT NULL,
	client_completed_at timestamptz NULL,
	admin_acknowledged_at timestamptz NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT rd_client_requests_pkey PRIMARY KEY (id),
	CONSTRAINT rd_client_requests_status_check CHECK ((status = ANY (ARRAY['requested'::text, 'client_in_progress'::text, 'client_completed'::text, 'admin_acknowledged'::text]))),
	CONSTRAINT rd_client_requests_type_check CHECK ((type = ANY (ARRAY['roles'::text, 'subcomponents'::text])))
);
CREATE INDEX IF NOT EXISTS idx_rd_client_requests_by ON public.rd_client_requests USING btree (business_year_id, type, status);

-- Table Triggers

drop trigger if exists update_rd_client_requests_updated_at on public.rd_client_requests;
create trigger update_rd_client_requests_updated_at before
update
    on
    public.rd_client_requests for each row execute function update_updated_at_column();


-- public.rd_client_requests foreign keys

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_namespace n ON n.oid = t.relnamespace
		WHERE c.conname = 'rd_client_requests_business_year_id_fkey'
			AND t.relname = 'rd_client_requests'
			AND n.nspname = 'public'
	) THEN
		ALTER TABLE public.rd_client_requests
			ADD CONSTRAINT rd_client_requests_business_year_id_fkey
			FOREIGN KEY (business_year_id)
			REFERENCES public.rd_business_years(id)
			ON DELETE CASCADE;
	END IF;
END $$;