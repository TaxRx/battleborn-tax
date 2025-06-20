import { useState, useCallback } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface AddTodoInput {
  title: string;
  description: string;
  completed: boolean;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = useCallback(async (input: AddTodoInput) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date()
    };

    setTodos(prev => [...prev, newTodo]);
    return newTodo;
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo
  };
}

export type { Todo, AddTodoInput }; 