package wshandler

import (
	"context"
	"sync"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// Registry は同時進行する複数バトルの roomRuntime をインメモリ管理する。
// sync.RWMutex で goroutine 安全。決着・切断でルームを破棄する。
type Registry struct {
	mu    sync.RWMutex
	rooms map[string]*roomRuntime
	rails *railsclient.Client
}

// NewRegistry は空のレジストリを作る。
func NewRegistry(rails *railsclient.Client) *Registry {
	return &Registry{rooms: make(map[string]*roomRuntime), rails: rails}
}

// getOrCreate は battleID のルームを返す。無ければ start-data を取得して生成し、
// tick ループを開始する。生成済みなら既存ルームを返す（2人目の参加者）。
func (r *Registry) getOrCreate(ctx context.Context, battleID string) (*roomRuntime, error) {
	r.mu.RLock()
	if rt, ok := r.rooms[battleID]; ok {
		r.mu.RUnlock()
		return rt, nil
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	// ロック昇格の間に作られていないか再確認。
	if rt, ok := r.rooms[battleID]; ok {
		return rt, nil
	}

	data, err := r.rails.FetchStartData(ctx, battleID)
	if err != nil {
		return nil, err
	}
	room := buildRoom(data, battle.DefaultConfig())
	rt := newRoomRuntime(room, r.rails)
	r.rooms[battleID] = rt

	// tick ループを開始。終了時にレジストリから取り除く。
	go func() {
		rt.run(context.Background())
		r.remove(battleID)
	}()

	return rt, nil
}

func (r *Registry) remove(battleID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.rooms, battleID)
}

// Count は進行中ルーム数（テスト・監視用）。
func (r *Registry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.rooms)
}
