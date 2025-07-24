import { useCallback, useEffect, useRef, useState } from "react";
import generateUniqueId from "generate-unique-id";

import { EventsEmit, EventsOff, EventsOn, LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import { CancelProcess } from "../wailsjs/go/main/App.js";

export const useDocumentQuery = ({ addMessageToChat, loadDocumentHistory }) => {
  const [progressMessage, setProgressMessage] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [abortController, setAbortController] = useState(null);

  // Use refs to avoid stale closures
  const currentRequestIdRef = useRef(null);
  const progressMessageRef = useRef(null);
  const eventListenersRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    currentRequestIdRef.current = currentRequestId;
  }, [currentRequestId]);

  useEffect(() => {
    progressMessageRef.current = progressMessage;
  }, [progressMessage]);

  useEffect(() => {
    abortControllerRef.current = abortController;
  }, [abortController]);

  const cleanup = useCallback(() => {
    // Remove event listeners
    if (eventListenersRef.current) {
      EventsOff("query-document-progress");
      EventsOff("query-document-response");
      eventListenersRef.current = false;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        LogError("Error aborting request:", error);
      }
      abortControllerRef.current = null;
    }

    // Reset state
    setProgressMessage(null);
    setCurrentRequestId(null);
    setIsProcessing(false);
    setAbortController(null);
  }, []); // No dependencies to avoid stale closures

  const handleProgress = useCallback((data) => {
    LogInfo("Progress event received:", data);

    // Use ref to get current request ID to avoid stale closure
    if (data.requestId === currentRequestIdRef.current && data.status) {
      setProgressMessage(prev => ({
        ...prev,
        progress: data.progress,
        message: data.message,
        details: data.details || prev?.details,
        lastUpdate: Date.now(),
      }));
    }
  }, []); // No dependencies to avoid stale closures

  const handleResponse = useCallback((data) => {
    LogInfo("Response event received:", data);

    // Use ref to get current request ID to avoid stale closure
    if (data.requestId !== currentRequestIdRef.current) {
      LogInfo("Ignoring response for different request ID");
      return;
    }

    // Calculate processing time using ref to avoid stale closure
    const processTime = progressMessageRef.current?.startTime
        ? Date.now() - progressMessageRef.current.startTime
        : 0;

    // Cleanup before processing response to avoid race conditions
    cleanup();

    if (data.success) {
      addMessageToChat("assistant", data.result, false, data.processingTime || processTime);
      // Use a more reasonable delay and add error boundary
      setTimeout(() => {
        loadDocumentHistory().catch(error => {
          LogError("Failed to reload document history:", error);
        });
      }, 500);
    } else {
      const errorMessage = data.error || "An error occurred while processing your question.";
      addMessageToChat("system", errorMessage, false);
      LogError(`Query failed: ${data.error}`);
    }
  }, [cleanup, addMessageToChat, loadDocumentHistory]);

  const handleCancel = useCallback(async () => {
    if (!isProcessing && !abortControllerRef.current) {
      LogInfo("No active request to cancel");
      return;
    }

    try {
      // Abort the client-side request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cancel backend process
      await CancelProcess();
      LogInfo("Query cancelled by user");
      addMessageToChat("system", "Query was cancelled by user");
    } catch (error) {
      LogError("Failed to cancel backend process:", error);
      // Still show user message even if backend cancel fails
      addMessageToChat("system", "Query cancellation requested");
    } finally {
      cleanup();
    }
  }, [isProcessing, cleanup, addMessageToChat]);

  const submitQuery = useCallback(async (queryData) => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      const requestId = generateUniqueId();
      const startTime = Date.now();

      // Set up state
      setCurrentRequestId(requestId);
      setIsProcessing(true);

      setProgressMessage({
        progress: 0,
        message: "Initializing query...",
        startTime,
        requestId,
      });

      // Set up event listeners only once
      if (!eventListenersRef.current) {
        EventsOn("query-document-progress", handleProgress);
        EventsOn("query-document-response", handleResponse);
        eventListenersRef.current = true;
      }

      // Check if request was aborted before emission
      if (newAbortController.signal.aborted) {
        throw new Error("Request was aborted before submission");
      }

      // Emit the request
      EventsEmit("query-document-request", {
        ...queryData,
        requestId,
      });

      LogInfo(`Query submitted with request ID: ${requestId}`);

    } catch (error) {
      LogError("Query submission error:", error);
      cleanup();

      if (error.name === "AbortError" || error.message.includes("aborted")) {
        LogInfo("Query was cancelled during submission");
        addMessageToChat("system", "Query was cancelled");
      } else {
        LogError(`Question failed: ${error}`);
        addMessageToChat("system", "Sorry, I encountered an error. Please try again.");
      }
      throw error; // Re-throw to allow caller to handle
    }
  }, [handleProgress, handleResponse, cleanup, addMessageToChat]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    progressMessage,
    isProcessing,
    submitQuery,
    handleCancel,
  };
};