package main

import (
	"context"
	"embed"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"os"
	"runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

// Container holds all application dependencies
type Container struct {
	Context        context.Context
	Logger         logger.Logger
	LlamaCliArgs   *LlamaCliArgs
	LlamaEmbedArgs *LlamaEmbedArgs
	AppArgs        *DefaultAppArgs
	Database       *mongo.Database
}

// NewContainer creates and initializes a new dependency injection container
func NewContainer() (*Container, error) {
	// Load environment variables
	_ = godotenv.Load("byte-vision-cfg.env")

	// Parse configuration from environment
	llamaCliArgs := ParseDefaultLlamaCliEnv()
	llamaEmbedArgs := ParseDefaultLlamaEmbedEnv()
	appArgs := ParseDefaultAppEnv()

	// Initialize logger
	logPath := fmt.Sprintf(appArgs.AppLogPath + appArgs.AppLogFileName)
	// Truncate existing log file if it exists
	if file, err := os.OpenFile(logPath, os.O_WRONLY|os.O_TRUNC, 0644); err == nil {
		err := file.Close()
		if err != nil {
			return nil, err
		}
	} else if !os.IsNotExist(err) {
		fmt.Printf("Warning: Failed to truncate existing log file: %v\n", err)
	}

	log := logger.NewFileLogger(logPath)
	ctx := context.Background()

	// Initialize the database connection
	db, err := initDatabase(&appArgs)
	if err != nil {
		log.Error(fmt.Sprintf("Failed to initialize database: %v", err))
		// Continue without a database, don't return an error
	}

	return &Container{
		Context:        ctx,
		Logger:         log,
		LlamaCliArgs:   &llamaCliArgs,
		LlamaEmbedArgs: &llamaEmbedArgs,
		AppArgs:        &appArgs,
		Database:       db,
	}, nil
}

func createAppMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()

	// Platform-specific menu handling for macOS
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}

	// Create a File menu
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("&Open", keys.CmdOrCtrl("o"), handleOpenFile)
	fileMenu.AddSeparator()
	fileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		rt.Quit(app.ctx)
	})

	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.EditMenu())
	}

	return appMenu
}

func handleOpenFile(_ *menu.CallbackData) {
	// Implementation for file opening
}

func createAppOptions(app *App, appMenu *menu.Menu, container *Container) *options.App {
	return &options.App{
		Title: "byte-vision",
		Menu:  appMenu,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},

		Logger:            container.Logger,
		WindowStartState:  options.Maximised,
		StartHidden:       false,
		HideWindowOnClose: false,
		Bind: []interface{}{
			app,
		},
		EnableDefaultContextMenu: true,
		LogLevel:                 logger.DEBUG,
		LogLevelProduction:       logger.ERROR,
		OnStartup:                app.Startup,
		OnDomReady:               app.Domready,
		OnShutdown:               app.Shutdown,
		OnBeforeClose:            app.BeforeClose,
		CSSDragProperty:          "--wails-draggable",
		CSSDragValue:             "drag",
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     false,
			DisableWebViewDrop: false,
			CSSDropProperty:    "--wails-drop-target",
			CSSDropValue:       "drop",
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			BackdropType:                      windows.Mica,
			DisablePinchZoom:                  false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			Theme:                             windows.SystemDefault,
			CustomTheme: &windows.ThemeSettings{
				DarkModeTitleBar:   windows.RGB(20, 20, 20),
				DarkModeTitleText:  windows.RGB(200, 200, 200),
				DarkModeBorder:     windows.RGB(20, 0, 20),
				LightModeTitleBar:  windows.RGB(200, 200, 200),
				LightModeTitleText: windows.RGB(20, 20, 20),
				LightModeBorder:    windows.RGB(200, 200, 200),
			},
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	}
}

func main() {
	// Initialize dependency injection container
	container, err := NewContainer()
	if err != nil {
		fmt.Printf("Failed to initialize container: %v\n", err)
		os.Exit(1)
	}
	// Initialize the Elasticsearch client and create indices
	elasticsearchLogger := NewElasticsearchRequestLogger(LoggingLevelInfo)
	_, err = InitializeElasticsearchWithIndices(*elasticsearchLogger, *container.AppArgs)
	if err != nil {
		container.Logger.Fatal(fmt.Sprintf("Failed to initialize Elasticsearch: %v", err))
	}

	// Create an application with injected dependencies
	app := NewApp(container.Logger, container.LlamaCliArgs, container.LlamaEmbedArgs, container.AppArgs, container.Database)

	// Setup menu
	appMenu := createAppMenu(app)

	// Create and configure app options
	appOptions := createAppOptions(app, appMenu, container)

	// Run the application
	err = wails.Run(appOptions)

	if err != nil {
		container.Logger.Error(err.Error())
	}

	// Close the database connection when the application exits
	if err := CloseDatabase(); err != nil {
		container.Logger.Error(fmt.Sprintf("Error closing database connection: %v", err))
	}
}
