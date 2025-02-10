package main

import (
	"bytes"
	"fmt"
	"os"
	"text/template"
)

// Package chat provides a chat prompt template.
// Sometimes you need to define a chat prompt, this package provides a way to do that.

func CreateSystemUserTemplate(input string) string {

	templateStr := "{{.SystemPrompt }}{{.UserPrompt }}{{.Question }}{{.AssistantPrompt }}"

	tmpl, err := template.New("templateStr").Parse(templateStr)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return ""
	}
	out := PromptTemplate{
		SystemPrompt:    "system You are a smart AI assistant. You will give factual answers. \r\n",
		UserPrompt:      " user ",
		Question:        input + "\r\n",
		AssistantPrompt: "assistant \r\n",
	}

	// Step 5: Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template to stdout
	if err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return ""
	}
	bytes1 := []byte(doc.String())
	fmt.Printf("Bytes (Method 1): %v\n", len(bytes1))
	return doc.String()
}
func CreateMathTemplate(input string) string {

	templateStr := "{{.SystemPrompt }}{{.Question }}{{.AssistantPrompt }}"

	tmpl, err := template.New("templateStr").Parse(templateStr)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return ""
	}
	out := PromptTemplate{
		SystemPrompt:    "Below is an instruction that describes a task. Write a response that appropriately completes the request.\r\n",
		Question:        "### Instruction: \r\n" + input + "\r\n",
		AssistantPrompt: "### Response:\r\n",
	}

	// Step 5: Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template to stdout
	if err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return ""
	}
	return doc.String()
}
func CreateLlamaTemplate(input string) string {

	templateStr := "{{.SystemPrompt }}{{.UserPrompt }}{{.Question }}{{.AssistantPrompt }}"

	tmpl, err := template.New("templateStr").Parse(templateStr)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return ""
	}
	out := PromptTemplate{
		SystemPrompt:    "<|begin_of_text|><|start_header_id|><|end_header_id|>You are a helpful assistant<|eot_id|>\r\n",
		UserPrompt:      "<|start_header_id|>user<|end_header_id|>\r\n",
		Question:        input + "\r\n",
		AssistantPrompt: "<|eot_id|><|start_header_id|>assistant<|end_header_id|>\r\n",
	}

	// Step 5: Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template to stdout
	if err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return ""
	}
	return doc.String()
}
func CreateInstTemplate(input string) string {

	templateStr := "{{.UserPrompt }}{{.Question }}{{.AssistantPrompt }}"

	tmpl, err := template.New("templateStr").Parse(templateStr)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return ""
	}
	out := PromptTemplate{
		UserPrompt:      " [INST]",
		Question:        input,
		AssistantPrompt: "[/INST]\r\n",
	}

	// Step 5: Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template to stdout
	if err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return ""
	}
	return doc.String()
}
func CreateReportTemplateWithMetadata(reportTemplatePath string, reportDataPath string) string {
	// Step 1: Open the file
	templateFile, err := os.Open(AppArgs.PromptTemplateFolderName + reportTemplatePath)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return ""
	}
	tempStat, _ := os.Stat(AppArgs.PromptTemplateFolderName + reportTemplatePath)
	tempSize := tempStat.Size()

	dataFile, err := os.Open(AppArgs.ReportDataPath + reportDataPath)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return ""
	}
	tempStat, _ = os.Stat(AppArgs.ReportDataPath + reportDataPath)
	dataSize := tempStat.Size()
	defer func(templateFile *os.File) {
		err := templateFile.Close()
		if err != nil {

		}
	}(templateFile)
	defer func(dataFile *os.File) {
		err := dataFile.Close()
		if err != nil {

		}
	}(dataFile)

	// Step 2: Read the file content
	templateContent := make([]byte, tempSize)    // Example buffer size
	n, err := templateFile.Read(templateContent) // Read the file into the buffer
	if err != nil && err.Error() != "EOF" {
		fmt.Printf("Error reading file: %v\n", err)
		return ""
	}
	dataContent := make([]byte, dataSize) // Example buffer size
	d, err := dataFile.Read(dataContent)  // Read the file into the buffer
	if err != nil && err.Error() != "EOF" {
		fmt.Printf("Error reading file: %v\n", err)
		return ""
	}

	content := string(templateContent[:n]) // Convert the content into a string

	// Optional: Trim the file content (if needed)
	data := string(dataContent[:d])

	// Step 3: Define a string template (or use from file)
	reportTemplateStr := "{{.SystemPrompt }}{{.UserPrompt }}{{.ReportDate }}{{.ReportTemplate }}{{.AssistantPrompt }}"

	// Step 4: Parse and execute the template
	tmpl, err := template.New("reportTemplateStr").Parse(reportTemplateStr)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return ""
	}

	/*// Create data for the template
	out := ReportPromptTemplate{
		SystemPrompt:    "<s>[INST] \r\n",
		UserPrompt:      "Please use the report template provided with #### to build a report. Please use the data provided between context start and end. List out the data in a table format with the appropriate headers. \r\n",
		ReportTemplate:  content,
		ReportDate:      data,
		AssistantPrompt: "[/INST] \r\n",
	}*/
	out := ReportPromptTemplate{
		SystemPrompt:    "",
		UserPrompt:      "user Step 1. With the report data provided create a report sorted by field lastName alphabetically. Step 2 Format the report using the template instructions as a guide.\r\n",
		ReportTemplate:  "# Instructions:\r\n" + content,
		ReportDate:      "# Report data:\r\n" + data + "\r\n",
		AssistantPrompt: "assistant\r\n",
	}

	// Step 5: Execute the template against the data
	var doc bytes.Buffer
	err = tmpl.Execute(&doc, out) // Write the rendered template to stdout
	if err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return ""
	}
	return doc.String()
}
