package main

import (
	"encoding/json"
	"fmt"
)

// GetDocumentQuestionResponse retrieves question responses for a document
func (app *App) GetDocumentQuestionResponse(documentId string) string {
	responses, err := GetDocumentQuestionResponse(app.appArgs, documentId)
	if err != nil {
		ctx := DocumentQueryErrorCtx
		ctx.TechnicalMsg = fmt.Sprintf("Failed to get document question response for documentId: %s", documentId)
		return HandleError(app.log, ctx, err)
	}

	jsonOutput, err := json.Marshal(responses)
	if err != nil {
		ctx := JSONMarshalErrorCtx
		ctx.TechnicalMsg = fmt.Sprintf("Failed to marshal document responses for documentId: %s, response type: %T", documentId, responses)
		return HandleError(app.log, ctx, err)
	}

	return string(jsonOutput)
}

// SaveDocumentQuestionResponse saves a document question response
func (app *App) SaveDocumentQuestionResponse(payload DocumentQuestionResponse) string {
	result, err := SaveDocumentQuestionResponse(app.appArgs, payload)
	if err != nil {
		ctx := DocumentSaveErrorCtx
		ctx.TechnicalMsg = fmt.Sprintf("Failed to save document question response, payload: %+v", payload)
		return HandleError(app.log, ctx, err)
	}
	return result
}
