package service

import (
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
)

const MessageBoardMaxContentRunes = 500

var (
	ErrMessageBoardEmpty      = errors.New("message content is empty")
	ErrMessageBoardTooLong    = errors.New("message content is too long")
	ErrMessageBoardSaveLookup = errors.New("failed to load player save")
)

type MessageBoardService struct {
	messageBoardRepo *repository.MessageBoardRepository
	saveService      *SaveService
}

func NewMessageBoardService(
	messageBoardRepo *repository.MessageBoardRepository,
	saveService *SaveService,
) *MessageBoardService {
	return &MessageBoardService{
		messageBoardRepo: messageBoardRepo,
		saveService:      saveService,
	}
}

type MessageBoardItem struct {
	ID        uint      `json:"id"`
	TeamName  string    `json:"team_name"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	IsSelf    bool      `json:"is_self"`
}

type MessageBoardListResponse struct {
	Messages []MessageBoardItem `json:"messages"`
}

func normalizeMessageContent(content string) (string, error) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return "", ErrMessageBoardEmpty
	}
	if utf8.RuneCountInString(trimmed) > MessageBoardMaxContentRunes {
		return "", ErrMessageBoardTooLong
	}
	return trimmed, nil
}

func teamNameFromSaveJSON(saveJSON json.RawMessage) string {
	var payload savePayload
	if err := json.Unmarshal(saveJSON, &payload); err != nil {
		return ""
	}
	return strings.TrimSpace(payload.TeamName)
}

func (s *MessageBoardService) teamNameForUser(userID uint) (string, error) {
	saveJSON, err := s.saveService.GetSave(userID)
	if err != nil {
		return "", ErrMessageBoardSaveLookup
	}
	return teamNameFromSaveJSON(saveJSON), nil
}

func toMessageBoardItem(entry model.MessageBoardEntry, viewerUserID uint) MessageBoardItem {
	return MessageBoardItem{
		ID:        entry.ID,
		TeamName:  entry.TeamName,
		Content:   entry.Content,
		CreatedAt: entry.CreatedAt,
		IsSelf:    entry.UserID == viewerUserID,
	}
}

func (s *MessageBoardService) ListMessages(userID uint, limit int, beforeID uint) (*MessageBoardListResponse, error) {
	rows, err := s.messageBoardRepo.ListRecent(limit, beforeID)
	if err != nil {
		return nil, err
	}
	items := make([]MessageBoardItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, toMessageBoardItem(row, userID))
	}
	return &MessageBoardListResponse{Messages: items}, nil
}

func (s *MessageBoardService) PostMessage(userID uint, content string) (*MessageBoardItem, error) {
	normalized, err := normalizeMessageContent(content)
	if err != nil {
		return nil, err
	}
	teamName, err := s.teamNameForUser(userID)
	if err != nil {
		return nil, err
	}
	entry := &model.MessageBoardEntry{
		UserID:   userID,
		TeamName: teamName,
		Content:  normalized,
	}
	if err := s.messageBoardRepo.Create(entry); err != nil {
		return nil, err
	}
	item := toMessageBoardItem(*entry, userID)
	return &item, nil
}
