package main

// GetAppLogFile reads the content of the log file
func (app *App) GetAppLogFile(appLogPath string) string {
	return GetAppLogFile(appLogPath)
}

// GetModelFiles retrieves a list of model file names and their paths
func (app *App) GetModelFiles() []ModelNameFullPath {
	return GetModelFilesInDirectory(*app.appArgs)
}
