package main

import (
	"fmt"
	"github.com/jonathanhecl/chunker"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	defaultSeparators                 = []string{"\n\n", "\n", " "}
	defaultLengthFunction LenFunction = func(s string) int { return len(s) }
)

type TextSplitter struct {
	chunkSize      int
	chunkOverlap   int
	lengthFunction LenFunction
}
type RecursiveCharacterTextSplitter struct {
	TextSplitter
	separators []string
}
type LenFunction func(string) int

//nolint:gocognit
func (t *TextSplitter) mergeSplits(splits []string, separator string) []string {
	docs := make([]string, 0)
	currentDoc := make([]string, 0)
	total := 0
	for _, d := range splits {
		splitLen := t.lengthFunction(d)

		if total+splitLen+getSLen(currentDoc, separator, 0) > t.chunkSize {
			if total > t.chunkSize {
				fmt.Printf("Created a chunk of size %d, which is longer than the specified %d", total, t.chunkSize)
			}
			if len(currentDoc) > 0 {
				doc := t.joinDocs(currentDoc, separator)
				if doc != "" {
					docs = append(docs, doc)
				}
				for (total > t.chunkOverlap) || (getSLen(currentDoc, separator, 0) > t.chunkSize) && total > 0 {
					//nolint:gosec
					total -= t.lengthFunction(currentDoc[0]) + getSLen(currentDoc, separator, 1)
					//nolint:gosec
					currentDoc = currentDoc[1:]
				}
			}
		}
		currentDoc = append(currentDoc, d)
		total += getSLen(currentDoc, separator, 1)
		total += splitLen
	}
	doc := t.joinDocs(currentDoc, separator)
	if doc != "" {
		docs = append(docs, doc)
	}
	return docs
}

func (t *TextSplitter) joinDocs(docs []string, separator string) string {
	text := strings.Join(docs, separator)
	return strings.TrimSpace(text)
}

func getSLen(currentDoc []string, separator string, compareLen int) int {
	if len(currentDoc) > compareLen {
		return len(separator)
	}

	return 0
}

func NewRecursiveCharacterTextSplitter(chunkSize int, chunkOverlap int) *RecursiveCharacterTextSplitter {
	return &RecursiveCharacterTextSplitter{
		TextSplitter: TextSplitter{
			chunkSize:      chunkSize,
			chunkOverlap:   chunkOverlap,
			lengthFunction: defaultLengthFunction,
		},
		separators: defaultSeparators,
	}
}

func (r *RecursiveCharacterTextSplitter) WithSeparators(separators []string) *RecursiveCharacterTextSplitter {
	r.separators = separators
	return r
}

func (r *RecursiveCharacterTextSplitter) WithLengthFunction(
	lengthFunction LenFunction,
) *RecursiveCharacterTextSplitter {
	r.lengthFunction = lengthFunction
	return r
}

func (r *RecursiveCharacterTextSplitter) SplitDocuments(log logger.Logger, appArgs DefaultAppArgs, documents []Document) []Document {
	docs := make([]Document, 0)
	var sourceStr string
	for i, doc := range documents {
		// Extract filename from metadata or use default
		filename := "parsed.txt" // default
		if sourcePath, exists := doc.Metadata[SourceMetadataKey]; exists {
			if sourceStr, ok := sourcePath.(string); ok {
				filename = filepath.Base(sourceStr) + "_parsed.txt"
			}
		}

		err := SaveAsText(appArgs.PromptTempPath, filename, doc.Content, log)
		if err != nil {
			log.Error(err.Error())
		}

		for _, chunk := range r.SplitText(appArgs, log, doc.Content, sourceStr) {
			metadata := make(Meta)
			for k, v := range documents[i].Metadata {
				metadata[k] = v
			}
			docs = append(docs,
				Document{
					Content:  chunk,
					Metadata: metadata,
				},
			)
		}
	}
	return docs
}

/*
Important for RAG tuning
1)Removes unwanted/special characters from the text while preserving common punctuation and symbols.
re := regexp.MustCompile(`[^a-zA-Z0-9.,!?;:'"\s\-_@#$%&*()[\]{}/<>+=]`)

**Pattern Breakdown**:
- `[^...]` - Negated character class (matches any character NOT in the brackets)
- `a-zA-Z` - Lowercase and uppercase letters
- `0-9` - Digits
- `.,!?;:'"` - Common punctuation marks
- - Whitespace characters (spaces, tabs, newlines) `\s`
- `\-_` - Hyphen and underscore (hyphen escaped to avoid range interpretation)
- `@#$%&*` - Common symbols
- `()[\]{}` - Brackets and parentheses (square brackets escaped)
- `/<>+=` - Mathematical and comparison operators

**Effect**: Any character not in this allowed set gets replaced with an empty string, effectively removing it from the text.

2)Matches various line break combinations to normalize them into consistent spacing.
Regex := regexp.MustCompile(`\r\n\r\n|\r\r|\r\n|\n\n|\r|\n`)

**Pattern Breakdown** (ordered by priority due to alternation `|`):
- - Windows double line break (CRLF + CRLF) `\r\n\r\n`
- - Double carriage return (old Mac style) `\r\r`
- - Windows single line break (CRLF) `\r\n`
- - Unix/Linux double line break (LF + LF) `\n\n`
- - Single carriage return (old Mac style) `\r`
- - Unix/Linux single line break (LF) `\n`

**Effect**: All matched line break patterns get replaced with a single space `" "`, normalizing different line ending formats and converting line breaks to spaces for text processing.
*/

func (r *RecursiveCharacterTextSplitter) SplitText(appArgs DefaultAppArgs, log logger.Logger, text string, filename string) []string {
	re := regexp.MustCompile(`[^a-zA-Z0-9.,!?;:'"\s\-_@#$%&*()[\]{}/<>+=]`)
	regex := regexp.MustCompile(`\r\n\r\n|\r\r|\r\n|\n\n|\r|\n`)

	var defaultSeparators []string = []string{"\n\n", "\n", "\r\n", "\r", "\r\n\r\n"}
	c := chunker.NewChunker(r.chunkSize, r.chunkOverlap, defaultSeparators, false, true)
	out := c.Chunk(regex.ReplaceAllString(re.ReplaceAllString(text, ""), " "))

	// Use the provided filename instead of hardcoded "chunked.txt"
	if len(filename) > 0 {
		outputFilename := filepath.Base(filename) + "_chunked.txt"
		err := SaveAsText(appArgs.PromptTempPath, outputFilename, strings.Join(out, "\n"), log)
		if err != nil {
			log.Error(err.Error())
		}
	} else {
		err := SaveAsText(appArgs.PromptTempPath, "chunked.txt", strings.Join(out, "\n"), log)
		if err != nil {
			log.Error(err.Error())
		}
	}

	return out
}
