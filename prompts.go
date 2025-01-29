package main

import "fmt"

// Package chat provides a chat prompt template.
// Sometimes you need to define a chat prompt, this package provides a way to do that.

func CreateTemplate(input string) string {
	return fmt.Sprintf("[INST] %s [/INST]", input)
}
