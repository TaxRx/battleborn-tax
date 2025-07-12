-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.clients (
  created_by uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  filing_status USER-DEFINED NOT NULL,
  state text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agi numeric NOT NULL DEFAULT 0,
  additional_deductions numeric DEFAULT 0,
  capital_gains numeric DEFAULT 0,
  se_income numeric DEFAULT 0,
  qbi_eligible boolean DEFAULT false,
  dependents integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  tax_year integer NOT NULL DEFAULT 2024,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.experts (
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  specialization text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT experts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'affiliate'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.proposals (
  client_id uuid NOT NULL,
  created_by uuid NOT NULL,
  pdf_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status USER-DEFINED NOT NULL DEFAULT 'draft'::proposal_status,
  notes text DEFAULT ''::text,
  estimated_savings numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_notes text DEFAULT ''::text,
  expert_email text,
  last_updated_by_admin timestamp with time zone,
  CONSTRAINT proposals_pkey PRIMARY KEY (id),
  CONSTRAINT proposals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.strategies (
  proposal_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  est_savings numeric DEFAULT 0,
  est_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT strategies_pkey PRIMARY KEY (id),
  CONSTRAINT strategies_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id)
);