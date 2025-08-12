package main

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/jonathanhecl/chunker"
	"github.com/wailsapp/wails/v2/pkg/logger"
)

var (
	defaultSeparators                 = []string{"\n\n", "\n", " "}
	defaultLengthFunction LenFunction = func(s string) int { return len(s) }
)

var StopWordsSet = map[string]struct{}{
	"i": {}, "me": {}, "my": {}, "myself": {}, "we": {}, "our": {}, "ours": {}, "ourselves": {},
	"you": {}, "your": {}, "yours": {}, "yourself": {}, "yourselves": {},
	"he": {}, "him": {}, "his": {}, "himself": {},
	"she": {}, "her": {}, "hers": {}, "herself": {},
	"it": {}, "its": {}, "itself": {},
	"they": {}, "them": {}, "their": {}, "theirs": {}, "themselves": {},
	"what": {}, "which": {}, "who": {}, "whom": {},
	"this": {}, "that": {}, "these": {}, "those": {},
	"am": {}, "is": {}, "are": {}, "was": {}, "were": {}, "be": {}, "been": {}, "being": {},
	"have": {}, "has": {}, "had": {}, "having": {},
	"do": {}, "does": {}, "did": {}, "doing": {},
	"a": {}, "an": {}, "the": {},
	"and": {}, "but": {}, "if": {}, "or": {}, "because": {}, "as": {}, "until": {}, "while": {},
	"of": {}, "at": {}, "by": {}, "for": {}, "with": {}, "about": {}, "against": {}, "between": {},
	"into": {}, "through": {}, "during": {}, "before": {}, "after": {}, "above": {}, "below": {},
	"to": {}, "from": {}, "up": {}, "down": {}, "in": {}, "out": {}, "on": {}, "off": {}, "over": {}, "under": {},
	"again": {}, "further": {}, "then": {}, "once": {},
	"here": {}, "there": {}, "when": {}, "where": {}, "why": {}, "how": {},
	"all": {}, "any": {}, "both": {}, "each": {}, "few": {}, "more": {}, "most": {}, "other": {}, "some": {}, "such": {},
	"no": {}, "nor": {}, "not": {}, "only": {}, "own": {}, "same": {}, "so": {}, "than": {}, "too": {}, "very": {},
	"s": {}, "t": {}, "can": {}, "will": {}, "just": {}, "don": {}, "should": {}, "now": {},
}

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

		doc.Content = RemoveStopWordsFast(doc.Content)

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
func RemoveStopWordsFast(text string) string {
	if text == "" {
		return ""
	}

	// Use byte slice for maximum performance
	input := []byte(text)
	result := make([]byte, 0, len(input))

	i := 0
	for i < len(input) {
		// Skip leading whitespace
		for i < len(input) && isWhitespace(input[i]) {
			i++
		}

		if i >= len(input) {
			break
		}

		// Find word boundary
		wordStart := i
		for i < len(input) && !isWhitespace(input[i]) && !isPunctuation(input[i]) {
			i++
		}

		if i > wordStart {
			word := string(input[wordStart:i])
			cleanWord := strings.ToLower(word)

			// Check if not a stop word
			if _, isStopWord := StopWordsSet[cleanWord]; !isStopWord {
				if len(result) > 0 {
					result = append(result, ' ')
				}
				result = append(result, input[wordStart:i]...)
			}
		}

		// Skip punctuation
		for i < len(input) && (isWhitespace(input[i]) || isPunctuation(input[i])) {
			i++
		}
	}

	return string(result)
}

func isWhitespace(b byte) bool {
	return b == ' ' || b == '\t' || b == '\n' || b == '\r'
}

func isPunctuation(b byte) bool {
	return (b >= 33 && b <= 47) || (b >= 58 && b <= 64) ||
		(b >= 91 && b <= 96) || (b >= 123 && b <= 126)
}
