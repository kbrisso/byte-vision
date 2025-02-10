package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

func ParseDefaultLlamaCliEnv() LlamaCppArgs {
	out := LlamaCppArgs{
		Description:              os.Getenv("Description"),
		ModelCmd:                 os.Getenv("ModelCmd"),
		ModelFullPath:            cleanPath(os.Getenv("ModelFullPath")),
		PromptCmd:                os.Getenv("PromptCmd"),
		PromptCmdEnabled:         getEnvBool(os.Getenv("PromptCmdEnabled"), false),
		PromptText:               os.Getenv("PromptText"),
		ChatTemplateCmd:          os.Getenv("ChatTemplateCmd"),
		ChatTemplateVal:          os.Getenv("ChatTemplateVal"),
		MultilineInputCmd:        os.Getenv("MultilineInputCmd"),
		MultilineInputCmdEnabled: getEnvBool(os.Getenv("MultilineInputCmdEnabled"), false),
		CtxSizeCmd:               os.Getenv("CtxSizeCmd"),
		CtxSizeVal:               os.Getenv("CtxSizeVal"),
		RopeScaleCmd:             os.Getenv("RopeScaleCmd"),
		RopeScaleVal:             os.Getenv("RopeScaleVal"),
		PromptCacheAllCmd:        os.Getenv("PromptCacheAllCmd"),
		PromptCacheCmd:           os.Getenv("PromptCacheCmd"),
		PromptCacheVal:           os.Getenv("PromptCacheVal"),
		PromptFileCmd:            os.Getenv("PromptFileCmd"),
		PromptFileVal:            cleanPath(os.Getenv("PromptFileVal")),
		InteractiveFirstCmd:      os.Getenv("InteractiveFirstCmd"),
		InteractiveModeCmd:       os.Getenv("InteractiveModeCmd"),
		ReversePromptCmd:         os.Getenv("ReversePromptCmd"),
		ReversePromptVal:         os.Getenv("ReversePromptVal"),
		InPrefixCmd:              os.Getenv("InPrefixCmd"),
		InPrefixVal:              os.Getenv("InPrefixVal"),
		InSuffixCmd:              os.Getenv("InSuffixCmd"),
		InSuffixVal:              os.Getenv("InSuffixVal"),
		GPULayersCmd:             os.Getenv("GPULayersCmd"),
		GPULayersVal:             os.Getenv("GPULayersVal"),
		ThreadsBatchCmd:          os.Getenv("ThreadsBatchCmd"),
		ThreadsBatchVal:          os.Getenv("ThreadsBatchVal"),
		ThreadsCmd:               os.Getenv("ThreadsCmd"),
		ThreadsVal:               os.Getenv("ThreadsVal"),
		KeepCmd:                  os.Getenv("KeepCmd"),
		KeepVal:                  os.Getenv("KeepVal"),
		TopKCmd:                  os.Getenv("TopKCmd"),
		TopKVal:                  os.Getenv("TopKVal"),
		MainGPUCmd:               os.Getenv("MainGPUCmd"),
		MainGPUVal:               os.Getenv("MainGPUVal"),
		RepeatPenaltyCmd:         os.Getenv("RepeatPenaltyCmd"),
		RepeatPenaltyVal:         os.Getenv("RepeatPenaltyVal"),
		RepeatLastPenaltyCmd:     os.Getenv("RepeatLastPenaltyCmd"),
		RepeatLastPenaltyVal:     os.Getenv("RepeatLastPenaltyVal"),
		MemLockCmd:               os.Getenv("MemLockCmd"),
		MemLockCmdEnabled:        getEnvBool(os.Getenv("MemLockCmdEnabled"), false),
		EscapeNewLinesCmd:        os.Getenv("EscapeNewLinesCmd"),
		EscapeNewLinesCmdEnabled: getEnvBool(os.Getenv("EscapeNewLinesCmdEnabled"), false),
		LogVerboseCmd:            os.Getenv("LogVerboseCmd"),
		LogVerboseEnabled:        getEnvBool(os.Getenv("LogVerboseEnabled"), false),
		TemperatureVal:           os.Getenv("TemperatureVal"),
		TemperatureCmd:           os.Getenv("TemperatureCmd"),
		PredictCmd:               os.Getenv("PredictCmd"),
		PredictVal:               os.Getenv("PredictVal"),
		NoDisplayPromptCmd:       os.Getenv("NoDisplayPromptCmd"),
		NoDisplayPromptEnabled:   getEnvBool(os.Getenv("NoDisplayPromptEnabled"), false),
		TopPCmd:                  os.Getenv("TopPCmd"),
		TopPVal:                  os.Getenv("TopPVal"),
		ModelLogFileCmd:          cleanPath(os.Getenv("ModelLogFileCmd")),
		ModelLogFileNameVal:      cleanPath(os.Getenv("ModelLogFileNameVal")),
		ConversationCmd:          os.Getenv("ConversationCmd"),
		ConversationCmdEnabled:   getEnvBool(os.Getenv("ConversationCmdEnabled"), false),
		FlashAttentionCmd:        os.Getenv("FlashAttentionCmd"),
		FlashAttentionCmdEnabled: getEnvBool(os.Getenv("FlashAttentionCmdEnabled"), false),
	}
	return out
}
func ParseDefaultLlamaEmbedEnv() LlamaEmbedArgs {
	out := LlamaEmbedArgs{
		EmbedPoolingCmd:               os.Getenv("EmbedPoolingCmd"),
		EmbedPoolingVal:               os.Getenv("EmbedPoolingVal"),
		EmbedOutputFormatCmd:          os.Getenv("EmbedOutputFormatCmd"),
		EmbedOutputFormatVal:          os.Getenv("EmbedOutputFormatVal"),
		EmbedCtxSizeCmd:               os.Getenv("EmbedCtxSizeCmd"),
		EmbedCtxSizeVal:               os.Getenv("EmbedCtxtSizeVal"),
		EmbedBatchCmd:                 os.Getenv("EmbedBatchCmd"),
		EmbedBatchVal:                 os.Getenv("EmbedBatchVal"),
		EmbedThreadsBatchCmd:          os.Getenv("EmbedThreadsBatchCmd"),
		EmbedThreadsBatchVal:          os.Getenv("EmbedThreadsBatchVal"),
		EmbedThreadsCmd:               os.Getenv("EmbedThreadsCmd"),
		EmbedThreadsVal:               os.Getenv("EmbedThreadsVal"),
		EmbedSeparatorCmd:             os.Getenv("EmbedSeparatorCmd"),
		EmbedSeparatorVal:             os.Getenv("EmbedSeparatorVal"),
		EmbedModelLogFileCmd:          cleanPath(os.Getenv("EmbedModelLogFileCmd")),
		EmbedModelLogFileNameVal:      os.Getenv("EmbedModelLogFileNameVal"),
		EmbedModelPathVal:             cleanPath(os.Getenv("EmbedModelPathVal")),
		EmbedModelPathCmd:             cleanPath(os.Getenv("EmbedModelPathCmd")),
		EmbedNormalizeCmd:             os.Getenv("EmbedNormalizeCmd"),
		EmbedNormalizeVal:             os.Getenv("EmbedNormalizeVal"),
		EmbedMainGPUCmd:               os.Getenv("EmbedMainGPUCmd"),
		EmbedMainGPUVal:               os.Getenv("EmbedMainGPUVal"),
		EmbedKeepCmd:                  os.Getenv("EmbedKeepCmd"),
		EmbedKeepVal:                  os.Getenv("EmbedKeepVal"),
		EmbedTopKCmd:                  os.Getenv("EmbedTopKCmd"),
		EmbedTopKVal:                  os.Getenv("EmbedTopKVal"),
		EmbedPromptFileCmd:            os.Getenv("EmbedPromptFileCmd"),
		EmbedPromptFileVal:            cleanPath(os.Getenv("EmbedPromptFileVal")),
		EmbedPromptCmd:                os.Getenv("EmbedPromptCmd"),
		EmbedFlashAttentionCmdEnabled: getEnvBool(os.Getenv("EmbedFlashAttentionCmdEnabled"), false),
		EmbedFlashAttentionCmd:        os.Getenv("EmbedFlashAttentionCmd"),
		EmbedPromptCmdEnabled:         getEnvBool(os.Getenv("EmbedPromptCmdEnabled"), false),
		EmbedTemperatureVal:           os.Getenv("EmbedTemperatureVal"),
		EmbedTemperatureCmd:           os.Getenv("EmbedTemperatureCmd"),
		EmbedGPULayersCmd:             os.Getenv("EmbedGPULayersCmd"),
		EmbedGPULayersVal:             os.Getenv("EmbedGPULayersVal"),
		EmbedRepeatPenaltyCmd:         os.Getenv("EmbedRepeatPenaltyCmd"),
		EmbedRepeatPenaltyVal:         os.Getenv("EmbedRepeatPenaltyVal"),
	}
	return out
}

