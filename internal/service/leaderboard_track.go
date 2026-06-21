package service

import "encoding/json"

const (
	LeaderboardWindowSteps      = 1000
	LeaderboardMinLifetimeSteps = 1000
)

type leaderboardTrackSegment struct {
	Steps int     `json:"steps"`
	Gold  float64 `json:"gold"`
	Xp    float64 `json:"xp"`
}

type leaderboardTrack struct {
	LifetimeSteps int                       `json:"lifetimeSteps"`
	Segments      []leaderboardTrackSegment `json:"segments"`
}

func emptyLeaderboardTrack() leaderboardTrack {
	return leaderboardTrack{LifetimeSteps: 0, Segments: []leaderboardTrackSegment{}}
}

func explorationSteps(combat, rest int) int {
	total := combat + rest
	if total < 0 {
		return 0
	}
	return total
}

func normalizeLeaderboardTrack(raw json.RawMessage) leaderboardTrack {
	if len(raw) == 0 {
		return emptyLeaderboardTrack()
	}
	var track leaderboardTrack
	if err := json.Unmarshal(raw, &track); err != nil {
		return emptyLeaderboardTrack()
	}
	if track.LifetimeSteps < 0 {
		track.LifetimeSteps = 0
	}
	if track.Segments == nil {
		track.Segments = []leaderboardTrackSegment{}
	}
	clean := make([]leaderboardTrackSegment, 0, len(track.Segments))
	for _, seg := range track.Segments {
		if seg.Steps <= 0 {
			continue
		}
		if seg.Gold < 0 {
			seg.Gold = 0
		}
		if seg.Xp < 0 {
			seg.Xp = 0
		}
		clean = append(clean, seg)
	}
	track.Segments = clean
	if track.LifetimeSteps == 0 && len(track.Segments) > 0 {
		for _, seg := range track.Segments {
			track.LifetimeSteps += seg.Steps
		}
	}
	return trimLeaderboardWindow(track)
}

func appendLeaderboardTrackSegment(track leaderboardTrack, steps int, gold, xp float64) leaderboardTrack {
	if steps <= 0 {
		return track
	}
	if gold < 0 {
		gold = 0
	}
	if xp < 0 {
		xp = 0
	}
	track.Segments = append(track.Segments, leaderboardTrackSegment{
		Steps: steps,
		Gold:  gold,
		Xp:    xp,
	})
	track.LifetimeSteps += steps
	return trimLeaderboardWindow(track)
}

func trimLeaderboardWindow(track leaderboardTrack) leaderboardTrack {
	windowSteps := 0
	for _, seg := range track.Segments {
		windowSteps += seg.Steps
	}
	for windowSteps > LeaderboardWindowSteps && len(track.Segments) > 0 {
		first := track.Segments[0]
		excess := windowSteps - LeaderboardWindowSteps
		if first.Steps <= excess {
			windowSteps -= first.Steps
			track.Segments = track.Segments[1:]
			continue
		}
		keep := first.Steps - excess
		ratio := float64(keep) / float64(first.Steps)
		track.Segments[0] = leaderboardTrackSegment{
			Steps: keep,
			Gold:  first.Gold * ratio,
			Xp:    first.Xp * ratio,
		}
		windowSteps = LeaderboardWindowSteps
	}
	return track
}

func windowTotals(track leaderboardTrack) (steps int, gold, xp float64) {
	for _, seg := range track.Segments {
		steps += seg.Steps
		gold += seg.Gold
		xp += seg.Xp
	}
	return steps, gold, xp
}

func migrateLeaderboardTrackFromPlayerStats(track leaderboardTrack, stats playerStatsPayload) leaderboardTrack {
	if track.LifetimeSteps > 0 {
		return track
	}
	steps := explorationSteps(stats.CombatActionSteps, stats.RestSteps)
	if steps <= 0 {
		return track
	}
	return appendLeaderboardTrackSegment(emptyLeaderboardTrack(), steps, stats.CumulativeGold, stats.CumulativeXp)
}

func parseLeaderboardTrackFromSave(saveJSON json.RawMessage) (leaderboardTrack, playerStatsPayload, error) {
	var payload struct {
		TeamName         string          `json:"teamName"`
		PlayerStats      json.RawMessage `json:"playerStats"`
		LeaderboardTrack json.RawMessage `json:"leaderboardTrack"`
	}
	if err := json.Unmarshal(saveJSON, &payload); err != nil {
		return emptyLeaderboardTrack(), playerStatsPayload{}, err
	}
	var stats playerStatsPayload
	if len(payload.PlayerStats) > 0 {
		if err := json.Unmarshal(payload.PlayerStats, &stats); err != nil {
			return emptyLeaderboardTrack(), playerStatsPayload{}, err
		}
	}
	track := normalizeLeaderboardTrack(payload.LeaderboardTrack)
	track = migrateLeaderboardTrackFromPlayerStats(track, stats)
	return track, stats, nil
}
