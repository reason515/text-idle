package service

import (
	"testing"
)

func TestNormalizeMessageContent_TrimsAndRejectsEmpty(t *testing.T) {
	got, err := normalizeMessageContent("  hello  ")
	if err != nil || got != "hello" {
		t.Fatalf("expected hello, got %q err=%v", got, err)
	}
	_, err = normalizeMessageContent("   ")
	if err != ErrMessageBoardEmpty {
		t.Fatalf("expected empty error, got %v", err)
	}
}

func TestNormalizeMessageContent_RejectsTooLong(t *testing.T) {
	long := make([]byte, MessageBoardMaxContentRunes+1)
	for i := range long {
		long[i] = 'a'
	}
	_, err := normalizeMessageContent(string(long))
	if err != ErrMessageBoardTooLong {
		t.Fatalf("expected too long error, got %v", err)
	}
}
