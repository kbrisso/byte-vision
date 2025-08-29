package main

import (
	"context"
	"fmt"

	"github.com/labstack/gommon/log"
	"github.com/wailsapp/wails/v2/pkg/logger"

	"os"
	"path/filepath"
	"regexp"
)

type DirectoryLoader struct {
	loader Loader

	dirname               string
	regExPathMatch        string
	logger                logger.Logger
	appArgs               DefaultAppArgs
	enableStopWordRemoval bool
}

func NewDirectoryLoader(dirname string, regExPathMatch string, logger logger.Logger, appArgs DefaultAppArgs, enableStopWordRemoval bool) *DirectoryLoader {
	return &DirectoryLoader{
		dirname:               dirname,
		regExPathMatch:        regExPathMatch,
		logger:                logger,
		appArgs:               appArgs,
		enableStopWordRemoval: enableStopWordRemoval,
	}
}

func (d *DirectoryLoader) WithTextSplitter(textSplitter TextSplitterLoader) *DirectoryLoader {
	d.loader.textSplitter = textSplitter
	return d
}

func (d *DirectoryLoader) Load(ctx context.Context, logger logger.Logger, appArgs DefaultAppArgs, enableStopWordRemoval bool) ([]Document, error) {
	err := d.validate()
	if err != nil {
		return nil, err
	}

	regExp, err := regexp.Compile(d.regExPathMatch)
	if err != nil {
		return nil, err
	}

	docs := []Document{}
	err = filepath.Walk(d.dirname, func(path string, info os.FileInfo, err error) error {
		if err == nil && regExp.MatchString(info.Name()) {
			d, errLoad := NewTextLoader(path, nil).Load(logger, ctx, appArgs, enableStopWordRemoval)
			if errLoad != nil {
				return errLoad
			}

			docs = append(docs, d...)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	if d.loader.textSplitter != nil {
		docs = d.loader.textSplitter.SplitDocuments(logger, appArgs, enableStopWordRemoval, docs)
	}
	return docs, nil
}
func (d *DirectoryLoader) validate() error {
	fileStat, err := os.Stat(d.dirname)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if !fileStat.IsDir() {
		return fmt.Errorf("%w: %w", "Is directory", os.ErrNotExist)
	}
	return nil
}

func GetAppLogFile(appLogPath string) string {
	data, err := os.ReadFile(filepath.Clean(appLogPath))
	if err != nil {
		log.Error(err.Error())
		return ""
	}
	return string(data)
}
func GetModelFilesInDirectory(appArgs DefaultAppArgs) []ModelNameFullPath {
	dirPath := filepath.Clean(appArgs.ModelPath)
	filePath, err := os.Open(dirPath)
	if err != nil {
		log.Error(err.Error())
		return nil
	}
	defer func(filePath *os.File) {
		err := filePath.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(filePath)
	files, err := filePath.Readdir(-1)
	if err != nil {
		log.Error(err.Error())
		return nil
	}
	var modelNameFullPath []ModelNameFullPath
	for _, entry := range files {
		if !entry.IsDir() {
			// Check if the file has a .gguf extension
			if filepath.Ext(entry.Name()) == ".gguf" {
				fullPath := filepath.Clean(filepath.Join(dirPath, entry.Name()))
				modelNameFullPath = append(modelNameFullPath, ModelNameFullPath{
					FileName: entry.Name(),
					FullPath: fullPath,
				})
			}
		}
	}
	return modelNameFullPath
}
