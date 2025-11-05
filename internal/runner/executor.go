package runner

import (
	"bytes"
	"context"
	"io"
	"os/exec"
	"sync"
)

type ExecutionResult struct {
	Stdout string
	Stderr string
}

func RunSwalang(ctx context.Context, binPath, workDir, entry string) (*ExecutionResult, error) {
	cmd := exec.CommandContext(ctx, binPath, entry)
	cmd.Dir = workDir

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}

	if err := cmd.Start(); err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	var stdoutBuf, stderrBuf bytes.Buffer

	wg.Add(2)

	go func() {
		defer wg.Done()
		io.Copy(&stdoutBuf, stdoutPipe)
	}()

	go func() {
		defer wg.Done()
		io.Copy(&stderrBuf, stderrPipe)
	}()

	cmdErr := cmd.Wait()

	wg.Wait()

	return &ExecutionResult{
		Stdout: stdoutBuf.String(),
		Stderr: stderrBuf.String(),
	}, cmdErr
}
