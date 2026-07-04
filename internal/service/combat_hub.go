package service

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// CombatHub tracks per-user WebSocket connections for combat events.
type CombatHub struct {
	mu             sync.RWMutex
	conns          map[uint]map[*websocket.Conn]struct{}
	testConnected  map[uint]bool
}

func NewCombatHub() *CombatHub {
	return &CombatHub{conns: make(map[uint]map[*websocket.Conn]struct{})}
}

// SetUserConnectedForTest marks a user as WS-connected (unit tests only).
func (h *CombatHub) SetUserConnectedForTest(userID uint, connected bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.testConnected == nil {
		h.testConnected = make(map[uint]bool)
	}
	if connected {
		h.testConnected[userID] = true
	} else {
		delete(h.testConnected, userID)
	}
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
	if h.testConnected != nil && h.testConnected[userID] {
		return true
	}
	return len(h.conns[userID]) > 0
}

// WSMessage is the envelope sent to clients.
type WSMessage struct {
	Seq   int64           `json:"seq"`
	Type  string          `json:"type"`
	Event json.RawMessage `json:"event,omitempty"`
}
