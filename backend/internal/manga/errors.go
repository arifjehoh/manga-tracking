package manga

import "errors"

var (
	ErrNotFound       = errors.New("manga not found")
	ErrInvalidTitle   = errors.New("title cannot be empty")
	ErrInvalidChapter = errors.New("chapter must be >= 0")
	ErrInvalidStatus  = errors.New("invalid status")
)
