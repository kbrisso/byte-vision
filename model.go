package main

import (
	"context"
	"os/exec"
	"regexp"
)

var llamaCppSanitizeRegexp = regexp.MustCompile(`\[.*?\]`)

func GenerateSingleCompletionWithCancel(ctx context.Context, args []string) ([]byte, error) {
	// Create a child context with cancel
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Create a channel to capture the result
	result := make(chan struct {
		output []byte
		err    error
	})

	// Run the command in a goroutine
	go func() {
		out, err := exec.CommandContext(ctx, AppArgs.LLamaCliPath, args...).Output()
		result <- struct {
			output []byte
			err    error
		}{output: out, err: err}
		close(result)
	}()

	select {
	case res := <-result:
		// Command completed
		return res.output, res.err
	case <-ctx.Done():
		// Context was canceled or timed out
		return nil, ctx.Err()
	}
}
