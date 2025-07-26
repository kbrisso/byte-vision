package main

import (
	"bytes"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"text/template"
)

type PromptData interface {
	SetInput(input string)
}

// SystemPrompt represents a system-user-assistant prompt structure
type SystemPrompt struct {
	SystemPrompt    string
	UserPrompt      string
	Input           string
	AssistantPrompt string
}

// SetInput implements the PromptData interface
func (sp *SystemPrompt) SetInput(input string) {
	sp.Input = input
}

// InstPrompt represents an instruction-based prompt structure
type InstPrompt struct {
	InstStart string
	Input     string
	InstEnd   string
}

// SetInput implements the PromptData interface
func (ip *InstPrompt) SetInput(input string) {
	ip.Input = input
}

// PromptConfig holds template and data for a specific prompt type
type PromptConfig struct {
	Template string
	Data     PromptData
}

// PromptRegistry manages all prompt configurations
type PromptRegistry struct {
	configs map[string]PromptConfig
}

// NewPromptRegistry creates a new registry with all prompt configurations
func NewPromptRegistry() *PromptRegistry {
	registry := &PromptRegistry{
		configs: make(map[string]PromptConfig),
	}

	// Register all prompt configurations
	registry.registerPrompts()
	return registry
}

func (pr *PromptRegistry) registerPrompts() {
	systemTemplate := "{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"
	instTemplate := "{{.InstStart }}{{.Input }}{{.InstEnd }}"

	pr.configs = map[string]PromptConfig{
		"LLAMA2": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<<SYS>>\nYou're are a helpful Assistant, and you only response to the \"Assistant\"\nRemember, maintain a natural tone. Be precise, concise, and casual. Keep it short\r\n<</SYS>>\r\n",
				UserPrompt:      " [INST] User:\r\n",
				AssistantPrompt: "[/INST] Assistant:\r\n",
			},
		},
		"LLAMA3": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<|begin_of_text|><|start_header_id|><|end_header_id|>You're a helpful AI assistant.<|eot_id|>\r\n",
				UserPrompt:      "<|start_header_id|>User<|end_header_id|>\r\n",
				AssistantPrompt: "<|eot_id|><|start_header_id|>Assistant<|end_header_id|>\r\n",
			},
		},
		"SystemUserAssistant": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "System You're a helpful AI assistant. \r\n",
				UserPrompt:      "User \r\n",
				AssistantPrompt: "Assistant \r\n",
			},
		},
		"UserAssistantDeepSeek": {
			Template: instTemplate,
			Data: &InstPrompt{
				InstStart: "<｜User｜>",
				InstEnd:   "<｜Assistant｜>\n<think>\n</think>\n",
			},
		},
		"Qwen3": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<|im_start|>system\r\nYou're a helpful AI assistant.<|im_end|>\r\n",
				UserPrompt:      "<|im_start|>user\r\n",
				AssistantPrompt: "<|im_end|>\r\n<|im_start|>assistant\r\n<think>\n</think>\n",
			},
		},
		"Granite": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<|start_of_role|>system<|end_of_role|>You're a helpful AI assistant.<|end_of_text|>\r\n",
				UserPrompt:      "<|start_of_role|>user<|end_of_role|> \r\n",
				AssistantPrompt: "<|end_of_text|>\r\n<|start_of_role|>assistant<|end_of_role|> \r\n",
			},
		},
		"FreeForm": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "",
				UserPrompt:      "",
				AssistantPrompt: "\r\n",
			},
		},
	}
}

// GetConfig returns the prompt configuration for a given type
func (pr *PromptRegistry) GetConfig(promptType string) (PromptConfig, bool) {
	config, exists := pr.configs[promptType]
	return config, exists
}

// GetDefaultConfig returns the default prompt configuration
func (pr *PromptRegistry) GetDefaultConfig() PromptConfig {
	return pr.configs["SystemUserAssistant"]
}

// Global registry instance
var promptRegistry = NewPromptRegistry()

// TemplateProcessor handles template parsing and execution
type TemplateProcessor struct {
	logger logger.Logger
}

// NewTemplateProcessor creates a new template processor
func NewTemplateProcessor(log logger.Logger) *TemplateProcessor {
	return &TemplateProcessor{logger: log}
}

// Process processes a template with the given data and input
func (tp *TemplateProcessor) Process(templateText string, data PromptData, input string) (string, error) {
	// Create a copy of the data to avoid modifying the original
	dataCopy := tp.copyPromptData(data)
	dataCopy.SetInput(input)

	tmpl, err := template.New("promptTemplate").Parse(templateText)
	if err != nil {
		tp.logger.Error(fmt.Sprintf("Template parsing error: %v", err))
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buffer bytes.Buffer
	if err := tmpl.Execute(&buffer, dataCopy); err != nil {
		tp.logger.Error(fmt.Sprintf("Template execution error: %v", err))
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buffer.String(), nil
}

// copyPromptData creates a copy of PromptData to avoid modifying the original
func (tp *TemplateProcessor) copyPromptData(data PromptData) PromptData {
	switch v := data.(type) {
	case *SystemPrompt:
		return &SystemPrompt{
			SystemPrompt:    v.SystemPrompt,
			UserPrompt:      v.UserPrompt,
			Input:           v.Input,
			AssistantPrompt: v.AssistantPrompt,
		}
	case *InstPrompt:
		return &InstPrompt{
			InstStart: v.InstStart,
			Input:     v.Input,
			InstEnd:   v.InstEnd,
		}
	default:
		return data // Fallback for unknown types
	}
}

// HandlePromptType manages prompt creation based on type using the registry approach
func HandlePromptType(log logger.Logger, promptType string, promptText string) (string, error) {
	processor := NewTemplateProcessor(log)

	config, exists := promptRegistry.GetConfig(promptType)
	if !exists {
		// Use default configuration for unknown types
		config = promptRegistry.GetDefaultConfig()
		log.Debug(fmt.Sprintf("Unknown prompt type '%s', using default configuration", promptType))
	}

	return processor.Process(config.Template, config.Data, promptText)
}

// Template struct for backward compatibility
type Template struct {
	Text string
}

// CreateTemplate Legacy function for backward compatibility
func CreateTemplate(log logger.Logger, data PromptData, tmpl Template, input string) (string, error) {
	processor := NewTemplateProcessor(log)
	return processor.Process(tmpl.Text, data, input)
}