func ParseDefaultAppEnv() DefaultAppArgs {
	out := DefaultAppArgs{
		ModelPath:                cleanPath(os.Getenv("ModelPath")),
		AppLogPath:               cleanPath(os.Getenv("AppLogPath")),
		AppLogFileName:           os.Getenv("AppLogFileName"),
		PromptTemplateFolderName: cleanPath(os.Getenv("PromptTemplateFolderName")),
		ModelFolderName:          os.Getenv("ModelFolderName"),
		LLamaCliPath:             cleanPath(os.Getenv("LLamaCliPath")),
		LLamaEmbedCliPath:        cleanPath(os.Getenv("LLamaEmbedCliPath")),
		PDFToTextEXE:             cleanPath(os.Getenv("PDFToTextEXE")),
		ModelLogFolderNamePath:   os.Getenv("ModelLogFolderNamePath"),
		EmbedDBFolderName:        os.Getenv("EmbedDBFolderName"),
		EmbedModelFileName:       os.Getenv("EmbedModelFileName"),
		ModelFileName:            os.Getenv("ModelFileName"),
		ReportDataPath:           cleanPath(os.Getenv("ReportDataPath")),
		PromptCacheFolderName:    cleanPath(os.Getenv("PromptCacheFolderName")),
	}
	return out
}

