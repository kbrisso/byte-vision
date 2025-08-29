package main

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var mongoClient *mongo.Client
var mongoDatabase *mongo.Database

const (
	DatabaseName                 = "byte-vision"
	CliSettingsCollection        = "cli-settings"
	EmbedSettingsCollection      = "embed-settings"
	DocumentQuestionsCollection  = "document-questions"
	InferenceQuestionsCollection = "inference-questions"

	DefaultTimeout    = 5 * time.Second
	LongTimeout       = 60 * time.Second
	ConnectionTimeout = 10 * time.Second
)

type QuestionResponse struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Response  string        `bson:"response" json:"response"`
	Args      string        `bson:"args" json:"args"`
	Question  string        `bson:"question" json:"question"`
	CreatedAt time.Time     `bson:"createdAt" json:"createdAt"`
}

// DocumentQuestionResponse represents a document question and its response
type DocumentQuestionResponse struct {
	ID          bson.ObjectID  `bson:"_id,omitempty" json:"id,omitempty"`
	DocumentID  string         `bson:"documentId" json:"documentId"`
	IndexName   string         `bson:"indexName" json:"indexName"`
	EmbedPrompt string         `bson:"embedPrompt" json:"embedPrompt"`
	DocPrompt   string         `bson:"docPrompt" json:"docPrompt"`
	Response    string         `bson:"response" json:"response"`
	Keywords    []string       `bson:"keywords" json:"keywords"`
	PromptType  string         `bson:"promptType" json:"promptType"`
	EmbedArgs   LlamaEmbedArgs `bson:"embedState" json:"embedState"`
	CliState    LlamaCliArgs   `bson:"cliState" json:"cliState"`
	CreatedAt   time.Time      `bson:"createdAt" json:"createdAt"`
	ProcessTime int64          `bson:"processTime" json:"processTime"` // in milliseconds
}

// SettingsDocument represents a saved settings document in MongoDB
type SettingsDocument struct {
	Settings    interface{} `bson:"settings" json:"settings"`
	CreatedAt   time.Time   `bson:"createdAt" json:"createdAt"`
	Description string      `bson:"description" json:"description"`
}

// ensureDatabaseConnection ensures database connection is established
func ensureDatabaseConnection(appArgs *DefaultAppArgs) error {
	if mongoClient == nil {
		return OpenDatabase(appArgs)
	}
	return nil
}

// initDatabase initializes the database connection and returns the database instance
func initDatabase(appArgs *DefaultAppArgs) (*mongo.Database, error) {
	// Open the database connection (sets up global mongoClient and mongoDatabase variables)
	if err := OpenDatabase(appArgs); err != nil {
		return nil, err
	}

	// Return the global database instance
	return mongoDatabase, nil
}

// createContextWithTimeout creates a context with the specified timeout
func createContextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}

// closeCursor safely closes a MongoDB cursor and handles errors
func closeCursor(cursor *mongo.Cursor, ctx context.Context) {
	if closeErr := cursor.Close(ctx); closeErr != nil {
		// Log error if needed - could be enhanced with proper logging
	}
}

// SaveCliSettings saves the current CLI settings to MongoDB with the given description
func SaveCliSettings(appArgs *DefaultAppArgs, description string, settings interface{}) error {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(LongTimeout)
	defer cancel()

	settingsCollection := mongoDatabase.Collection(CliSettingsCollection)

	settingsDocument := SettingsDocument{
		Settings:    settings,
		CreatedAt:   time.Now(),
		Description: description,
	}

	descriptionFilter := bson.M{"description": description}
	updateOperation := bson.M{"$set": settingsDocument}
	upsertOptions := options.UpdateOne().SetUpsert(true)

	_, err := settingsCollection.UpdateOne(ctx, descriptionFilter, updateOperation, upsertOptions)
	return err
}

// GetSavedCliSettings retrieves all saved CLI settings from MongoDB
func GetSavedCliSettings(appArgs *DefaultAppArgs) ([]SettingsDocument, error) {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	settingsCollection := mongoDatabase.Collection(CliSettingsCollection)
	settingsCursor, err := settingsCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer closeCursor(settingsCursor, ctx)

	var savedSettings []SettingsDocument
	if err := settingsCursor.All(ctx, &savedSettings); err != nil {
		return nil, err
	}

	return savedSettings, nil
}

// DeleteSavedCliSettings deletes a saved CLI settings document by description
func DeleteSavedCliSettings(appArgs *DefaultAppArgs, description string) error {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	settingsCollection := mongoDatabase.Collection(CliSettingsCollection)
	descriptionFilter := bson.M{"description": description}
	_, err := settingsCollection.DeleteOne(ctx, descriptionFilter)
	return err
}

// SaveEmbedSettings saves the current LlamaEmbed settings to MongoDB with the given description
func SaveEmbedSettings(appArgs *DefaultAppArgs, description string, settings interface{}) error {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(LongTimeout)
	defer cancel()

	embedCollection := mongoDatabase.Collection(EmbedSettingsCollection)

	embedDocument := SettingsDocument{
		Settings:    settings,
		CreatedAt:   time.Now(),
		Description: description,
	}

	descriptionFilter := bson.M{"description": description}
	updateOperation := bson.M{"$set": embedDocument}
	upsertOptions := options.UpdateOne().SetUpsert(true)

	_, err := embedCollection.UpdateOne(ctx, descriptionFilter, updateOperation, upsertOptions)
	return err
}

