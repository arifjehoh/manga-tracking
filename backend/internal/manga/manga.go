package manga

import (
	"time"
)

type Status string

const (
	StatusReading   Status = "Reading"
	StatusBacklog   Status = "Backlog"
	StatusCompleted Status = "Completed"
	StatusDropped   Status = "Dropped"
	StatusHiatus    Status = "Hiatus"
)

type Manga struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Image     *string   `json:"image"`
	URL       *string   `json:"url"`
	Status    Status    `json:"status"`
	Chapter   int       `json:"chapter"`
	AddedAt   time.Time `json:"added_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *Manga) Validate() error {
	if m.Title == "" {
		return ErrInvalidTitle
	}
	if m.Chapter < 0 {
		return ErrInvalidChapter
	}
	switch m.Status {
	case StatusReading, StatusBacklog, StatusCompleted, StatusDropped, StatusHiatus:
		// valid
	default:
		return ErrInvalidStatus
	}
	return nil
}