func getEnvBool(key string, fallback bool) bool {
	result, err := strconv.ParseBool(key)
	if err != nil {
		return fallback
	}

	return result
}
func cleanPath(path string) string {
	filepath.Clean(path)
	return fmt.Sprintf("%s%s", path, "\\")

}

func LlamaCliStructToArgs(args LlamaCppArgs) []string {
	var result []string
	// Helper function for NullString pairs
	addCmdValPair := func(cmd string, val string) {
		if len(val) != 0 {
			result = append(result, cmd, val)
		}
	}
	// Helper function for NullString and NullBool pairs
	addCmdBoolPair := func(cmd string, val bool) {
		if val == true {
			// Convert boolean to string before adding it to the result
			result = append(result, cmd)
		}
	}
	// Examples of using the helper functions
	addCmdValPair(args.ModelCmd, args.ModelFullPath)
	addCmdValPair(args.PromptCmd, args.PromptText)
	addCmdValPair(args.ChatTemplateCmd, args.ChatTemplateVal)
	addCmdBoolPair(args.ConversationCmd, args.ConversationCmdEnabled)
	addCmdBoolPair(args.MultilineInputCmd, args.MultilineInputCmdEnabled)
	addCmdValPair(args.CtxSizeCmd, args.CtxSizeVal)
	addCmdValPair(args.RopeScaleCmd, args.RopeScaleVal)
	addCmdValPair(args.PromptCacheCmd, args.PromptCacheVal)
	addCmdValPair(args.PromptFileCmd, args.PromptFileVal)
	addCmdBoolPair(args.InteractiveFirstCmd, args.InteractiveFirstCmdEnabled)
	addCmdBoolPair(args.InteractiveModeCmd, args.InteractiveModeCmdEnabled)
	addCmdValPair(args.ReversePromptCmd, args.ReversePromptVal)
	addCmdValPair(args.InPrefixCmd, args.InPrefixVal)
	addCmdValPair(args.InSuffixCmd, args.InSuffixVal)
	addCmdValPair(args.GPULayersCmd, args.GPULayersVal)
	addCmdValPair(args.ThreadsBatchCmd, args.ThreadsBatchVal)
	addCmdValPair(args.ThreadsCmd, args.ThreadsVal)
	addCmdValPair(args.KeepCmd, args.KeepVal)
	addCmdValPair(args.TopKCmd, args.TopKVal)
	addCmdValPair(args.MainGPUCmd, args.MainGPUVal)
	addCmdValPair(args.RepeatPenaltyCmd, args.RepeatPenaltyVal)
	addCmdValPair(args.RepeatLastPenaltyCmd, args.RepeatLastPenaltyVal)
	addCmdBoolPair(args.MemLockCmd, args.MemLockCmdEnabled)
	addCmdBoolPair(args.EscapeNewLinesCmd, args.EscapeNewLinesCmdEnabled)
	addCmdValPair(args.TemperatureCmd, args.TemperatureVal)
	addCmdValPair(args.PredictCmd, args.PredictVal)
	addCmdValPair(args.ModelLogFileCmd, args.ModelLogFileNameVal)
	addCmdBoolPair(args.NoDisplayPromptCmd, args.NoDisplayPromptEnabled)
	addCmdValPair(args.TopPCmd, args.TopPVal)
	addCmdBoolPair(args.LogVerboseCmd, args.LogVerboseEnabled)
	addCmdBoolPair(args.FlashAttentionCmd, args.FlashAttentionCmdEnabled)
	return result

}
func LlamaEmbedStructToArgs(args LlamaEmbedArgs) []string {
	var result []string
	// Helper function for NullString pairs
	addCmdValPair := func(cmd string, val string) {
		if len(val) != 0 {
			result = append(result, cmd, val)
		}
	}
	addCmdBoolPair := func(cmd string, val bool) {
		if val == true {
			// Convert boolean to string before adding it to the result
			result = append(result, cmd)
		}
	}
	// Examples of using the helper functions
	addCmdValPair(args.EmbedPoolingCmd, args.EmbedPoolingVal)
	addCmdValPair(args.EmbedOutputFormatCmd, args.EmbedOutputFormatVal)
	addCmdValPair(args.EmbedNormalizeCmd, args.EmbedNormalizeVal)
	addCmdValPair(args.EmbedCtxSizeCmd, args.EmbedCtxSizeVal)
	addCmdValPair(args.EmbedThreadsBatchCmd, args.EmbedThreadsBatchVal)
	addCmdValPair(args.EmbedSeparatorCmd, args.EmbedSeparatorVal)
	addCmdValPair(args.EmbedModelLogFileCmd, args.EmbedModelLogFileNameVal)
	addCmdValPair(args.EmbedModelPathCmd, args.EmbedModelPathVal)
	addCmdValPair(args.EmbedKeepCmd, args.EmbedKeepVal)
	addCmdValPair(args.EmbedTopKCmd, args.EmbedTopKVal)
	addCmdBoolPair(args.EmbedFlashAttentionCmd, args.EmbedFlashAttentionCmdEnabled)
	addCmdValPair(args.EmbedPromptFileCmd, args.EmbedPromptFileVal)
	addCmdBoolPair(args.EmbedPromptCmd, args.EmbedPromptCmdEnabled)
	addCmdValPair(args.EmbedTemperatureCmd, args.EmbedTemperatureVal)
	addCmdValPair(args.EmbedGPULayersCmd, args.EmbedGPULayersVal)
	addCmdValPair(args.EmbedRepeatPenaltyCmd, args.EmbedRepeatPenaltyVal)
	addCmdValPair(args.EmbedPromptCmd, args.EmbedPromptText)

	return result

}
func DefaultAppStructToArgs(args DefaultAppArgs) []string {
	var result []string
	// Helper function for NullString pairs
	addCmdValPair := func(cmd string) {
		if len(cmd) != 0 {
			result = append(result, cmd)
		}
	}
	// Examples of using the helper functions
	addCmdValPair(args.AppLogPath)
	addCmdValPair(args.AppLogFileName)
	addCmdValPair(args.PDFToTextEXE)
	addCmdValPair(args.LLamaCliPath)
	addCmdValPair(args.LLamaEmbedCliPath)
	addCmdValPair(args.ModelFolderName)
	addCmdValPair(args.PromptCacheFolderName)
	addCmdValPair(args.PromptTemplateFolderName)
	addCmdValPair(args.ModelFileName)
	addCmdValPair(args.EmbedModelFileName)
	addCmdValPair(args.ModelLogFolderNamePath)
	addCmdValPair(args.EmbedDBFolderName)
	addCmdValPair(args.ModelPath)
	return result

}

