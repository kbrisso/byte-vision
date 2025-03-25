import {GetDefaultSettings} from "../wailsjs/go/main/App.js";
import {LogError} from "../wailsjs/runtime/runtime.js";

import {LlamaEmbedArgs} from "./LlamaEmbedSettingsContextHooks.jsx";
import {DefaultAppArgs} from "./AppSettingsContextHooks.jsx";
import {LlamaCppArgs} from "./LlamaCliSettingsContextHooks.jsx";
import {createRoot} from 'react-dom/client'



const SETTINGS_INDICES = {
    LLAMA_CPP: 0, LLAMA_EMBED: 1, APP_SETTINGS: 2

};

export async function initState() {
    try {
        const container = document.getElementById('root')
        const root = createRoot(container)
        const result = await GetDefaultSettings();
        const settings = JSON.parse(result);
        await initLlamaCppSettings(settings[SETTINGS_INDICES.LLAMA_CPP]);
        await initLlamaEmbedSettings(settings[SETTINGS_INDICES.LLAMA_EMBED]);
        await initAppSettings(settings[SETTINGS_INDICES.APP_SETTINGS]);
        return Promise.resolve(root);

    } catch (error) {
        LogError("Failed to initialize settings: " + error.message);
    }
}

async function initAppSettings(appSettings) {
    try {
        Object.assign(DefaultAppArgs, {
            ModelPath: appSettings.modelPath,
            AppLogPath: appSettings.appLogPath,
            AppLogFileName: appSettings.appLogFileName,
            PromptTemplateFolderName: appSettings.promptTemplateFolderName,
            PromptCacheFolderName: appSettings.promptCacheFolderName,
            ModelFolderName: appSettings.modelFolderName,
            LLamaCliPath: appSettings.lLamaCliPath,
            LLamaEmbedCliPath: appSettings.lLamaEmbedCliPath,
            PDFToTextEXE: appSettings.pDFToTextEXE,
            EmbedDBFolderName: appSettings.embedDBFolderName,
            ModelFileName: appSettings.modelFileName,
            EmbedModelFileName: appSettings.embedModelFileName,
            ModelLogFolderNamePath: appSettings.modelLogFolderNamePath,
            ReportDataPath: appSettings.reportDataPath,


        });
    }catch (error){
        LogError("Failed to initialize app settings: " + error.message);
    }
}

async function initLlamaCppSettings(llamaCppSettings) {
    try {
        Object.assign(LlamaCppArgs, {
            ID: llamaCppSettings.id,
            Description: llamaCppSettings.description,
            PromptCmd: llamaCppSettings.promptCmd,
            PromptCmdEnabled: llamaCppSettings.promptCmdEnabled,
            ChatTemplateCmd: llamaCppSettings.chatTemplateCmd,
            ChatTemplateVal: llamaCppSettings.chatTemplateVal,
            MultilineInputCmd: llamaCppSettings.multilineInputCmd,
            MultilineInputCmdEnabled: llamaCppSettings.multilineInputCmdEnabled,
            CtxSizeCmd: llamaCppSettings.ctxSizeCmd,
            CtxSizeVal: llamaCppSettings.ctxSizeVal,
            RopeScaleVal: llamaCppSettings.ropeScaleVal,
            RopeScaleCmd: llamaCppSettings.ropeScaleCmd,
            PromptCacheAllCmd: llamaCppSettings.promptCacheAllCmd,
            PromptCacheAllEnabled: llamaCppSettings.promptCacheAllEnabled,
            PromptCacheCmd: llamaCppSettings.promptCacheCmd,
            PromptCacheVal: llamaCppSettings.promptCacheVal,
            PromptFileCmd: llamaCppSettings.promptFileCmd,
            PromptFileVal: llamaCppSettings.promptFileVal,
            ReversePromptCmd: llamaCppSettings.reversePromptCmd,
            ReversePromptVal: llamaCppSettings.reversePromptVal,
            InPrefixCmd: llamaCppSettings.inPrefixCmd,
            InPrefixVal: llamaCppSettings.inPrefixVal,
            InSuffixCmd: llamaCppSettings.inSuffixCmd,
            InSuffixVal: llamaCppSettings.inSuffixVal,
            GPULayersCmd: llamaCppSettings.gPULayersCmd,
            GPULayersVal: llamaCppSettings.gPULayersVal,
            ThreadsBatchCmd: llamaCppSettings.threadsBatchCmd,
            ThreadsBatchVal: llamaCppSettings.threadsBatchVal,
            ThreadsCmd: llamaCppSettings.threadsCmd,
            ThreadsVal: llamaCppSettings.threadsVal,
            KeepCmd: llamaCppSettings.keepCmd,
            KeepVal: llamaCppSettings.keepVal,
            TopKCmd: llamaCppSettings.topKCmd,
            TopKVal: llamaCppSettings.topKVal,
            MainGPUCmd: llamaCppSettings.mainGPUCmd,
            MainGPUVal: llamaCppSettings.mainGPUVal,
            RepeatPenaltyCmd: llamaCppSettings.repeatPenaltyCmd,
            RepeatPenaltyVal: llamaCppSettings.repeatPenaltyVal,
            RepeatLastPenaltyCmd: llamaCppSettings.repeatLastPenaltyCmd,
            RepeatLastPenaltyVal: llamaCppSettings.repeatLastPenaltyVal,
            MemLockCmd: llamaCppSettings.memLockCmd,
            MemLockCmdEnabled: llamaCppSettings.memLockCmdEnabled,
            NoMMApCmd: llamaCppSettings.noMMApCmd,
            NoMMApCmdEnabled: llamaCppSettings.noMMApCmdEnabled,
            EscapeNewLinesCmd: llamaCppSettings.escapeNewLinesCmd,
            EscapeNewLinesCmdEnabled: llamaCppSettings.escapeNewLinesCmdEnabled,
            LogVerboseCmd: llamaCppSettings.logVerboseCmd,
            LogVerboseEnabled: llamaCppSettings.logVerboseEnabled,
            TemperatureVal: llamaCppSettings.temperatureVal,
            TemperatureCmd: llamaCppSettings.temperatureCmd,
            PredictCmd: llamaCppSettings.predictCmd,
            PredictVal: llamaCppSettings.predictVal,
            ModelFullPath: llamaCppSettings.modelFullPath,
            ModelCmd: llamaCppSettings.modelCmd,
            PromptText: llamaCppSettings.promptText,
            NoDisplayPromptCmd: llamaCppSettings.noDisplayPromptCmd,
            NoDisplayPromptEnabled: llamaCppSettings.noDisplayPromptEnabled,
            TopPCmd: llamaCppSettings.topPCmd,
            TopPVal: llamaCppSettings.topPVal,
            MinPCmd: llamaCppSettings.MinPCmd,
            MinPVal: llamaCppSettings.MinPVal,
            ModelLogFileCmd: llamaCppSettings.modelLogFileCmd,
            ModelLogFileNameVal: llamaCppSettings.modelLogFileNameVal,
            FlashAttentionCmd: llamaCppSettings.flashAttentionCmd,
            FlashAttentionCmdEnabled: llamaCppSettings.flashAttentionCmdEnabled
        });

    }catch(error){
        LogError("Failed to initialize llama cpp settings: " + error.message);
    }
}

