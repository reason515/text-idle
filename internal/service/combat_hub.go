package service

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// CombatHub tracks per-user WebSocket connections for combat events.
type CombatHub struct {
	mu    sync.RWMutex
	conns map[uint]map[*websocket.Conn]struct{}
}

func NewCombatHub() *CombatHub {
	return &CombatHub{conns: make(map[uint]map[*websocket.Conn]struct{})}
}

func (h *CombatHub) Register(userID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.conns[userID] == nil {
		h.conns[userID] = make(map[*websocket.Conn]struct{})
	}
	h.conns[userID][conn] = struct{}{}
}

func (h *CombatHub) Unregister(userID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.conns[userID]; ok {
		delete(set, conn)
		if len(set) == 0 {
			delete(h.conns, userID)
		}
	}
}

func (h *CombatHub) Broadcast(userID uint, payload []byte) {
	h.mu.RLock()
	set := h.conns[userID]
	conns := make([]*websocket.Conn, 0, len(set))
	for c := range set {
		conns = append(conns, c)
	}
	h.mu.RUnlock()
	for _, c := range conns {
		_ = c.WriteMessage(websocket.TextMessage, payload)
	}
}

func (h *CombatHub) HasConnection(userID uint) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.conns[userID]) > 0
}

// WSMessage is the envelope sent to clients.
type WSMessage struct {
	Seq   int64           `json:"seq"`
	Type  string          `json:"type"`
	Event json.RawMessage `json:"event,omitempty"`
}
