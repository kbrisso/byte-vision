package main

import (
	"encoding/json"
	"fmt"
)

// GetDefaultSettings returns all the default settings for the application
func (app *App) GetDefaultSettings() string {
	llamaCliArgsJSON, err := json.Marshal(app.llamaCliArgs)
	if err != nil {
		app.log.Error("Failed to marshal LlamaCli args: " + err.Error())
		return ""
	}

	llamaEmbedArgsJSON, err := json.Marshal(app.llamaEmbedArgs)
	if err != nil {
		app.log.Error("Failed to marshal LlamaEmbed args: " + err.Error())
		return ""
	}

	appArgsJSON, err := json.Marshal(app.appArgs)
	if err != nil {
		app.log.Error("Failed to marshal app args: " + err.Error())
		return ""
	}

	return fmt.Sprintf("[%s, %s, %s]", llamaCliArgsJSON, llamaEmbedArgsJSON, appArgsJSON)
}

// SaveCliSettings saves the current LlamaCli settings to MongoDB with the given description
func (app *App) SaveCliSettings(description string, settings interface{}) error {
	return SaveCliSettings(app.appArgs, description, settings)
}

// SaveEmbedSettings saves the current LlamaEmbed settings to MongoDB with the given description
func (app *App) SaveEmbedSettings(description string, settings interface{}) error {
	return SaveEmbedSettings(app.appArgs, description, settings)
}

// GetSavedCliSettings retrieves saved CLI settings
func (app *App) GetSavedCliSettings() string {
	savedSettings, err := GetSavedCliSettings(app.appArgs)
	if err != nil {
		app.log.Error("Failed to get saved CLI settings: " + err.Error())
		return ""
	}

	jsonOutput, err := json.Marshal(savedSettings)
	if err != nil {
		app.log.Error("Failed to marshal CLI settings: " + err.Error())
		return ""
	}

	return string(jsonOutput)
}

// GetSavedEmbedSettings retrieves saved embed settings
func (app *App) GetSavedEmbedSettings() string {
	savedEmbedSettings, err := GetSavedEmbedSettings(app.appArgs)
	if err != nil {
		app.log.Error("Failed to get saved embed settings: " + err.Error())
		return ""
	}

	jsonOutput, err := json.Marshal(savedEmbedSettings)
	if err != nil {
		app.log.Error("Failed to marshal embed settings: " + err.Error())
		return ""
	}

	return string(jsonOutput)
}
