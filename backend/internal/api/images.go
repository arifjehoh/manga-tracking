package api

import (
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const maxImageWidth = 800

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

func saveImage(file multipart.File, header *multipart.FileHeader, dataDir string) (string, error) {
	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		return "", fmt.Errorf("unsupported image format: %s (allowed: jpg, jpeg, png, gif, webp)", ext)
	}

	// Generate unique filename
	filename := uuid.New().String() + ext
	imagesDir := filepath.Join(dataDir, "images")
	fullPath := filepath.Join(imagesDir, filename)

	// Ensure images directory exists
	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create images directory: %w", err)
	}

	// Decode image to check dimensions
	img, format, err := image.Decode(file)
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Reset file pointer for saving
	if _, err := file.Seek(0, 0); err != nil {
		return "", fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Check if resizing is needed
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > maxImageWidth {
		// Resize image
		newHeight := int(float64(height) * float64(maxImageWidth) / float64(width))
		resized := image.NewRGBA(image.Rect(0, 0, maxImageWidth, newHeight))
		draw.CatmullRom.Scale(resized, resized.Bounds(), img, bounds, draw.Over, nil)

		// Save resized image
		outFile, err := os.Create(fullPath)
		if err != nil {
			return "", fmt.Errorf("failed to create file: %w", err)
		}
		defer outFile.Close()

		// Encode based on format
		switch format {
		case "jpeg", "jpg":
			if err := encodeJPEG(outFile, resized); err != nil {
				return "", fmt.Errorf("failed to encode JPEG: %w", err)
			}
		case "png":
			if err := encodePNG(outFile, resized); err != nil {
				return "", fmt.Errorf("failed to encode PNG: %w", err)
			}
		case "gif":
			if err := encodeGIF(outFile, resized); err != nil {
				return "", fmt.Errorf("failed to encode GIF: %w", err)
			}
		default:
			// For webp or unknown formats, just copy the original
			if _, err := file.Seek(0, 0); err != nil {
				return "", fmt.Errorf("failed to reset file pointer: %w", err)
			}
			if _, err := io.Copy(outFile, file); err != nil {
				return "", fmt.Errorf("failed to copy file: %w", err)
			}
		}
	} else {
		// Save original file without resizing
		outFile, err := os.Create(fullPath)
		if err != nil {
			return "", fmt.Errorf("failed to create file: %w", err)
		}
		defer outFile.Close()

		if _, err := io.Copy(outFile, file); err != nil {
			return "", fmt.Errorf("failed to copy file: %w", err)
		}
	}

	// Return relative path for storage in database
	return "/images/" + filename, nil
}

func encodeJPEG(w io.Writer, img image.Image) error {
	return jpeg.Encode(w, img, &jpeg.Options{Quality: 85})
}

func encodePNG(w io.Writer, img image.Image) error {
	return png.Encode(w, img)
}

func encodeGIF(w io.Writer, img image.Image) error {
	return gif.Encode(w, img, nil)
}
