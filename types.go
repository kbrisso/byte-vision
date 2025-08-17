package main

import (
	"encoding/json"
	"os"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

func ParseDefaultLlamaCliEnv() LlamaCliArgs {
	out := LlamaCliArgs{
		Description:                os.Getenv("Description"),
		VerbosePromptCmd:           os.Getenv("VerbosePromptCmd"),
		VerbosePromptCmdEnabled:    getEnvBool(os.Getenv("VerbosePromptCmdEnabled"), false),
		ThreadsCmd:                 os.Getenv("ThreadsCmd"),
		ThreadsVal:                 os.Getenv("ThreadsVal"),
		ThreadsBatchCmd:            os.Getenv("ThreadsBatchCmd"),
		ThreadsBatchVal:            os.Getenv("ThreadsBatchVal"),
		CpuMaskCmd:                 os.Getenv("CpuMaskCmd"),
		CpuMaskVal:                 os.Getenv("CpuMaskVal"),
		CpuRangeCmd:                os.Getenv("CpuRangeCmd"),
		CpuRangeVal:                os.Getenv("CpuRangeVal"),
		CpuStrictCmd:               os.Getenv("CpuStrictCmd"),
		CpuStrictVal:               os.Getenv("CpuStrictVal"),
		PrioCmd:                    os.Getenv("PrioCmd"),
		PrioVal:                    os.Getenv("PrioVal"),
		PollCmd:                    os.Getenv("PollCmd"),
		PollVal:                    os.Getenv("PollVal"),
		CpuMaskBatchCmd:            os.Getenv("CpuMaskBatchCmd"),
		CpuMaskBatchVal:            os.Getenv("CpuMaskBatchVal"),
		CpuRangeBatchCmd:           os.Getenv("CpuRangeBatchCmd"),
		CpuRangeBatchVal:           os.Getenv("CpuRangeBatchVal"),
		CpuStrictBatchCmd:          os.Getenv("CpuStrictBatchCmd"),
		CpuStrictBatchVal:          os.Getenv("CpuStrictBatchVal"),
		PrioBatchCmd:               os.Getenv("PrioBatchCmd"),
		PrioBatchVal:               os.Getenv("PrioBatchVal"),
		PollBatchCmd:               os.Getenv("PollBatchCmd"),
		PollBatchVal:               os.Getenv("PollBatchVal"),
		CtxSizeCmd:                 os.Getenv("CtxSizeCmd"),
		CtxSizeVal:                 os.Getenv("CtxSizeVal"),
		PredictCmd:                 os.Getenv("PredictCmd"),
		PredictVal:                 os.Getenv("PredictVal"),
		BatchCmd:                   os.Getenv("BatchCmd"),
		BatchCmdVal:                os.Getenv("BatchCmdVal"),
		UBatchCmd:                  os.Getenv("UBatchCmd"),
		UBatchCmdVal:               os.Getenv("UBatchCmdVal"),
		KeepCmd:                    os.Getenv("KeepCmd"),
		KeepVal:                    os.Getenv("KeepVal"),
		FlashAttentionCmd:          os.Getenv("FlashAttentionCmd"),
		FlashAttentionCmdEnabled:   getEnvBool(os.Getenv("FlashAttentionCmdEnabled"), false),
		PromptCmd:                  os.Getenv("PromptCmd"),
		PromptCmdEnabled:           getEnvBool(os.Getenv("PromptCmdEnabled"), false),
		PromptText:                 os.Getenv("PromptText"),
		NoPerfCmd:                  os.Getenv("NoPerfCmd"),
		NoPerfCmdEnabled:           getEnvBool(os.Getenv("NoPerfCmdEnabled"), false),
		PromptFileCmd:              os.Getenv("PromptFileCmd"),
		PromptFileVal:              os.Getenv("PromptFileVal"),
		BinaryFileCmd:              os.Getenv("BinaryFileCmd"),
		BinaryFileVal:              os.Getenv("BinaryFileVal"),
		EscapeNewLinesCmd:          os.Getenv("EscapeNewLinesCmd"),
		EscapeNewLinesCmdEnabled:   getEnvBool(os.Getenv("EscapeNewLinesCmdEnabled"), false),
		NoEscapeCmd:                os.Getenv("NoEscapeCmd"),
		NoEscapeCmdEnabled:         getEnvBool(os.Getenv("NoEscapeCmdEnabled"), false),
		RopeScalingCmd:             os.Getenv("RopeScalingCmd"),
		RopeScalingVal:             os.Getenv("RopeScalingVal"),
		RopeScaleCmd:               os.Getenv("RopeScaleCmd"),
		RopeScaleVal:               os.Getenv("RopeScaleVal"),
		RopeFreqBaseCmd:            os.Getenv("RopeFreqBaseCmd"),
		RopeFreqBaseVal:            os.Getenv("RopeFreqBaseVal"),
		RopeFreqScaleCmd:           os.Getenv("RopeFreqScaleCmd"),
		RopeFreqScaleVal:           os.Getenv("RopeFreqScaleVal"),
		YarnOrigContextCmd:         os.Getenv("YarnOrigContextCmd"),
		YarnOrigContextCmdVal:      os.Getenv("YarnOrigContextCmdVal"),
		YarnExtFactorCmd:           os.Getenv("YarnExtFactorCmd"),
		YarnExtFactorVal:           os.Getenv("YarnExtFactorVal"),
		YarnAttnFactorCmd:          os.Getenv("YarnAttnFactorCmd"),
		YarnAttnFactorVal:          os.Getenv("YarnAttnFactorVal"),
		YarnBetaSlowCmd:            os.Getenv("YarnBetaSlowCmd"),
		YarnBetaSlowVal:            os.Getenv("YarnBetaSlowVal"),
		YarnBetaFastCmd:            os.Getenv("YarnBetaFastCmd"),
		YarnBetaFastVal:            os.Getenv("YarnBetaFastVal"),
		DumpKvCacheCmd:             os.Getenv("DumpKvCacheCmd"),
		DumpKvCacheCmdEnabled:      getEnvBool(os.Getenv("DumpKvCacheCmdEnabled"), false),
		NoKvOffloadCmd:             os.Getenv("NoKvOffloadCmd"),
		NoKvOffloadCmdEnabled:      getEnvBool(os.Getenv("NoKvOffloadCmdEnabled"), false),
		CacheTypeKCmd:              os.Getenv("CacheTypeKCmd"),
		CacheTypeKVal:              os.Getenv("CacheTypeKVal"),
		CacheTypeVCmd:              os.Getenv("CacheTypeVCmd"),
		CacheTypeVVal:              os.Getenv("CacheTypeVVal"),
		DefragTholdCmd:             os.Getenv("DefragTholdCmd"),
		DefragTholdVal:             os.Getenv("DefragTholdVal"),
		ParallelCmd:                os.Getenv("ParallelCmd"),
		ParallelVal:                os.Getenv("ParallelVal"),
		RpcCmd:                     os.Getenv("RpcCmd"),
		RpcVal:                     os.Getenv("RpcVal"),
		MemLockCmd:                 os.Getenv("MemLockCmd"),
		MemLockCmdEnabled:          getEnvBool(os.Getenv("MemLockCmdEnabled"), false),
		NoMmapCmd:                  os.Getenv("NoMmapCmd"),
		NoMmapCmdEnabled:           getEnvBool(os.Getenv("NoMmapCmdEnabled"), false),
		NumaCmd:                    os.Getenv("NumaCmd"),
		NumaVal:                    os.Getenv("NumaVal"),
		DeviceCmd:                  os.Getenv("DeviceCmd"),
		DeviceVal:                  os.Getenv("DeviceVal"),
		ListDevicesCmd:             os.Getenv("ListDevicesCmd"),
		ListDevicesCmdEnabled:      getEnvBool(os.Getenv("ListDevicesCmdEnabled"), false),
		OverrideTensorCmd:          os.Getenv("OverrideTensorCmd"),
		OverrideTensorVal:          os.Getenv("OverrideTensorVal"),
		GPULayersCmd:               os.Getenv("GPULayersCmd"),
		GPULayersVal:               os.Getenv("GPULayersVal"),
		SplitModeCmd:               os.Getenv("SplitModeCmd"),
		SplitModeCmdVal:            os.Getenv("SplitModeCmdVal"),
		TensorSplitCmd:             os.Getenv("TensorSplitCmd"),
		TensorSplitVal:             os.Getenv("TensorSplitVal"),
		MainGPUCmd:                 os.Getenv("MainGPUCmd"),
		MainGPUVal:                 os.Getenv("MainGPUVal"),
		CheckTensorsCmd:            os.Getenv("CheckTensorsCmd"),
		CheckTensorsCmdEnabled:     getEnvBool(os.Getenv("CheckTensorsCmdEnabled"), false),
		OverrideKvCmd:              os.Getenv("OverrideKvCmd"),
		OverrideKvVal:              os.Getenv("OverrideKvVal"),
		LoraCmd:                    os.Getenv("LoraCmd"),
		LoraVal:                    os.Getenv("LoraVal"),
		LoraScaledCmd:              os.Getenv("LoraScaledCmd"),
		LoraScaledVal:              os.Getenv("LoraScaledVal"),
		ControlVectorCmd:           os.Getenv("ControlVectorCmd"),
		ControlVectorVal:           os.Getenv("ControlVectorVal"),
		ControlVectorScaledCmd:     os.Getenv("ControlVectorScaledCmd"),
		ControlVectorScaledVal:     os.Getenv("ControlVectorScaledVal"),
		ControlVectorLayerRangeCmd: os.Getenv("ControlVectorLayerRangeCmd"),
		ControlVectorLayerRangeVal: os.Getenv("ControlVectorLayerRangeVal"),
		ModelCmd:                   os.Getenv("ModelCmd"),
		ModelFullPathVal:           os.Getenv("ModelFullPathVal"),
		ModelUrlCmd:                os.Getenv("ModelUrlCmd"),
		ModelUrlVal:                os.Getenv("ModelUrlVal"),
		HfRepoCmd:                  os.Getenv("HfRepoCmd"),
		HfRepoVal:                  os.Getenv("HfRepoVal"),
		HfRepoDraftCmd:             os.Getenv("HfRepoDraftCmd"),
		HfRepoDraftVal:             os.Getenv("HfRepoDraftVal"),
		HfFileCmd:                  os.Getenv("HfFileCmd"),
		HfFileVal:                  os.Getenv("HfFileVal"),
		HfRepoVCmd:                 os.Getenv("HfRepoVCmd"),
		HfRepoVVal:                 os.Getenv("HfRepoVVal"),
		HfFileVCmd:                 os.Getenv("HfFileVCmd"),
		HfFileVVal:                 os.Getenv("HfFileVVal"),
		HfTokenCmd:                 os.Getenv("HfTokenCmd"),
		HfTokenVal:                 os.Getenv("HfTokenVal"),
		LogDisableCmd:              os.Getenv("LogDisableCmd"),
		LogDisableCmdEnabled:       getEnvBool(os.Getenv("LogDisableCmdEnabled"), false),
		ModelLogFileCmd:            os.Getenv("ModelLogFileCmd"),
		ModelLogFileNameVal:        os.Getenv("ModelLogFileNameVal"),
		LogColorsCmd:               os.Getenv("LogColorsCmd"),
		LogColorsCmdEnabled:        getEnvBool(os.Getenv("LogColorsCmdEnabled"), false),
		LogVerboseCmd:              os.Getenv("LogVerboseCmd"),
		LogVerboseEnabled:          getEnvBool(os.Getenv("LogVerboseEnabled"), false),
		LogVerbosityCmd:            os.Getenv("LogVerbosityCmd"),
		LogVerbosityVal:            os.Getenv("LogVerbosityVal"),
		LogPrefixCmd:               os.Getenv("LogPrefixCmd"),
		LogPrefixCmdEnabled:        getEnvBool(os.Getenv("LogPrefixCmdEnabled"), false),
		LogTimestampsCmd:           os.Getenv("LogTimestampsCmd"),
		LogTimestampsCmdEnabled:    getEnvBool(os.Getenv("LogTimestampsCmdEnabled"), false),

		// ----- sampling params -----
		SamplersCmd:           os.Getenv("SamplersCmd"),
		SamplersVal:           os.Getenv("SamplersVal"),
		RandomSeedCmd:         os.Getenv("RandomSeedCmd"),
		RandomSeedVal:         os.Getenv("RandomSeedVal"),
		SamplingSeqCmd:        os.Getenv("SamplingSeqCmd"),
		SamplingSeqVal:        os.Getenv("SamplingSeqVal"),
		IgnoreEosCmd:          os.Getenv("IgnoreEosCmd"),
		IgnoreEosCmdEnabled:   getEnvBool(os.Getenv("IgnoreEosCmdEnabled"), false),
		TemperatureCmd:        os.Getenv("TemperatureCmd"),
		TemperatureVal:        os.Getenv("TemperatureVal"),
		TopKCmd:               os.Getenv("TopKCmd"),
		TopKVal:               os.Getenv("TopKVal"),
		TopPCmd:               os.Getenv("TopPCmd"),
		TopPVal:               os.Getenv("TopPVal"),
		MinPCmd:               os.Getenv("MinPCmd"),
		MinPVal:               os.Getenv("MinPVal"),
		TopNSigmaCmd:          os.Getenv("TopNSigmaCmd"),
		TopNSigmaVal:          os.Getenv("TopNSigmaVal"),
		XtcProbabilityCmd:     os.Getenv("XtcProbabilityCmd"),
		XtcProbabilityVal:     os.Getenv("XtcProbabilityVal"),
		XtcThresholdCmd:       os.Getenv("XtcThresholdCmd"),
		XtcThresholdVal:       os.Getenv("XtcThresholdVal"),
		TypicalCmd:            os.Getenv("TypicalCmd"),
		TypicalVal:            os.Getenv("TypicalVal"),
		RepeatLastPenaltyCmd:  os.Getenv("RepeatLastPenaltyCmd"),
		RepeatLastPenaltyVal:  os.Getenv("RepeatLastPenaltyVal"),
		RepeatPenaltyCmd:      os.Getenv("RepeatPenaltyCmd"),
		RepeatPenaltyVal:      os.Getenv("RepeatPenaltyVal"),
		PresencePenaltyCmd:    os.Getenv("PresencePenaltyCmd"),
		PresencePenaltyVal:    os.Getenv("PresencePenaltyVal"),
		FrequencyPenaltyCmd:   os.Getenv("FrequencyPenaltyCmd"),
		FrequencyPenaltyVal:   os.Getenv("FrequencyPenaltyVal"),
		DryMultiplierCmd:      os.Getenv("DryMultiplierCmd"),
		DryMultiplierVal:      os.Getenv("DryMultiplierVal"),
		DryBaseCmd:            os.Getenv("DryBaseCmd"),
		DryBaseVal:            os.Getenv("DryBaseVal"),
		DryAllowedLengthCmd:   os.Getenv("DryAllowedLengthCmd"),
		DryAllowedLengthVal:   os.Getenv("DryAllowedLengthVal"),
		DryPenaltyLastNCmd:    os.Getenv("DryPenaltyLastNCmd"),
		DryPenaltyLastNVal:    os.Getenv("DryPenaltyLastNVal"),
		DrySequenceBreakerCmd: os.Getenv("DrySequenceBreakerCmd"),
		DrySequenceBreakerVal: os.Getenv("DrySequenceBreakerVal"),
		DynatempRangeCmd:      os.Getenv("DynatempRangeCmd"),
		DynatempRangeVal:      os.Getenv("DynatempRangeVal"),
		DynatempExpCmd:        os.Getenv("DynatempExpCmd"),
		DynatempExpVal:        os.Getenv("DynatempExpVal"),
		MirostatCmd:           os.Getenv("MirostatCmd"),
		MirostatVal:           os.Getenv("MirostatVal"),
		MirostatLrCmd:         os.Getenv("MirostatLrCmd"),
		MirostatLrVal:         os.Getenv("MirostatLrVal"),
		MirostatEntCmd:        os.Getenv("MirostatEntCmd"),
		MirostatEntVal:        os.Getenv("MirostatEntVal"),
		LogitBiasCmd:          os.Getenv("LogitBiasCmd"),
		LogitBiasVal:          os.Getenv("LogitBiasVal"),
		GrammarCmd:            os.Getenv("GrammarCmd"),
		GrammarVal:            os.Getenv("GrammarVal"),
		GrammarFileCmd:        os.Getenv("GrammarFileCmd"),
		GrammarFileVal:        os.Getenv("GrammarFileVal"),
		JsonSchemaCmd:         os.Getenv("JsonSchemaCmd"),
		JsonSchemaVal:         os.Getenv("JsonSchemaVal"),
		JsonSchemaFileCmd:     os.Getenv("JsonSchemaFileCmd"),
		JsonSchemaFileVal:     os.Getenv("JsonSchemaFileVal"),

		// ----- example-specific params -----
		NoDisplayPromptCmd:         os.Getenv("NoDisplayPromptCmd"),
		NoDisplayPromptEnabled:     getEnvBool(os.Getenv("NoDisplayPromptEnabled"), false),
		NoContextShiftCmd:          os.Getenv("NoContextShiftCmd"),
		NoContextShiftCmdEnabled:   getEnvBool(os.Getenv("NoContextShiftCmdEnabled"), false),
		SystemPromptCmd:            os.Getenv("SystemPromptCmd"),
		SystemPromptVal:            os.Getenv("SystemPromptVal"),
		SystemPromptFileCmd:        os.Getenv("SystemPromptFileCmd"),
		SystemPromptFileVal:        os.Getenv("SystemPromptFileVal"),
		PrintTokenCountCmd:         os.Getenv("PrintTokenCountCmd"),
		PrintTokenCountVal:         os.Getenv("PrintTokenCountVal"),
		PromptCacheCmd:             os.Getenv("PromptCacheCmd"),
		PromptCacheVal:             os.Getenv("PromptCacheVal"),
		PromptCacheAllCmd:          os.Getenv("PromptCacheAllCmd"),
		PromptCacheAllCmdEnabled:   getEnvBool(os.Getenv("PromptCacheAllCmdEnabled"), false),
		PromptCacheRoCmd:           os.Getenv("PromptCacheRoCmd"),
		PromptCacheRoCmdEnabled:    getEnvBool(os.Getenv("PromptCacheRoCmdEnabled"), false),
		ReversePromptCmd:           os.Getenv("ReversePromptCmd"),
		ReversePromptVal:           os.Getenv("ReversePromptVal"),
		SpecialCmd:                 os.Getenv("SpecialCmd"),
		SpecialCmdEnabled:          getEnvBool(os.Getenv("SpecialCmdEnabled"), false),
		ConversationCmd:            os.Getenv("ConversationCmd"),
		ConversationCmdEnabled:     getEnvBool(os.Getenv("ConversationCmdEnabled"), false),
		NoConversationCmd:          os.Getenv("NoConversationCmd"),
		NoConversationCmdEnabled:   getEnvBool(os.Getenv("NoConversationCmdEnabled"), false),
		SingleTurnCmd:              os.Getenv("SingleTurnCmd"),
		SingleTurnCmdEnabled:       getEnvBool(os.Getenv("SingleTurnCmdEnabled"), false),
		InteractiveCmd:             os.Getenv("InteractiveCmd"),
		InteractiveCmdEnabled:      getEnvBool(os.Getenv("InteractiveCmdEnabled"), false),
		InteractiveFirstCmd:        os.Getenv("InteractiveFirstCmd"),
		InteractiveFirstCmdEnabled: getEnvBool(os.Getenv("InteractiveFirstCmdEnabled"), false),
		MultilineInputCmd:          os.Getenv("MultilineInputCmd"),
		MultilineInputCmdEnabled:   getEnvBool(os.Getenv("MultilineInputCmdEnabled"), false),
		InPrefixBosCmd:             os.Getenv("InPrefixBosCmd"),
		InPrefixBosCmdEnabled:      getEnvBool(os.Getenv("InPrefixBosCmdEnabled"), false),
		InPrefixCmd:                os.Getenv("InPrefixCmd"),
		InPrefixVal:                os.Getenv("InPrefixVal"),
		InSuffixCmd:                os.Getenv("InSuffixCmd"),
		InSuffixVal:                os.Getenv("InSuffixVal"),
		NoWarmupCmd:                os.Getenv("NoWarmupCmd"),
		NoWarmupCmdEnabled:         getEnvBool(os.Getenv("NoWarmupCmdEnabled"), false),
		GrpAttnNCmd:                os.Getenv("GrpAttnNCmd"),
		GrpAttnNVal:                os.Getenv("GrpAttnNVal"),
		GrpAttnWCmd:                os.Getenv("GrpAttnWCmd"),
		GrpAttnWVal:                os.Getenv("GrpAttnWVal"),
		JinjaCmd:                   os.Getenv("JinjaCmd"),
		JinjaCmdEnabled:            getEnvBool(os.Getenv("JinjaCmdEnabled"), false),
		ReasoningFormatCmd:         os.Getenv("ReasoningFormatCmd"),
		ReasoningFormatVal:         os.Getenv("ReasoningFormatVal"),
		ChatTemplateCmd:            os.Getenv("ChatTemplateCmd"),
		ChatTemplateVal:            os.Getenv("ChatTemplateVal"),
		ChatTemplateFileCmd:        os.Getenv("ChatTemplateFileCmd"),
		ChatTemplateFileVal:        os.Getenv("ChatTemplateFileVal"),
		SimpleIoCmd:                os.Getenv("SimpleIoCmd"),
		SimpleIoCmdEnabled:         getEnvBool(os.Getenv("SimpleIoCmdEnabled"), false),
	}
	return out
}

func ParseDefaultLlamaEmbedEnv() LlamaEmbedArgs {
	out := LlamaEmbedArgs{
		Description: os.Getenv("Description"),

		// ----- common params -----
		EmbedVerbosePromptCmd:           os.Getenv("EmbedVerbosePromptCmd"),
		EmbedVerbosePromptCmdEnabled:    getEnvBool(os.Getenv("EmbedVerbosePromptCmdEnabled"), false),
		EmbedThreadsCmd:                 os.Getenv("EmbedThreadsCmd"),
		EmbedThreadsVal:                 os.Getenv("EmbedThreadsVal"),
		EmbedThreadsBatchCmd:            os.Getenv("EmbedThreadsBatchCmd"),
		EmbedThreadsBatchVal:            os.Getenv("EmbedThreadsBatchVal"),
		EmbedCpuMaskCmd:                 os.Getenv("EmbedCpuMaskCmd"),
		EmbedCpuMaskVal:                 os.Getenv("EmbedCpuMaskVal"),
		EmbedCpuRangeCmd:                os.Getenv("EmbedCpuRangeCmd"),
		EmbedCpuRangeVal:                os.Getenv("EmbedCpuRangeVal"),
		EmbedCpuStrictCmd:               os.Getenv("EmbedCpuStrictCmd"),
		EmbedCpuStrictVal:               os.Getenv("EmbedCpuStrictVal"),
		EmbedPrioCmd:                    os.Getenv("EmbedPrioCmd"),
		EmbedPrioVal:                    os.Getenv("EmbedPrioVal"),
		EmbedPollCmd:                    os.Getenv("EmbedPollCmd"),
		EmbedPollVal:                    os.Getenv("EmbedPollVal"),
		EmbedCpuMaskBatchCmd:            os.Getenv("EmbedCpuMaskBatchCmd"),
		EmbedCpuMaskBatchVal:            os.Getenv("EmbedCpuMaskBatchVal"),
		EmbedCpuRangeBatchCmd:           os.Getenv("EmbedCpuRangeBatchCmd"),
		EmbedCpuRangeBatchVal:           os.Getenv("EmbedCpuRangeBatchVal"),
		EmbedCpuStrictBatchCmd:          os.Getenv("EmbedCpuStrictBatchCmd"),
		EmbedCpuStrictBatchVal:          os.Getenv("EmbedCpuStrictBatchVal"),
		EmbedPrioBatchCmd:               os.Getenv("EmbedPrioBatchCmd"),
		EmbedPrioBatchVal:               os.Getenv("EmbedPrioBatchVal"),
		EmbedPollBatchCmd:               os.Getenv("EmbedPollBatchCmd"),
		EmbedPollBatchVal:               os.Getenv("EmbedPollBatchVal"),
		EmbedCtxSizeCmd:                 os.Getenv("EmbedCtxSizeCmd"),
		EmbedCtxSizeVal:                 os.Getenv("EmbedCtxtSizeVal"),
		EmbedPredictCmd:                 os.Getenv("EmbedPredictCmd"),
		EmbedPredictVal:                 os.Getenv("EmbedPredictVal"),
		EmbedBatchCmd:                   os.Getenv("EmbedBatchCmd"),
		EmbedBatchVal:                   os.Getenv("EmbedBatchVal"),
		EmbedUBatchCmd:                  os.Getenv("EmbedUBatchCmd"),
		EmbedUBatchVal:                  os.Getenv("EmbedUBatchVal"),
		EmbedKeepCmd:                    os.Getenv("EmbedKeepCmd"),
		EmbedKeepVal:                    os.Getenv("EmbedKeepVal"),
		EmbedFlashAttentionCmd:          os.Getenv("EmbedFlashAttentionCmd"),
		EmbedFlashAttentionCmdEnabled:   getEnvBool(os.Getenv("EmbedFlashAttentionCmdEnabled"), false),
		EmbedPromptCmd:                  os.Getenv("EmbedPromptCmd"),
		EmbedPromptCmdEnabled:           getEnvBool(os.Getenv("EmbedPromptCmdEnabled"), false),
		EmbedPromptText:                 os.Getenv("EmbedPromptText"),
		EmbedNoPerfCmd:                  os.Getenv("EmbedNoPerfCmd"),
		EmbedNoPerfCmdEnabled:           getEnvBool(os.Getenv("EmbedNoPerfCmdEnabled"), false),
		EmbedPromptFileCmd:              os.Getenv("EmbedPromptFileCmd"),
		EmbedPromptFileVal:              os.Getenv("EmbedPromptFileVal"),
		EmbedBinaryFileCmd:              os.Getenv("EmbedBinaryFileCmd"),
		EmbedBinaryFileVal:              os.Getenv("EmbedBinaryFileVal"),
		EmbedEscapeNewLinesCmd:          os.Getenv("EmbedEscapeNewLinesCmd"),
		EmbedEscapeNewLinesCmdEnabled:   getEnvBool(os.Getenv("EmbedEscapeNewLinesCmdEnabled"), false),
		EmbedNoEscapeCmd:                os.Getenv("EmbedNoEscapeCmd"),
		EmbedNoEscapeCmdEnabled:         getEnvBool(os.Getenv("EmbedNoEscapeCmdEnabled"), false),
		EmbedRopeScalingCmd:             os.Getenv("EmbedRopeScalingCmd"),
		EmbedRopeScalingVal:             os.Getenv("EmbedRopeScalingVal"),
		EmbedRopeScaleCmd:               os.Getenv("EmbedRopeScaleCmd"),
		EmbedRopeScaleVal:               os.Getenv("EmbedRopeScaleVal"),
		EmbedRopeFreqBaseCmd:            os.Getenv("EmbedRopeFreqBaseCmd"),
		EmbedRopeFreqBaseVal:            os.Getenv("EmbedRopeFreqBaseVal"),
		EmbedRopeFreqScaleCmd:           os.Getenv("EmbedRopeFreqScaleCmd"),
		EmbedRopeFreqScaleVal:           os.Getenv("EmbedRopeFreqScaleVal"),
		EmbedYarnOrigContextCmd:         os.Getenv("EmbedYarnOrigContextCmd"),
		EmbedYarnOrigContextVal:         os.Getenv("EmbedYarnOrigContextVal"),
		EmbedYarnExtFactorCmd:           os.Getenv("EmbedYarnExtFactorCmd"),
		EmbedYarnExtFactorVal:           os.Getenv("EmbedYarnExtFactorVal"),
		EmbedYarnAttnFactorCmd:          os.Getenv("EmbedYarnAttnFactorCmd"),
		EmbedYarnAttnFactorVal:          os.Getenv("EmbedYarnAttnFactorVal"),
		EmbedYarnBetaSlowCmd:            os.Getenv("EmbedYarnBetaSlowCmd"),
		EmbedYarnBetaSlowVal:            os.Getenv("EmbedYarnBetaSlowVal"),
		EmbedYarnBetaFastCmd:            os.Getenv("EmbedYarnBetaFastCmd"),
		EmbedYarnBetaFastVal:            os.Getenv("EmbedYarnBetaFastVal"),
		EmbedDumpKvCacheCmd:             os.Getenv("EmbedDumpKvCacheCmd"),
		EmbedDumpKvCacheCmdEnabled:      getEnvBool(os.Getenv("EmbedDumpKvCacheCmdEnabled"), false),
		EmbedNoKvOffloadCmd:             os.Getenv("EmbedNoKvOffloadCmd"),
		EmbedNoKvOffloadCmdEnabled:      getEnvBool(os.Getenv("EmbedNoKvOffloadCmdEnabled"), false),
		EmbedCacheTypeKCmd:              os.Getenv("EmbedCacheTypeKCmd"),
		EmbedCacheTypeKVal:              os.Getenv("EmbedCacheTypeKVal"),
		EmbedCacheTypeVCmd:              os.Getenv("EmbedCacheTypeVCmd"),
		EmbedCacheTypeVVal:              os.Getenv("EmbedCacheTypeVVal"),
		EmbedDefragTholdCmd:             os.Getenv("EmbedDefragTholdCmd"),
		EmbedDefragTholdVal:             os.Getenv("EmbedDefragTholdVal"),
		EmbedParallelCmd:                os.Getenv("EmbedParallelCmd"),
		EmbedParallelVal:                os.Getenv("EmbedParallelVal"),
		EmbedRpcCmd:                     os.Getenv("EmbedRpcCmd"),
		EmbedRpcVal:                     os.Getenv("EmbedRpcVal"),
		EmbedMemLockCmd:                 os.Getenv("EmbedMemLockCmd"),
		EmbedMemLockCmdEnabled:          getEnvBool(os.Getenv("EmbedMemLockCmdEnabled"), false),
		EmbedNoMmapCmd:                  os.Getenv("EmbedNoMmapCmd"),
		EmbedNoMmapCmdEnabled:           getEnvBool(os.Getenv("EmbedNoMmapCmdEnabled"), false),
		EmbedNumaCmd:                    os.Getenv("EmbedNumaCmd"),
		EmbedNumaVal:                    os.Getenv("EmbedNumaVal"),
		EmbedDeviceCmd:                  os.Getenv("EmbedDeviceCmd"),
		EmbedDeviceVal:                  os.Getenv("EmbedDeviceVal"),
		EmbedListDevicesCmd:             os.Getenv("EmbedListDevicesCmd"),
		EmbedListDevicesCmdEnabled:      getEnvBool(os.Getenv("EmbedListDevicesCmdEnabled"), false),
		EmbedOverrideTensorCmd:          os.Getenv("EmbedOverrideTensorCmd"),
		EmbedOverrideTensorVal:          os.Getenv("EmbedOverrideTensorVal"),
		EmbedGPULayersCmd:               os.Getenv("EmbedGPULayersCmd"),
		EmbedGPULayersVal:               os.Getenv("EmbedGPULayersVal"),
		EmbedSplitModeCmd:               os.Getenv("EmbedSplitModeCmd"),
		EmbedSplitModeVal:               os.Getenv("EmbedSplitModeVal"),
		EmbedTensorSplitCmd:             os.Getenv("EmbedTensorSplitCmd"),
		EmbedTensorSplitVal:             os.Getenv("EmbedTensorSplitVal"),
		EmbedMainGPUCmd:                 os.Getenv("EmbedMainGPUCmd"),
		EmbedMainGPUVal:                 os.Getenv("EmbedMainGPUVal"),
		EmbedCheckTensorsCmd:            os.Getenv("EmbedCheckTensorsCmd"),
		EmbedCheckTensorsCmdEnabled:     getEnvBool(os.Getenv("EmbedCheckTensorsCmdEnabled"), false),
		EmbedOverrideKvCmd:              os.Getenv("EmbedOverrideKvCmd"),
		EmbedOverrideKvVal:              os.Getenv("EmbedOverrideKvVal"),
		EmbedLoraCmd:                    os.Getenv("EmbedLoraCmd"),
		EmbedLoraVal:                    os.Getenv("EmbedLoraVal"),
		EmbedLoraScaledCmd:              os.Getenv("EmbedLoraScaledCmd"),
		EmbedLoraScaledVal:              os.Getenv("EmbedLoraScaledVal"),
		EmbedControlVectorCmd:           os.Getenv("EmbedControlVectorCmd"),
		EmbedControlVectorVal:           os.Getenv("EmbedControlVectorVal"),
		EmbedControlVectorScaledCmd:     os.Getenv("EmbedControlVectorScaledCmd"),
		EmbedControlVectorScaledVal:     os.Getenv("EmbedControlVectorScaledVal"),
		EmbedControlVectorLayerRangeCmd: os.Getenv("EmbedControlVectorLayerRangeCmd"),
		EmbedControlVectorLayerRangeVal: os.Getenv("EmbedControlVectorLayerRangeVal"),
		EmbedModelCmd:                   os.Getenv("EmbedModelCmd"),
		EmbedModelFullPathVal:           os.Getenv("EmbedModelFullPathVal"),
		EmbedModelUrlCmd:                os.Getenv("EmbedModelUrlCmd"),
		EmbedModelUrlVal:                os.Getenv("EmbedModelUrlVal"),
		EmbedHfRepoCmd:                  os.Getenv("EmbedHfRepoCmd"),
		EmbedHfRepoVal:                  os.Getenv("EmbedHfRepoVal"),
		EmbedHfRepoDraftCmd:             os.Getenv("EmbedHfRepoDraftCmd"),
		EmbedHfRepoDraftVal:             os.Getenv("EmbedHfRepoDraftVal"),
		EmbedHfFileCmd:                  os.Getenv("EmbedHfFileCmd"),
		EmbedHfFileVal:                  os.Getenv("EmbedHfFileVal"),
		EmbedHfRepoVCmd:                 os.Getenv("EmbedHfRepoVCmd"),
		EmbedHfRepoVVal:                 os.Getenv("EmbedHfRepoVVal"),
		EmbedHfFileVCmd:                 os.Getenv("EmbedHfFileVCmd"),
		EmbedHfFileVVal:                 os.Getenv("EmbedHfFileVVal"),
		EmbedHfTokenCmd:                 os.Getenv("EmbedHfTokenCmd"),
		EmbedHfTokenVal:                 os.Getenv("EmbedHfTokenVal"),
		EmbedLogDisableCmd:              os.Getenv("EmbedLogDisableCmd"),
		EmbedLogDisableCmdEnabled:       getEnvBool(os.Getenv("EmbedLogDisableCmdEnabled"), false),
		EmbedModelLogFileCmd:            os.Getenv("EmbedModelLogFileCmd"),
		EmbedModelLogFileNameVal:        os.Getenv("EmbedModelLogFileNameVal"),
		EmbedLogColorsCmd:               os.Getenv("EmbedLogColorsCmd"),
		EmbedLogColorsCmdEnabled:        getEnvBool(os.Getenv("EmbedLogColorsCmdEnabled"), false),
		EmbedLogVerboseCmd:              os.Getenv("EmbedLogVerboseCmd"),
		EmbedLogVerboseEnabled:          getEnvBool(os.Getenv("EmbedLogVerboseEnabled"), false),
		EmbedLogVerbosityCmd:            os.Getenv("EmbedLogVerbosityCmd"),
		EmbedLogVerbosityVal:            os.Getenv("EmbedLogVerbosityVal"),
		EmbedLogPrefixCmd:               os.Getenv("EmbedLogPrefixCmd"),
		EmbedLogPrefixCmdEnabled:        getEnvBool(os.Getenv("EmbedLogPrefixCmdEnabled"), false),
		EmbedLogTimestampsCmd:           os.Getenv("EmbedLogTimestampsCmd"),
		EmbedLogTimestampsCmdEnabled:    getEnvBool(os.Getenv("EmbedLogTimestampsCmdEnabled"), false),

		// ----- sampling params -----
		EmbedSamplersCmd:           os.Getenv("EmbedSamplersCmd"),
		EmbedSamplersVal:           os.Getenv("EmbedSamplersVal"),
		EmbedRandomSeedCmd:         os.Getenv("EmbedRandomSeedCmd"),
		EmbedRandomSeedVal:         os.Getenv("EmbedRandomSeedVal"),
		EmbedSamplingSeqCmd:        os.Getenv("EmbedSamplingSeqCmd"),
		EmbedSamplingSeqVal:        os.Getenv("EmbedSamplingSeqVal"),
		EmbedIgnoreEosCmd:          os.Getenv("EmbedIgnoreEosCmd"),
		EmbedIgnoreEosCmdEnabled:   getEnvBool(os.Getenv("EmbedIgnoreEosCmdEnabled"), false),
		EmbedTemperatureCmd:        os.Getenv("EmbedTemperatureCmd"),
		EmbedTemperatureVal:        os.Getenv("EmbedTemperatureVal"),
		EmbedTopKCmd:               os.Getenv("EmbedTopKCmd"),
		EmbedTopKVal:               os.Getenv("EmbedTopKVal"),
		EmbedTopPCmd:               os.Getenv("EmbedTopPCmd"),
		EmbedTopPVal:               os.Getenv("EmbedTopPVal"),
		EmbedMinPCmd:               os.Getenv("EmbedMinPCmd"),
		EmbedMinPVal:               os.Getenv("EmbedMinPVal"),
		EmbedXtcProbabilityCmd:     os.Getenv("EmbedXtcProbabilityCmd"),
		EmbedXtcProbabilityVal:     os.Getenv("EmbedXtcProbabilityVal"),
		EmbedXtcThresholdCmd:       os.Getenv("EmbedXtcThresholdCmd"),
		EmbedXtcThresholdVal:       os.Getenv("EmbedXtcThresholdVal"),
		EmbedTypicalCmd:            os.Getenv("EmbedTypicalCmd"),
		EmbedTypicalVal:            os.Getenv("EmbedTypicalVal"),
		EmbedRepeatLastPenaltyCmd:  os.Getenv("EmbedRepeatLastPenaltyCmd"),
		EmbedRepeatLastPenaltyVal:  os.Getenv("EmbedRepeatLastPenaltyVal"),
		EmbedRepeatPenaltyCmd:      os.Getenv("EmbedRepeatPenaltyCmd"),
		EmbedRepeatPenaltyVal:      os.Getenv("EmbedRepeatPenaltyVal"),
		EmbedPresencePenaltyCmd:    os.Getenv("EmbedPresencePenaltyCmd"),
		EmbedPresencePenaltyVal:    os.Getenv("EmbedPresencePenaltyVal"),
		EmbedFrequencyPenaltyCmd:   os.Getenv("EmbedFrequencyPenaltyCmd"),
		EmbedFrequencyPenaltyVal:   os.Getenv("EmbedFrequencyPenaltyVal"),
		EmbedDryMultiplierCmd:      os.Getenv("EmbedDryMultiplierCmd"),
		EmbedDryMultiplierVal:      os.Getenv("EmbedDryMultiplierVal"),
		EmbedDryBaseCmd:            os.Getenv("EmbedDryBaseCmd"),
		EmbedDryBaseVal:            os.Getenv("EmbedDryBaseVal"),
		EmbedDryAllowedLengthCmd:   os.Getenv("EmbedDryAllowedLengthCmd"),
		EmbedDryAllowedLengthVal:   os.Getenv("EmbedDryAllowedLengthVal"),
		EmbedDryPenaltyLastNCmd:    os.Getenv("EmbedDryPenaltyLastNCmd"),
		EmbedDryPenaltyLastNVal:    os.Getenv("EmbedDryPenaltyLastNVal"),
		EmbedDrySequenceBreakerCmd: os.Getenv("EmbedDrySequenceBreakerCmd"),
		EmbedDrySequenceBreakerVal: os.Getenv("EmbedDrySequenceBreakerVal"),
		EmbedDynatempRangeCmd:      os.Getenv("EmbedDynatempRangeCmd"),
		EmbedDynatempRangeVal:      os.Getenv("EmbedDynatempRangeVal"),
		EmbedDynatempExpCmd:        os.Getenv("EmbedDynatempExpCmd"),
		EmbedDynatempExpVal:        os.Getenv("EmbedDynatempExpVal"),
		EmbedMirostatCmd:           os.Getenv("EmbedMirostatCmd"),
		EmbedMirostatVal:           os.Getenv("EmbedMirostatVal"),
		EmbedMirostatLrCmd:         os.Getenv("EmbedMirostatLrCmd"),
		EmbedMirostatLrVal:         os.Getenv("EmbedMirostatLrVal"),
		EmbedMirostatEntCmd:        os.Getenv("EmbedMirostatEntCmd"),
		EmbedMirostatEntVal:        os.Getenv("EmbedMirostatEntVal"),
		EmbedLogitBiasCmd:          os.Getenv("EmbedLogitBiasCmd"),
		EmbedLogitBiasVal:          os.Getenv("EmbedLogitBiasVal"),
		EmbedGrammarCmd:            os.Getenv("EmbedGrammarCmd"),
		EmbedGrammarVal:            os.Getenv("EmbedGrammarVal"),
		EmbedGrammarFileCmd:        os.Getenv("EmbedGrammarFileCmd"),
		EmbedGrammarFileVal:        os.Getenv("EmbedGrammarFileVal"),
		EmbedJsonSchemaCmd:         os.Getenv("EmbedJsonSchemaCmd"),
		EmbedJsonSchemaVal:         os.Getenv("EmbedJsonSchemaVal"),
		EmbedJsonSchemaFileCmd:     os.Getenv("EmbedJsonSchemaFileCmd"),
		EmbedJsonSchemaFileVal:     os.Getenv("EmbedJsonSchemaFileVal"),

		// ----- example-specific params -----
		EmbedNoWarmupCmd:                 os.Getenv("EmbedNoWarmupCmd"),
		EmbedNoWarmupCmdEnabled:          getEnvBool(os.Getenv("EmbedNoWarmupCmdEnabled"), false),
		EmbedPoolingCmd:                  os.Getenv("EmbedPoolingCmd"),
		EmbedPoolingVal:                  os.Getenv("EmbedPoolingVal"),
		EmbedAttentionCmd:                os.Getenv("EmbedAttentionCmd"),
		EmbedAttentionVal:                os.Getenv("EmbedAttentionVal"),
		EmbedNormalizeCmd:                os.Getenv("EmbedNormalizeCmd"),
		EmbedNormalizeVal:                os.Getenv("EmbedNormalizeVal"),
		EmbedOutputFormatCmd:             os.Getenv("EmbedOutputFormatCmd"),
		EmbedOutputFormatVal:             os.Getenv("EmbedOutputFormatVal"),
		EmbedSeparatorCmd:                os.Getenv("EmbedSeparatorCmd"),
		EmbedSeparatorVal:                os.Getenv("EmbedSeparatorVal"),
		EmbedBgeSmallEnDefaultCmd:        os.Getenv("EmbedBgeSmallEnDefaultCmd"),
		EmbedBgeSmallEnDefaultCmdEnabled: getEnvBool(os.Getenv("EmbedBgeSmallEnDefaultCmdEnabled"), false),
		EmbedE5SmallEnDefaultCmd:         os.Getenv("EmbedE5SmallEnDefaultCmd"),
		EmbedE5SmallEnDefaultCmdEnabled:  getEnvBool(os.Getenv("EmbedE5SmallEnDefaultCmdEnabled"), false),
		EmbedGteSmallDefaultCmd:          os.Getenv("EmbedGteSmallDefaultCmd"),
		EmbedGteSmallDefaultCmdEnabled:   getEnvBool(os.Getenv("EmbedGteSmallDefaultCmdEnabled"), false),
	}
	return out
}

func ParseDefaultAppEnv() DefaultAppArgs {
	out := DefaultAppArgs{
		ModelPath:                    os.Getenv("ModelPath"),
		AppLogPath:                   os.Getenv("AppLogPath"),
		AppLogFileName:               os.Getenv("AppLogFileName"),
		PromptTempPath:               os.Getenv("PromptTempPath"),
		LLamaCliPath:                 os.Getenv("LLamaCliPath"),
		LLamaEmbedCliPath:            os.Getenv("LLamaEmbedCliPath"),
		PDFToTextPath:                os.Getenv("PDFToTextPath"),
		ModelLogPath:                 os.Getenv("ModelLogPath"),
		DocumentPath:                 os.Getenv("DocumentPath"),
		EmbedModelFileName:           os.Getenv("EmbedModelFileName"),
		ModelFileName:                os.Getenv("ModelFileName"),
		PromptCachePath:              os.Getenv("PromptCachePath"),
		MongoURI:                     os.Getenv("MongoURI"),
		TesseractPath:                os.Getenv("TesseractPath"),
		PdfToImagesPath:              os.Getenv("PdfToImagesPath"),
		ElasticsearchServerAddresses: strings.Split(os.Getenv("ElasticsearchServerAddresses"), ","),
		ElasticsearchAPIKey:          os.Getenv("ElasticsearchAPIKey"),
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

func LlamaCliStructToArgs(args LlamaCliArgs) []string {
	var result []string
	// Helper function for command-value pairs
	addCmdValPair := func(cmd string, val string) {
		if len(val) != 0 {
			result = append(result, cmd, val)
		}
	}
	// Helper function for boolean commands
	addCmdBoolPair := func(cmd string, val bool) {
		if val == true {
			result = append(result, cmd)
		}
	}

	// ----- common params -----
	addCmdBoolPair(args.VerbosePromptCmd, args.VerbosePromptCmdEnabled)
	addCmdValPair(args.ThreadsCmd, args.ThreadsVal)
	addCmdValPair(args.ThreadsBatchCmd, args.ThreadsBatchVal)
	addCmdValPair(args.CpuMaskCmd, args.CpuMaskVal)
	addCmdValPair(args.CpuRangeCmd, args.CpuRangeVal)
	addCmdValPair(args.CpuStrictCmd, args.CpuStrictVal)
	addCmdValPair(args.PrioCmd, args.PrioVal)
	addCmdValPair(args.PollCmd, args.PollVal)
	addCmdValPair(args.CpuMaskBatchCmd, args.CpuMaskBatchVal)
	addCmdValPair(args.CpuRangeBatchCmd, args.CpuRangeBatchVal)
	addCmdValPair(args.CpuStrictBatchCmd, args.CpuStrictBatchVal)
	addCmdValPair(args.PrioBatchCmd, args.PrioBatchVal)
	addCmdValPair(args.PollBatchCmd, args.PollBatchVal)
	addCmdValPair(args.CtxSizeCmd, args.CtxSizeVal)
	addCmdValPair(args.PredictCmd, args.PredictVal)
	addCmdValPair(args.BatchCmd, args.BatchCmdVal)
	addCmdValPair(args.UBatchCmd, args.UBatchCmdVal)
	addCmdValPair(args.KeepCmd, args.KeepVal)
	addCmdBoolPair(args.FlashAttentionCmd, args.FlashAttentionCmdEnabled)
	addCmdValPair(args.PromptCmd, args.PromptText)
	addCmdBoolPair(args.NoPerfCmd, args.NoPerfCmdEnabled)
	addCmdValPair(args.PromptFileCmd, args.PromptFileVal)
	addCmdValPair(args.BinaryFileCmd, args.BinaryFileVal)
	addCmdBoolPair(args.EscapeNewLinesCmd, args.EscapeNewLinesCmdEnabled)
	addCmdBoolPair(args.NoEscapeCmd, args.NoEscapeCmdEnabled)
	addCmdValPair(args.RopeScalingCmd, args.RopeScalingVal)
	addCmdValPair(args.RopeScaleCmd, args.RopeScaleVal)
	addCmdValPair(args.RopeFreqBaseCmd, args.RopeFreqBaseVal)
	addCmdValPair(args.RopeFreqScaleCmd, args.RopeFreqScaleVal)
	addCmdValPair(args.YarnOrigContextCmd, args.YarnOrigContextCmdVal)
	addCmdValPair(args.YarnExtFactorCmd, args.YarnExtFactorVal)
	addCmdValPair(args.YarnAttnFactorCmd, args.YarnAttnFactorVal)
	addCmdValPair(args.YarnBetaSlowCmd, args.YarnBetaSlowVal)
	addCmdValPair(args.YarnBetaFastCmd, args.YarnBetaFastVal)
	addCmdBoolPair(args.DumpKvCacheCmd, args.DumpKvCacheCmdEnabled)
	addCmdBoolPair(args.NoKvOffloadCmd, args.NoKvOffloadCmdEnabled)
	addCmdValPair(args.CacheTypeKCmd, args.CacheTypeKVal)
	addCmdValPair(args.CacheTypeVCmd, args.CacheTypeVVal)
	addCmdValPair(args.DefragTholdCmd, args.DefragTholdVal)
	addCmdValPair(args.ParallelCmd, args.ParallelVal)
	addCmdValPair(args.RpcCmd, args.RpcVal)
	addCmdBoolPair(args.MemLockCmd, args.MemLockCmdEnabled)
	addCmdBoolPair(args.NoMmapCmd, args.NoMmapCmdEnabled)
	addCmdValPair(args.NumaCmd, args.NumaVal)
	addCmdValPair(args.DeviceCmd, args.DeviceVal)
	addCmdBoolPair(args.ListDevicesCmd, args.ListDevicesCmdEnabled)
	addCmdValPair(args.OverrideTensorCmd, args.OverrideTensorVal)
	addCmdValPair(args.GPULayersCmd, args.GPULayersVal)
	addCmdValPair(args.SplitModeCmd, args.SplitModeCmdVal)
	addCmdValPair(args.TensorSplitCmd, args.TensorSplitVal)
	addCmdValPair(args.MainGPUCmd, args.MainGPUVal)
	addCmdBoolPair(args.CheckTensorsCmd, args.CheckTensorsCmdEnabled)
	addCmdValPair(args.OverrideKvCmd, args.OverrideKvVal)
	addCmdValPair(args.LoraCmd, args.LoraVal)
	addCmdValPair(args.LoraScaledCmd, args.LoraScaledVal)
	addCmdValPair(args.ControlVectorCmd, args.ControlVectorVal)
	addCmdValPair(args.ControlVectorScaledCmd, args.ControlVectorScaledVal)
	addCmdValPair(args.ControlVectorLayerRangeCmd, args.ControlVectorLayerRangeVal)
	addCmdValPair(args.ModelCmd, args.ModelFullPathVal)
	addCmdValPair(args.ModelUrlCmd, args.ModelUrlVal)
	addCmdValPair(args.HfRepoCmd, args.HfRepoVal)
	addCmdValPair(args.HfRepoDraftCmd, args.HfRepoDraftVal)
	addCmdValPair(args.HfFileCmd, args.HfFileVal)
	addCmdValPair(args.HfRepoVCmd, args.HfRepoVVal)
	addCmdValPair(args.HfFileVCmd, args.HfFileVVal)
	addCmdValPair(args.HfTokenCmd, args.HfTokenVal)
	addCmdBoolPair(args.LogDisableCmd, args.LogDisableCmdEnabled)
	addCmdValPair(args.ModelLogFileCmd, args.ModelLogFileNameVal)
	addCmdBoolPair(args.LogColorsCmd, args.LogColorsCmdEnabled)
	addCmdBoolPair(args.LogVerboseCmd, args.LogVerboseEnabled)
	addCmdValPair(args.LogVerbosityCmd, args.LogVerbosityVal)
	addCmdBoolPair(args.LogPrefixCmd, args.LogPrefixCmdEnabled)
	addCmdBoolPair(args.LogTimestampsCmd, args.LogTimestampsCmdEnabled)

	// ----- sampling params -----
	addCmdValPair(args.SamplersCmd, args.SamplersVal)
	addCmdValPair(args.RandomSeedCmd, args.RandomSeedVal)
	addCmdValPair(args.SamplingSeqCmd, args.SamplingSeqVal)
	addCmdBoolPair(args.IgnoreEosCmd, args.IgnoreEosCmdEnabled)
	addCmdValPair(args.TemperatureCmd, args.TemperatureVal)
	addCmdValPair(args.TopKCmd, args.TopKVal)
	addCmdValPair(args.TopPCmd, args.TopPVal)
	addCmdValPair(args.MinPCmd, args.MinPVal)
	addCmdValPair(args.TopNSigmaCmd, args.TopNSigmaVal)
	addCmdValPair(args.XtcProbabilityCmd, args.XtcProbabilityVal)
	addCmdValPair(args.XtcThresholdCmd, args.XtcThresholdVal)
	addCmdValPair(args.TypicalCmd, args.TypicalVal)
	addCmdValPair(args.RepeatLastPenaltyCmd, args.RepeatLastPenaltyVal)
	addCmdValPair(args.RepeatPenaltyCmd, args.RepeatPenaltyVal)
	addCmdValPair(args.PresencePenaltyCmd, args.PresencePenaltyVal)
	addCmdValPair(args.FrequencyPenaltyCmd, args.FrequencyPenaltyVal)
	addCmdValPair(args.DryMultiplierCmd, args.DryMultiplierVal)
	addCmdValPair(args.DryBaseCmd, args.DryBaseVal)
	addCmdValPair(args.DryAllowedLengthCmd, args.DryAllowedLengthVal)
	addCmdValPair(args.DryPenaltyLastNCmd, args.DryPenaltyLastNVal)
	addCmdValPair(args.DrySequenceBreakerCmd, args.DrySequenceBreakerVal)
	addCmdValPair(args.DynatempRangeCmd, args.DynatempRangeVal)
	addCmdValPair(args.DynatempExpCmd, args.DynatempExpVal)
	addCmdValPair(args.MirostatCmd, args.MirostatVal)
	addCmdValPair(args.MirostatLrCmd, args.MirostatLrVal)
	addCmdValPair(args.MirostatEntCmd, args.MirostatEntVal)
	addCmdValPair(args.LogitBiasCmd, args.LogitBiasVal)
	addCmdValPair(args.GrammarCmd, args.GrammarVal)
	addCmdValPair(args.GrammarFileCmd, args.GrammarFileVal)
	addCmdValPair(args.JsonSchemaCmd, args.JsonSchemaVal)
	addCmdValPair(args.JsonSchemaFileCmd, args.JsonSchemaFileVal)

	// ----- example-specific params -----
	addCmdBoolPair(args.NoDisplayPromptCmd, args.NoDisplayPromptEnabled)
	addCmdBoolPair(args.ColorCmd, args.ColorCmdEnabled)
	addCmdBoolPair(args.NoContextShiftCmd, args.NoContextShiftCmdEnabled)
	addCmdValPair(args.SystemPromptCmd, args.SystemPromptVal)
	addCmdValPair(args.SystemPromptFileCmd, args.SystemPromptFileVal)
	addCmdValPair(args.PrintTokenCountCmd, args.PrintTokenCountVal)
	addCmdValPair(args.PromptCacheCmd, args.PromptCacheVal)
	addCmdBoolPair(args.PromptCacheAllCmd, args.PromptCacheAllCmdEnabled)
	addCmdBoolPair(args.PromptCacheRoCmd, args.PromptCacheRoCmdEnabled)
	addCmdValPair(args.ReversePromptCmd, args.ReversePromptVal)
	addCmdBoolPair(args.SpecialCmd, args.SpecialCmdEnabled)
	addCmdBoolPair(args.ConversationCmd, args.ConversationCmdEnabled)
	addCmdBoolPair(args.NoConversationCmd, args.NoConversationCmdEnabled)
	addCmdBoolPair(args.SingleTurnCmd, args.SingleTurnCmdEnabled)
	addCmdBoolPair(args.InteractiveCmd, args.InteractiveCmdEnabled)
	addCmdBoolPair(args.InteractiveFirstCmd, args.InteractiveFirstCmdEnabled)
	addCmdBoolPair(args.MultilineInputCmd, args.MultilineInputCmdEnabled)
	addCmdBoolPair(args.InPrefixBosCmd, args.InPrefixBosCmdEnabled)
	addCmdValPair(args.InPrefixCmd, args.InPrefixVal)
	addCmdValPair(args.InSuffixCmd, args.InSuffixVal)
	addCmdBoolPair(args.NoWarmupCmd, args.NoWarmupCmdEnabled)
	addCmdValPair(args.GrpAttnNCmd, args.GrpAttnNVal)
	addCmdValPair(args.GrpAttnWCmd, args.GrpAttnWVal)
	addCmdBoolPair(args.JinjaCmd, args.JinjaCmdEnabled)
	addCmdValPair(args.ReasoningFormatCmd, args.ReasoningFormatVal)
	addCmdValPair(args.ChatTemplateCmd, args.ChatTemplateVal)
	addCmdValPair(args.ChatTemplateFileCmd, args.ChatTemplateFileVal)
	addCmdBoolPair(args.SimpleIoCmd, args.SimpleIoCmdEnabled)

	return result
}

func LlamaEmbedStructToArgs(args LlamaEmbedArgs) []string {
	var result []string
	// Helper function for command-value pairs
	addCmdValPair := func(cmd string, val string) {
		if len(val) != 0 {
			result = append(result, cmd, val)
		}
	}
	// Helper function for boolean commands
	addCmdBoolPair := func(cmd string, val bool) {
		if val == true {
			result = append(result, cmd)
		}
	}

	// ----- common params -----
	addCmdBoolPair(args.EmbedVerbosePromptCmd, args.EmbedVerbosePromptCmdEnabled)
	addCmdValPair(args.EmbedThreadsCmd, args.EmbedThreadsVal)
	addCmdValPair(args.EmbedThreadsBatchCmd, args.EmbedThreadsBatchVal)
	addCmdValPair(args.EmbedCpuMaskCmd, args.EmbedCpuMaskVal)
	addCmdValPair(args.EmbedCpuRangeCmd, args.EmbedCpuRangeVal)
	addCmdValPair(args.EmbedCpuStrictCmd, args.EmbedCpuStrictVal)
	addCmdValPair(args.EmbedPrioCmd, args.EmbedPrioVal)
	addCmdValPair(args.EmbedPollCmd, args.EmbedPollVal)
	addCmdValPair(args.EmbedCpuMaskBatchCmd, args.EmbedCpuMaskBatchVal)
	addCmdValPair(args.EmbedCpuRangeBatchCmd, args.EmbedCpuRangeBatchVal)
	addCmdValPair(args.EmbedCpuStrictBatchCmd, args.EmbedCpuStrictBatchVal)
	addCmdValPair(args.EmbedPrioBatchCmd, args.EmbedPrioBatchVal)
	addCmdValPair(args.EmbedPollBatchCmd, args.EmbedPollBatchVal)
	addCmdValPair(args.EmbedCtxSizeCmd, args.EmbedCtxSizeVal)
	addCmdValPair(args.EmbedPredictCmd, args.EmbedPredictVal)
	addCmdValPair(args.EmbedBatchCmd, args.EmbedBatchVal)
	addCmdValPair(args.EmbedUBatchCmd, args.EmbedUBatchVal)
	addCmdValPair(args.EmbedKeepCmd, args.EmbedKeepVal)
	addCmdBoolPair(args.EmbedFlashAttentionCmd, args.EmbedFlashAttentionCmdEnabled)
	addCmdValPair(args.EmbedPromptCmd, args.EmbedPromptText)
	addCmdBoolPair(args.EmbedNoPerfCmd, args.EmbedNoPerfCmdEnabled)
	addCmdValPair(args.EmbedPromptFileCmd, args.EmbedPromptFileVal)
	addCmdValPair(args.EmbedBinaryFileCmd, args.EmbedBinaryFileVal)
	addCmdBoolPair(args.EmbedEscapeNewLinesCmd, args.EmbedEscapeNewLinesCmdEnabled)
	addCmdBoolPair(args.EmbedNoEscapeCmd, args.EmbedNoEscapeCmdEnabled)
	addCmdValPair(args.EmbedRopeScalingCmd, args.EmbedRopeScalingVal)
	addCmdValPair(args.EmbedRopeScaleCmd, args.EmbedRopeScaleVal)
	addCmdValPair(args.EmbedRopeFreqBaseCmd, args.EmbedRopeFreqBaseVal)
	addCmdValPair(args.EmbedRopeFreqScaleCmd, args.EmbedRopeFreqScaleVal)
	addCmdValPair(args.EmbedYarnOrigContextCmd, args.EmbedYarnOrigContextVal)
	addCmdValPair(args.EmbedYarnExtFactorCmd, args.EmbedYarnExtFactorVal)
	addCmdValPair(args.EmbedYarnAttnFactorCmd, args.EmbedYarnAttnFactorVal)
	addCmdValPair(args.EmbedYarnBetaSlowCmd, args.EmbedYarnBetaSlowVal)
	addCmdValPair(args.EmbedYarnBetaFastCmd, args.EmbedYarnBetaFastVal)
	addCmdBoolPair(args.EmbedDumpKvCacheCmd, args.EmbedDumpKvCacheCmdEnabled)
	addCmdBoolPair(args.EmbedNoKvOffloadCmd, args.EmbedNoKvOffloadCmdEnabled)
	addCmdValPair(args.EmbedCacheTypeKCmd, args.EmbedCacheTypeKVal)
	addCmdValPair(args.EmbedCacheTypeVCmd, args.EmbedCacheTypeVVal)
	addCmdValPair(args.EmbedDefragTholdCmd, args.EmbedDefragTholdVal)
	addCmdValPair(args.EmbedParallelCmd, args.EmbedParallelVal)
	addCmdValPair(args.EmbedRpcCmd, args.EmbedRpcVal)
	addCmdBoolPair(args.EmbedMemLockCmd, args.EmbedMemLockCmdEnabled)
	addCmdBoolPair(args.EmbedNoMmapCmd, args.EmbedNoMmapCmdEnabled)
	addCmdValPair(args.EmbedNumaCmd, args.EmbedNumaVal)
	addCmdValPair(args.EmbedDeviceCmd, args.EmbedDeviceVal)
	addCmdBoolPair(args.EmbedListDevicesCmd, args.EmbedListDevicesCmdEnabled)
	addCmdValPair(args.EmbedOverrideTensorCmd, args.EmbedOverrideTensorVal)
	addCmdValPair(args.EmbedGPULayersCmd, args.EmbedGPULayersVal)
	addCmdValPair(args.EmbedSplitModeCmd, args.EmbedSplitModeVal)
	addCmdValPair(args.EmbedTensorSplitCmd, args.EmbedTensorSplitVal)
	addCmdValPair(args.EmbedMainGPUCmd, args.EmbedMainGPUVal)
	addCmdBoolPair(args.EmbedCheckTensorsCmd, args.EmbedCheckTensorsCmdEnabled)
	addCmdValPair(args.EmbedOverrideKvCmd, args.EmbedOverrideKvVal)
	addCmdValPair(args.EmbedLoraCmd, args.EmbedLoraVal)
	addCmdValPair(args.EmbedLoraScaledCmd, args.EmbedLoraScaledVal)
	addCmdValPair(args.EmbedControlVectorCmd, args.EmbedControlVectorVal)
	addCmdValPair(args.EmbedControlVectorScaledCmd, args.EmbedControlVectorScaledVal)
	addCmdValPair(args.EmbedControlVectorLayerRangeCmd, args.EmbedControlVectorLayerRangeVal)
	addCmdValPair(args.EmbedModelCmd, args.EmbedModelFullPathVal)
	addCmdValPair(args.EmbedModelUrlCmd, args.EmbedModelUrlVal)
	addCmdValPair(args.EmbedHfRepoCmd, args.EmbedHfRepoVal)
	addCmdValPair(args.EmbedHfRepoDraftCmd, args.EmbedHfRepoDraftVal)
	addCmdValPair(args.EmbedHfFileCmd, args.EmbedHfFileVal)
	addCmdValPair(args.EmbedHfRepoVCmd, args.EmbedHfRepoVVal)
	addCmdValPair(args.EmbedHfFileVCmd, args.EmbedHfFileVVal)
	addCmdValPair(args.EmbedHfTokenCmd, args.EmbedHfTokenVal)
	addCmdBoolPair(args.EmbedLogDisableCmd, args.EmbedLogDisableCmdEnabled)
	addCmdValPair(args.EmbedModelLogFileCmd, args.EmbedModelLogFileNameVal)
	addCmdBoolPair(args.EmbedLogColorsCmd, args.EmbedLogColorsCmdEnabled)
	addCmdBoolPair(args.EmbedLogVerboseCmd, args.EmbedLogVerboseEnabled)
	addCmdValPair(args.EmbedLogVerbosityCmd, args.EmbedLogVerbosityVal)
	addCmdBoolPair(args.EmbedLogPrefixCmd, args.EmbedLogPrefixCmdEnabled)
	addCmdBoolPair(args.EmbedLogTimestampsCmd, args.EmbedLogTimestampsCmdEnabled)

	// ----- sampling params -----
	addCmdValPair(args.EmbedSamplersCmd, args.EmbedSamplersVal)
	addCmdValPair(args.EmbedRandomSeedCmd, args.EmbedRandomSeedVal)
	addCmdValPair(args.EmbedSamplingSeqCmd, args.EmbedSamplingSeqVal)
	addCmdBoolPair(args.EmbedIgnoreEosCmd, args.EmbedIgnoreEosCmdEnabled)
	addCmdValPair(args.EmbedTemperatureCmd, args.EmbedTemperatureVal)
	addCmdValPair(args.EmbedTopKCmd, args.EmbedTopKVal)
	addCmdValPair(args.EmbedTopPCmd, args.EmbedTopPVal)
	addCmdValPair(args.EmbedMinPCmd, args.EmbedMinPVal)
	addCmdValPair(args.EmbedXtcProbabilityCmd, args.EmbedXtcProbabilityVal)
	addCmdValPair(args.EmbedXtcThresholdCmd, args.EmbedXtcThresholdVal)
	addCmdValPair(args.EmbedTypicalCmd, args.EmbedTypicalVal)
	addCmdValPair(args.EmbedRepeatLastPenaltyCmd, args.EmbedRepeatLastPenaltyVal)
	addCmdValPair(args.EmbedRepeatPenaltyCmd, args.EmbedRepeatPenaltyVal)
	addCmdValPair(args.EmbedPresencePenaltyCmd, args.EmbedPresencePenaltyVal)
	addCmdValPair(args.EmbedFrequencyPenaltyCmd, args.EmbedFrequencyPenaltyVal)
	addCmdValPair(args.EmbedDryMultiplierCmd, args.EmbedDryMultiplierVal)
	addCmdValPair(args.EmbedDryBaseCmd, args.EmbedDryBaseVal)
	addCmdValPair(args.EmbedDryAllowedLengthCmd, args.EmbedDryAllowedLengthVal)
	addCmdValPair(args.EmbedDryPenaltyLastNCmd, args.EmbedDryPenaltyLastNVal)
	addCmdValPair(args.EmbedDrySequenceBreakerCmd, args.EmbedDrySequenceBreakerVal)
	addCmdValPair(args.EmbedDynatempRangeCmd, args.EmbedDynatempRangeVal)
	addCmdValPair(args.EmbedDynatempExpCmd, args.EmbedDynatempExpVal)
	addCmdValPair(args.EmbedMirostatCmd, args.EmbedMirostatVal)
	addCmdValPair(args.EmbedMirostatLrCmd, args.EmbedMirostatLrVal)
	addCmdValPair(args.EmbedMirostatEntCmd, args.EmbedMirostatEntVal)
	addCmdValPair(args.EmbedLogitBiasCmd, args.EmbedLogitBiasVal)
	addCmdValPair(args.EmbedGrammarCmd, args.EmbedGrammarVal)
	addCmdValPair(args.EmbedGrammarFileCmd, args.EmbedGrammarFileVal)
	addCmdValPair(args.EmbedJsonSchemaCmd, args.EmbedJsonSchemaVal)
	addCmdValPair(args.EmbedJsonSchemaFileCmd, args.EmbedJsonSchemaFileVal)

	// ----- example-specific params -----
	addCmdBoolPair(args.EmbedNoWarmupCmd, args.EmbedNoWarmupCmdEnabled)
	addCmdValPair(args.EmbedPoolingCmd, args.EmbedPoolingVal)
	addCmdValPair(args.EmbedAttentionCmd, args.EmbedAttentionVal)
	addCmdValPair(args.EmbedNormalizeCmd, args.EmbedNormalizeVal)
	addCmdValPair(args.EmbedOutputFormatCmd, args.EmbedOutputFormatVal)
	addCmdValPair(args.EmbedSeparatorCmd, args.EmbedSeparatorVal)
	addCmdBoolPair(args.EmbedBgeSmallEnDefaultCmd, args.EmbedBgeSmallEnDefaultCmdEnabled)
	addCmdBoolPair(args.EmbedE5SmallEnDefaultCmd, args.EmbedE5SmallEnDefaultCmdEnabled)
	addCmdBoolPair(args.EmbedGteSmallDefaultCmd, args.EmbedGteSmallDefaultCmdEnabled)

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
	addCmdValPair(args.PDFToTextPath)
	addCmdValPair(args.LLamaCliPath)
	addCmdValPair(args.LLamaEmbedCliPath)
	addCmdValPair(args.ModelPath)
	addCmdValPair(args.PromptCachePath)
	addCmdValPair(args.PromptTempPath)
	addCmdValPair(args.ModelFileName)
	addCmdValPair(args.EmbedModelFileName)
	addCmdValPair(args.ModelLogPath)
	addCmdValPair(args.DocumentPath)
	addCmdValPair(args.ModelPath)
	addCmdValPair(args.TesseractPath)
	addCmdValPair(args.ElasticsearchAPIKey)

	return result

}

type LlamaCliArgs struct {
	ID          string `json:"Id"`
	Description string `json:"Description"`

	// ----- common params -----
	VerbosePromptCmd           string `json:"VerbosePromptCmd"`
	VerbosePromptCmdEnabled    bool   `json:"VerbosePromptCmdEnabled"`
	ThreadsCmd                 string `json:"ThreadsCmd"`
	ThreadsVal                 string `json:"ThreadsVal"`
	ThreadsBatchCmd            string `json:"ThreadsBatchCmd"`
	ThreadsBatchVal            string `json:"ThreadsBatchVal"`
	CpuMaskCmd                 string `json:"CpuMaskCmd"`
	CpuMaskVal                 string `json:"CpuMaskVal"`
	CpuRangeCmd                string `json:"CpuRangeCmd"`
	CpuRangeVal                string `json:"CpuRangeVal"`
	CpuStrictCmd               string `json:"CpuStrictCmd"`
	CpuStrictVal               string `json:"CpuStrictVal"`
	PrioCmd                    string `json:"PrioCmd"`
	PrioVal                    string `json:"PrioVal"`
	PollCmd                    string `json:"PollCmd"`
	PollVal                    string `json:"PollVal"`
	CpuMaskBatchCmd            string `json:"CpuMaskBatchCmd"`
	CpuMaskBatchVal            string `json:"CpuMaskBatchVal"`
	CpuRangeBatchCmd           string `json:"CpuRangeBatchCmd"`
	CpuRangeBatchVal           string `json:"CpuRangeBatchVal"`
	CpuStrictBatchCmd          string `json:"CpuStrictBatchCmd"`
	CpuStrictBatchVal          string `json:"CpuStrictBatchVal"`
	PrioBatchCmd               string `json:"PrioBatchCmd"`
	PrioBatchVal               string `json:"PrioBatchVal"`
	PollBatchCmd               string `json:"PollBatchCmd"`
	PollBatchVal               string `json:"PollBatchVal"`
	CtxSizeCmd                 string `json:"CtxSizeCmd"`
	CtxSizeVal                 string `json:"CtxSizeVal"`
	PredictCmd                 string `json:"PredictCmd"`
	PredictVal                 string `json:"PredictVal"`
	BatchCmd                   string `json:"BatchCmd"`
	BatchCmdVal                string `json:"BatchCmdVal"`
	UBatchCmd                  string `json:"UBatchCmd"`
	UBatchCmdVal               string `json:"UBatchCmdVal"`
	KeepCmd                    string `json:"KeepCmd"`
	KeepVal                    string `json:"KeepVal"`
	FlashAttentionCmd          string `json:"FlashAttentionCmd"`
	FlashAttentionCmdEnabled   bool   `json:"FlashAttentionCmdEnabled"`
	PromptCmd                  string `json:"PromptCmd"`
	PromptCmdEnabled           bool   `json:"PromptCmdEnabled"`
	PromptText                 string `json:"PromptText"`
	NoPerfCmd                  string `json:"NoPerfCmd"`
	NoPerfCmdEnabled           bool   `json:"NoPerfCmdEnabled"`
	PromptFileCmd              string `json:"PromptFileCmd"`
	PromptFileVal              string `json:"PromptFileVal"`
	BinaryFileCmd              string `json:"BinaryFileCmd"`
	BinaryFileVal              string `json:"BinaryFileVal"`
	EscapeNewLinesCmd          string `json:"EscapeNewLinesCmd"`
	EscapeNewLinesCmdEnabled   bool   `json:"EscapeNewLinesCmdEnabled"`
	NoEscapeCmd                string `json:"NoEscapeCmd"`
	NoEscapeCmdEnabled         bool   `json:"NoEscapeCmdEnabled"`
	RopeScalingCmd             string `json:"RopeScalingCmd"`
	RopeScalingVal             string `json:"RopeScalingVal"`
	RopeScaleCmd               string `json:"RopeScaleCmd"`
	RopeScaleVal               string `json:"RopeScaleVal"`
	RopeFreqBaseCmd            string `json:"RopeFreqBaseCmd"`
	RopeFreqBaseVal            string `json:"RopeFreqBaseVal"`
	RopeFreqScaleCmd           string `json:"RopeFreqScaleCmd"`
	RopeFreqScaleVal           string `json:"RopeFreqScaleVal"`
	YarnOrigContextCmd         string `json:"YarnOrigContextCmd"`
	YarnOrigContextCmdVal      string `json:"YarnOrigContextCmdVal"`
	YarnExtFactorCmd           string `json:"YarnExtFactorCmd"`
	YarnExtFactorVal           string `json:"YarnExtFactorVal"`
	YarnAttnFactorCmd          string `json:"YarnAttnFactorCmd"`
	YarnAttnFactorVal          string `json:"YarnAttnFactorVal"`
	YarnBetaSlowCmd            string `json:"YarnBetaSlowCmd"`
	YarnBetaSlowVal            string `json:"YarnBetaSlowVal"`
	YarnBetaFastCmd            string `json:"YarnBetaFastCmd"`
	YarnBetaFastVal            string `json:"YarnBetaFastVal"`
	DumpKvCacheCmd             string `json:"DumpKvCacheCmd"`
	DumpKvCacheCmdEnabled      bool   `json:"DumpKvCacheCmdEnabled"`
	NoKvOffloadCmd             string `json:"NoKvOffloadCmd"`
	NoKvOffloadCmdEnabled      bool   `json:"NoKvOffloadCmdEnabled"`
	CacheTypeKCmd              string `json:"CacheTypeKCmd"`
	CacheTypeKVal              string `json:"CacheTypeKVal"`
	CacheTypeVCmd              string `json:"CacheTypeVCmd"`
	CacheTypeVVal              string `json:"CacheTypeVVal"`
	DefragTholdCmd             string `json:"DefragTholdCmd"`
	DefragTholdVal             string `json:"DefragTholdVal"`
	ParallelCmd                string `json:"ParallelCmd"`
	ParallelVal                string `json:"ParallelVal"`
	RpcCmd                     string `json:"RpcCmd"`
	RpcVal                     string `json:"RpcVal"`
	MemLockCmd                 string `json:"MemLockCmd"`
	MemLockCmdEnabled          bool   `json:"MemLockCmdEnabled"`
	NoMmapCmd                  string `json:"NoMmapCmd"`
	NoMmapCmdEnabled           bool   `json:"NoMmapCmdEnabled"`
	NumaCmd                    string `json:"NumaCmd"`
	NumaVal                    string `json:"NumaVal"`
	DeviceCmd                  string `json:"DeviceCmd"`
	DeviceVal                  string `json:"DeviceVal"`
	ListDevicesCmd             string `json:"ListDevicesCmd"`
	ListDevicesCmdEnabled      bool   `json:"ListDevicesCmdEnabled"`
	OverrideTensorCmd          string `json:"OverrideTensorCmd"`
	OverrideTensorVal          string `json:"OverrideTensorVal"`
	GPULayersCmd               string `json:"GPULayersCmd"`
	GPULayersVal               string `json:"GPULayersVal"`
	SplitModeCmd               string `json:"SplitModeCmd"`
	SplitModeCmdVal            string `json:"SplitModeCmdVal"`
	TensorSplitCmd             string `json:"TensorSplitCmd"`
	TensorSplitVal             string `json:"TensorSplitVal"`
	MainGPUCmd                 string `json:"MainGPUCmd"`
	MainGPUVal                 string `json:"MainGPUVal"`
	CheckTensorsCmd            string `json:"CheckTensorsCmd"`
	CheckTensorsCmdEnabled     bool   `json:"CheckTensorsCmdEnabled"`
	OverrideKvCmd              string `json:"OverrideKvCmd"`
	OverrideKvVal              string `json:"OverrideKvVal"`
	LoraCmd                    string `json:"LoraCmd"`
	LoraVal                    string `json:"LoraVal"`
	LoraScaledCmd              string `json:"LoraScaledCmd"`
	LoraScaledVal              string `json:"LoraScaledVal"`
	ControlVectorCmd           string `json:"ControlVectorCmd"`
	ControlVectorVal           string `json:"ControlVectorVal"`
	ControlVectorScaledCmd     string `json:"ControlVectorScaledCmd"`
	ControlVectorScaledVal     string `json:"ControlVectorScaledVal"`
	ControlVectorLayerRangeCmd string `json:"ControlVectorLayerRangeCmd"`
	ControlVectorLayerRangeVal string `json:"ControlVectorLayerRangeVal"`
	ModelCmd                   string `json:"ModelCmd"`
	ModelFullPathVal           string `json:"ModelFullPathVal"`
	ModelUrlCmd                string `json:"ModelUrlCmd"`
	ModelUrlVal                string `json:"ModelUrlVal"`
	HfRepoCmd                  string `json:"HfRepoCmd"`
	HfRepoVal                  string `json:"HfRepoVal"`
	HfRepoDraftCmd             string `json:"HfRepoDraftCmd"`
	HfRepoDraftVal             string `json:"HfRepoDraftVal"`
	HfFileCmd                  string `json:"HfFileCmd"`
	HfFileVal                  string `json:"HfFileVal"`
	HfRepoVCmd                 string `json:"HfRepoVCmd"`
	HfRepoVVal                 string `json:"HfRepoVVal"`
	HfFileVCmd                 string `json:"HfFileVCmd"`
	HfFileVVal                 string `json:"HfFileVVal"`
	HfTokenCmd                 string `json:"HfTokenCmd"`
	HfTokenVal                 string `json:"HfTokenVal"`
	LogDisableCmd              string `json:"LogDisableCmd"`
	LogDisableCmdEnabled       bool   `json:"LogDisableCmdEnabled"`
	ModelLogFileCmd            string `json:"ModelLogFileCmd"`
	ModelLogFileNameVal        string `json:"ModelLogFileNameVal"`
	LogColorsCmd               string `json:"LogColorsCmd"`
	LogColorsCmdEnabled        bool   `json:"LogColorsCmdEnabled"`
	LogVerboseCmd              string `json:"LogVerboseCmd"`
	LogVerboseEnabled          bool   `json:"LogVerboseEnabled"`
	LogVerbosityCmd            string `json:"LogVerbosityCmd"`
	LogVerbosityVal            string `json:"LogVerbosityVal"`
	LogPrefixCmd               string `json:"LogPrefixCmd"`
	LogPrefixCmdEnabled        bool   `json:"LogPrefixCmdEnabled"`
	LogTimestampsCmd           string `json:"LogTimestampsCmd"`
	LogTimestampsCmdEnabled    bool   `json:"LogTimestampsCmdEnabled"`

	// ----- sampling params -----
	SamplersCmd           string `json:"SamplersCmd"`
	SamplersVal           string `json:"SamplersVal"`
	RandomSeedCmd         string `json:"RandomSeedCmd"`
	RandomSeedVal         string `json:"RandomSeedVal"`
	SamplingSeqCmd        string `json:"SamplingSeqCmd"`
	SamplingSeqVal        string `json:"SamplingSeqVal"`
	IgnoreEosCmd          string `json:"IgnoreEosCmd"`
	IgnoreEosCmdEnabled   bool   `json:"IgnoreEosCmdEnabled"`
	TemperatureCmd        string `json:"TemperatureCmd"`
	TemperatureVal        string `json:"TemperatureVal"`
	TopKCmd               string `json:"TopKCmd"`
	TopKVal               string `json:"TopKVal"`
	TopPCmd               string `json:"TopPCmd"`
	TopPVal               string `json:"TopPVal"`
	MinPCmd               string `json:"MinPCmd"`
	MinPVal               string `json:"MinPVal"`
	TopNSigmaCmd          string `json:"TopNSigmaCmd"`
	TopNSigmaVal          string `json:"TopNSigmaVal"`
	XtcProbabilityCmd     string `json:"XtcProbabilityCmd"`
	XtcProbabilityVal     string `json:"XtcProbabilityVal"`
	XtcThresholdCmd       string `json:"XtcThresholdCmd"`
	XtcThresholdVal       string `json:"XtcThresholdVal"`
	TypicalCmd            string `json:"TypicalCmd"`
	TypicalVal            string `json:"TypicalVal"`
	RepeatLastPenaltyCmd  string `json:"RepeatLastPenaltyCmd"`
	RepeatLastPenaltyVal  string `json:"RepeatLastPenaltyVal"`
	RepeatPenaltyCmd      string `json:"RepeatPenaltyCmd"`
	RepeatPenaltyVal      string `json:"RepeatPenaltyVal"`
	PresencePenaltyCmd    string `json:"PresencePenaltyCmd"`
	PresencePenaltyVal    string `json:"PresencePenaltyVal"`
	FrequencyPenaltyCmd   string `json:"FrequencyPenaltyCmd"`
	FrequencyPenaltyVal   string `json:"FrequencyPenaltyVal"`
	DryMultiplierCmd      string `json:"DryMultiplierCmd"`
	DryMultiplierVal      string `json:"DryMultiplierVal"`
	DryBaseCmd            string `json:"DryBaseCmd"`
	DryBaseVal            string `json:"DryBaseVal"`
	DryAllowedLengthCmd   string `json:"DryAllowedLengthCmd"`
	DryAllowedLengthVal   string `json:"DryAllowedLengthVal"`
	DryPenaltyLastNCmd    string `json:"DryPenaltyLastNCmd"`
	DryPenaltyLastNVal    string `json:"DryPenaltyLastNVal"`
	DrySequenceBreakerCmd string `json:"DrySequenceBreakerCmd"`
	DrySequenceBreakerVal string `json:"DrySequenceBreakerVal"`
	DynatempRangeCmd      string `json:"DynatempRangeCmd"`
	DynatempRangeVal      string `json:"DynatempRangeVal"`
	DynatempExpCmd        string `json:"DynatempExpCmd"`
	DynatempExpVal        string `json:"DynatempExpVal"`
	MirostatCmd           string `json:"MirostatCmd"`
	MirostatVal           string `json:"MirostatVal"`
	MirostatLrCmd         string `json:"MirostatLrCmd"`
	MirostatLrVal         string `json:"MirostatLrVal"`
	MirostatEntCmd        string `json:"MirostatEntCmd"`
	MirostatEntVal        string `json:"MirostatEntVal"`
	LogitBiasCmd          string `json:"LogitBiasCmd"`
	LogitBiasVal          string `json:"LogitBiasVal"`
	GrammarCmd            string `json:"GrammarCmd"`
	GrammarVal            string `json:"GrammarVal"`
	GrammarFileCmd        string `json:"GrammarFileCmd"`
	GrammarFileVal        string `json:"GrammarFileVal"`
	JsonSchemaCmd         string `json:"JsonSchemaCmd"`
	JsonSchemaVal         string `json:"JsonSchemaVal"`
	JsonSchemaFileCmd     string `json:"JsonSchemaFileCmd"`
	JsonSchemaFileVal     string `json:"JsonSchemaFileVal"`

	// ----- example-specific params -----
	NoDisplayPromptCmd         string `json:"NoDisplayPromptCmd"`
	NoDisplayPromptEnabled     bool   `json:"NoDisplayPromptEnabled"`
	ColorCmd                   string `json:"ColorCmd"`
	ColorCmdEnabled            bool   `json:"ColorCmdEnabled"`
	NoContextShiftCmd          string `json:"NoContextShiftCmd"`
	NoContextShiftCmdEnabled   bool   `json:"NoContextShiftCmdEnabled"`
	SystemPromptCmd            string `json:"SystemPromptCmd"`
	SystemPromptVal            string `json:"SystemPromptVal"`
	SystemPromptFileCmd        string `json:"SystemPromptFileCmd"`
	SystemPromptFileVal        string `json:"SystemPromptFileVal"`
	PrintTokenCountCmd         string `json:"PrintTokenCountCmd"`
	PrintTokenCountVal         string `json:"PrintTokenCountVal"`
	PromptCacheCmd             string `json:"PromptCacheCmd"`
	PromptCacheVal             string `json:"PromptCacheVal"`
	PromptCacheAllCmd          string `json:"PromptCacheAllCmd"`
	PromptCacheAllCmdEnabled   bool   `json:"PromptCacheAllCmdEnabled"`
	PromptCacheRoCmd           string `json:"PromptCacheRoCmd"`
	PromptCacheRoCmdEnabled    bool   `json:"PromptCacheRoCmdEnabled"`
	ReversePromptCmd           string `json:"ReversePromptCmd"`
	ReversePromptVal           string `json:"ReversePromptVal"`
	SpecialCmd                 string `json:"SpecialCmd"`
	SpecialCmdEnabled          bool   `json:"SpecialCmdEnabled"`
	ConversationCmd            string `json:"ConversationCmd"`
	ConversationCmdEnabled     bool   `json:"ConversationCmdEnabled"`
	NoConversationCmd          string `json:"NoConversationCmd"`
	NoConversationCmdEnabled   bool   `json:"NoConversationCmdEnabled"`
	SingleTurnCmd              string `json:"SingleTurnCmd"`
	SingleTurnCmdEnabled       bool   `json:"SingleTurnCmdEnabled"`
	InteractiveCmd             string `json:"InteractiveCmd"`
	InteractiveCmdEnabled      bool   `json:"InteractiveCmdEnabled"`
	InteractiveFirstCmd        string `json:"InteractiveFirstCmd"`
	InteractiveFirstCmdEnabled bool   `json:"InteractiveFirstCmdEnabled"`
	MultilineInputCmd          string `json:"MultilineInputCmd"`
	MultilineInputCmdEnabled   bool   `json:"MultilineInputCmdEnabled"`
	InPrefixBosCmd             string `json:"InPrefixBosCmd"`
	InPrefixBosCmdEnabled      bool   `json:"InPrefixBosCmdEnabled"`
	InPrefixCmd                string `json:"InPrefixCmd"`
	InPrefixVal                string `json:"InPrefixVal"`
	InSuffixCmd                string `json:"InSuffixCmd"`
	InSuffixVal                string `json:"InSuffixVal"`
	NoWarmupCmd                string `json:"NoWarmupCmd"`
	NoWarmupCmdEnabled         bool   `json:"NoWarmupCmdEnabled"`
	GrpAttnNCmd                string `json:"GrpAttnNCmd"`
	GrpAttnNVal                string `json:"GrpAttnNVal"`
	GrpAttnWCmd                string `json:"GrpAttnWCmd"`
	GrpAttnWVal                string `json:"GrpAttnWVal"`
	JinjaCmd                   string `json:"JinjaCmd"`
	JinjaCmdEnabled            bool   `json:"JinjaCmdEnabled"`
	ReasoningFormatCmd         string `json:"ReasoningFormatCmd"`
	ReasoningFormatVal         string `json:"ReasoningFormatVal"`
	ChatTemplateCmd            string `json:"ChatTemplateCmd"`
	ChatTemplateVal            string `json:"ChatTemplateVal"`
	ChatTemplateFileCmd        string `json:"ChatTemplateFileCmd"`
	ChatTemplateFileVal        string `json:"ChatTemplateFileVal"`
	SimpleIoCmd                string `json:"SimpleIoCmd"`
	SimpleIoCmdEnabled         bool   `json:"SimpleIoCmdEnabled"`
}

type LlamaEmbedArgs struct {
	Description string `json:"Description"`

	// ----- common params -----
	EmbedVerbosePromptCmd           string `json:"EmbedVerbosePromptCmd"`
	EmbedVerbosePromptCmdEnabled    bool   `json:"EmbedVerbosePromptCmdEnabled"`
	EmbedThreadsCmd                 string `json:"EmbedThreadsCmd"`
	EmbedThreadsVal                 string `json:"EmbedThreadsVal"`
	EmbedThreadsBatchCmd            string `json:"EmbedThreadsBatchCmd"`
	EmbedThreadsBatchVal            string `json:"EmbedThreadsBatchVal"`
	EmbedCpuMaskCmd                 string `json:"EmbedCpuMaskCmd"`
	EmbedCpuMaskVal                 string `json:"EmbedCpuMaskVal"`
	EmbedCpuRangeCmd                string `json:"EmbedCpuRangeCmd"`
	EmbedCpuRangeVal                string `json:"EmbedCpuRangeVal"`
	EmbedCpuStrictCmd               string `json:"EmbedCpuStrictCmd"`
	EmbedCpuStrictVal               string `json:"EmbedCpuStrictVal"`
	EmbedPrioCmd                    string `json:"EmbedPrioCmd"`
	EmbedPrioVal                    string `json:"EmbedPrioVal"`
	EmbedPollCmd                    string `json:"EmbedPollCmd"`
	EmbedPollVal                    string `json:"EmbedPollVal"`
	EmbedCpuMaskBatchCmd            string `json:"EmbedCpuMaskBatchCmd"`
	EmbedCpuMaskBatchVal            string `json:"EmbedCpuMaskBatchVal"`
	EmbedCpuRangeBatchCmd           string `json:"EmbedCpuRangeBatchCmd"`
	EmbedCpuRangeBatchVal           string `json:"EmbedCpuRangeBatchVal"`
	EmbedCpuStrictBatchCmd          string `json:"EmbedCpuStrictBatchCmd"`
	EmbedCpuStrictBatchVal          string `json:"EmbedCpuStrictBatchVal"`
	EmbedPrioBatchCmd               string `json:"EmbedPrioBatchCmd"`
	EmbedPrioBatchVal               string `json:"EmbedPrioBatchVal"`
	EmbedPollBatchCmd               string `json:"EmbedPollBatchCmd"`
	EmbedPollBatchVal               string `json:"EmbedPollBatchVal"`
	EmbedCtxSizeCmd                 string `json:"EmbedCtxSizeCmd"`
	EmbedCtxSizeVal                 string `json:"EmbedCtxSizeVal"`
	EmbedPredictCmd                 string `json:"EmbedPredictCmd"`
	EmbedPredictVal                 string `json:"EmbedPredictVal"`
	EmbedBatchCmd                   string `json:"EmbedBatchCmd"`
	EmbedBatchVal                   string `json:"EmbedBatchVal"`
	EmbedUBatchCmd                  string `json:"EmbedUBatchCmd"`
	EmbedUBatchVal                  string `json:"EmbedUBatchVal"`
	EmbedKeepCmd                    string `json:"EmbedKeepCmd"`
	EmbedKeepVal                    string `json:"EmbedKeepVal"`
	EmbedFlashAttentionCmd          string `json:"EmbedFlashAttentionCmd"`
	EmbedFlashAttentionCmdEnabled   bool   `json:"EmbedFlashAttentionCmdEnabled"`
	EmbedPromptCmd                  string `json:"EmbedPromptCmd"`
	EmbedPromptCmdEnabled           bool   `json:"EmbedPromptCmdEnabled"`
	EmbedPromptText                 string `json:"EmbedPromptText"`
	EmbedNoPerfCmd                  string `json:"EmbedNoPerfCmd"`
	EmbedNoPerfCmdEnabled           bool   `json:"EmbedNoPerfCmdEnabled"`
	EmbedPromptFileCmd              string `json:"EmbedPromptFileCmd"`
	EmbedPromptFileVal              string `json:"EmbedPromptFileVal"`
	EmbedBinaryFileCmd              string `json:"EmbedBinaryFileCmd"`
	EmbedBinaryFileVal              string `json:"EmbedBinaryFileVal"`
	EmbedEscapeNewLinesCmd          string `json:"EmbedEscapeNewLinesCmd"`
	EmbedEscapeNewLinesCmdEnabled   bool   `json:"EmbedEscapeNewLinesCmdEnabled"`
	EmbedNoEscapeCmd                string `json:"EmbedNoEscapeCmd"`
	EmbedNoEscapeCmdEnabled         bool   `json:"EmbedNoEscapeCmdEnabled"`
	EmbedRopeScalingCmd             string `json:"EmbedRopeScalingCmd"`
	EmbedRopeScalingVal             string `json:"EmbedRopeScalingVal"`
	EmbedRopeScaleCmd               string `json:"EmbedRopeScaleCmd"`
	EmbedRopeScaleVal               string `json:"EmbedRopeScaleVal"`
	EmbedRopeFreqBaseCmd            string `json:"EmbedRopeFreqBaseCmd"`
	EmbedRopeFreqBaseVal            string `json:"EmbedRopeFreqBaseVal"`
	EmbedRopeFreqScaleCmd           string `json:"EmbedRopeFreqScaleCmd"`
	EmbedRopeFreqScaleVal           string `json:"EmbedRopeFreqScaleVal"`
	EmbedYarnOrigContextCmd         string `json:"EmbedYarnOrigContextCmd"`
	EmbedYarnOrigContextVal         string `json:"EmbedYarnOrigContextVal"`
	EmbedYarnExtFactorCmd           string `json:"EmbedYarnExtFactorCmd"`
	EmbedYarnExtFactorVal           string `json:"EmbedYarnExtFactorVal"`
	EmbedYarnAttnFactorCmd          string `json:"EmbedYarnAttnFactorCmd"`
	EmbedYarnAttnFactorVal          string `json:"EmbedYarnAttnFactorVal"`
	EmbedYarnBetaSlowCmd            string `json:"EmbedYarnBetaSlowCmd"`
	EmbedYarnBetaSlowVal            string `json:"EmbedYarnBetaSlowVal"`
	EmbedYarnBetaFastCmd            string `json:"EmbedYarnBetaFastCmd"`
	EmbedYarnBetaFastVal            string `json:"EmbedYarnBetaFastVal"`
	EmbedDumpKvCacheCmd             string `json:"EmbedDumpKvCacheCmd"`
	EmbedDumpKvCacheCmdEnabled      bool   `json:"EmbedDumpKvCacheCmdEnabled"`
	EmbedNoKvOffloadCmd             string `json:"EmbedNoKvOffloadCmd"`
	EmbedNoKvOffloadCmdEnabled      bool   `json:"EmbedNoKvOffloadCmdEnabled"`
	EmbedCacheTypeKCmd              string `json:"EmbedCacheTypeKCmd"`
	EmbedCacheTypeKVal              string `json:"EmbedCacheTypeKVal"`
	EmbedCacheTypeVCmd              string `json:"EmbedCacheTypeVCmd"`
	EmbedCacheTypeVVal              string `json:"EmbedCacheTypeVVal"`
	EmbedDefragTholdCmd             string `json:"EmbedDefragTholdCmd"`
	EmbedDefragTholdVal             string `json:"EmbedDefragTholdVal"`
	EmbedParallelCmd                string `json:"EmbedParallelCmd"`
	EmbedParallelVal                string `json:"EmbedParallelVal"`
	EmbedRpcCmd                     string `json:"EmbedRpcCmd"`
	EmbedRpcVal                     string `json:"EmbedRpcVal"`
	EmbedMemLockCmd                 string `json:"EmbedMemLockCmd"`
	EmbedMemLockCmdEnabled          bool   `json:"EmbedMemLockCmdEnabled"`
	EmbedNoMmapCmd                  string `json:"EmbedNoMmapCmd"`
	EmbedNoMmapCmdEnabled           bool   `json:"EmbedNoMmapCmdEnabled"`
	EmbedNumaCmd                    string `json:"EmbedNumaCmd"`
	EmbedNumaVal                    string `json:"EmbedNumaVal"`
	EmbedDeviceCmd                  string `json:"EmbedDeviceCmd"`
	EmbedDeviceVal                  string `json:"EmbedDeviceVal"`
	EmbedListDevicesCmd             string `json:"EmbedListDevicesCmd"`
	EmbedListDevicesCmdEnabled      bool   `json:"EmbedListDevicesCmdEnabled"`
	EmbedOverrideTensorCmd          string `json:"EmbedOverrideTensorCmd"`
	EmbedOverrideTensorVal          string `json:"EmbedOverrideTensorVal"`
	EmbedGPULayersCmd               string `json:"EmbedGPULayersCmd"`
	EmbedGPULayersVal               string `json:"EmbedGPULayersVal"`
	EmbedSplitModeCmd               string `json:"EmbedSplitModeCmd"`
	EmbedSplitModeVal               string `json:"EmbedSplitModeVal"`
	EmbedTensorSplitCmd             string `json:"EmbedTensorSplitCmd"`
	EmbedTensorSplitVal             string `json:"EmbedTensorSplitVal"`
	EmbedMainGPUCmd                 string `json:"EmbedMainGPUCmd"`
	EmbedMainGPUVal                 string `json:"EmbedMainGPUVal"`
	EmbedCheckTensorsCmd            string `json:"EmbedCheckTensorsCmd"`
	EmbedCheckTensorsCmdEnabled     bool   `json:"EmbedCheckTensorsCmdEnabled"`
	EmbedOverrideKvCmd              string `json:"EmbedOverrideKvCmd"`
	EmbedOverrideKvVal              string `json:"EmbedOverrideKvVal"`
	EmbedLoraCmd                    string `json:"EmbedLoraCmd"`
	EmbedLoraVal                    string `json:"EmbedLoraVal"`
	EmbedLoraScaledCmd              string `json:"EmbedLoraScaledCmd"`
	EmbedLoraScaledVal              string `json:"EmbedLoraScaledVal"`
	EmbedControlVectorCmd           string `json:"EmbedControlVectorCmd"`
	EmbedControlVectorVal           string `json:"EmbedControlVectorVal"`
	EmbedControlVectorScaledCmd     string `json:"EmbedControlVectorScaledCmd"`
	EmbedControlVectorScaledVal     string `json:"EmbedControlVectorScaledVal"`
	EmbedControlVectorLayerRangeCmd string `json:"EmbedControlVectorLayerRangeCmd"`
	EmbedControlVectorLayerRangeVal string `json:"EmbedControlVectorLayerRangeVal"`
	EmbedModelCmd                   string `json:"EmbedModelCmd"`
	EmbedModelFullPathVal           string `json:"EmbedModelFullPathVal"`
	EmbedModelUrlCmd                string `json:"EmbedModelUrlCmd"`
	EmbedModelUrlVal                string `json:"EmbedModelUrlVal"`
	EmbedHfRepoCmd                  string `json:"EmbedHfRepoCmd"`
	EmbedHfRepoVal                  string `json:"EmbedHfRepoVal"`
	EmbedHfRepoDraftCmd             string `json:"EmbedHfRepoDraftCmd"`
	EmbedHfRepoDraftVal             string `json:"EmbedHfRepoDraftVal"`
	EmbedHfFileCmd                  string `json:"EmbedHfFileCmd"`
	EmbedHfFileVal                  string `json:"EmbedHfFileVal"`
	EmbedHfRepoVCmd                 string `json:"EmbedHfRepoVCmd"`
	EmbedHfRepoVVal                 string `json:"EmbedHfRepoVVal"`
	EmbedHfFileVCmd                 string `json:"EmbedHfFileVCmd"`
	EmbedHfFileVVal                 string `json:"EmbedHfFileVVal"`
	EmbedHfTokenCmd                 string `json:"EmbedHfTokenCmd"`
	EmbedHfTokenVal                 string `json:"EmbedHfTokenVal"`
	EmbedLogDisableCmd              string `json:"EmbedLogDisableCmd"`
	EmbedLogDisableCmdEnabled       bool   `json:"EmbedLogDisableCmdEnabled"`
	EmbedModelLogFileCmd            string `json:"EmbedModelLogFileCmd"`
	EmbedModelLogFileNameVal        string `json:"EmbedModelLogFileNameVal"`
	EmbedLogColorsCmd               string `json:"EmbedLogColorsCmd"`
	EmbedLogColorsCmdEnabled        bool   `json:"EmbedLogColorsCmdEnabled"`
	EmbedLogVerboseCmd              string `json:"EmbedLogVerboseCmd"`
	EmbedLogVerboseEnabled          bool   `json:"EmbedLogVerboseEnabled"`
	EmbedLogVerbosityCmd            string `json:"EmbedLogVerbosityCmd"`
	EmbedLogVerbosityVal            string `json:"EmbedLogVerbosityVal"`
	EmbedLogPrefixCmd               string `json:"EmbedLogPrefixCmd"`
	EmbedLogPrefixCmdEnabled        bool   `json:"EmbedLogPrefixCmdEnabled"`
	EmbedLogTimestampsCmd           string `json:"EmbedLogTimestampsCmd"`
	EmbedLogTimestampsCmdEnabled    bool   `json:"EmbedLogTimestampsCmdEnabled"`

	// ----- sampling params -----
	EmbedSamplersCmd           string `json:"EmbedSamplersCmd"`
	EmbedSamplersVal           string `json:"EmbedSamplersVal"`
	EmbedRandomSeedCmd         string `json:"EmbedRandomSeedCmd"`
	EmbedRandomSeedVal         string `json:"EmbedRandomSeedVal"`
	EmbedSamplingSeqCmd        string `json:"EmbedSamplingSeqCmd"`
	EmbedSamplingSeqVal        string `json:"EmbedSamplingSeqVal"`
	EmbedIgnoreEosCmd          string `json:"EmbedIgnoreEosCmd"`
	EmbedIgnoreEosCmdEnabled   bool   `json:"EmbedIgnoreEosCmdEnabled"`
	EmbedTemperatureCmd        string `json:"EmbedTemperatureCmd"`
	EmbedTemperatureVal        string `json:"EmbedTemperatureVal"`
	EmbedTopKCmd               string `json:"EmbedTopKCmd"`
	EmbedTopKVal               string `json:"EmbedTopKVal"`
	EmbedTopPCmd               string `json:"EmbedTopPCmd"`
	EmbedTopPVal               string `json:"EmbedTopPVal"`
	EmbedMinPCmd               string `json:"EmbedMinPCmd"`
	EmbedMinPVal               string `json:"EmbedMinPVal"`
	EmbedXtcProbabilityCmd     string `json:"EmbedXtcProbabilityCmd"`
	EmbedXtcProbabilityVal     string `json:"EmbedXtcProbabilityVal"`
	EmbedXtcThresholdCmd       string `json:"EmbedXtcThresholdCmd"`
	EmbedXtcThresholdVal       string `json:"EmbedXtcThresholdVal"`
	EmbedTypicalCmd            string `json:"EmbedTypicalCmd"`
	EmbedTypicalVal            string `json:"EmbedTypicalVal"`
	EmbedRepeatLastPenaltyCmd  string `json:"EmbedRepeatLastPenaltyCmd"`
	EmbedRepeatLastPenaltyVal  string `json:"EmbedRepeatLastPenaltyVal"`
	EmbedRepeatPenaltyCmd      string `json:"EmbedRepeatPenaltyCmd"`
	EmbedRepeatPenaltyVal      string `json:"EmbedRepeatPenaltyVal"`
	EmbedPresencePenaltyCmd    string `json:"EmbedPresencePenaltyCmd"`
	EmbedPresencePenaltyVal    string `json:"EmbedPresencePenaltyVal"`
	EmbedFrequencyPenaltyCmd   string `json:"EmbedFrequencyPenaltyCmd"`
	EmbedFrequencyPenaltyVal   string `json:"EmbedFrequencyPenaltyVal"`
	EmbedDryMultiplierCmd      string `json:"EmbedDryMultiplierCmd"`
	EmbedDryMultiplierVal      string `json:"EmbedDryMultiplierVal"`
	EmbedDryBaseCmd            string `json:"EmbedDryBaseCmd"`
	EmbedDryBaseVal            string `json:"EmbedDryBaseVal"`
	EmbedDryAllowedLengthCmd   string `json:"EmbedDryAllowedLengthCmd"`
	EmbedDryAllowedLengthVal   string `json:"EmbedDryAllowedLengthVal"`
	EmbedDryPenaltyLastNCmd    string `json:"EmbedDryPenaltyLastNCmd"`
	EmbedDryPenaltyLastNVal    string `json:"EmbedDryPenaltyLastNVal"`
	EmbedDrySequenceBreakerCmd string `json:"EmbedDrySequenceBreakerCmd"`
	EmbedDrySequenceBreakerVal string `json:"EmbedDrySequenceBreakerVal"`
	EmbedDynatempRangeCmd      string `json:"EmbedDynatempRangeCmd"`
	EmbedDynatempRangeVal      string `json:"EmbedDynatempRangeVal"`
	EmbedDynatempExpCmd        string `json:"EmbedDynatempExpCmd"`
	EmbedDynatempExpVal        string `json:"EmbedDynatempExpVal"`
	EmbedMirostatCmd           string `json:"EmbedMirostatCmd"`
	EmbedMirostatVal           string `json:"EmbedMirostatVal"`
	EmbedMirostatLrCmd         string `json:"EmbedMirostatLrCmd"`
	EmbedMirostatLrVal         string `json:"EmbedMirostatLrVal"`
	EmbedMirostatEntCmd        string `json:"EmbedMirostatEntCmd"`
	EmbedMirostatEntVal        string `json:"EmbedMirostatEntVal"`
	EmbedLogitBiasCmd          string `json:"EmbedLogitBiasCmd"`
	EmbedLogitBiasVal          string `json:"EmbedLogitBiasVal"`
	EmbedGrammarCmd            string `json:"EmbedGrammarCmd"`
	EmbedGrammarVal            string `json:"EmbedGrammarVal"`
	EmbedGrammarFileCmd        string `json:"EmbedGrammarFileCmd"`
	EmbedGrammarFileVal        string `json:"EmbedGrammarFileVal"`
	EmbedJsonSchemaCmd         string `json:"EmbedJsonSchemaCmd"`
	EmbedJsonSchemaVal         string `json:"EmbedJsonSchemaVal"`
	EmbedJsonSchemaFileCmd     string `json:"EmbedJsonSchemaFileCmd"`
	EmbedJsonSchemaFileVal     string `json:"EmbedJsonSchemaFileVal"`

	// ----- example-specific params -----
	EmbedNoWarmupCmd                 string `json:"EmbedNoWarmupCmd"`
	EmbedNoWarmupCmdEnabled          bool   `json:"EmbedNoWarmupCmdEnabled"`
	EmbedPoolingCmd                  string `json:"EmbedPoolingCmd"`
	EmbedPoolingVal                  string `json:"EmbedPoolingVal"`
	EmbedAttentionCmd                string `json:"EmbedAttentionCmd"`
	EmbedAttentionVal                string `json:"EmbedAttentionVal"`
	EmbedNormalizeCmd                string `json:"EmbedNormalizeCmd"`
	EmbedNormalizeVal                string `json:"EmbedNormalizeVal"`
	EmbedOutputFormatCmd             string `json:"EmbedOutputFormatCmd"`
	EmbedOutputFormatVal             string `json:"EmbedOutputFormatVal"`
	EmbedSeparatorCmd                string `json:"EmbedSeparatorCmd"`
	EmbedSeparatorVal                string `json:"EmbedSeparatorVal"`
	EmbedBgeSmallEnDefaultCmd        string `json:"EmbedBgeSmallEnDefaultCmd"`
	EmbedBgeSmallEnDefaultCmdEnabled bool   `json:"EmbedBgeSmallEnDefaultCmdEnabled"`
	EmbedE5SmallEnDefaultCmd         string `json:"EmbedE5SmallEnDefaultCmd"`
	EmbedE5SmallEnDefaultCmdEnabled  bool   `json:"EmbedE5SmallEnDefaultCmdEnabled"`
	EmbedGteSmallDefaultCmd          string `json:"EmbedGteSmallDefaultCmd"`
	EmbedGteSmallDefaultCmdEnabled   bool   `json:"EmbedGteSmallDefaultCmdEnabled"`
}
type DefaultAppArgs struct {
	ModelPath                    string   `json:"ModelPath"`
	AppLogPath                   string   `json:"AppLogPath"`
	AppLogFileName               string   `json:"AppLogFileName"`
	PromptTempPath               string   `json:"PromptTempPath"`
	LLamaCliPath                 string   `json:"LLamaCliPath"`
	LLamaEmbedCliPath            string   `json:"LLamaEmbedCliPath"`
	PDFToTextPath                string   `json:"PDFToTextPath"`
	ModelLogPath                 string   `json:"ModelLogPath"`
	DocumentPath                 string   `json:"DocumentPath"`
	EmbedModelFileName           string   `json:"EmbedModelFileName"`
	ModelFileName                string   `json:"ModelFileName"`
	PromptCachePath              string   `json:"PromptCachePath"`
	MongoURI                     string   `json:"MongoURI"`
	TesseractPath                string   `json:"TesseractPath"`
	PdfToImagesPath              string   `json:"PdfToImagesPath"`
	ElasticsearchAPIKey          string   `json:"ElasticsearchAPIKey"`
	ElasticsearchServerAddresses []string `json:"ElasticsearchServerAddresses"`
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
	logger     logger.Logger
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

type PDFLoader struct {
	loader Loader

	pdfToTextPath string
	path          string
}

type ElasticDocumentTextChunk struct {
	TextChunk string    `json:"textChunk"`
	Vector    []float32 `json:"vector"`
}
type ElasticDocument struct {
	Title          string                     `json:"title"`
	MetaTextDesc   string                     `json:"metaTextDesc"`
	MetaKeyWords   string                     `json:"metaKeyWords"`
	SourceLocation string                     `json:"sourceLocation"`
	Timestamp      string                     `json:"timestamp"`
	DocChunks      []ElasticDocumentTextChunk `json:"docChunks"`
}

type ElasticDocumentResponse struct {
	Title          string `json:"title"`
	MetaTextDesc   string `json:"metaTextDesc"`
	MetaKeyWords   string `json:"metaKeyWords"`
	SourceLocation string `json:"sourceLocation"`
	Timestamp      string `json:"timestamp"`
	Id             string `json:"id"`
}
