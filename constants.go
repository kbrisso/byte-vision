package main

import "time"

const (
	DocumentQueryHandler       = "handleQueryDocumentRequest"
	DocumentAddHandler         = "handleAddDocumentRequest"
	InferenceCompletionHandler = "handleInferenceCompletionRequest"
)

const (
	EventAddDocumentRequest  = "add-document-request"
	EventAddDocumentProgress = "add-document-progress"
	EventAddDocumentResponse = "add-document-response"
)

const (
	EventQueryDocumentRequest  = "query-document-request"
	EventQueryDocumentProgress = "query-document-progress"
	EventQueryDocumentResponse = "query-document-response"

	// Progress status constants
	ProgressStatusStarting   = "starting"
	ProgressStatusProcessing = "processing"

	// Progress messages
	MessageStarting   = "Starting document query..."
	MessageProcessing = "Processing document query..."

	// Progress percentages
	ProgressInitial = 5

	// Error messages
	ErrorNoDataReceived          = "No data received in query-document-request event"
	ErrorFailedCreateHandler     = "Failed to create event handler"
	ErrorRequestValidationFailed = "Request validation failed: "
	ErrorFailedConvertCLI        = "Failed to convert CLI args: "
	ErrorFailedConvertEmbed      = "Failed to convert embed args: "
	ErrorFailedMarshalRequest    = "Failed to marshal request data: "
	ErrorFailedUnmarshalRequest  = "Failed to unmarshal request data: "
	ErrorFailedParseRequest      = "failed to parse request data: %w"
	ErrorFailedUnmarshalData     = "failed to unmarshal request: %w"
	ErrorFailedConvertCLIArgs    = "failed to convert CLI arguments: %w"
	ErrorFailedConvertEmbedArgs  = "failed to convert embedding arguments: %w"
	ErrorInternalError           = "Internal error: %v"
	ErrorPanicInHandler          = "Panic in handleQueryDocumentRequest: %v"

	// Log message formats
	LogReceivedRequest     = "Received query-document-request event with %d parameters"
	LogParsedSuccessfully  = "Parsed request successfully: %+v"
	LogEmittingProgress    = "Emitting progress: %+v"
	LogEmittingResponse    = "Emitting response: %+v"
	LogCallingQueryElastic = "Calling QueryElasticDocument with converted arguments for request: %s"
	LogRequestCompleted    = "Document query request %s completed in %dms"

	// Handler name constant
	HandlerNameQueryDocument = "handleQueryDocumentRequest"

	// Sleep duration
	CompletionSleepDuration = 25 * time.Millisecond
)
const (
	EventInferenceCompletionRequest  = "inference-completion-request"
	EventInferenceCompletionResponse = "inference-completion-response"
	EventInferenceCompletionProgress = "inference-completion-progress"
)

// Constants for progress statuses
const (
	StatusStarting   = "starting"
	StatusProcessing = "processing"
	StatusGenerating = "generating"
	StatusSaving     = "saving"
	StatusFinalizing = "finalizing"
	StatusCompleted  = "completed"
)

// Constants for progress messages
const (
	MessageStartingInference    = "Starting inference completion..."
	MessageProcessingInference  = "Processing inference completion..."
	MessageProcessingPrompt     = "Processing prompt..."
	MessageGeneratingCompletion = "Generating completion..."
	MessageSavingCompletion     = "Saving completion..."
	MessageFinalizingResponse   = "Finalizing response..."
	MessageProcessingComplete   = "Processing complete"
)

// Constants for progress percentages
const (
	ProgressStart      = 5
	ProgressProcessing = 10
	ProgressPrompt     = 20
	ProgressGenerating = 50
	ProgressSaving     = 80
	ProgressFinalizing = 95
	ProgressComplete   = 100
)

// Constants for error messages and general strings
const (
	ErrorInvalidRequestFormat     = "invalid request data format"
	ErrorOperationCancelledByUser = "Operation cancelled by user"
	ErrorPrefix                   = "Error: "
	LogSettingUpInferenceListener = "Setting up inference event listener..."
	LogInferenceListenerComplete  = "Inference event listener setup complete"
	LogCompletionCancelledByUser  = "Completion generation was cancelled by user"
	LogFailedToHandlePromptType   = "Failed to handle prompt type: "
	LogFailedToGenerateCompletion = "Failed to generate completion: "
	LogFailedToSaveCompletion     = "Failed to save completion: "
	LogEventHandlerNil            = "EventHandler is nil in safeHandleInferenceCompletionRequest\n"
	PromptFilePrefix              = "prompt"
)

// Constants for delays and timing
const (
	ProgressUIDelay = 25 * time.Millisecond
)
