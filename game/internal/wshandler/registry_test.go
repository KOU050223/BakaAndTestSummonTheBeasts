package wshandler

import (
	"sync"
	"testing"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
)

// newTestRoom は HTTP に依存しない最小の roomRuntime を作る（rails=nil）。
func newTestRoom(battleID string) *roomRuntime {
	fields := []battle.Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 5}}
	a := battle.NewPlayer("A", "A", 0, 0, map[string]*battle.Summon{"math": {Subject: "math", HP: 100}})
	b := battle.NewPlayer("B", "B", 1, 0, map[string]*battle.Summon{"math": {Subject: "math", HP: 100}})
	room := battle.NewRoom(battleID, fields, map[string]*battle.Player{"A": a, "B": b}, battle.DefaultConfig())
	return newRoomRuntime(room, nil)
}

func TestRegistryRemoveAndCount(t *testing.T) {
	t.Run("ルームの登録数を数え削除で取り除ける", func(t *testing.T) {
		r := NewRegistry(nil)
		if r.Count() != 0 {
			t.Fatalf("初期は0のはず: %d", r.Count())
		}

		// HTTP を介さず内部マップへ直接登録（getOrCreate の生成経路はHTTP依存のため分離）。
		r.rooms["11"] = newTestRoom("11")
		r.rooms["22"] = newTestRoom("22")
		if r.Count() != 2 {
			t.Fatalf("2ルームのはず: %d", r.Count())
		}

		r.remove("11")
		if r.Count() != 1 {
			t.Fatalf("削除後は1のはず: %d", r.Count())
		}
		if _, ok := r.rooms["11"]; ok {
			t.Error("削除したルームは残らないはず")
		}
	})
}

func TestRegistryRemoveIsIdempotent(t *testing.T) {
	t.Run("存在しないルームの削除はno-op", func(t *testing.T) {
		r := NewRegistry(nil)
		r.remove("missing") // パニックしない
		if r.Count() != 0 {
			t.Errorf("0のはず: %d", r.Count())
		}
	})
}

func TestRegistryConcurrentAccess(t *testing.T) {
	t.Run("並行な登録・削除・カウントでデータ競合しない", func(t *testing.T) {
		// go test -race と併用して mutex の正しさを検証する。
		r := NewRegistry(nil)
		var wg sync.WaitGroup
		for i := range 50 {
			wg.Add(1)
			go func(id string) {
				defer wg.Done()
				r.mu.Lock()
				r.rooms[id] = newTestRoom(id)
				r.mu.Unlock()
				_ = r.Count()
				r.remove(id)
			}(string(rune('A' + (i % 26))))
		}
		wg.Wait()
		if r.Count() != 0 {
			t.Errorf("全削除後は0のはず: %d", r.Count())
		}
	})
}
