/**
 * @fileoverview Comprehensive demonstration of Understate library features
 * @description This file showcases the full capabilities of Understate state management
 * including synchronous/asynchronous operations, indexing, subscriptions, and real-world patterns.
 *
 * @usage Run this file with Node.js:
 *   node examples/comprehensive-demo.js
 *
 * @requires Node.js 14+
 */

import { Understate } from '../src/index.js';

//=============================================================================
// Utility Functions
//=============================================================================

const printSection = (title) => {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//=============================================================================
// USE CASE 1: Basic Counter (Increment/Decrement)
//=============================================================================

/**
 * Demonstrates basic state mutations with simple increment/decrement operations.
 * Shows how to create an Understate instance, define mutator functions, and apply updates.
 */
async function demoBasicCounter() {
  printSection('USE CASE 1: Basic Counter');

  const counter = new Understate({ initial: 0 });

  // Define mutators
  const increment = x => x + 1;
  const decrement = x => x - 1;
  const add = amount => x => x + amount;
  const multiply = factor => x => x * factor;

  console.log('Initial state:', await counter.get());

  await counter.set(increment);
  console.log('After increment:', await counter.get());

  await counter.set(add(5));
  console.log('After add(5):', await counter.get());

  await counter.set(decrement);
  console.log('After decrement:', await counter.get());

  await counter.set(multiply(3));
  console.log('After multiply(3):', await counter.get());
}

//=============================================================================
// USE CASE 2: Todo List (Add/Remove/Toggle)
//=============================================================================

/**
 * Demonstrates managing a list-based state with add, remove, and toggle operations.
 * Shows array manipulation patterns and complex state structures.
 */
async function demoTodoList() {
  printSection('USE CASE 2: Todo List Management');

  const todoState = new Understate({ initial: [] });

  // ID counter for unique IDs
  let todoIdCounter = 1;

  // Mutators for todo operations
  const addTodo = (text) => (todos) => [
    ...todos,
    { id: todoIdCounter++, text, completed: false }
  ];

  const toggleTodo = (id) => (todos) =>
    todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );

  const removeTodo = (id) => (todos) =>
    todos.filter(todo => todo.id !== id);

  console.log('Initial todos:', await todoState.get());

  await todoState.set(addTodo('Learn Understate'));
  await todoState.set(addTodo('Build an app'));
  await todoState.set(addTodo('Deploy to production'));

  const todos = await todoState.get();
  console.log('After adding todos:', JSON.stringify(todos, null, 2));

  const firstId = todos[0].id;
  await todoState.set(toggleTodo(firstId));
  console.log('After toggling first todo:', JSON.stringify(await todoState.get(), null, 2));

  await todoState.set(removeTodo(firstId));
  console.log('After removing first todo:', JSON.stringify(await todoState.get(), null, 2));
}

//=============================================================================
// USE CASE 3: Async Data Fetching (Simulated API)
//=============================================================================

/**
 * Demonstrates asynchronous state management with simulated API calls.
 * Shows loading states, error handling, and async/await patterns.
 */
async function demoAsyncDataFetching() {
  printSection('USE CASE 3: Async Data Fetching');

  const dataState = new Understate({
    initial: { data: null, loading: false, error: null },
    asynchronous: true
  });

  // Simulated API call
  const fetchUserData = async (userId) => {
    await wait(500);
    if (userId < 1) {
      throw new Error('Invalid user ID');
    }
    return { id: userId, name: `User ${userId}`, email: `user${userId}@example.com` };
  };

  // Async mutators (must return promises in async mode)
  const setLoading = () => async (state) => ({ ...state, loading: true, error: null });

  const fetchUser = (userId) => async (state) => {
    try {
      const data = await fetchUserData(userId);
      return { data, loading: false, error: null };
    } catch (error) {
      return { data: null, loading: false, error: error.message };
    }
  };

  console.log('Initial state:', await dataState.get());

  await dataState.set(setLoading());
  console.log('Loading state:', await dataState.get());

  await dataState.set(fetchUser(42));
  console.log('After successful fetch:', await dataState.get());

  await dataState.set(fetchUser(-1));
  console.log('After failed fetch:', await dataState.get());
}

//=============================================================================
// USE CASE 4: Form State Management
//=============================================================================

/**
 * Demonstrates form state management with field updates and validation.
 * Shows nested object updates and validation patterns.
 */
