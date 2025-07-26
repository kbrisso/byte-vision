import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import { AddElasticDocument, CancelProcess } from "../wailsjs/go/main/App.js";
import { EventsEmit, EventsOff, EventsOn } from "../wailsjs/runtime/runtime.js";

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

    return new Promise((resolve, reject) => {
      try {
        setProcessing(true);
        setParserError(null);
        setProcessingOutput("");
        setProcessingProgress(0);
        setProcessingStage("Initializing...");

        const startTime = Date.now();
        const requestId = `parser_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const controller = new AbortController();
        setAbortController(controller);

        // Save configuration
        setLastParserConfig(config);

        if (!settings) {
          throw new Error("Settings not loaded");
        }

        // Prepare the request data
        const requestData = {
          requestId: requestId,
          settings: settings.llamaEmbed,
          config: {
            selectedDocType: config.selectedDocType,
            indexName: config.indexName,
            title: config.title,
            metaTextDesc: config.metaTextDesc,
            metaKeyWords: config.metaKeyWords,
            sourceLocation: config.sourceLocation,
            chunkSize: parseInt(config.chunkSize),
            chunkOverlap: parseInt(config.chunkOverlap),
          },
        };

        // Set up event listeners for this specific request
        const handleResponse = (response) => {
          if (response.requestId === requestId) {
            const processTime = Date.now() - startTime;

            if (response.success) {
              setProcessingProgress(100);
              setProcessingStage("Completed");
              setProcessingOutput(response.result);
              LogInfo("Document parsing completed successfully");
              resolve(response.result);
            } else {
              const errorMessage = response.error || "An error occurred during processing";
              setParserError(errorMessage);
              setProcessingOutput(`Error: ${errorMessage}`);
              setProcessingStage("Error");
              LogError(`Document parsing failed: ${response.error}`);
              reject(new Error(response.error));
            }

            // Cleanup
            setProcessing(false);
            setAbortController(null);
            setProcessingProgress(0);
            setProcessingStage("");

            // Remove event listeners
            EventsOff("document-parser-response", handleResponse);
            EventsOff("document-parser-progress", handleProgress);
          }
        };

        const handleProgress = (progress) => {
          if (progress.requestId === requestId) {
            setProcessingProgress(progress.progress || 0);
            setProcessingStage(progress.message || progress.status || "Processing...");
            LogInfo(`Document parsing progress: ${progress.status} - ${progress.message} (${progress.progress}%)`);
          }
        };

        // Handle cancellation
        const handleAbort = () => {
          setParserError("Operation cancelled by user");
          setProcessingOutput("Operation cancelled by user");
          setProcessingStage("Cancelled");
          setProcessing(false);
          setAbortController(null);
          setProcessingProgress(0);
          setProcessingStage("");

          // Remove event listeners
          EventsOff("document-parser-response", handleResponse);
          EventsOff("document-parser-progress", handleProgress);

          reject(new Error("Operation cancelled by user"));
        };

        // Set up abort signal handling
        controller.signal.addEventListener("abort", handleAbort);

        // Register event listeners
        EventsOn("document-parser-response", handleResponse);
        EventsOn("document-parser-progress", handleProgress);

        // Emit the document parser request event
        EventsEmit("document-parser-request", requestData);
      } catch (error) {
        LogError(`Error setting up document parsing request: ${error}`);
        setParserError(error.message);
        setProcessing(false);
        setAbortController(null);
        setProcessingProgress(0);
        setProcessingStage("");
        reject(error);
      }
    });
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