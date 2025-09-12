package main

import (
	"fmt"
	"runtime"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

// ErrorContext holds context information for error handling
type ErrorContext struct {
	Operation    string
	UserMessage  string
	TechnicalMsg string
}

// HandleError logs detailed error information and returns a user-friendly message
func HandleError(log logger.Logger, ctx ErrorContext, err error) string {
	// Get caller information
	pc, file, line, ok := runtime.Caller(1)
	var callerInfo string
	if ok {
		fn := runtime.FuncForPC(pc)
		funcName := "unknown"
		if fn != nil {
			// Extract just the function name from the full path
			parts := strings.Split(fn.Name(), ".")
			if len(parts) > 0 {
				funcName = parts[len(parts)-1]
			}
		}
		// Extract just the filename from the full path
		fileParts := strings.Split(file, "/")
		fileName := fileParts[len(fileParts)-1]
		callerInfo = fmt.Sprintf("%s:%d in %s()", fileName, line, funcName)
	} else {
		callerInfo = "unknown location"
	}

	// Log detailed technical information
	logMsg := fmt.Sprintf("[%s] %s | Location: %s | Error: %v",
		ctx.Operation, ctx.TechnicalMsg, callerInfo, err)
	log.Error(logMsg)

	// Return user-friendly message
	if ctx.UserMessage != "" {
		return ctx.UserMessage
	}
	return "An error occurred while processing your request. Please try again."
}

// HandleErrorWithStackTrace logs error with full stack trace for critical errors
func HandleErrorWithStackTrace(log logger.Logger, ctx ErrorContext, err error) string {
	// Get stack trace
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false)
	stackTrace := string(buf[:n])

	// Get immediate caller info
	pc, file, line, ok := runtime.Caller(1)
	var callerInfo string
	if ok {
		fn := runtime.FuncForPC(pc)
		funcName := "unknown"
		if fn != nil {
			parts := strings.Split(fn.Name(), ".")
			if len(parts) > 0 {
				funcName = parts[len(parts)-1]
			}
		}
		fileParts := strings.Split(file, "/")
		fileName := fileParts[len(fileParts)-1]
		callerInfo = fmt.Sprintf("%s:%d in %s()", fileName, line, funcName)
	}

	// Log with stack trace
	logMsg := fmt.Sprintf("[CRITICAL-%s] %s | Location: %s | Error: %v | Stack Trace:\n%s",
		ctx.Operation, ctx.TechnicalMsg, callerInfo, err, stackTrace)
	log.Error(logMsg)

	// Return user-friendly message
	if ctx.UserMessage != "" {
		return ctx.UserMessage
	}
	return "A critical error occurred. Please contact support if this problem persists."
}

// LogAndReturnError is a quick helper for simple error handling
func LogAndReturnError(log logger.Logger, operation, userMsg, technicalMsg string, err error) string {
	ctx := ErrorContext{
		Operation:    operation,
		UserMessage:  userMsg,
		TechnicalMsg: technicalMsg,
	}
	return HandleError(log, ctx, err)
}

// RecoverFromPanic handles panics and logs them appropriately
func RecoverFromPanic(log logger.Logger, operation string) string {
	if r := recover(); r != nil {
		buf := make([]byte, 4096)
		n := runtime.Stack(buf, false)
		stackTrace := string(buf[:n])

		logMsg := fmt.Sprintf("[PANIC-%s] Panic recovered: %v | Stack Trace:\n%s",
			operation, r, stackTrace)
		log.Error(logMsg)

		return "An unexpected error occurred. The operation has been safely recovered."
	}
	return ""
}

// SafeExecute wraps function execution with panic recovery
func SafeExecute(log logger.Logger, operation string, fn func() string) string {
	defer func() {
		if msg := RecoverFromPanic(log, operation); msg != "" {
			// Panic was recovered, message is already logged
		}
	}()

	return fn()
}

// WrapError wraps an error with additional context
func WrapError(operation, message string, err error) error {
	return fmt.Errorf("[%s] %s: %w", operation, message, err)
}

// Common error contexts for reuse
var (
	DocumentQueryErrorCtx = ErrorContext{
		Operation:   "DOCUMENT_QUERY",
		UserMessage: "Unable to retrieve document information. Please check if the document exists and try again.",
	}

	DocumentSaveErrorCtx = ErrorContext{
		Operation:   "DOCUMENT_SAVE",
		UserMessage: "Failed to save document response. Your query was processed but couldn't be saved.",
	}

	JSONMarshalErrorCtx = ErrorContext{
		Operation:   "JSON_MARSHAL",
		UserMessage: "Unable to format response data. The information was retrieved but couldn't be displayed properly.",
	}
)
