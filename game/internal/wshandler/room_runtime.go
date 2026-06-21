package wshandler

import (
	"context"
	"maps"
	"sync"
	"time"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// tickInterval は固定 tick の間隔（30Hz）。
const tickInterval = time.Second / 30

// conn は1接続が満たすべき最小インターフェース（gorilla の *websocket.Conn で実装）。
// テストでフェイクに差し替えられるよう抽象化する。
type conn interface {
	WriteJSON(v any) error
	Close() error
}

// roomRuntime は1バトルの実行時状態。tick ループ・接続・入力バッファを束ねる。
type roomRuntime struct {
	room  *battle.Room
	rails *railsclient.Client
	logs  []railsclient.FinishLog

	mu      sync.Mutex
	conns   map[string]conn         // userID -> 接続
	inputs  map[string]battle.Input // userID -> 最新入力
	done    chan struct{}
	stopped bool
}

func newRoomRuntime(room *battle.Room, rails *railsclient.Client) *roomRuntime {
	return &roomRuntime{
		room:   room,
		rails:  rails,
		conns:  make(map[string]conn),
		inputs: make(map[string]battle.Input),
		done:   make(chan struct{}),
	}
}

// addConn は接続を登録する。
func (rt *roomRuntime) addConn(userID string, c conn) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.conns[userID] = c
}

// setInput は最新の入力状態を上書きする（押下状態モデル）。
func (rt *roomRuntime) setInput(userID string, in battle.Input) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.inputs[userID] = in
}

// run は tick ループを回す。決着または stop で終了し、結果を Rails へ送る。
func (rt *roomRuntime) run(ctx context.Context) {
	ticker := time.NewTicker(tickInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-rt.done:
			return
		case <-ticker.C:
			if finished := rt.step(); finished {
				rt.finish(ctx)
				return
			}
		}
	}
}

// step は1 tick 進めて全接続へ state を配信する。決着したら true。
func (rt *roomRuntime) step() bool {
	rt.mu.Lock()
	inputs := make(map[string]battle.Input, len(rt.inputs))
	maps.Copy(inputs, rt.inputs)
	events := rt.room.Step(inputs)
	for _, ev := range events {
		rt.logs = append(rt.logs, railsclient.FinishLog{
			Turn: ev.Turn, ActorID: ev.ActorID, TargetID: ev.TargetID, Action: "attack", Damage: ev.Damage,
		})
	}
	state := snapshot(rt.room)
	conns := make(map[string]conn, len(rt.conns))
	maps.Copy(conns, rt.conns)
	finished := rt.room.Finished
	winner, loser := rt.room.WinnerID, rt.room.LoserID
	winnerTeam, loserTeam := playerTeamID(rt.room, winner), playerTeamID(rt.room, loser)
	rt.mu.Unlock()

	for _, c := range conns {
		_ = c.WriteJSON(state)
	}
	if finished {
		fin := FinishedMessage{
			Type:       "finished",
			WinnerTeam: winnerTeam,
			LoserTeam:  loserTeam,
			WinnerID:   winner,
			LoserID:    loser,
		}
		for _, c := range conns {
			_ = c.WriteJSON(fin)
		}
	}
	return finished
}

// finish は結果を Rails へ冪等保存し、接続を閉じる。
func (rt *roomRuntime) finish(ctx context.Context) {
	rt.mu.Lock()
	body := railsclient.FinishRequest{
		WinnerID: rt.room.WinnerID, LoserID: rt.room.LoserID,
		WinnerTeam: playerTeamID(rt.room, rt.room.WinnerID),
		LoserTeam:  playerTeamID(rt.room, rt.room.LoserID),
		Logs:       rt.logs,
	}
	rt.mu.Unlock()

	if rt.rails != nil {
		_ = rt.rails.PostFinish(ctx, rt.room.BattleID, body)
	}
	rt.stop()
}

// playerTeamID は永続化対象のクラスIDを返す。無所属の1対1では空文字を返す。
func playerTeamID(room *battle.Room, playerID string) string {
	if player := room.Players[playerID]; player != nil {
		return player.TeamID
	}
	return ""
}

// stop は tick ループを止め、接続を閉じる（多重呼び出し安全）。
func (rt *roomRuntime) stop() {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	if rt.stopped {
		return
	}
	rt.stopped = true
	close(rt.done)
	for _, c := range rt.conns {
		_ = c.Close()
	}
}
