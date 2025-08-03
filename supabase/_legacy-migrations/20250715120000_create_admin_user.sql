-- Create Admin User Account
-- This creates the admin user in auth.users and corresponding profile

BEGIN;

-- Insert admin user into auth.users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@taxrxgroup.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            '12345678-1234-1234-1234-123456789012',
            '00000000-0000-0000-0000-000000000000',
            'admin@taxrxgroup.com',
            '$2a$10$5jkOHKrW/gTqjEJ7z3sOVeHPbLp/VfC6XK2hYSaG3a3Ql4uuEYvLy', -- 'testpass123' hashed
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    END IF;
END $$;

-- Create corresponding profile with platform admin access
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    access_level,
    role,
    created_at,
    updated_at
) VALUES (
    '12345678-1234-1234-1234-123456789012',
    'admin@taxrxgroup.com',
    'Platform Administrator',
    'platform',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    access_level = 'platform',
    role = 'admin',
    full_name = 'Platform Administrator';

-- Create client user accounts from CLAUDE.md
DO $$
BEGIN
    -- Insert dan@fellars.com if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dan@fellars.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            '12345678-1234-1234-1234-123456789013',
            '00000000-0000-0000-0000-000000000000',
            'dan@fellars.com',
            '$2a$10$5jkOHKrW/gTqjEJ7z3sOVeHPbLp/VfC6XK2hYSaG3a3Ql4uuEYvLy', -- 'testpass123' hashed
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    END IF;
    
    -- Insert testclient@fellars.com if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'testclient@fellars.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            '12345678-1234-1234-1234-123456789014',
            '00000000-0000-0000-0000-000000000000',
            'testclient@fellars.com',
            '$2a$10$5jkOHKrW/gTqjEJ7z3sOVeHPbLp/VfC6XK2hYSaG3a3Ql4uuEYvLy', -- 'testpass123' hashed
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    END IF;
END $$;

-- Create corresponding profiles for client users
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    access_level,
    role,
    created_at,
    updated_at
) VALUES 
(
    '12345678-1234-1234-1234-123456789013',
    'dan@fellars.com',
    'Dan Fellars',
    'client',
    'client',
    NOW(),
    NOW()
),
(
    '12345678-1234-1234-1234-123456789014',
    'testclient@fellars.com',
    'Test Client',
    'client',
    'client',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a sample client for testing if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE email = 'dan@fellars.com') THEN
        INSERT INTO public.clients (
            id,
            full_name,
            email,
            phone,
            created_at,
            updated_at
        ) VALUES (
            '12345678-1234-1234-1234-123456789015',
            'Fellars Test Company',
            'dan@fellars.com',
            '+1-555-123-4567',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Link the client users to the client if relationships don't exist
DO $$
BEGIN
    -- Link dan@fellars.com as owner
    IF NOT EXISTS (
        SELECT 1 FROM public.client_users 
        WHERE client_id = '12345678-1234-1234-1234-123456789015' 
        AND user_id = '12345678-1234-1234-1234-123456789013'
    ) THEN
        INSERT INTO public.client_users (client_id, user_id, role)
        VALUES ('12345678-1234-1234-1234-123456789015', '12345678-1234-1234-1234-123456789013', 'owner');
    END IF;
    
    -- Link testclient@fellars.com as viewer
    IF NOT EXISTS (
        SELECT 1 FROM public.client_users 
        WHERE client_id = '12345678-1234-1234-1234-123456789015' 
        AND user_id = '12345678-1234-1234-1234-123456789014'
    ) THEN
        INSERT INTO public.client_users (client_id, user_id, role)
        VALUES ('12345678-1234-1234-1234-123456789015', '12345678-1234-1234-1234-123456789014', 'viewer');
    END IF;
END $$;

COMMIT;