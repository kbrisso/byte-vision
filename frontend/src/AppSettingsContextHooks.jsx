import {createContext, useReducer, useContext} from 'react';

export const DefaultAppArgs = {

    ModelPath: "",
    AppLogPath: "",
    AppLogFileName: "",
    PromptTemplateFolderName: "",
    PromptCacheFolderName: "",
    ModelFolderName: "",
    LLamaCliPath: "",
    LLamaEmbedCliPath: "",
    PDFToTextEXE: "",
    EmbedDBFolderName: "",
    ModelFileName: "",
    EmbedModelFileName: "",
    ModelLogFolderNamePath: "",
    ReportDataPath: "",
};

// Context creation
const AppSettingsContext = createContext();
const AppSettingsDispatchContext = createContext();

// Reducer function to handle state updates
function settingsReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state, [action.field]: action.value,
            };
        case 'RESET_STATE':
            return state;
        case 'SET_MULTIPLE_FIELDS':
            return {
                ...state, ...action.payload, // Merge new fields into state
            };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

// Provider component
export const AppSettingsProvider = ({children}) => {
    const [state, dispatch] = useReducer(settingsReducer, DefaultAppArgs);

    return (<AppSettingsContext.Provider value={state}>
            <AppSettingsDispatchContext.Provider value={dispatch}>
                {children}
            </AppSettingsDispatchContext.Provider>
        </AppSettingsContext.Provider>);
};

// Custom hooks for consuming state and dispatch
export const useAppSettings = () => {
    const context = useContext(AppSettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const useAppSettingsDispatch = () => {
    const context = useContext(AppSettingsDispatchContext);
    if (!context) {
        throw new Error('useSettingsDispatch must be used within a SettingsProvider');
    }
    return context;
};