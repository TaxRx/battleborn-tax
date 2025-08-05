import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import useAuthStore from '../store/authStore';

interface MagicLinkHandlerProps {
  children: React.ReactNode;
}

const MagicLinkHandler: React.FC<MagicLinkHandlerProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleMagicLink = async () => {
      // Log the complete URL and all parameters for debugging
      console.log('🔗 MagicLinkHandler: Current URL:', window.location.href);
      console.log('🔗 MagicLinkHandler: Search params:', window.location.search);
      console.log('🔗 MagicLinkHandler: Hash params:', window.location.hash);
      console.log('🔗 MagicLinkHandler: All URL params:', Object.fromEntries(new URLSearchParams(window.location.search)));
      
      // Check both query parameters and hash fragments for magic link tokens
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      let error = searchParams.get('error');
      let errorDescription = searchParams.get('error_description');
      
      // Also check hash fragments (Supabase sometimes uses these)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get('token');
      const hashType = hashParams.get('type');
      const hashAccessToken = hashParams.get('access_token');
      const hashRefreshToken = hashParams.get('refresh_token');
      const hashError = hashParams.get('error');
      const hashErrorDescription = hashParams.get('error_description');
      
      // Use hash values if query params are empty
      const finalToken = token || hashToken;
      const finalType = type || hashType;
      const finalAccessToken = accessToken || hashAccessToken;
      const finalRefreshToken = refreshToken || hashRefreshToken;
      error = error || hashError;
      errorDescription = errorDescription || hashErrorDescription;
      
      console.log('🔗 MagicLinkHandler: Parsed parameters:', {
        queryToken: token ? `${token.substring(0, 15)}...` : null,
        queryType: type,
        hashToken: hashToken ? `${hashToken.substring(0, 15)}...` : null,
        hashType: hashType,
        finalToken: finalToken ? `${finalToken.substring(0, 15)}...` : null,
        finalType: finalType,
        hasAccessToken: !!finalAccessToken,
        hasRefreshToken: !!finalRefreshToken,
        error,
        errorDescription
      });
      
      // Check for errors first
      if (error) {
        console.error('🔗 MagicLinkHandler: Error in URL parameters:', { error, errorDescription });
        console.log('🔗 MagicLinkHandler: Redirecting to login with error');
        navigate('/login?error=magic_link_failed', { replace: true });
        return;
      }
      
      // Check for either classic magic link format or newer token format
      if ((!finalToken || finalType !== 'magiclink') && !finalAccessToken) {
        console.log('🔗 MagicLinkHandler: No magic link tokens found, skipping');
        return;
      }

      console.log('🔗 MagicLinkHandler: Starting magic link processing...');
      setIsProcessing(true);

      try {
        let session = null;
        
        // Since we disabled detectSessionInUrl, we need to manually set the session from URL fragments
        if (finalAccessToken && finalRefreshToken) {
          console.log('🔗 MagicLinkHandler: Processing access_token and refresh_token from URL...');
          
          // Manually set the session using the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });
          
          console.log('🔗 MagicLinkHandler: Session set result:', {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            email: data.session?.user?.email,
            error: sessionError
          });
          
          if (sessionError) {
            console.error('🔗 MagicLinkHandler: Error setting session from tokens:', sessionError);
            throw sessionError;
          }
          
          if (!data.session?.user) {
            console.error('🔗 MagicLinkHandler: No user in session after setting tokens');
            throw new Error('Failed to establish session from magic link tokens');
          }
          
          session = data.session;
        } else {
          // Fallback for other token formats
          console.log('🔗 MagicLinkHandler: No access_token found, checking current session...');
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !sessionData.session?.user) {
            console.error('🔗 MagicLinkHandler: No valid session found');
            throw new Error('No valid authentication session found');
          }
          
          session = sessionData.session;
        }
        
        console.log('🔗 MagicLinkHandler: Final session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          email: session?.user?.email,
          userId: session?.user?.id
        });

        if (session?.user) {
          console.log('🔗 MagicLinkHandler: Magic link authentication successful!', {
            email: session.user.email,
            userId: session.user.id,
            emailConfirmed: session.user.email_confirmed_at
          });
          
          // Fetch user profile and account information
          console.log('🔗 MagicLinkHandler: Fetching user profile and account...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              account:accounts (
                id,
                name,
                type,
                status
              )
            `)
            .eq('id', session.user.id)
            .single();

          console.log('🔗 MagicLinkHandler: Profile fetch result:', {
            hasProfile: !!profile,
            profileError,
            accountType: profile?.account?.type,
            profileData: profile ? {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              account_id: profile.account_id
            } : null
          });

          if (profileError) {
            console.error('🔗 MagicLinkHandler: Error fetching profile after magic link:', profileError);
            // Continue with basic user info if profile fetch fails
          }

          const extendedUser = {
            id: session.user.id,
            email: session.user.email || '',
            profile: profile,
            account: profile?.account || undefined
          };

          console.log('🔗 MagicLinkHandler: Created extended user object:', extendedUser);

          // Update user context
          console.log('🔗 MagicLinkHandler: Updating user context...');
          setUser(extendedUser);

          // Update auth store
          const userType = extendedUser.account?.type || 'client';
          console.log('🔗 MagicLinkHandler: Updating auth store with user type:', userType);
          login(userType);

          console.log('🔗 MagicLinkHandler: User authenticated via magic link successfully!', {
            email: extendedUser.email,
            accountType: userType,
            hasAccount: !!extendedUser.account,
            willRedirect: userType !== 'client'
          });

          // Clean up URL parameters
          console.log('🔗 MagicLinkHandler: Cleaning up URL parameters...');
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('type');
          url.searchParams.delete('access_token');
          url.searchParams.delete('refresh_token');
          url.hash = '';  // Clear hash fragments too
          window.history.replaceState({}, '', url.toString());
          console.log('🔗 MagicLinkHandler: URL cleaned, new URL:', url.toString());

          // Redirect based on user type
          if (userType === 'client') {
            // Stay on /client page but without URL parameters
            console.log('🔗 MagicLinkHandler: Client user - staying on /client page');
            setIsProcessing(false);
            return;
          } else {
            // Redirect to appropriate dashboard
            console.log(`🔗 MagicLinkHandler: Non-client user - redirecting to /${userType}`);
            navigate(`/${userType}`, { replace: true });
            return;
          }
        } else {
          console.error('🔗 MagicLinkHandler: No session found after magic link processing');
          console.log('🔗 MagicLinkHandler: Session object was:', session);
          throw new Error('Authentication failed - no session established');
        }
      } catch (error) {
        console.error('🔗 MagicLinkHandler: Magic link authentication failed:', error);
        console.error('🔗 MagicLinkHandler: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Clean up URL parameters
        console.log('🔗 MagicLinkHandler: Cleaning up URL parameters after error...');
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('type');
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        url.hash = '';  // Clear hash fragments too
        window.history.replaceState({}, '', url.toString());
        
        // Redirect to login with error
        console.log('🔗 MagicLinkHandler: Redirecting to login with error...');
        navigate('/login?error=magic_link_failed', { replace: true });
      } finally {
        console.log('🔗 MagicLinkHandler: Processing complete, setting isProcessing to false');
        setIsProcessing(false);
      }
    };

    handleMagicLink();
  }, [searchParams, navigate, setUser, login]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Signing you in...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we verify your magic link</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MagicLinkHandler;