package main

import (
	"fmt"
	"strings"
)

var (
	defaultSeparators                 = []string{"\n\n", "\n", " ", ""}
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

// AI-translated from https://github.com/hwchase17/langchain/blob/master/langchain/text_splitter.py
func (r *RecursiveCharacterTextSplitter) SplitDocuments(documents []Document) []Document {
	docs := make([]Document, 0)

	for i, doc := range documents {
		for _, chunk := range r.SplitText(doc.Content) {
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

func (r *RecursiveCharacterTextSplitter) SplitText(text string) []string {
	// Split incoming text and return chunks.
	finalChunks := []string{}
	// Get appropriate separator to use
	separator := r.separators[len(r.separators)-1]
	newSeparators := []string{}
	for i, s := range r.separators {
		if s == "" {
			separator = s
			break
		}

		if strings.Contains(text, s) {
			separator = s
			newSeparators = r.separators[i+1:]
			break
		}
	}
	// Now that we have the separator, split the text
	splits := strings.Split(text, separator)
	// Now go merging things, recursively splitting longer texts.
	goodSplits := []string{}
	for _, s := range splits {
		if r.lengthFunction(s) < r.chunkSize {
			goodSplits = append(goodSplits, s)
		} else {
			if len(goodSplits) > 0 {
				mergedText := r.mergeSplits(goodSplits, separator)
				finalChunks = append(finalChunks, mergedText...)
				goodSplits = []string{}
			}
			if len(newSeparators) == 0 {
				finalChunks = append(finalChunks, s)
			} else {
				otherInfo := r.SplitText(s)
				finalChunks = append(finalChunks, otherInfo...)
			}
		}
	}
	if len(goodSplits) > 0 {
		mergedText := r.mergeSplits(goodSplits, separator)
		finalChunks = append(finalChunks, mergedText...)
	}
	return finalChunks
}
