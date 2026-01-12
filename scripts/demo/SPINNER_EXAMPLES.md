# Loading Spinner Examples

> Comprehensive examples demonstrating loading state management with Understate

This directory contains practical examples showing how to implement loading spinners with Understate during async operations.

## Table of Contents

- [Overview](#overview)
- [Examples](#examples)
  - [HTML Demo](#1-html-demo-spinner-demohtml)
  - [Node.js Demo](#2-nodejs-demo-spinner-demojs)
- [Core Pattern](#core-pattern)
- [State Structure](#state-structure)
- [Framework Integration](#integration-tips)
- [Benefits](#benefits-of-this-pattern)
- [Learn More](#learn-more)

## Overview

Understate is a state management library that makes it easy to track loading states during asynchronous operations. These examples demonstrate:

- ✅ Managing loading states with Understate
- ✅ Displaying visual loading indicators
- ✅ Handling async operations gracefully
- ✅ Updating UI based on state changes
- ✅ Error handling and recovery

## Examples

### 1. HTML Demo (`spinner-demo.html`)

An interactive browser-based demo showing a visual loading spinner.

**Features:**
- Animated CSS spinner
- Real-time state updates
- Success/error status display
- Data visualization
- Button state management

**To run:**
```bash
# Simply open in a web browser
open scripts/demo/spinner-demo.html
```

Or serve with a local server:
```bash
npx serve scripts/demo
# Then visit http://localhost:3000/spinner-demo.html
```

### 2. Node.js Demo (`spinner-demo.js`)

A command-line demo showing how to manage loading states in Node.js applications.

**Features:**
- Terminal spinner animation
- Async operation management
- Error handling
- Chained async operations
- Colored console output

**To run:**
```bash
node scripts/demo/spinner-demo.js
```

## Core Pattern

Both examples follow the same state management pattern:

```javascript
// 1. Initialize state with loading structure
const state = new Understate({
    initial: {
        isLoading: false,
        data: null,
        error: null
    }
});

// 2. Subscribe to state changes
state.subscribe((state) => {
    if (state.isLoading) {
        // Show spinner
    } else if (state.error) {
        // Show error
    } else if (state.data) {
        // Show data
    }
});

// 3. Update state during async operations
await state.set(() => ({ isLoading: true, data: null, error: null }));

try {
    const data = await fetchData();
    await state.set(() => ({ isLoading: false, data, error: null }));
} catch (error) {
    await state.set(() => ({ isLoading: false, data: null, error: error.message }));
}
```

## State Structure

The recommended state structure for loading operations:

```javascript
{
    isLoading: boolean,    // Whether an operation is in progress
    operation: string,     // Description of current operation (optional)
    data: any,            // Result data from async operation
    error: string | null  // Error message if operation failed
}
```

## Integration Tips

### React Integration

```jsx
import { useEffect, useState } from 'react';
import Understate from 'understate';

function MyComponent() {
    const [state, setState] = useState({ isLoading: false, data: null });
    const loadingState = useRef(new Understate({ initial: state }));

    useEffect(() => {
        const subscription = loadingState.current.subscribe(setState);
        return () => subscription.unsubscribe();
    }, []);

    return (
        <div>
            {state.isLoading && <Spinner />}
            {state.data && <Data value={state.data} />}
        </div>
    );
}
```

### Vue Integration

```vue
<template>
    <div>
        <Spinner v-if="state.isLoading" />
        <Data v-if="state.data" :value="state.data" />
    </div>
</template>

<script>
import Understate from 'understate';

export default {
    data() {
        return {
            state: { isLoading: false, data: null },
            stateManager: new Understate({ initial: this.state })
        };
    },
    mounted() {
        this.stateManager.subscribe((newState) => {
            this.state = newState;
        });
    }
};
</script>
```

## Benefits of This Pattern

1. **Centralized Loading State**: All loading logic in one place
2. **Reactive UI**: UI automatically updates when state changes
3. **Type Safety**: Clear state structure for TypeScript
4. **Testable**: Easy to test state transitions
5. **Reusable**: Same pattern works across frameworks
6. **Predictable**: Consistent state management across your application
7. **Maintainable**: Easy to understand and modify

## Learn More

- **[Main Documentation](../../readme.md)** - Complete Understate guide
- **[API Reference](../../readme.md#api-reference)** - Detailed API documentation
- **[Advanced Patterns](../../readme.md#advanced-usage-patterns)** - Advanced techniques
- **[Contributing](../../readme.md#contributing)** - How to contribute

## Quick Links

- [npm Package](https://www.npmjs.com/package/understate)
- [GitHub Repository](https://github.com/johnhenry/understate)
- [Report Issues](https://github.com/johnhenry/understate/issues)

---

## License

ISC - See [LICENSE](../../readme.md#license) for details
