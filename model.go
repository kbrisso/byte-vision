package main

import (
	"context"
	"os/exec"
	"runtime"
	"syscall"
)

func GenerateSingleCompletionWithCancel(ctx context.Context, appArgs DefaultAppArgs, args []string) ([]byte, error) {
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
		cmd := exec.CommandContext(ctx, appArgs.LLamaCliPath, args...)
		// Hide the window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				HideWindow: true,
			}
		}
		out, err := cmd.Output()
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
