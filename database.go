package main

import (
	"database/sql"
	_ "modernc.org/sqlite"
)

func GetDefaultSettings(args LlamaCppArgs) (LlamaCppArgs, error) {

	db, err := sql.Open("sqlite", "./db/byte-vision-app-settings.db")
	if err != nil {
		Log.Error(err.Error())
		return args, err
	}
	stmt, err := db.Prepare("SELECT * FROM llamaCppArgs WHERE ID = ?")
	if err != nil {
		Log.Error(err.Error())
		return args, err
	}
	defer func(stmt *sql.Stmt) {
		err := stmt.Close()
		if err != nil {
			Log.Error(err.Error())
		}
	}(stmt)
	err = stmt.QueryRow(1).Scan(&args.ID,
		&args.Description,
		&args.PromptCmd,
		&args.PromptCmdEnabled,
		&args.ConversationCmd,
		&args.ConversationCmdEnabled,
		&args.ChatTemplateCmd,
		&args.ChatTemplateVal,
		&args.MultilineInputCmd,
		&args.MultilineInputCmdEnabled,
		&args.CtxSizeCmd,
		&args.CtxSizeVal,
		&args.RopeScaleVal,
		&args.RopeScaleCmd,
		&args.PromptCacheCmd,
		&args.PromptCacheVal,
		&args.PromptFileCmd,
		&args.PromptFileVal,
		&args.InteractiveFirstCmd,
		&args.InteractiveFirstCmdEnabled,
		&args.InteractiveModeCmd,
		&args.InteractiveModeCmdEnabled,
		&args.ReversePromptCmd,
		&args.ReversePromptVal,
		&args.InPrefixCmd,
		&args.InPrefixVal,
		&args.InSuffixCmd,
		&args.InSuffixVal,
		&args.GPULayersCmd,
		&args.GPULayersVal,
		&args.ThreadsBatchCmd,
		&args.ThreadsBatchVal,
		&args.ThreadsCmd,
		&args.ThreadsVal,
		&args.KeepCmd,
		&args.KeepVal,
		&args.TopKCmd,
		&args.TopKVal,
		&args.MainGPUCmd,
		&args.MainGPUVal,
		&args.RepeatPenaltyCmd,
		&args.RepeatPenaltyVal,
		&args.RepeatLastPenaltyCmd,
		&args.RepeatLastPenaltyVal,
		&args.MemLockCmd,
		&args.MemLockCmdEnabled,
		&args.EscapeNewLinesCmd,
		&args.EscapeNewLinesCmdEnabled,
		&args.LogVerboseCmd,
		&args.LogVerboseEnabled,
		&args.TemperatureVal,
		&args.TemperatureCmd,
		&args.PredictCmd,
		&args.PredictVal,
		&args.ModelFullPath,
		&args.ModelCmd,
		&args.PromptText,
		&args.NoDisplayPromptCmd,
		&args.NoDisplayPromptEnabled,
		&args.TopPCmd,
		&args.TopPVal,
		&args.LogFileCmd,
		&args.LogFileVal,
	)
	if err != nil {
		Log.Error(err.Error())
	}
	defer func(db *sql.DB) {
		err := db.Close()
		if err != nil {
			Log.Error(err.Error())
		}
	}(db)
	return args, err
}
