package main

import (
	"bytes"
	"fmt"
	"text/template"

	"github.com/wailsapp/wails/v2/pkg/logger"
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

// UserPrompt represents an instruction-based prompt structure
type UserPrompt struct {
	UserStart string
	Input     string
	UserEnd   string
}

// SetInput implements the PromptData interface
func (ip *UserPrompt) SetInput(input string) {
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

func NewGPTOSSPrompt(systemInstruction, assistantChannel string) *UserPrompt {
	return &UserPrompt{
		// System instruction + assistant channel + user message preamble
		UserStart: "<|start|>system<|message|>" +
			systemInstruction +
			"<|end|><|start|>assistant<|channel|>" +
			assistantChannel +
			"<|start|>user<|message|>",
		// Close the user message, and open assistant turn
		UserEnd: "<|end|><|start|>assistant",
	}
}
func (pr *PromptRegistry) registerPrompts() {
	systemTemplate := "{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"
	instTemplate := "{{.UserStart }}{{.Input }}{{.UserEnd }}"

	pr.configs = map[string]PromptConfig{
		"Mistral": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "",
				UserPrompt:      "<s>[INST]You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\nPlease follow these instructions:\n\r\n",
				AssistantPrompt: "[/INST]\r\n",
			},
		},
		"LLAMA3": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<|begin_of_text|><|start_header_id|><|end_header_id|>You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\nPlease follow these instructions:\n<|eot_id|>\n",
				UserPrompt:      "<|start_header_id|>User<|end_header_id|>\r\n",
				AssistantPrompt: "<|eot_id|><|start_header_id|>Assistant<|end_header_id|>\r\n",
			},
		},
		"SystemUserAssistant": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "System You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\n Please follow these instructions:\n",
				UserPrompt:      "User\n",
				AssistantPrompt: "Assistant\n",
			},
		},
		"UserAssistantDeepSeek": {
			Template: instTemplate,
			Data: &UserPrompt{
				UserStart: "<｜User｜>",
				UserEnd:   "<｜Assistant｜>\n<think>\n</think>\n",
			},
		},
		"Qwen3": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "",
				UserPrompt:      "<|im_start|>\nuser You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\nPlease follow these instructions:\n",
				AssistantPrompt: "<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n",
			},
		},
		"Granite": {
			Template: systemTemplate,
			Data: &SystemPrompt{
				SystemPrompt:    "<|start_of_role|>system<|end_of_role|>You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\nPlease follow these instructions:\n<|end_of_text|>\r\n",
				UserPrompt:      "<|start_of_role|>user<|end_of_role|> \n",
				AssistantPrompt: "<|end_of_text|>\n<|start_of_role|>assistant<|end_of_role|>\n",
			},
		},
		"Gemma": {
			Template: instTemplate,
			Data: &UserPrompt{
				UserStart: "<start_of_turn>user You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.\nPlease follow these instructions:\n",
				UserEnd:   "<end_of_turn>\n<start_of_turn>model\n",
			},
		},
		//<|start|>system<|message|>You are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2024-06\nCurrent date: 2025-08-05\n\nReasoning: medium\n\n# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|><|start|>user<|message|>Hello<|end|><|start|>assistant<|channel|>final<|message|>Hi there!<|end|><|start|>user<|message|>What is 1+1?<|end|><|start|>assistant
		"GPTOSS": {
			Template: instTemplate,
			Data: NewGPTOSSPrompt(
				"You are a professional research analyst. Please format output as markdown text, don't include the markdown``` avoid excessive formatting that distracts from content.",
				"final",
			),
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
	case *UserPrompt:
		return &UserPrompt{
			UserStart: v.UserStart,
			Input:     v.Input,
			UserEnd:   v.UserEnd,
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
