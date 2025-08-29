package main

import (
	"fmt"
)

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
		// Emit appropriate error response based on handler type
		switch handlerName {
		case "handleQueryDocumentRequest":
			eh.emitDocumentQueryError(requestID, fmt.Sprintf("Internal error: %v", r))
		case "handleAddDocumentRequest":
			eh.emitDocumentAddError(requestID, fmt.Sprintf("Internal error: %v", r))
		case "handleInferenceCompletionRequest":
			eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
				RequestID: requestID,
				Success:   false,
				Error:     fmt.Sprintf("Internal error: %v", r),
			})
		default:
			eh.app.log.Error(fmt.Sprintf("Unhandled panic in %s for request %s: %v", handlerName, requestID, r))
		}
	}
}