// GetSavedEmbedSettings retrieves all saved embed settings from MongoDB
func GetSavedEmbedSettings(appArgs *DefaultAppArgs) ([]SettingsDocument, error) {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(LongTimeout)
	defer cancel()

	embedCollection := mongoDatabase.Collection(EmbedSettingsCollection)
	embedCursor, err := embedCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer closeCursor(embedCursor, ctx)

	var savedEmbedSettings []SettingsDocument
	if err := embedCursor.All(ctx, &savedEmbedSettings); err != nil {
		return nil, err
	}

	return savedEmbedSettings, nil
}

// OpenDatabase opens a connection to MongoDB using the provided app arguments
func OpenDatabase(appArgs *DefaultAppArgs) error {
	// If we already have a connection, reuse it
	if mongoClient != nil && mongoDatabase != nil {
		return nil
	}

	ctx, cancel := createContextWithTimeout(LongTimeout)
	defer cancel()

	// Connect to MongoDB
	var err error
	clientOptions := options.Client().ApplyURI(appArgs.MongoURI)
	mongoClient, err = mongo.Connect(clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Check the connection
	if err = mongoClient.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	// Set up the database
	mongoDatabase = mongoClient.Database(DatabaseName)

	return nil
}

// SaveDocumentQuestionResponse saves a document question and its response to MongoDB
func SaveDocumentQuestionResponse(appArgs *DefaultAppArgs, questionResponse DocumentQuestionResponse) (string, error) {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return "", fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	documentCollection := mongoDatabase.Collection(DocumentQuestionsCollection)

	// Set creation time if not already set
	if questionResponse.CreatedAt.IsZero() {
		questionResponse.CreatedAt = time.Now()
	}

	// Insert the document
	insertResult, err := documentCollection.InsertOne(ctx, questionResponse)
	if err != nil {
		return "", fmt.Errorf("failed to save document question response: %w", err)
	}

	// Convert the inserted ID to string
	insertedID := insertResult.InsertedID.(bson.ObjectID).Hex()

	return insertedID, nil
}

// GetDocumentQuestionResponse retrieves document question responses for a specific document
func GetDocumentQuestionResponse(appArgs *DefaultAppArgs, documentID string) ([]DocumentQuestionResponse, error) {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	documentCollection := mongoDatabase.Collection(DocumentQuestionsCollection)

	// Create a filter for the document ID
	documentFilter := bson.M{"documentId": documentID}

	// Find all interactions for this document, sorted by creation time
	sortOptions := options.Find().SetSort(bson.M{"createdAt": -1}) // Sort newest first
	documentCursor, err := documentCollection.Find(ctx, documentFilter, sortOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve document question responses: %w", err)
	}
	defer closeCursor(documentCursor, ctx)

	// Decode the results
	var documentResponses []DocumentQuestionResponse
	if err := documentCursor.All(ctx, &documentResponses); err != nil {
		return nil, fmt.Errorf("failed to decode document question responses: %w", err)
	}

	return documentResponses, nil
}

// SaveQuestionResponse inserts a new record into the collection
func SaveQuestionResponse(appArgs *DefaultAppArgs, response string, args string, question string) error {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return err
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	// Create a new document
	questionResponseDoc := QuestionResponse{
		Response:  response,
		Args:      args,
		Question:  question,
		CreatedAt: time.Now(),
	}

	// Insert the document
	inferenceCollection := mongoDatabase.Collection(InferenceQuestionsCollection)
	_, err := inferenceCollection.InsertOne(ctx, questionResponseDoc)
	if err != nil {
		return fmt.Errorf("failed to insert question response: %w", err)
	}

	return nil
}

// GetInferenceHistory retrieves all records from the collection
func GetInferenceHistory(appArgs *DefaultAppArgs) ([]QuestionResponse, error) {
	if err := ensureDatabaseConnection(appArgs); err != nil {
		return nil, err
	}

	ctx, cancel := createContextWithTimeout(DefaultTimeout)
	defer cancel()

	inferenceCollection := mongoDatabase.Collection(InferenceQuestionsCollection)
	inferenceCursor, err := inferenceCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to find documents: %w", err)
	}
	defer closeCursor(inferenceCursor, ctx)

	var inferenceResults []QuestionResponse
	if err := inferenceCursor.All(ctx, &inferenceResults); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %w", err)
	}

	return inferenceResults, nil
}

// CloseDatabase closes the MongoDB connection
func CloseDatabase() error {
	if mongoClient != nil {
		ctx, cancel := createContextWithTimeout(DefaultTimeout)
		defer cancel()

		if err := mongoClient.Disconnect(ctx); err != nil {
			return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
		}
		mongoClient = nil
		mongoDatabase = nil
	}
	return nil
}
