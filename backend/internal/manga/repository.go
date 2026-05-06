package manga

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/arif/manga-tracker/internal/database"
)

type Repository struct {
	db *database.DB
}

func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetDB() *database.DB {
	return r.db
}

func (r *Repository) Create(m *Manga) error {
	if err := m.Validate(); err != nil {
		return err
	}

	query := `
		INSERT INTO manga (id, title, image, url, status, chapter, added_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()
	_, err := r.db.Exec(query, m.ID, m.Title, m.Image, m.URL, m.Status, m.Chapter, now, now)
	if err != nil {
		return fmt.Errorf("failed to create manga: %w", err)
	}
	m.AddedAt = now
	m.UpdatedAt = now
	return nil
}

func (r *Repository) GetByID(id string) (*Manga, error) {
	query := `SELECT id, title, image, url, status, chapter, added_at, updated_at FROM manga WHERE id = ?`

	var m Manga
	err := r.db.QueryRow(query, id).Scan(&m.ID, &m.Title, &m.Image, &m.URL, &m.Status, &m.Chapter, &m.AddedAt, &m.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get manga: %w", err)
	}
	return &m, nil
}

func (r *Repository) List() ([]*Manga, error) {
	query := `SELECT id, title, image, url, status, chapter, added_at, updated_at FROM manga ORDER BY updated_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list manga: %w", err)
	}
	defer rows.Close()

	var result []*Manga
	for rows.Next() {
		var m Manga
		if err := rows.Scan(&m.ID, &m.Title, &m.Image, &m.URL, &m.Status, &m.Chapter, &m.AddedAt, &m.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan manga: %w", err)
		}
		result = append(result, &m)
	}
	return result, nil
}

func (r *Repository) Update(m *Manga) error {
	if err := m.Validate(); err != nil {
		return err
	}

	query := `
		UPDATE manga 
		SET title = ?, image = ?, url = ?, status = ?, chapter = ?, updated_at = ?
		WHERE id = ?
	`
	now := time.Now()
	result, err := r.db.Exec(query, m.Title, m.Image, m.URL, m.Status, m.Chapter, now, m.ID)
	if err != nil {
		return fmt.Errorf("failed to update manga: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}

	m.UpdatedAt = now
	return nil
}

func (r *Repository) Delete(id string) error {
	query := `DELETE FROM manga WHERE id = ?`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete manga: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) GetSuggested() ([]*Manga, error) {
	oneWeekAgo := time.Now().Add(-7 * 24 * time.Hour)
	query := `
		SELECT id, title, image, url, status, chapter, added_at, updated_at 
		FROM manga 
		WHERE status = ? AND updated_at < ?
		ORDER BY updated_at ASC
	`

	rows, err := r.db.Query(query, StatusReading, oneWeekAgo)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggested manga: %w", err)
	}
	defer rows.Close()

	var result []*Manga
	for rows.Next() {
		var m Manga
		if err := rows.Scan(&m.ID, &m.Title, &m.Image, &m.URL, &m.Status, &m.Chapter, &m.AddedAt, &m.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan manga: %w", err)
		}
		result = append(result, &m)
	}
	return result, nil
}
