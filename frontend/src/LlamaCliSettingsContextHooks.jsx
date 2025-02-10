import {createContext, useReducer, useContext} from 'react';
export const LlamaCppArgs = {

        ID: "",
        Description: "",
        PromptCmd: "",
        PromptCmdEnabled: "",
        ConversationCmd: "",
        ConversationCmdEnabled: false,
        ChatTemplateCmd: "",
        ChatTemplateVal: "",
        MultilineInputCmd: "",
        MultilineInputCmdEnabled: false,
        CtxSizeCmd: "",
        CtxSizeVal: "",
        RopeScaleVal: "",
        RopeScaleCmd: "",
        PromptCacheAllCmd: "",
        PromptCacheAllEnabled: false,
        PromptCacheCmd: "",
        PromptCacheVal: "",
        PromptFileCmd: "",
        PromptFileVal: "",
        InteractiveFirstCmd: "",
        InteractiveFirstCmdEnabled: false,
        InteractiveModeCmdEnabled: false,
        InteractiveModeCmd: "",
        ReversePromptCmd: "",
        ReversePromptVal: "",
        InPrefixCmd: "",
        InPrefixVal: "",
        InSuffixCmd: "",
        InSuffixVal: "",
        GPULayersCmd: "",
        GPULayersVal: "",
        ThreadsBatchCmd: "",
        ThreadsBatchVal: "",
        ThreadsCmd: "",
        ThreadsVal: "",
        KeepCmd: "",
        KeepVal: "",
        TopKCmd: "",
        TopKVal: "",
        MainGPUCmd: "",
        MainGPUVal: "",
        RepeatPenaltyCmd: "",
        RepeatPenaltyVal: "",
        RepeatLastPenaltyCmd: "",
        RepeatLastPenaltyVal: "",
        MemLockCmd: "",
        MemLockCmdEnabled: false,
        NoMMApCmd: "",
        NoMMApCmdEnabled: false,
        EscapeNewLinesCmd: "",
        EscapeNewLinesCmdEnabled: false,
        LogVerboseCmd: "",
        LogVerboseEnabled: false,
        TemperatureVal: "",
        TemperatureCmd: "",
        PredictCmd: "",
        PredictVal: "",
        ModelFullPath: "",
        ModelCmd: "",
        PromptText: "",
        NoDisplayPromptCmd: "",
        NoDisplayPromptEnabled: false,
        TopPCmd: "",
        TopPVal: "",
        ModelLogFileCmd: "",
        ModelLogFileNameVal: "",
        FlashAttentionCmd: "",
        FlashAttentionCmdEnabled: false,
};

// Context creation
const LlamaCliSettingsContext = createContext();
const LlamaCliSettingsDispatchContext = createContext();

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
export const LlamaCliSettingsProvider = ({children}) => {
    const [state, dispatch] = useReducer(settingsReducer, LlamaCppArgs);

    return (
        <LlamaCliSettingsContext.Provider value={state}>
            <LlamaCliSettingsDispatchContext.Provider value={dispatch}>
                {children}
            </LlamaCliSettingsDispatchContext.Provider>
        </LlamaCliSettingsContext.Provider>
    );
};

// Custom hooks for consuming state and dispatch
export const useLlamaCliSettings = () => {
    const context = useContext(LlamaCliSettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const useLlamaCliSettingsDispatch = () => {
    const context = useContext(LlamaCliSettingsDispatchContext);
    if (!context) {
        throw new Error('useSettingsDispatch must be used within a SettingsProvider');
    }
    return context;
};