type LlamaCppArgs struct {
	ID                         string `json:"id"`
	Description                string `json:"description"`
	PromptCmd                  string `json:"promptCmd"`
	PromptCmdEnabled           bool   `json:"promptCmdEnabled"`
	ConversationCmd            string `json:"conversationCmd"`
	ConversationCmdEnabled     bool   `json:"conversationCmdEnabled"`
	ChatTemplateCmd            string `json:"chatTemplateCmd"`
	ChatTemplateVal            string `json:"chatTemplateVal"`
	MultilineInputCmd          string `json:"multilineInputCmd"`
	MultilineInputCmdEnabled   bool   `json:"multilineInputCmdEnabled"`
	CtxSizeCmd                 string `json:"ctxSizeCmd"`
	CtxSizeVal                 string `json:"ctxSizeVal"`
	RopeScaleVal               string `json:"ropeScaleVal"`
	RopeScaleCmd               string `json:"ropeScaleCmd"`
	PromptCacheAllCmd          string `json:"promptCacheAllCmd"`
	PromptCacheAllEnabled      bool   `json:"promptCacheAllEnabled"`
	PromptCacheCmd             string `json:"promptCacheCmd"`
	PromptCacheVal             string `json:"promptCacheVal"`
	PromptFileCmd              string `json:"promptFileCmd"`
	PromptFileVal              string `json:"promptFileVal"`
	InteractiveFirstCmd        string `json:"interactiveFirstCmd"`
	InteractiveFirstCmdEnabled bool   `json:"interactiveFirstCmdEnabled"`
	InteractiveModeCmdEnabled  bool   `json:"interactiveModeCmdEnabled"`
	InteractiveModeCmd         string `json:"interactiveModeCmd"`
	ReversePromptCmd           string `json:"reversePromptCmd"`
	ReversePromptVal           string `json:"reversePromptVal"`
	InPrefixCmd                string `json:"inPrefixCmd"`
	InPrefixVal                string `json:"inPrefixVal"`
	InSuffixCmd                string `json:"inSuffixCmd"`
	InSuffixVal                string `json:"inSuffixVal"`
	GPULayersCmd               string `json:"gPULayersCmd"`
	GPULayersVal               string `json:"gPULayersVal"`
	ThreadsBatchCmd            string `json:"threadsBatchCmd"`
	ThreadsBatchVal            string `json:"threadsBatchVal"`
	ThreadsCmd                 string `json:"threadsCmd"`
	ThreadsVal                 string `json:"threadsVal"`
	KeepCmd                    string `json:"keepCmd"`
	KeepVal                    string `json:"keepVal"`
	TopKCmd                    string `json:"topKCmd"`
	TopKVal                    string `json:"topKVal"`
	MainGPUCmd                 string `json:"mainGPUCmd"`
	MainGPUVal                 string `json:"mainGPUVal"`
	RepeatPenaltyCmd           string `json:"repeatPenaltyCmd"`
	RepeatPenaltyVal           string `json:"repeatPenaltyVal"`
	RepeatLastPenaltyCmd       string `json:"repeatLastPenaltyCmd"`
	RepeatLastPenaltyVal       string `json:"repeatLastPenaltyVal"`
	MemLockCmd                 string `json:"memLockCmd"`
	MemLockCmdEnabled          bool   `json:"memLockCmdEnabled"`
	NoMMApCmd                  string `json:"noMMApCmd"`
	NoMMApCmdEnabled           bool   `json:"noMMApCmdEnabled"`
	EscapeNewLinesCmd          string `json:"escapeNewLinesCmd"`
	EscapeNewLinesCmdEnabled   bool   `json:"escapeNewLinesCmdEnabled"`
	LogVerboseCmd              string `json:"logVerboseCmd"`
	LogVerboseEnabled          bool   `json:"logVerboseEnabled"`
	TemperatureVal             string `json:"temperatureVal"`
	TemperatureCmd             string `json:"temperatureCmd"`
	PredictCmd                 string `json:"predictCmd"`
	PredictVal                 string `json:"predictVal"`
	ModelFullPath              string `json:"modelFullPath"`
	ModelCmd                   string `json:"modelCmd"`
	PromptText                 string `json:"promptText"`
	NoDisplayPromptCmd         string `json:"noDisplayPromptCmd"`
	NoDisplayPromptEnabled     bool   `json:"noDisplayPromptEnabled"`
	TopPCmd                    string `json:"topPCmd"`
	TopPVal                    string `json:"topPVal"`
	ModelLogFileCmd            string `json:"modelLogFileCmd"`
	ModelLogFileNameVal        string `json:"modelLogFileNameVal"`
	FlashAttentionCmd          string `json:"flashAttentionCmd"`
	FlashAttentionCmdEnabled   bool   `json:"flashAttentionCmdEnabled"`
}