async function demoFormState() {
  printSection('USE CASE 4: Form State Management');

  const formState = new Understate({
    initial: {
      fields: {
        username: '',
        email: '',
        password: ''
      },
      errors: {},
      touched: {},
      isValid: false
    }
  });

  // Mutators
  const updateField = (name, value) => state => ({
    ...state,
    fields: { ...state.fields, [name]: value },
    touched: { ...state.touched, [name]: true }
  });

  const validateForm = () => state => {
    const errors = {};
    const { username, email, password } = state.fields;

    if (!username || username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (!email || !email.includes('@')) {
      errors.email = 'Invalid email address';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return {
      ...state,
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };

  console.log('Initial form:', JSON.stringify(await formState.get(), null, 2));

  await formState.set(updateField('username', 'jo'));
  await formState.set(validateForm());
  console.log('After invalid username:', JSON.stringify(await formState.get(), null, 2));

  await formState.set(updateField('username', 'john_doe'));
  await formState.set(updateField('email', 'john@example.com'));
  await formState.set(updateField('password', 'secure123'));
  await formState.set(validateForm());
  console.log('After valid inputs:', JSON.stringify(await formState.get(), null, 2));
}

//=============================================================================
// USE CASE 5: State History/Undo Functionality
//=============================================================================

/**
 * Demonstrates state history tracking and undo functionality using indexing.
 * Shows how to maintain a history of state changes and retrieve previous states.
 */
async function demoStateHistory() {
  printSection('USE CASE 5: State History & Undo');

  const editorState = new Understate({
    initial: { text: '', version: 0 },
    index: true
  });

  const history = [];

  // Track history
  editorState.subscribe((state, id) => {
    if (id) {
      history.push(id);
    }
  });

  // Mutators
  const setText = (text) => state => ({
    text,
    version: state.version + 1
  });

  console.log('Initial state:', await editorState.get());

  await editorState.set(setText('Hello'));
  console.log('Version 1:', await editorState.get());

  await editorState.set(setText('Hello World'));
  console.log('Version 2:', await editorState.get());

  await editorState.set(setText('Hello World!'));
  console.log('Version 3:', await editorState.get());

  console.log('\nHistory length:', history.length);
  console.log('Retrieving version 1:', await editorState.get(history[0]));
  console.log('Retrieving version 2:', await editorState.get(history[1]));

  // Undo to previous state
  const previousState = await editorState.get(history[history.length - 2]);
  await editorState.set(() => previousState);
  console.log('After undo:', await editorState.get());
}

//=============================================================================
// USE CASE 6: Complex Nested State
//=============================================================================

/**
 * Demonstrates managing complex nested object structures.
 * Shows deep updates and state composition patterns.
 */
async function demoNestedState() {
  printSection('USE CASE 6: Complex Nested State');

  const userProfile = new Understate({
    initial: {
      user: {
        id: 1,
        name: 'John Doe',
        profile: {
          bio: '',
          avatar: null
        }
      },
      settings: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          profileVisible: true,
          showEmail: false
        }
      },
      preferences: {
        language: 'en',
        timezone: 'UTC'
      }
    }
  });

  // Mutators for nested updates
  const updateBio = (bio) => state => ({
    ...state,
    user: {
      ...state.user,
      profile: { ...state.user.profile, bio }
    }
  });

  const toggleNotification = (type) => state => ({
    ...state,
    settings: {
      ...state.settings,
      notifications: {
        ...state.settings.notifications,
        [type]: !state.settings.notifications[type]
      }
    }
  });

  const setTheme = (theme) => state => ({
    ...state,
    settings: { ...state.settings, theme }
  });

  console.log('Initial profile:', JSON.stringify(await userProfile.get(), null, 2));

  await userProfile.set(updateBio('Software developer and open source enthusiast'));
  await userProfile.set(toggleNotification('push'));
  await userProfile.set(setTheme('dark'));

  console.log('Updated profile:', JSON.stringify(await userProfile.get(), null, 2));
}

//=============================================================================
// USE CASE 7: Method Chaining with .s()
//=============================================================================

/**
 * Demonstrates method chaining using the .s() method for fluent APIs.
 * Shows how to chain multiple state updates in a single expression.
 */
async function demoMethodChaining() {
  printSection('USE CASE 7: Method Chaining');

  const calculator = new Understate({ initial: 10 });

  const add = (n) => x => x + n;
  const multiply = (n) => x => x * n;
  const subtract = (n) => x => x - n;
  const divide = (n) => x => x / n;

  console.log('Initial value:', await calculator.get());

  // Chain multiple operations
  calculator
    .s(add(5))
    .s(multiply(2))
    .s(subtract(10))
    .s(divide(2));

  // Wait for async operations to complete
  await wait(50);

  console.log('After chained operations: 10 + 5 = 15, * 2 = 30, - 10 = 20, / 2 = 10');
  console.log('Final value:', await calculator.get());
}

//=============================================================================
// USE CASE 8: Error Handling in Async Operations
//=============================================================================

/**
 * Demonstrates error handling patterns in asynchronous state updates.
 * Shows try-catch patterns, error states, and recovery strategies.
 */
async function demoErrorHandling() {
  printSection('USE CASE 8: Error Handling');

  const apiState = new Understate({
    initial: {
      result: null,
      error: null,
      status: 'idle'
    },
    asynchronous: true
  });

  // Simulated API with error conditions
  const riskyApiCall = async (shouldFail) => {
    await wait(300);
    if (shouldFail) {
      throw new Error('API request failed: Server error 500');
    }
    return { data: 'Success data', timestamp: Date.now() };
  };

  // Mutator with error handling
  const performApiCall = (shouldFail) => async (state) => {
    try {
      const result = await riskyApiCall(shouldFail);
      return { result, error: null, status: 'success' };
    } catch (error) {
      return { result: null, error: error.message, status: 'error' };
    }
  };

  console.log('Initial state:', await apiState.get());

  await apiState.set(performApiCall(false));
  console.log('After successful call:', await apiState.get());

  await apiState.set(performApiCall(true));
  console.log('After failed call:', await apiState.get());

  // Recovery mutation (must be async)
  const reset = () => async () => ({ result: null, error: null, status: 'idle' });
  await apiState.set(reset());
  console.log('After reset:', await apiState.get());
}

//=============================================================================
// USE CASE 9: Multiple Subscribers Pattern
//=============================================================================

/**
 * Demonstrates managing multiple subscribers to state changes.
 * Shows subscription lifecycle, selective unsubscribe, and subscriber patterns.
 */
async function demoMultipleSubscribers() {
  printSection('USE CASE 9: Multiple Subscribers');

  const notificationState = new Understate({ initial: { count: 0, messages: [] } });

  const logs = { logger: [], analytics: [], ui: [] };

  // Multiple subscribers for different purposes
  const loggerSub = notificationState.subscribe(state => {
    logs.logger.push(`[Logger] Count: ${state.count}`);
  });

  const analyticsSub = notificationState.subscribe(state => {
    logs.analytics.push(`[Analytics] Messages: ${state.messages.length}`);
  });

  const uiSub = notificationState.subscribe(state => {
    logs.ui.push(`[UI] Display: ${state.count} notifications`);
  });

  // Mutators
  const addNotification = (message) => state => ({
    count: state.count + 1,
    messages: [...state.messages, message]
  });

  const clearNotifications = () => () => ({
    count: 0,
    messages: []
  });

  console.log('Adding notifications...');
  await notificationState.set(addNotification('New message'));
  await notificationState.set(addNotification('Friend request'));
  await notificationState.set(addNotification('System update'));

  console.log('\nLogger output:', logs.logger);
  console.log('Analytics output:', logs.analytics);
  console.log('UI output:', logs.ui);

  // Unsubscribe analytics
  analyticsSub.unsubscribe();
  console.log('\nAnalytics unsubscribed. Clearing notifications...');

  await notificationState.set(clearNotifications());

  console.log('\nLogger output:', logs.logger);
  console.log('Analytics output (no new entries):', logs.analytics);
  console.log('UI output:', logs.ui);
}

//=============================================================================
// USE CASE 10: State Persistence (localStorage simulation)
//=============================================================================

/**
 * Demonstrates state persistence patterns using simulated localStorage.
 * Shows hydration, serialization, and persistence strategies.
 */
async function demoStatePersistence() {
  printSection('USE CASE 10: State Persistence');

  // Simulate localStorage
  const storage = {};
  const mockLocalStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; }
  };

  const STORAGE_KEY = 'app_state';

  // Load persisted state or use default
  const loadPersistedState = () => {
    const saved = mockLocalStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { count: 0, lastUpdated: null };
  };

  const persistedState = new Understate({
    initial: loadPersistedState()
  });

  // Auto-persist on every change
  persistedState.subscribe(state => {
    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('State persisted to storage');
  });

  // Mutators
  const increment = () => state => ({
    count: state.count + 1,
    lastUpdated: new Date().toISOString()
  });

  console.log('Initial state (from storage):', await persistedState.get());
  console.log('Storage contents:', mockLocalStorage.getItem(STORAGE_KEY));

  await persistedState.set(increment());
  console.log('\nAfter increment:', await persistedState.get());
  console.log('Storage contents:', mockLocalStorage.getItem(STORAGE_KEY));

  await persistedState.set(increment());
  console.log('\nAfter second increment:', await persistedState.get());
  console.log('Storage contents:', mockLocalStorage.getItem(STORAGE_KEY));

  // Simulate page reload
  console.log('\n--- Simulating page reload ---');
  const reloadedState = new Understate({
    initial: loadPersistedState()
  });
  console.log('Reloaded state:', await reloadedState.get());
}

//=============================================================================
// Main Runner
//=============================================================================

/**
 * Main function to run all demonstrations sequentially.
 * Executes each use case with proper error handling and output formatting.
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         UNDERSTATE LIBRARY - COMPREHENSIVE DEMONSTRATION           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  try {
    await demoBasicCounter();
    await demoTodoList();
    await demoAsyncDataFetching();
    await demoFormState();
    await demoStateHistory();
    await demoNestedState();
    await demoMethodChaining();
    await demoErrorHandling();
    await demoMultipleSubscribers();
    await demoStatePersistence();

    console.log('\n' + '='.repeat(70));
    console.log('  All demonstrations completed successfully!');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n❌ Error running demonstrations:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute main function
main();
