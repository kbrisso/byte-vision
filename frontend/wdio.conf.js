import fs from 'fs';
import path from 'path';

export const config = {
    runner: 'local',

    specs: [
        './test/specs/**/*.js'
    ],

    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-extensions',
                '--disable-default-apps',
                '--no-default-browser-check',
                '--no-first-run',
                '--disable-popup-blocking',
                '--disable-logging',
                '--log-level=3',
                '--silent'
            ],
            excludeSwitches: ['enable-logging'],
            useAutomationExtension: false,
            prefs: {
                'profile.default_content_setting_values.notifications': 2,
                'profile.default_content_settings.popups': 0
            }
            // Remove loggingPrefs - this is causing the error
        },
        // Move logging preferences to the top level if needed
        'goog:loggingPrefs': {
            browser: 'OFF',
            driver: 'OFF',
            performance: 'OFF'
        }
    }],

    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost:5173',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    services: [
        ['chromedriver', {
            logFileName: 'chromedriver.log',
            outputDir: './logs'
        }]
    ],

    framework: 'mocha',
    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    onPrepare: function (config, capabilities) {
        console.log('onPrepare');

        const dirs = ['./logs', './test/screenshots'];
        dirs.forEach(dir => {
            const fullPath = path.resolve(dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    },

    before: function (capabilities, specs) {
        console.log('maximizeWindow');
        browser.maximizeWindow();
    },

    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            browser.saveScreenshot(`./test/screenshots/ERROR_${test.title}_${Date.now()}.png`);
        }
    }
};