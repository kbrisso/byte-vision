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

// safeHandleAddDocumentRequest wraps the add document handler with panic recovery
func (eh *EventHandler) safeHandleAddDocumentRequest(request DocumentAddRequest) {
	defer eh.recoverFromPanic("handleAddDocumentRequest", request.RequestID)

	eh.app.handleAddDocumentRequest(request)
}

func (eh *EventHandler) setupDocumentAddEventListener() {
	// Add validation
	if eh == nil || eh.app == nil {
		return
	}
	// Check if context is valid
	if eh.app.ctx == nil {
		eh.app.log.Error("Application context is nil, cannot setup document add event listener")
		return
	}

	runtime.EventsOn(eh.app.ctx, "add-document-request", func(optionalData ...interface{}) {
		// Add panic recovery
		defer func() {
			if r := recover(); r != nil {
				eh.app.log.Error(fmt.Sprintf("Panic in add-document-request handler: %v", r))
			}
		}()

		eh.app.log.Info(fmt.Sprintf("Received add-document-request event with %d parameters", len(optionalData)))

		if len(optionalData) == 0 {
			eh.app.log.Info("No data received in add-document-request event")
			return
		}

		request, err := eh.parseDocumentAddRequest(optionalData[0])
		if err != nil {
			// Try to extract requestID from raw data for better error correlation
			requestID := ""
			if requestData, ok := optionalData[0].(map[string]interface{}); ok {
				if id, exists := requestData["requestId"]; exists {
					requestID = fmt.Sprintf("%v", id)
				}
			}
			eh.emitDocumentAddError(requestID, err.Error())
			return
		}

		eh.app.log.Info(fmt.Sprintf("Parsed add request successfully: %+v", request))

		// Execute the add document request asynchronously with error recovery
		go func() {
			defer func() {
				if r := recover(); r != nil {
					eh.app.log.Error(fmt.Sprintf("Panic in handleAddDocumentRequest: %v", r))
					eh.emitDocumentAddError(request.RequestID, fmt.Sprintf("Internal error: %v", r))
				}
			}()
			eh.app.handleAddDocumentRequest(request)
		}()
	})
}

// setupDocumentProgressEventListeners sets up progress-related event listeners
func (eh *EventHandler) setupDocumentProgressEventListeners() {
	// Listen for add-document-progress events (if you need to handle progress from frontend)
	runtime.EventsOn(eh.app.ctx, "add-document-progress", func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-progress event")
		// This is typically used for emitting progress, not listening
		// Add custom logic here if needed
	})

	// Listen for add-document-response events (if you need to handle responses from frontend)
	runtime.EventsOn(eh.app.ctx, "add-document-response", func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-response event")
		// This is typically used for emitting responses, not listening
		// Add custom logic here if needed
	})
}

// parseDocumentAddRequest parses and validates document add request data
func (eh *EventHandler) parseDocumentAddRequest(data interface{}) (DocumentAddRequest, error) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		return DocumentAddRequest{}, fmt.Errorf("invalid request data format")
	}

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
func (eh *EventHandler) emitDocumentAddResponse(response DocumentAddResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, "add-document-response", response)
}

func (eh *EventHandler) emitDocumentAddProgress(progress map[string]interface{}) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document progress: %+v", progress))
	runtime.EventsEmit(eh.app.ctx, "add-document-progress", progress)
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
