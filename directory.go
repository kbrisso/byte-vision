package main

import (
	"context"
	"fmt"

	"os"
	"path/filepath"
	"regexp"
)

type DirectoryLoader struct {
	loader Loader

	dirname        string
	regExPathMatch string
}

func NewDirectoryLoader(dirname string, regExPathMatch string) *DirectoryLoader {
	return &DirectoryLoader{
		dirname:        dirname,
		regExPathMatch: regExPathMatch,
	}
}

func (d *DirectoryLoader) WithTextSplitter(textSplitter TextSplitterLoader) *DirectoryLoader {
	d.loader.textSplitter = textSplitter
	return d
}

func (d *DirectoryLoader) Load(ctx context.Context) ([]Document, error) {
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
			d, errLoad := NewTextLoader(path, nil).Load(ctx)
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
		docs = d.loader.textSplitter.SplitDocuments(docs)
	}
	return docs, nil
}

func (d *DirectoryLoader) validate() error {
	fileStat, err := os.Stat(d.dirname)
	if err != nil {
		Log.Error(err.Error())
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
		Log.Error(err.Error())
		return ""
	}
	return string(data)
}
func GetCurrentModelLogFile(modelLogPath string) string {

	if _, err := os.Stat(modelLogPath); os.IsNotExist(err) {
		err := os.MkdirAll(filepath.Dir(modelLogPath), os.ModePerm)
		if err != nil {
			Log.Error(err.Error())
			return ""
		}
	}
	data, err := os.ReadFile(filepath.Clean(modelLogPath))
	if err != nil {
		Log.Error(err.Error())
		return ""
	}
	return string(data)
}
func GetCurrentEmbedModelLogFile(embedModelLogPath string) string {
	if _, err := os.Stat(embedModelLogPath); os.IsNotExist(err) {
		err := os.MkdirAll(filepath.Dir(embedModelLogPath), os.ModePerm)
		if err != nil {
			Log.Error(err.Error())
			return ""
		}
	}
	data, err := os.ReadFile(filepath.Clean(embedModelLogPath))
	if err != nil {
		Log.Error(err.Error())
		return ""
	}
	return string(data)
}

func GetModelFilesInDirectory() []ModelNameFullPath {
	dirPath := filepath.Clean(AppArgs.ModelFolderName)
	filePath, err := os.Open(dirPath)

	if err != nil {
		Log.Error(err.Error())
		return nil
	}

	defer func(filePath *os.File) {
		err := filePath.Close()
		if err != nil {
			Log.Error(err.Error())
		}
	}(filePath)

	files, err := filePath.Readdir(-1)
	if err != nil {
		Log.Error(err.Error())
		return nil
	}

	var modelNameFullPath []ModelNameFullPath
	for _, entry := range files {
		if !entry.IsDir() {
			fullPath := filepath.Clean(filepath.Join(dirPath, entry.Name()))
			modelNameFullPath = append(modelNameFullPath, ModelNameFullPath{
				FileName: entry.Name(),
				FullPath: fullPath,
			})
		}
	}
	return modelNameFullPath
}
