package main

import (
	"database/sql"
	"encoding/json"
	"os"
)

func EmbedArgs() []string {
	out := LlamaCppEmbedArgs{
		EmbedPoolingCmd:      os.Getenv("EmbedPoolingCmd"),
		EmbedPoolingVal:      os.Getenv("EmbedPoolingVal"),
		EmbedOutputFormatCmd: os.Getenv("EmbedOutputFormatCmd"),
		EmbedOutputFormatVal: os.Getenv("EmbedOutputFormatVal"),
		EmbedCtxSizeCmd:      os.Getenv("EmbedCtxSizeCmd"),
		EmbedCtxSizeVal:      os.Getenv("EmbedCtxtSizeVal"),
		EmbedBatchSizeCmd:    os.Getenv("EmbedBatchSizeCmd"),
		EmbedBatchSizeVal:    os.Getenv("EmbedBatchSizeVal"),
		EmbedSeparatorCmd:    os.Getenv("EmbedSeparatorCmd"),
		EmbedSeparatorVal:    os.Getenv("EmbedSeparatorVal"),
		EmbedLogFileCmd:      os.Getenv("EmbedLogFileCmd"),
		EmbedLogFileVal:      os.Getenv("EmbedLogFileVal"),
		EmbedModelPathVal:    os.Getenv("EmbedModelPathVal"),
		EmbedModelPathCmd:    os.Getenv("EmbedModelPathCmd"),
		EmbedNormalizeCmd:    os.Getenv("EmbedModelPathCmd"),
		EmbedNormalizeVal:    os.Getenv("EmbedModelPathVal"),
	}
	args := []string{
		out.EmbedPoolingCmd, out.EmbedPoolingVal,
		out.EmbedCtxSizeCmd, out.EmbedCtxSizeVal,
		out.EmbedBatchSizeCmd, out.EmbedBatchSizeVal,
		out.EmbedOutputFormatCmd, out.EmbedOutputFormatVal,
		out.EmbedModelPathCmd, out.EmbedModelPathVal,
		out.EmbedNormalizeCmd, out.EmbedNormalizeVal,
	}

	return args
}

func StructToArgs(args LlamaCppArgs) []string {
	var result []string

	// Helper function for NullString pairs
	addCmdValPair := func(cmd sql.NullString, val sql.NullString) {
		if len(val.String) != 0 {
			result = append(result, cmd.String, val.String)
		}
	}

	// Helper function for NullString and NullBool pairs

	addCmdBoolPair := func(cmd sql.NullString, val sql.NullBool) {
		if val.Bool == true {
			// Convert boolean to string before adding it to the result
			result = append(result, cmd.String)
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
	addCmdValPair(args.LogFileCmd, args.LogFileVal)
	addCmdBoolPair(args.NoDisplayPromptCmd, args.NoDisplayPromptEnabled)
	addCmdValPair(args.TopPCmd, args.TopPVal)
	addCmdBoolPair(args.LogVerboseCmd, args.LogVerboseEnabled)
	return result

}

type LlamaCppArgs struct {
	ID                         string
	Description                string
	PromptCmd                  sql.NullString
	PromptCmdEnabled           sql.NullBool
	ConversationCmd            sql.NullString
	ConversationCmdEnabled     sql.NullBool
	ChatTemplateCmd            sql.NullString
	ChatTemplateVal            sql.NullString
	MultilineInputCmd          sql.NullString
	MultilineInputCmdEnabled   sql.NullBool
	CtxSizeCmd                 sql.NullString
	CtxSizeVal                 sql.NullString
	RopeScaleVal               sql.NullString
	RopeScaleCmd               sql.NullString
	PromptCacheCmd             sql.NullString
	PromptCacheVal             sql.NullString
	PromptFileCmd              sql.NullString
	PromptFileVal              sql.NullString
	InteractiveFirstCmd        sql.NullString
	InteractiveFirstCmdEnabled sql.NullBool
	InteractiveModeCmdEnabled  sql.NullBool
	InteractiveModeCmd         sql.NullString
	ReversePromptCmd           sql.NullString
	ReversePromptVal           sql.NullString
	InPrefixCmd                sql.NullString
	InPrefixVal                sql.NullString
	InSuffixCmd                sql.NullString
	InSuffixVal                sql.NullString
	GPULayersCmd               sql.NullString
	GPULayersVal               sql.NullString
	ThreadsBatchCmd            sql.NullString
	ThreadsBatchVal            sql.NullString
	ThreadsCmd                 sql.NullString
	ThreadsVal                 sql.NullString
	KeepCmd                    sql.NullString
	KeepVal                    sql.NullString
	TopKCmd                    sql.NullString
	TopKVal                    sql.NullString
	MainGPUCmd                 sql.NullString
	MainGPUVal                 sql.NullString
	RepeatPenaltyCmd           sql.NullString
	RepeatPenaltyVal           sql.NullString
	RepeatLastPenaltyCmd       sql.NullString
	RepeatLastPenaltyVal       sql.NullString
	MemLockCmd                 sql.NullString
	MemLockCmdEnabled          sql.NullBool
	EscapeNewLinesCmd          sql.NullString
	EscapeNewLinesCmdEnabled   sql.NullBool
	LogVerboseCmd              sql.NullString
	LogVerboseEnabled          sql.NullBool
	TemperatureVal             sql.NullString
	TemperatureCmd             sql.NullString
	PredictCmd                 sql.NullString
	PredictVal                 sql.NullString
	ModelFullPath              sql.NullString
	ModelCmd                   sql.NullString
	PromptText                 sql.NullString
	NoDisplayPromptCmd         sql.NullString
	NoDisplayPromptEnabled     sql.NullBool
	TopPCmd                    sql.NullString
	TopPVal                    sql.NullString
	LogFileCmd                 sql.NullString
	LogFileVal                 sql.NullString
}

type LlamaCppEmbedArgs struct {
	EmbedCtxSizeCmd      string
	EmbedCtxSizeVal      string
	EmbedBatchSizeCmd    string
	EmbedBatchSizeVal    string
	EmbedSeparatorCmd    string
	EmbedSeparatorVal    string
	EmbedModelPathCmd    string
	EmbedModelPathVal    string
	EmbedLogFileCmd      string
	EmbedLogFileVal      string
	EmbedPoolingCmd      string
	EmbedPoolingVal      string
	EmbedOutputFormatCmd string
	EmbedOutputFormatVal string
	EmbedNormalizeCmd    string
	EmbedNormalizeVal    string
}
type ModelFile struct {
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