async function initLlamaEmbedSettings(llamaEmbedSettings) {
    try {
        Object.assign(LlamaEmbedArgs, {
            EmbedMainGPUCmd: llamaEmbedSettings.embedMainGPUCmd,
            EmbedMainGPUVal: llamaEmbedSettings.embedMainGPUVal,
            EmbedKeepCmd: llamaEmbedSettings.embedKeepCmd,
            EmbedKeepVal: llamaEmbedSettings.embedKeepVal,
            EmbedTopKCmd: llamaEmbedSettings.embedTopKCmd,
            EmbedTopKVal: llamaEmbedSettings.embedTopKVal,
            EmbedCtxSizeCmd: llamaEmbedSettings.embedCtxSizeCmd,
            EmbedCtxSizeVal: llamaEmbedSettings.embedCtxSizeVal,
            EmbedBatchCmd: llamaEmbedSettings.embedBatchCmd,
            EmbedBatchVal: llamaEmbedSettings.embedBatchVal,
            EmbedThreadsCmd: llamaEmbedSettings.embedThreadsCmd,
            EmbedThreadsVal: llamaEmbedSettings.embedThreadsVal,
            EmbedThreadsBatchCmd: llamaEmbedSettings.embedThreadsBatchCmd,
            EmbedThreadsBatchVal: llamaEmbedSettings.embedThreadsBatchVal,
            EmbedSeparatorCmd: llamaEmbedSettings.embedSeparatorCmd,
            EmbedSeparatorVal: llamaEmbedSettings.embedSeparatorVal,
            EmbedModelPathCmd: llamaEmbedSettings.embedModelPathCmd,
            EmbedModelPathVal: llamaEmbedSettings.embedModelPathVal,
            EmbedModelLogFileCmd: llamaEmbedSettings.embedModelLogFileCmd,
            EmbedModelLogFileNameVal: llamaEmbedSettings.embedModelLogFileNameVal,
            EmbedPoolingCmd: llamaEmbedSettings.embedPoolingCmd,
            EmbedPoolingVal: llamaEmbedSettings.embedPoolingVal,
            EmbedOutputFormatCmd: llamaEmbedSettings.embedOutputFormatCmd,
            EmbedOutputFormatVal: llamaEmbedSettings.embedOutputFormatVal,
            EmbedTemperatureCmd: llamaEmbedSettings.embedTemperatureCmd,
            EmbedTemperatureVal: llamaEmbedSettings.embedTemperatureVal
        });
    }catch(error){
        LogError("Failed to initialize llama embed settings: " + error.message);
    }
}