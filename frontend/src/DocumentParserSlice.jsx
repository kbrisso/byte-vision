import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import { AddElasticDocument, CancelProcess } from "../wailsjs/go/main/App.js";

export const createParserSlice = (set, get) => ({
  // Parser state
  isProcessing: false,
  processingOutput: "",
  lastParserConfig: null,
  parserError: null,
  abortController: null,
  processingProgress: 0,
  processingStage: "",
  error: null,
  loading: false,

  // Parser actions
  setProcessing: (isProcessing) =>
    set((state) => {
      state.isProcessing = isProcessing;
    }),
  setLoading: (loading) =>
    set((state) => {
      state.loading = loading;
    }),
  setProcessingOutput: (output) =>
    set((state) => {
      state.processingOutput = output;
    }),

  setLastParserConfig: (config) =>
    set((state) => {
      state.lastParserConfig = config;
    }),

  setParserError: (error) =>
    set((state) => {
      state.parserError = error;
    }),

  setAbortController: (controller) =>
    set((state) => {
      state.abortController = controller;
    }),

  setProcessingProgress: (progress) =>
    set((state) => {
      state.processingProgress = progress;
    }),

  setProcessingStage: (stage) =>
    set((state) => {
      state.processingStage = stage;
    }),

  // Complex actions
  startDocumentParsing: async (settings, config) => {
    const {
      setProcessing,
      setParserError,
      setProcessingOutput,
      setLastParserConfig,
      setAbortController,
      setProcessingProgress,
      setProcessingStage,
    } = get();

    try {
      setProcessing(true);
      setParserError(null);
      setProcessingOutput("");
      setProcessingProgress(0);
      setProcessingStage("Initializing...");

      // Create AbortController for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      // Save configuration
      setLastParserConfig(config);

      if (!settings) {
        throw new Error("Settings not loaded");
      }

      setProcessingStage("Processing documents...");
      setProcessingProgress(25);

      const result = await AddElasticDocument(
        settings.llamaEmbed,
        config.selectedDocType,
        config.indexName,
        config.title,
        config.metaTextDesc,
        config.metaKeyWords,
        config.sourceLocation,
        parseInt(config.chunkSize),
        parseInt(config.chunkOverlap),
      );

      setProcessingProgress(100);
      setProcessingStage("Completed");
      setProcessingOutput(result);

      LogInfo("Document parsing completed successfully");

      return result;
    } catch (error) {
      const errorMessage =
        error.message || "An error occurred during processing";
      setParserError(errorMessage);
      setProcessingOutput(`Error: ${errorMessage}`);
      setProcessingStage("Error");

      LogError(`Document parsing failed: ${error}`);
      throw error;
    } finally {
      setProcessing(false);
      setAbortController(null);
      setProcessingProgress(0);
      setProcessingStage("");
    }
  },

  cancelDocumentParsing: () => {
    const { abortController, setProcessing, setAbortController } = get();

    if (abortController) {
      abortController.abort();

      CancelProcess()
        .then((result) => {
          LogInfo(result);
        })
        .catch((error) => {
          LogError(error);
        });

      setProcessing(false);
      setAbortController(null);
      LogInfo("Document processing cancelled by user");
    }
  },

  resetParser: () =>
    set((state) => {
      state.isProcessing = false;
      state.processingOutput = "";
      state.parserError = null;
      state.abortController = null;
      state.processingProgress = 0;
      state.processingStage = "";
    }),
});
