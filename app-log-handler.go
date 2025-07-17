package main

// GetAppLogFile reads the content of the log file
func (a *App) GetAppLogFile(appLogPath string) string {
	return GetAppLogFile(appLogPath)
}

// GetModelFiles retrieves a list of model file names and their paths
func (a *App) GetModelFiles() []ModelNameFullPath {
	return GetModelFilesInDirectory(*a.appArgs)
}
