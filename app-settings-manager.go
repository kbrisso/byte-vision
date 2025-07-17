package main

import (
	"encoding/json"
	"fmt"
)

// GetDefaultSettings returns all the default settings for the application
func (a *App) GetDefaultSettings() string {
	llamaCliArgsJSON, err := json.Marshal(a.llamaCliArgs)
	if err != nil {
		a.log.Error("Failed to marshal LlamaCli args: " + err.Error())
		return ""
	}

	llamaEmbedArgsJSON, err := json.Marshal(a.llamaEmbedArgs)
	if err != nil {
		a.log.Error("Failed to marshal LlamaEmbed args: " + err.Error())
		return ""
	}

	appArgsJSON, err := json.Marshal(a.appArgs)
	if err != nil {
		a.log.Error("Failed to marshal app args: " + err.Error())
		return ""
	}

	return fmt.Sprintf("[%s, %s, %s]", llamaCliArgsJSON, llamaEmbedArgsJSON, appArgsJSON)
}

// SaveCliSettings saves the current LlamaCli settings to MongoDB with the given description
func (a *App) SaveCliSettings(description string, settings interface{}) error {
	return SaveCliSettings(a.appArgs, description, settings)
}

// SaveEmbedSettings saves the current LlamaEmbed settings to MongoDB with the given description
func (a *App) SaveEmbedSettings(description string, settings interface{}) error {
	return SaveEmbedSettings(a.appArgs, description, settings)
}

// GetSavedCliSettings retrieves saved CLI settings
func (a *App) GetSavedCliSettings() string {
	savedSettings, err := GetSavedCliSettings(a.appArgs)
	if err != nil {
		a.log.Error("Failed to get saved CLI settings: " + err.Error())
		return ""
	}

	jsonOutput, err := json.Marshal(savedSettings)
	if err != nil {
		a.log.Error("Failed to marshal CLI settings: " + err.Error())
		return ""
	}

	return string(jsonOutput)
}

// GetSavedEmbedSettings retrieves saved embed settings
func (a *App) GetSavedEmbedSettings() string {
	savedEmbedSettings, err := GetSavedEmbedSettings(a.appArgs)
	if err != nil {
		a.log.Error("Failed to get saved embed settings: " + err.Error())
		return ""
	}

	jsonOutput, err := json.Marshal(savedEmbedSettings)
	if err != nil {
		a.log.Error("Failed to marshal embed settings: " + err.Error())
		return ""
	}

	return string(jsonOutput)
}
