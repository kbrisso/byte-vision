// SettingsContext.jsx
import {createContext, useReducer, useContext} from 'react';

export const initialState = {
    ID: '',
    Description: '',    
    PromptCmd: {String: '', Valid: false},
    PromptCmdEnabled: {Bool: '', Valid: false},
    ConversationCmd: {String: '', Valid: false},
    ConversationCmdEnabled: {Bool: '', Valid: false},
    ChatTemplateCmd: {String: '', Valid: false},
    ChatTemplateVal: {String: '', Valid: false},
    MultilineInputCmd: {String: '', Valid: false},
    MultilineInputCmdEnabled: {Bool: '', Valid: false},
    CtxSizeCmd: {String: '', Valid: false},
    CtxSizeVal: {String: '', Valid: false},
    RopeScaleVal: {String: '', Valid: false},
    RopeScaleCmd: {String: '', Valid: false},
    PromptCacheCmd: {String: '', Valid: false},
    PromptCacheVal: {String: '', Valid: false},
    PromptFileCmd: {String: '', Valid: false},
    PromptFileVal: {String: '', Valid: false},
    InteractiveFirstCmd: {String: '', Valid: false},
    InteractiveFirstCmdEnabled: {Bool: '', Valid: false},
    InteractiveModeCmd: {String: '', Valid: false},
    InteractiveModeCmdEnabled: {Bool: '', Valid: false},
    ReversePromptCmd: {String: '', Valid: false},
    ReversePromptVal: {String: '', Valid: false},
    InPrefixCmd: {String: '', Valid: false},
    InPrefixVal: {String: '', Valid: false},
    InSuffixCmd: {String: '', Valid: false},
    InSuffixVal: {String: '', Valid: false},
    GPULayersCmd: {String: '', Valid: false},
    GPULayersVal: {String: '', Valid: false},
    ThreadsBatchCmd: {String: '', Valid: false},
    ThreadsBatchVal: {String: '', Valid: false},
    ThreadsCmd: {String: '', Valid: false},
    ThreadsVal: {String: '', Valid: false},
    KeepCmd: {String: '', Valid: false},
    KeepVal: {String: '', Valid: false},
    TopKCmd: {String: '', Valid: false},
    TopKVal: {String: '', Valid: false},
    MainGPUCmd: {String: '', Valid: false},
    MainGPUVal: {String: '', Valid: false},
    RepeatPenaltyCmd: {String: '', Valid: false},
    RepeatPenaltyVal: {String: '', Valid: false},
    RepeatLastPenaltyCmd: {String: '', Valid: false},
    RepeatLastPenaltyVal: {String: '', Valid: false},
    MemLockCmd: {String: '', Valid: false},
    MemLockCmdEnabled: {String: '', Valid: false},
    EscapeNewLinesCmd: {String: '', Valid: false},
    EscapeNewLinesCmdEnabled: {Bool: '', Valid: false},
    LogVerboseCmd: {String: '', Valid: false},
    LogVerboseEnabled: {Bool: '', Valid: false},
    TemperatureVal: {String: '', Valid: false},
    TemperatureCmd: {String: '', Valid: false},
    PredictCmd: {String: '', Valid: false},
    PredictVal: {String: '', Valid: false},
    ModelFullPath : {String: '', Valid: false},
    ModelCmd : {String: '', Valid: false},
    PromptText : {String: '', Valid: false},
    NoDisplayPromptCmd: {String: '', Valid: false},
    NoDisplayPromptEnabled: {Bool: '', Valid: false},
    TopPCmd: {String: '', Valid: false},
    TopPVal: {String: '', Valid: false},
    LogFileCmd: {String: '', Valid: false},
    LogFileVal: {String: '', Valid: false},


};

// Context creation
const SettingsContext = createContext();
const SettingsDispatchContext = createContext();

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
export const SettingsProvider = ({children}) => {
    const [state, dispatch] = useReducer(settingsReducer, initialState);

    return (
        <SettingsContext.Provider value={state}>
            <SettingsDispatchContext.Provider value={dispatch}>
                {children}
            </SettingsDispatchContext.Provider>
        </SettingsContext.Provider>
    );
};

// Custom hooks for consuming state and dispatch
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const useSettingsDispatch = () => {
    const context = useContext(SettingsDispatchContext);
    if (!context) {
        throw new Error('useSettingsDispatch must be used within a SettingsProvider');
    }
    return context;
};