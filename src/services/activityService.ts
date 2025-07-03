import { supabase } from '../lib/supabase';
import { ResearchActivity } from '../types';

export const getAllActivities = async () => {
  return await supabase
    .from('research_activities')
    .select('*');
};

export const getActivitiesForBusiness = async (businessId: string) => {
  return await supabase
    .from('research_activities')
    .select('*')
    .eq('business_id', businessId);
};

export const createActivity = async (activity: ResearchActivity) => {
  return await supabase
    .from('research_activities')
    .insert(activity)
    .select()
    .single();
};

export const updateActivity = async (id: string, updates: Partial<ResearchActivity>) => {
  return await supabase
    .from('research_activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteActivity = async (id: string) => {
  return await supabase
    .from('research_activities')
    .delete()
    .eq('id', id);
};

export const updateActivityStatus = async (id: string, status: string) => {
  return await supabase
    .from('research_activities')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
}; 