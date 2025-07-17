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

var graniteSystemTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var graniteSystemPrompt = SystemPrompt{
	SystemPrompt:    "<|start_of_role|>system<|end_of_role|>You're a helpful AI assistant.<|end_of_text|>\r\n",
	UserPrompt:      "<|start_of_role|>user<|end_of_role|> \r\n",
	Input:           "",
	AssistantPrompt: "<|end_of_text|>\r\n<|start_of_role|>assistant<|end_of_role|> \r\n",
}

var instDeepSeekTemplate = Template{"{{.InstStart }}{{.Input }}{{.InstEnd }}"}
var instDeepSeekPrompt = InstPrompt{
	InstStart: "<｜User｜>",
	Input:     "",
	InstEnd:   "<｜Assistant｜>\n<think>\n</think>\n",
}

var instTemplate = Template{"{{.InstStart }}{{.Input }}{{.InstEnd }}"}
var instPrompt = InstPrompt{
	InstStart: " [INST]\r\n",
	Input:     "",
	InstEnd:   "[/INST]\r\n",
}

var assistInstTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var assistInstPrompt = SystemPrompt{
	SystemPrompt:    "<<SYS>>\nYou're are a helpful Assistant, and you only response to the \"Assistant\"\nRemember, maintain a natural tone. Be precise, concise, and casual. Keep it short\r\n<</SYS>>\r\n",
	UserPrompt:      " [INST] User:\r\n",
	Input:           "",
	AssistantPrompt: "[/INST] Assistant:\r\n",
}

var systemTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var systemPrompt = SystemPrompt{
	SystemPrompt:    "System You're a helpful AI assistant. \r\n",
	UserPrompt:      "User \r\n",
	Input:           "",
	AssistantPrompt: "Assistant \r\n",
}

var llamaTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var llamaPrompt = SystemPrompt{
	SystemPrompt:    "<|begin_of_text|><|start_header_id|><|end_header_id|>You're a helpful AI assistant.<|eot_id|>\r\n",
	UserPrompt:      "<|start_header_id|>User<|end_header_id|>\r\n",
	Input:           "",
	AssistantPrompt: "<|eot_id|><|start_header_id|>Assistant<|end_header_id|>\r\n",
}

var qwenTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var qwenPrompt = SystemPrompt{
	SystemPrompt:    "<|im_start|>system\r\nYou're a helpful AI assistant.<|im_end|>\r\n",
	UserPrompt:      "|im_start|>user\r\n",
	Input:           "",
	AssistantPrompt: "<|im_end|>\r\n<|im_start|>assistant\r\n<think>\n</think>\n",
}
var noTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var noPrompt = SystemPrompt{
	SystemPrompt:    "",
	UserPrompt:      "",
	Input:           "",
	AssistantPrompt: "\r\n",
}

func (sp *SystemPrompt) SetInput(input string) {
	sp.Input = input
}

func (ip *InstPrompt) SetInput(input string) {
	ip.Input = input
}

// HandlePromptType manages prompt creation based on type
func HandlePromptType(log logger.Logger, promptType string, promptText string) (string, error) {
	switch promptType {
	case "LLAMA2":
		return CreateTemplate(log, &assistInstPrompt, assistInstTemplate, promptText)
	case "LLAMA3":
		return CreateTemplate(log, &llamaPrompt, llamaTemplate, promptText)
	case "SystemUserAssistant":
		return CreateTemplate(log, &systemPrompt, systemTemplate, promptText)
	case "UserAssistantDeepSeek":
		return CreateTemplate(log, &instDeepSeekPrompt, instDeepSeekTemplate, promptText)
	case "Qwen3":
		return CreateTemplate(log, &qwenPrompt, qwenTemplate, promptText)
	case "Granite":
		return CreateTemplate(log, &graniteSystemPrompt, graniteSystemTemplate, promptText)
	case "FreeForm":
		return CreateTemplate(log, &noPrompt, noTemplate, promptText)
	default:
		return CreateTemplate(log, &systemPrompt, systemTemplate, promptText)
	}
}

// CreateTemplate is a reusable template processing function
func CreateTemplate(log logger.Logger, data PromptData, tmpl Template, input string) (string, error) {
	data.SetInput(input)

	tmplParsed, err := template.New("promptTemplate").Parse(tmpl.Text)
	if err != nil {
		log.Error(err.Error())
		return "", fmt.Errorf("error in CreateTemplate: %w", err)
	}

	var doc bytes.Buffer
	if err = tmplParsed.Execute(&doc, data); err != nil {
		log.Error(err.Error())
		return "", fmt.Errorf("error in CreateTemplate: %w", err)
	}

	return doc.String(), nil
}
