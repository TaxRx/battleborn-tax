-- Update email confirmation for test users
-- This marks the users as email confirmed so they can log in

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IN (
  'admin@example.com',
  'operator@example.com', 
  'client@example.com',
  'affiliate@example.com',
  'expert@example.com'
);

-- Verify the updates
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
WHERE email IN (
  'admin@example.com',
  'operator@example.com', 
  'client@example.com',
  'affiliate@example.com',
  'expert@example.com'
)
ORDER BY email;