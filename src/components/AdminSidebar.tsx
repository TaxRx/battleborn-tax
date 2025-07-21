// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Group, 
  FileText, 
  Bell, 
  History, 
  Heart, 
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import AdminProfileService from '../modules/admin/services/adminProfileService';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin'
  },
  {
    label: 'Strategies',
    icon: FileText,
    path: '/admin/strategies'
  },
  {
    label: 'R&D Tax Credit',
    icon: FileText,
    path: '/admin/rd-tax-credit'
  },
  {
    label: 'Clients',
    icon: Users,
    path: '/admin/clients'
  },
  {
    label: 'Advisors',
    icon: UserPlus,
    path: '/admin/advisors'
  },
  {
    label: 'Groups',
    icon: Group,
    path: '/admin/groups'
  },
  {
    label: 'Documents',
    icon: FileText,
    path: '/admin/documents'
  },
  {
    label: 'Notifications',
    icon: Bell,
    path: '/admin/notifications'
  },
  {
    label: 'Audit Log',
    icon: History,
    path: '/admin/audit'
  },
  {
    label: 'Charitable Donations',
    icon: Heart,
    path: '/admin/charitable-donations'
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings'
  }
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminProfileService = AdminProfileService.getInstance();

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error getting current user:', userError);
          setLoading(false);
          return;
        }

        console.log('Fetching profile for user:', user.id);

        // Try to get profile directly from profiles table first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            account_id,
            account:accounts(id, name, type)
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile query error:', profileError);
          throw profileError;
        }

        if (profile) {
          console.log('Profile found:', profile);
          setCurrentProfile({
            ...profile,
            account_type: profile.account?.type
          });
        } else {
          console.log('No profile found, using fallback');
          throw new Error('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching current profile:', error);
        
        // Get user again for fallback
        const { data: { user: fallbackUser } } = await supabase.auth.getUser();
        
        // Only use fallback data as last resort
        setCurrentProfile({
          full_name: fallbackUser?.user_metadata?.full_name || 'Admin User',
          role: 'admin',
          account_type: 'admin',
          email: fallbackUser?.email || ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProfile();
  }, []);

  const handleLogout = async () => {
    try {
      // Don't wait for Supabase signOut - do it in background
      supabase.auth.signOut().catch(error => console.error('Supabase signOut error:', error));
      
      // Clear auth store state
      const { logout } = useAuthStore.getState();
      logout();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl border-r flex flex-col justify-between transition-all duration-200 z-30 ${hovered ? 'w-72' : 'w-20'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        {/* Dynamic Profile Header */}
        <div className={`flex items-center ${hovered ? 'px-8 py-6' : 'px-4 py-6'} border-b transition-all`}>
          <div className="flex items-center w-full">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 ${!hovered ? 'mr-0' : 'mr-3'} transition-all`}>
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {currentProfile?.full_name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {currentProfile?.role || 'admin'} {currentProfile?.account_type && currentProfile.account_type !== currentProfile.role ? `• ${currentProfile.account_type}` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`
                  group w-full flex items-center ${hovered ? 'px-8' : 'px-4'} py-4 text-lg font-medium rounded-xl transition-all
                  ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}
                `}
                style={{ marginBottom: '4px' }}
              >
                <span className={`mr-0 flex items-center justify-center h-8 w-8 rounded-lg ${active ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'} transition-all`}>
                  <item.icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                </span>
                <span className={`ml-4 transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className={`${hovered ? 'px-8' : 'px-4'} py-6 border-t transition-all`}>
        <button onClick={handleLogout} className="w-full flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors font-semibold py-3 rounded-lg bg-gray-50 hover:bg-red-50">
          <LogOut className="w-5 h-5 mr-2" />
          <span className={`transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 