type LlamaEmbedArgs struct {
	EmbedMainGPUCmd               string `json:"embedMainGPUCmd"`
	EmbedMainGPUVal               string `json:"embedMainGPUVal"`
	EmbedKeepCmd                  string `json:"embedKeepCmd"`
	EmbedKeepVal                  string `json:"embedKeepVal"`
	EmbedTopKCmd                  string `json:"embedTopKCmd"`
	EmbedTopKVal                  string `json:"embedTopKVal"`
	EmbedCtxSizeCmd               string `json:"embedCtxSizeCmd"`
	EmbedCtxSizeVal               string `json:"embedCtxSizeVal"`
	EmbedBatchCmd                 string `json:"embedBatchCmd"`
	EmbedBatchVal                 string `json:"embedBatchVal"`
	EmbedThreadsCmd               string `json:"embedThreadsCmd"`
	EmbedThreadsVal               string `json:"embedThreadsVal"`
	EmbedThreadsBatchCmd          string `json:"embedThreadsBatchCmd"`
	EmbedThreadsBatchVal          string `json:"embedThreadsBatchVal"`
	EmbedSeparatorCmd             string `json:"embedSeparatorCmd"`
	EmbedSeparatorVal             string `json:"embedSeparatorVal"`
	EmbedModelPathCmd             string `json:"embedModelPathCmd"`
	EmbedModelPathVal             string `json:"embedModelPathVal"`
	EmbedModelLogFileCmd          string `json:"embedModelLogFileCmd"`
	EmbedModelLogFileNameVal      string `json:"embedModelLogFileNameVal"`
	EmbedPoolingCmd               string `json:"embedPoolingCmd"`
	EmbedPoolingVal               string `json:"embedPoolingVal"`
	EmbedOutputFormatCmd          string `json:"embedOutputFormatCmd"`
	EmbedOutputFormatVal          string `json:"embedOutputFormatVal"`
	EmbedNormalizeCmd             string `json:"embedNormalizeCmd"`
	EmbedNormalizeVal             string `json:"embedNormalizeVal"`
	EmbedFlashAttentionCmd        string `json:"embedFlashAttentionCmd"`
	EmbedFlashAttentionCmdEnabled bool   `json:"embedFlashAttentionCmdEnabled"`
	EmbedPromptFileCmd            string `json:"embedPromptFileCmd"`
	EmbedPromptFileVal            string `json:"embedPromptFileVal"`
	EmbedPromptCmd                string `json:"embedPromptCmd"`
	EmbedPromptText               string `json:"embedPromptText"`
	EmbedPromptCmdEnabled         bool   `json:"embedPromptCmdEnabled"`
	EmbedTemperatureCmd           string `json:"embedTemperatureCmd"`
	EmbedTemperatureVal           string `json:"embedTemperatureVal"`
	EmbedGPULayersCmd             string `json:"embedGPULayersCmd"`
	EmbedGPULayersVal             string `json:"embedGPULayersVal"`
	EmbedRepeatPenaltyCmd         string `json:"embedRepeatPenaltyCmd"`
	EmbedRepeatPenaltyVal         string `json:"embedRepeatPenaltyVal"`
}
type DefaultAppArgs struct {
	ModelPath                string `json:"modelPath"`
	AppLogPath               string `json:"appLogPath"`
	AppLogFileName           string `json:"appLogFileName"`
	PromptTemplateFolderName string `json:"promptTemplateFolderName"`
	PromptCacheFolderName    string `json:"promptCacheFolderName"`
	ModelFolderName          string `json:"modelFolderName"`
	LLamaCliPath             string `json:"llamaCliPath"`
	LLamaEmbedCliPath        string `json:"llamaEmbedCliPath"`
	PDFToTextEXE             string `json:"pdfToTextEXE"`
	EmbedDBFolderName        string `json:"embedDBFolderName"`
	ModelFileName            string `json:"modelFileName"`
	EmbedModelFileName       string `json:"embedModelFileName"`
	ModelLogFolderNamePath   string `json:"modelLogFolderNamePath"`
	ReportDataPath           string `json:"reportDataPath"`
}

type ModelNameFullPath struct {
	FileName string
	FullPath string
}
type M map[string]interface{}

type Meta map[string]interface{}

// String returns the metadata as a JSON string
func (m Meta) String() string {
	jsonData, err := json.Marshal(m)
	if err != nil {
		return ""
	}

	return string(jsonData)
}

type Document struct {
	Content  string `json:"content"`
	Metadata Meta   `json:"metadata"`
}

type CSVLoader struct {
	separator  rune
	filename   string
	lazyQuotes bool
}

const (
	DefaultOutputKey = "output"
)

const (
	SourceMetadataKey = "source"
)

type ReportPromptTemplate struct {
	SystemPrompt    string
	UserPrompt      string
	ReportTemplate  string
	ReportDate      string
	AssistantPrompt string
}
type PromptTemplate struct {
	SystemPrompt    string
	UserPrompt      string
	Question        string
	AssistantPrompt string
}
type PDFLoader struct {
	loader Loader

	pdfToTextPath string
	path          string
}
