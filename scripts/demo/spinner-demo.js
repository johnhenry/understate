/**
 * Understate Loading Spinner Demo (Node.js)
 * Demonstrates how to manage loading states during async operations
 */

import Understate from './../../src/index.js';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Simple console spinner animation
class ConsoleSpinner {
    constructor() {
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.frameIndex = 0;
        this.intervalId = null;
        this.isSpinning = false;
    }

    start(message = 'Loading') {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.frameIndex = 0;

        this.intervalId = setInterval(() => {
            process.stdout.write(`\r${colors.cyan}${this.frames[this.frameIndex]}${colors.reset} ${message}...`);
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }, 80);
    }

    stop(finalMessage = null) {
        if (!this.isSpinning) return;
        this.isSpinning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Clear the spinner line
        process.stdout.write('\r\x1b[K');

        if (finalMessage) {
            console.log(finalMessage);
        }
    }
}

// Simulate an async API call
async function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate occasional failures
            if (Math.random() > 0.8) {
                reject(new Error('Network timeout'));
            } else {
                resolve({
                    id: userId,
                    name: `User ${userId}`,
                    email: `user${userId}@example.com`,
                    timestamp: new Date().toISOString()
                });
            }
        }, 2000);
    });
}

// Simulate processing data
async function processData(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ...data,
                processed: true,
                processedAt: new Date().toISOString()
            });
        }, 1500);
    });
}

// Main demo
async function runDemo() {
    console.log(`${colors.bright}${colors.blue}=== Understate Loading Spinner Demo ===${colors.reset}\n`);

    // Create state manager with loading state structure
    const appState = new Understate({
        initial: {
            isLoading: false,
            operation: null,
            data: null,
            error: null
        },
        asynchronous: true
    });

    // Create spinner instance
    const spinner = new ConsoleSpinner();

    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.isLoading) {
            spinner.start(state.operation || 'Loading');
        } else {
            spinner.stop();

            if (state.error) {
                console.log(`${colors.red}✗ Error:${colors.reset} ${state.error}`);
            } else if (state.data) {
                console.log(`${colors.green}✓ Success:${colors.reset} Operation completed`);
                console.log(`${colors.dim}Data:${colors.reset}`, JSON.stringify(state.data, null, 2));
            }
        }
    });

    try {
        // Demo 1: Fetch user data
        console.log(`${colors.yellow}Demo 1: Fetching user data...${colors.reset}`);

        await appState.set(async () => ({
            isLoading: true,
            operation: 'Fetching user data',
            data: null,
            error: null
        }));

        try {
            const userData = await fetchUserData(123);

            await appState.set(() => ({
                isLoading: false,
                operation: null,
                data: userData,
                error: null
            }));
        } catch (error) {
            await appState.set(() => ({
                isLoading: false,
                operation: null,
                data: null,
                error: error.message
            }));
        }

        // Wait before next demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('');

        // Demo 2: Process data with chained operations
        console.log(`${colors.yellow}Demo 2: Processing data (chained operations)...${colors.reset}`);

        await appState.set(async () => ({
            isLoading: true,
            operation: 'Fetching data',
            data: null,
            error: null
        }));

        try {
            const rawData = await fetchUserData(456);

            await appState.set(async () => ({
                isLoading: true,
                operation: 'Processing data',
                data: rawData,
                error: null
            }));

            const processedData = await processData(rawData);

            await appState.set(() => ({
                isLoading: false,
                operation: null,
                data: processedData,
                error: null
            }));
        } catch (error) {
            await appState.set(() => ({
                isLoading: false,
                operation: null,
                data: null,
                error: error.message
            }));
        }

        console.log('');
        console.log(`${colors.bright}${colors.green}Demo completed successfully!${colors.reset}`);
        console.log(`\n${colors.dim}This demo shows how Understate manages loading states during async operations.${colors.reset}`);
        console.log(`${colors.dim}The spinner automatically appears/disappears based on the isLoading state.${colors.reset}`);

    } catch (error) {
        console.error(`${colors.red}Demo error:${colors.reset}`, error);
        spinner.stop();
    }
}

// Run the demo
runDemo().catch(console.error);
