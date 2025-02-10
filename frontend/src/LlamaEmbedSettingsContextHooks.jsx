
import {createContext, useReducer, useContext} from 'react';
export const LlamaEmbedArgs = {

    EmbedMainGPUCmd: "",
    EmbedMainGPUVal: "",
    EmbedKeepCmd: "",
    EmbedKeepVal: "",
    EmbedTopKCmd: "",
    EmbedTopKVal: "",
    EmbedCtxSizeCmd: "",
    EmbedCtxSizeVal: "",
    EmbedBatchCmd: "",
    EmbedBatchVal: "",
    EmbedThreadsCmd: "",
    EmbedThreadsVal: "",
    EmbedThreadsBatchCmd: "",
    EmbedThreadsBatchVal: "",
    EmbedSeparatorCmd: "",
    EmbedSeparatorVal: "",
    EmbedModelPathCmd: "",
    EmbedModelPathVal: "",
    EmbedModelLogFileCmd: "",
    EmbedModelLogFileNameVal: "",
    EmbedPoolingCmd: "",
    EmbedPoolingVal: "",
    EmbedOutputFormatCmd: "",
    EmbedOutputFormatVal: "",
    EmbedNormalizeCmd: "",
    EmbedNormalizeVal: "",
    EmbedFlashAttentionCmd: "",
    EmbedFlashAttentionCmdEnabled: false,
    EmbedPromptFileCmd: "",
    EmbedPromptFileVal: "",
    EmbedPromptCmd: "",
    EmbedPromptCmdEnabled: false,
    EmbedTemperatureCmd: "",
    EmbedTemperatureVal: "",
    EmbedGPULayersCmd: "",
    EmbedGPULayersVal: "",
    EmbedRepeatPenaltyCmd: "",
    EmbedRepeatPenaltyVal: "",
};

// Context creation
const LlamaEmbedSettingsContext = createContext();
const LlamaEmbedSettingsDispatchContext = createContext();

// Reducer function to handle state updates
function settingsReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                [action.field]: action.value,
            };
        case 'RESET_STATE':
            return state;
        case 'SET_MULTIPLE_FIELDS':
            return {
                ...state,
                ...action.payload, // Merge new fields into state
            };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

// Provider component
export const LlamaEmbedSettingsProvider = ({children}) => {
    const [state, dispatch] = useReducer(settingsReducer, LlamaEmbedArgs);

    return (
        <LlamaEmbedSettingsContext.Provider value={state}>
            <LlamaEmbedSettingsDispatchContext.Provider value={dispatch}>
                {children}
            </LlamaEmbedSettingsDispatchContext.Provider>
        </LlamaEmbedSettingsContext.Provider>
    );
};

// Custom hooks for consuming state and dispatch
export const useLlamaEmbedSettings = () => {
    const context = useContext(LlamaEmbedSettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const useLlamaEmbedSettingsDispatch = () => {
    const context = useContext(LlamaEmbedSettingsDispatchContext);
    if (!context) {
        throw new Error('useSettingsDispatch must be used within a SettingsProvider');
    }
    return context;
};