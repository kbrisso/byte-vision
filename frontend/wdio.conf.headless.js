import { config as baseConfig } from './wdio.conf.js';

// Headless configuration with maximum suppression
export const config = {
    ...baseConfig,
    capabilities: [{
        ...baseConfig.capabilities[0],
        'goog:chromeOptions': {
            ...baseConfig.capabilities[0]['goog:chromeOptions'],
            args: [
                ...baseConfig.capabilities[0]['goog:chromeOptions'].args,
                '--headless=new', // Use new headless mode
                '--disable-gpu-sandbox',
                '--disable-software-rasterizer',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--mute-audio',
                '--disable-audio-output'
            ]
        }
    }],
    logLevel: 'error' // Only show errors in headless mode
};
