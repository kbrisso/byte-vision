package main

import (
	"bytes"
	"fmt"
	"os"
	"text/template"
)

/*
<｜begin▁of▁sentence｜>{system_prompt}<｜User｜>{prompt}<｜Assistant｜>
/*DeepSeek prompt
<｜User｜>What is 1+1?<｜Assistant｜>
*/
var instDeepSeekTemplate = Template{"{{.InstStart }}{{.Input }}{{.InstEnd }}"}
var instDeepSeekPrompt = InstPrompt{
	InstStart: "<｜begin_of_sentence｜>\r\n User: ",
	Input:     "",
	InstEnd:   "Assistant: \r\n<｜end_of_sentence｜>",
}

/*
Llama 2
<s>[INST] <<SYS>>
{{ system_prompt }}
<</SYS>>
{{ user_message }} [/INST]
*/
var instTemplate = Template{"{{.InstStart }}{{.Input }}{{.InstEnd }}"}
var instPrompt = InstPrompt{
	InstStart: " [INST]\r\n",
	Input:     "",
	InstEnd:   "[/INST]\r\n",
}

/*
	System, User Assistant prompt

System You are a helpful AI assistant
User
Input
Assistant
*/
var systemTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var systemPrompt = SystemPrompt{
	SystemPrompt:    "System You are a helpful AI assistant.\r\n",
	UserPrompt:      "User\r\n",
	Input:           "",
	AssistantPrompt: "Assistant\r\n",
}

/*
LLama 3
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{{ system_prompt }}<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ user_msg_1 }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
{{ model_answer_1 }}<|eot_id|>
*/
var llamaTemplate = Template{"{{.SystemPrompt }}{{.UserPrompt }}{{.Input }}{{.AssistantPrompt }}"}
var llamaPrompt = SystemPrompt{
	SystemPrompt:    "<|begin_of_text|><|start_header_id|><|end_header_id|>You are a helpful AI assistant.<|eot_id|>\r\n",
	UserPrompt:      "<|start_header_id|>User<|end_header_id|>\r\n",
	Input:           "",
	AssistantPrompt: "<|eot_id|><|start_header_id|>Assistant<|end_header_id|>\r\n",
}

// CreateSystemUserTemplate generates a formatted string by applying the input and SystemPrompt data to the provided template.
// Returns the generated string or an error if template parsing or execution fails.
func CreateSystemUserTemplate(systemPrompt SystemPrompt, systemTemplate Template, input string) (string, error) {
	tmpl, err := template.New("systemTemplate").Parse(systemTemplate.Text)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateSystemUserTemplate: %w", err)
	}
	//Pass input string to prompt
	systemPrompt.Input = input
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, systemPrompt)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateSystemUserTemplate: %w", err)
	}
	return doc.String(), nil
}

// CreateInstTemplate constructs a string by applying input and prompts to a predefined template.
// It returns the rendered template or an error on failure.
// Parameters: instPrompt (InstPrompt), instTemplate (Template), input (string).
// Errors: template parsing or execution errors.
func CreateInstTemplate(instPrompt InstPrompt, instTemplate Template, input string) (string, error) {
	tmpl, err := template.New("systemTemplate").Parse(instTemplate.Text)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateInstTemplate: %w", err)
	}
	//Pas input string to prompt
	instPrompt.Input = input
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, instPrompt)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateInstTemplate: %w", err)
	}
	return doc.String(), nil
}

// CreateReportTemplateWithMetadata generates a formatted report template string using template and report data files.
// It reads the specified template and report data files, processes their contents, and combines them into a structure.
// The function returns the rendered template string, or an error if an issue occurs during file operations or processing.
func CreateReportTemplateWithMetadata(reportTemplatePath string, reportDataPath string) (string, error) {
	//Open the template file
	templateFile, err := os.Open(AppArgs.PromptTemplateFolderName + reportTemplatePath)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}
	tempStat, _ := os.Stat(AppArgs.PromptTemplateFolderName + reportTemplatePath)
	tempSize := tempStat.Size()
	//Open the data file
	dataFile, err := os.Open(AppArgs.ReportDataPath + reportDataPath)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}
	tempStat, _ = os.Stat(AppArgs.ReportDataPath + reportDataPath)
	dataSize := tempStat.Size()
	defer func(templateFile *os.File) {
		err := templateFile.Close()
		if err != nil {
			Log.Error(err.Error())
			return
		}
	}(templateFile)
	defer func(dataFile *os.File) {
		err := dataFile.Close()
		if err != nil {
			Log.Error(err.Error())
			return
		}
	}(dataFile)

	// Step 2: Read the file content
	templateContent := make([]byte, tempSize)    // Example buffer size
	n, err := templateFile.Read(templateContent) // Read the file into the buffer
	if err != nil && err.Error() != "EOF" {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}
	dataContent := make([]byte, dataSize) // Example buffer size
	d, err := dataFile.Read(dataContent)  // Read the file into the buffer
	if err != nil && err.Error() != "EOF" {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}

	content := string(templateContent[:n]) // Convert the content into a string
	data := string(dataContent[:d])

	//Build  a string template
	reportTemplateStr := "{{.SystemPrompt }}{{.UserPrompt }}{{.ReportDate }}{{.ReportTemplate }}{{.AssistantPrompt }}"

	//Parse and execute the new template
	tmpl, err := template.New("reportTemplateStr").Parse(reportTemplateStr)
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}
	//Create final template string
	out := ReportPromptTemplate{
		SystemPrompt:    "",
		UserPrompt:      "user Step 1. With the report data provided create a report sorted by field lastName alphabetically. Step 2 Format the report using the template instructions as a guide.\r\n",
		ReportTemplate:  "# Instructions:\r\n" + content,
		ReportDate:      "# Report data:\r\n" + data + "\r\n",
		AssistantPrompt: "assistant\r\n",
	}

	//Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template out to stdout
	if err != nil {
		Log.Error(err.Error())
		return "", fmt.Errorf("error in CreateReportTemplateWithMetadata: %w", err)
	}
	return doc.String(), nil
}
