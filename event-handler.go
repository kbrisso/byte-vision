package main

import (
	"fmt"
)

// Handler type constants for consistent identification

// EventHandler manages all application event listeners
type EventHandler struct {
	app              *App
	docQueryHandler  *DocumentQueryEventHandler
	docAddHandler    *DocumentAddEventHandler
	inferenceHandler *InferenceEventHandler
}

// NewEventHandler creates a new event handler instance
func NewEventHandler(app *App) *EventHandler {
	if app == nil {
		return nil
	}
	eh := &EventHandler{app: app}
	eh.docQueryHandler = NewDocumentQueryEventHandler(eh)
	eh.docAddHandler = NewDocumentAddEventHandler(eh)
	eh.inferenceHandler = NewInferenceEventHandler(eh)
	return eh
}

// SetupAllEventListeners sets up all event listeners for the application
func (eh *EventHandler) SetupAllEventListeners() {
	eh.app.log.Info("Setting up event listeners...")
	eh.docQueryHandler.SetupEventListeners()
	eh.docAddHandler.SetupEventListeners()
	eh.inferenceHandler.SetupEventListeners()
	eh.app.log.Info("Event listeners setup complete")
}

// recoverFromPanic provides consistent panic recovery across all handlers
func (eh *EventHandler) recoverFromPanic(handlerName, requestID string) {
	if r := recover(); r != nil {
		eh.app.log.Error(fmt.Sprintf("Panic in %s: %v", handlerName, r))
		eh.emitErrorResponse(handlerName, requestID, fmt.Sprintf("Internal error: %v", r))
	}
}

// emitErrorResponse centralizes error response emission based on handler type
func (eh *EventHandler) emitErrorResponse(handlerName, requestID, errorMessage string) {
	switch handlerName {
	case DocumentQueryHandler:
		eh.emitDocumentQueryError(requestID, errorMessage)
	case DocumentAddHandler:
		eh.emitDocumentAddError(requestID, errorMessage)
	case InferenceCompletionHandler:
		eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
			RequestID: requestID,
			Success:   false,
			Error:     errorMessage,
		})
	default:
		eh.app.log.Error(fmt.Sprintf("Unhandled error in %s for request %s: %s", handlerName, requestID, errorMessage))
	}
}
