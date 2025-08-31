package main

import (
	"encoding/json"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// DocumentAddEventHandler delegates add-document event setup to the core EventHandler
type DocumentAddEventHandler struct {
	core *EventHandler
}

func NewDocumentAddEventHandler(core *EventHandler) *DocumentAddEventHandler {
	return &DocumentAddEventHandler{core: core}
}

func (h *DocumentAddEventHandler) SetupEventListeners() {
	if h == nil || h.core == nil {
		return
	}
	// Reuse existing implementation on the core handler
	h.core.setupDocumentAddEventListener()
	h.core.setupDocumentProgressEventListeners()
}

func (eh *EventHandler) setupDocumentAddEventListener() {
	if !eh.validateEventHandlerSetup() {
		return
	}

	runtime.EventsOn(eh.app.ctx, EventAddDocumentRequest, func(optionalData ...interface{}) {
		eh.handleAddDocumentEvent(optionalData...)
	})
}

// setupDocumentProgressEventListeners sets up progress-related event listeners
func (eh *EventHandler) setupDocumentProgressEventListeners() {
	if !eh.validateEventHandlerSetup() {
		return
	}

	// Listen for add-document-progress events (if you need to handle progress from frontend)
	runtime.EventsOn(eh.app.ctx, EventAddDocumentProgress, func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-progress event")
		// This is typically used for emitting progress, not listening
		// Add custom logic here if needed
	})

	// Listen for add-document-response events (if you need to handle responses from frontend)
	runtime.EventsOn(eh.app.ctx, EventAddDocumentResponse, func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-response event")
		// This is typically used for emitting responses, not listening
		// Add custom logic here if needed
	})
}

// validateEventHandlerSetup validates the event handler setup prerequisites
func (eh *EventHandler) validateEventHandlerSetup() bool {
	if eh == nil || eh.app == nil {
		return false
	}
	if eh.app.ctx == nil {
		eh.app.log.Error("Application context is nil, cannot setup document add event listener")
		return false
	}
	return true
}

// handleAddDocumentEvent processes the add document event with proper error handling
func (eh *EventHandler) handleAddDocumentEvent(optionalData ...interface{}) {
	defer eh.recoverFromEventPanic("add-document-request")

	eh.app.log.Info(fmt.Sprintf("Received add-document-request event with %d parameters", len(optionalData)))

	if len(optionalData) == 0 {
		eh.app.log.Info("No data received in add-document-request event")
		return
	}

	request, requestID, err := eh.parseAndValidateRequest(optionalData[0])
	if err != nil {
		eh.emitDocumentAddError(requestID, err.Error())
		return
	}

	eh.app.log.Info(fmt.Sprintf("Parsed add request successfully: %+v", request))
	eh.processAddDocumentRequestAsync(request)
}

// parseAndValidateRequest parses the request data and extracts requestID for error handling
func (eh *EventHandler) parseAndValidateRequest(data interface{}) (DocumentAddRequest, string, error) {
	request, err := eh.parseDocumentAddRequest(data)
	if err != nil {
		// Try to extract requestID from raw data for better error correlation
		requestID := eh.extractRequestID(data)
		return DocumentAddRequest{}, requestID, err
	}
	return request, request.RequestID, nil
}

// extractRequestID attempts to extract requestID from raw event data
func (eh *EventHandler) extractRequestID(data interface{}) string {
	if requestData, ok := data.(map[string]interface{}); ok {
		if id, exists := requestData["requestId"]; exists {
			return fmt.Sprintf("%v", id)
		}
	}
	return ""
}

// processAddDocumentRequestAsync processes the request asynchronously with error recovery
func (eh *EventHandler) processAddDocumentRequestAsync(request DocumentAddRequest) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				eh.app.log.Error(fmt.Sprintf("Panic in handleAddDocumentRequest: %v", r))
				eh.emitDocumentAddError(request.RequestID, fmt.Sprintf("Internal error: %v", r))
			}
		}()
		eh.app.handleAddDocumentRequest(request)
	}()
}

// recoverFromEventPanic provides centralized panic recovery for event handlers
func (eh *EventHandler) recoverFromEventPanic(eventName string) {
	if r := recover(); r != nil {
		eh.app.log.Error(fmt.Sprintf("Panic in %s handler: %v", eventName, r))
	}
}

// parseDocumentAddRequest parses and validates document add request data
func (eh *EventHandler) parseDocumentAddRequest(data interface{}) (DocumentAddRequest, error) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		return DocumentAddRequest{}, fmt.Errorf("invalid request data format")
	}

	return eh.marshalToDocumentAddRequest(requestData)
}

// marshalToDocumentAddRequest converts map data to DocumentAddRequest struct
func (eh *EventHandler) marshalToDocumentAddRequest(requestData map[string]interface{}) (DocumentAddRequest, error) {
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		eh.app.log.Info("Failed to marshal add request data: " + err.Error())
		return DocumentAddRequest{}, fmt.Errorf("failed to parse request data: %w", err)
	}

	var request DocumentAddRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		eh.app.log.Info("Failed to unmarshal add request data: " + err.Error())
		return DocumentAddRequest{}, fmt.Errorf("failed to unmarshal request: %w", err)
	}

	fmt.Println(request)
	return request, nil
}

// emitDocumentAddResponse emits a document add response
func (eh *EventHandler) emitDocumentAddResponse(response DocumentAddResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, EventAddDocumentResponse, response)
}

// emitDocumentAddProgress emits document add progress updates
func (eh *EventHandler) emitDocumentAddProgress(progress map[string]interface{}) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document progress: %+v", progress))
	runtime.EventsEmit(eh.app.ctx, EventAddDocumentProgress, progress)
}

// emitDocumentAddError emits a document add error response
func (eh *EventHandler) emitDocumentAddError(requestID, errorMsg string) {
	response := DocumentAddResponse{
		RequestID: requestID,
		Success:   false,
		Error:     errorMsg,
	}
	eh.emitDocumentAddResponse(response)
}

// safeHandleAddDocumentRequest wraps the add document handler with panic recovery
func (eh *EventHandler) safeHandleAddDocumentRequest(request DocumentAddRequest) {
	defer eh.recoverFromPanic("handleAddDocumentRequest", request.RequestID)
	eh.app.handleAddDocumentRequest(request)
}
