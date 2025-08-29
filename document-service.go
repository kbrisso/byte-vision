package main

import (
	"encoding/json"
)

// GetDocumentQuestionResponse retrieves question responses for a document
func (app *App) GetDocumentQuestionResponse(documentId string) string {
	responses, err := GetDocumentQuestionResponse(app.appArgs, documentId)
	if err != nil {
		app.log.Error("Failed to get document question response: " + err.Error())
		return err.Error()
	}

	jsonOutput, err := json.Marshal(responses)
	if err != nil {
		app.log.Error("Failed to marshal document responses: " + err.Error())
		return err.Error()
	}

	return string(jsonOutput)
}

// SaveDocumentQuestionResponse saves a document question response
func (app *App) SaveDocumentQuestionResponse(payload DocumentQuestionResponse) string {
	result, err := SaveDocumentQuestionResponse(app.appArgs, payload)
	if err != nil {
		app.log.Error("Failed to save document question response: " + err.Error())
		return err.Error()
	}
	return string(result)
}
