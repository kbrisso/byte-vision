package main

import (
	"embed"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"os"
)

//go:embed all:frontend/dist
var assets embed.FS
var Log logger.Logger
var ModelPath string
var LogPath string
var LLamaCppPath string
var EmbedLLamaCppPath string

func main() {
	_ = godotenv.Load("byte-vision-cfg.env")
	ModelPath = os.Getenv("ModelPath")
	LogPath = os.Getenv("LogPath")
	LLamaCppPath = os.Getenv("LLamaCppPath")
	EmbedLLamaCppPath = os.Getenv("EmbedLLamaCppPath")

	Log = logger.NewFileLogger(fmt.Sprintf(LogPath))

	// Create an instance of the app structure
	app := NewApp()
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "byte-vision",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Logger:           Log,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		Log.Error(err.Error())
	}
}
