package main

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// OpenDatabase opens or creates the SQLite database
func OpenDatabase() error {

	var err error
	db, err = sql.Open("sqlite3", AppArgs.AppDBFullPath)
	if err != nil {
		return err
	}

	return nil
}

// InsertData inserts a new record into the table
func InsertData(completion, args, prompt, date string) error {
	if db == nil {
		err := OpenDatabase()
		if err != nil {
			return err
		}
	}
	query := `INSERT INTO TaskHistory (Completion, Args, Prompt, Date) VALUES (?, ?, ?, ?)`
	_, err := db.Exec(query, completion, args, prompt, date)
	if err != nil {
		return err
	}

	fmt.Println("Data inserted successfully.")
	return nil
}

// GetData retrieves all records from the table
func GetData() ([]map[string]interface{}, error) {
	if db == nil {
		err := OpenDatabase()
		if err != nil {
			return nil, err
		}
	}
	query := `SELECT IDX, Completion, Args, Prompt, Date FROM TaskHistory`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}

	var results []map[string]interface{}
	for rows.Next() {
		var IDX int
		var Completion, Args, Prompt, Date string
		err := rows.Scan(&IDX, &Completion, &Args, &Prompt, &Date)
		if err != nil {
			return nil, err
		}
		row := map[string]interface{}{
			"idx":        IDX,
			"completion": Completion,
			"args":       Args,
			"prompt":     Prompt,
			"date":       Date,
		}
		results = append(results, row)
	}

	fmt.Println("Data retrieved successfully.")
	return results, nil
}

// CloseDatabase closes the SQLite database connection
func CloseDatabase() error {
	if db != nil {
		return db.Close()
	}
	return nil
}
