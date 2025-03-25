package main

import (
	"embed"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
	"runtime"
)

//go:embed all:frontend/dist
var assets embed.FS
var Log logger.Logger
var DefaultLlamaCliArgs LlamaCppArgs
var DefaultLlamaEmbedArgs LlamaEmbedArgs
var AppArgs DefaultAppArgs

func main() {
	_ = godotenv.Load("byte-vision-cfg.env")
	DefaultLlamaCliArgs = ParseDefaultLlamaCliEnv()
	DefaultLlamaEmbedArgs = ParseDefaultLlamaEmbedEnv()
	AppArgs = ParseDefaultAppEnv()
	Log = logger.NewFileLogger(fmt.Sprintf(AppArgs.AppLogPath + AppArgs.AppLogFileName))
	app := NewApp()
	AppMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		AppMenu.Append(menu.AppMenu()) // On macOS platform, this must be done right after `NewMenu()`
	}
	FileMenu := AppMenu.AddSubmenu("File")
	FileMenu.AddText("&Open", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		// do something
	})
	FileMenu.AddSeparator()
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		// `rt` is an alias of "github.com/wailsapp/wails/v2/pkg/runtime" to prevent collision with standard package
		rt.Quit(app.ctx)
	})

	if runtime.GOOS == "darwin" {
		AppMenu.Append(menu.EditMenu()) // On macOS platform, EditMenu should be appended to enable Cmd+C, Cmd+V, Cmd+Z... shortcuts
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "byte-vision",
		Width:  1024,
		Height: 768,
		Menu:   AppMenu,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Logger:           Log,
		Bind: []interface{}{
			app,
		},
		EnableDefaultContextMenu: true,
	})

	if err != nil {
		Log.Error(err.Error())
	}
}
