export const testData = {
    basicConfig: {
        description: 'Test Configuration',
        model: 'test-model.gguf'
    },
    
    completeConfig: {
        basic: {
            description: 'Complete Test Configuration',
            model: 'llama-2-7b.gguf'
        },
        performance: {
            threads: '8',
            ctxSize: '4096'
        },
        sampling: {
            temperature: '0.8',
            topK: '40',
            topP: '0.9'
        }
    },
    
    invalidConfig: {
        basic: {
            description: '', // Required field empty
        },
        performance: {
            threads: '-1', // Invalid value
            ctxSize: 'abc' // Invalid type
        },
        sampling: {
            temperature: '3.0', // Outside valid range
            topP: '1.5' // Outside valid range
        }
    },
    
    edgeCases: {
        maxValues: {
            ctxSize: '65536',
            threads: '64'
        },
        minValues: {
            ctxSize: '1',
            threads: '1'
        }
    }
};
