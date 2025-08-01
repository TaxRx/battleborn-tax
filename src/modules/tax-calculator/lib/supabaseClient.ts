import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { snakeToCamel, camelToSnake } from './utils/caseConversion';
import { supabase } from '../../../lib/supabase'; // Import the existing client

// Use the existing client instead of creating a new one
const supabaseClient = supabase;

// Helper function to wrap a query with case conversion
const wrapQuery = (query: any) => {
  const wrapped = {
    ...query,
    then: (onfulfilled?: ((value: any) => any)) => {
      return query.then((result: any) => {
        if (result.error) return result;
        return {
          ...result,
          data: result.data ? snakeToCamel(result.data) : null
        };
      }).then(onfulfilled);
    }
  };

  // Add filter methods that return wrapped queries
  const filterMethods = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'range', 'textSearch', 'match', 'not', 'or', 'filter'];
  filterMethods.forEach(method => {
    if (query[method]) {
      wrapped[method] = (...args: any[]) => wrapQuery(query[method](...args));
    }
  });

  // Add select method that returns wrapped query
  if (query.select) {
    wrapped.select = (columns?: string) => wrapQuery(query.select(columns));
  }

  // Add single/maybeSingle methods that return wrapped queries
  if (query.single) {
    wrapped.single = () => wrapQuery(query.single());
  }
  if (query.maybeSingle) {
    wrapped.maybeSingle = () => wrapQuery(query.maybeSingle());
  }

  return wrapped;
};

// Create a wrapper around the Supabase client to handle case conversion
export const db = {
  ...supabaseClient,
  auth: {
    ...supabaseClient.auth,
    // Keep auth methods as is since they don't need case conversion
    getUser: supabaseClient.auth.getUser.bind(supabaseClient.auth),
    signOut: supabaseClient.auth.signOut.bind(supabaseClient.auth),
  },
  from: (table: string) => {
    const originalFrom = supabaseClient.from(table);
    
    return {
      ...originalFrom,
      select: (query?: string) => wrapQuery(originalFrom.select(query)),
      insert: (values: any, options?: any) => {
        const promise = originalFrom.insert(camelToSnake(values), options);
        return wrapQuery(promise);
      },
      update: (values: any, options?: any) => {
        const promise = originalFrom.update(camelToSnake(values), options);
        return wrapQuery(promise);
      },
      upsert: (values: any, options?: any) => {
        const promise = originalFrom.upsert(camelToSnake(values), options);
        return wrapQuery(promise);
      },
      delete: () => {
        const promise = originalFrom.delete();
        return wrapQuery(promise);
      }
    };
  }
};

export default db; 