/**
 * Converts a string from camelCase to snake_case
 */
function camelToSnakeString(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts a string from snake_case to camelCase
 */
function snakeToCamelString(str: string): string {
  return str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
}

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 */
export function camelToSnake<T>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const snakeKey = camelToSnakeString(key);
      acc[snakeKey] = camelToSnake(obj[key as keyof T]);
      return acc;
    }, {});
  }
  
  return obj;
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 */
export function snakeToCamel<T>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const camelKey = snakeToCamelString(key);
      acc[camelKey] = snakeToCamel(obj[key as keyof T]);
      return acc;
    }, {});
  }
  
  return obj;
} 