package wshandler

import (
	"testing"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
)

// fakeConn は送信されたメッセージを記録するテスト用接続。
type fakeConn struct {
	messages []any
	closed   bool
}

func (f *fakeConn) WriteJSON(v any) error { f.messages = append(f.messages, v); return nil }
func (f *fakeConn) Close() error          { f.closed = true; return nil }

func newTestRuntime() (*roomRuntime, *fakeConn, *fakeConn) {
	fields := []battle.Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 5}}
	a := battle.NewPlayer("A", "A", 0, 0, map[string]*battle.Summon{
		"math": {Subject: "math", HP: 100, Attack: 30, Defense: 5, Speed: 8},
	})
	b := battle.NewPlayer("B", "B", 1, 0, map[string]*battle.Summon{
		"math": {Subject: "math", HP: 10, Attack: 20, Defense: 5, Speed: 4},
	})
	a.Angle = 0
	a.Summoned = true
	room := battle.NewRoom("11", fields, map[string]*battle.Player{"A": a, "B": b}, battle.DefaultConfig())

	rt := newRoomRuntime(room, nil)
	ca, cb := &fakeConn{}, &fakeConn{}
	rt.addConn("A", ca)
	rt.addConn("B", cb)
	return rt, ca, cb
}

func TestRuntimeStepBroadcastsState(t *testing.T) {
	t.Run("ステップ実行時に全接続へ状態を配信する", func(t *testing.T) {
		rt, ca, cb := newTestRuntime()
		rt.step()

		if len(ca.messages) == 0 || len(cb.messages) == 0 {
			t.Fatal("両接続にstateが配信されるはず")
		}
		if _, ok := ca.messages[0].(StateMessage); !ok {
			t.Errorf("最初のメッセージはStateMessageのはず: %T", ca.messages[0])
		}
	})
}

func TestRuntimeStepRecordsLogsAndFinishes(t *testing.T) {
	t.Run("攻撃ログを記録して決着メッセージを配信する", func(t *testing.T) {
		rt, ca, _ := newTestRuntime()
		rt.setInput("A", battle.Input{Attack: true})

		finished := rt.step()
		if !finished {
			t.Fatal("HP10をダメージ25で撃破し決着するはず")
		}
		if len(rt.logs) != 1 || rt.logs[0].Damage != 25 {
			t.Errorf("攻撃ログが記録されるはず: %+v", rt.logs)
		}
		// state と finished の両方が配信される。
		var hasFinished bool
		for _, m := range ca.messages {
			if fm, ok := m.(FinishedMessage); ok && fm.WinnerID == "A" {
				hasFinished = true
			}
		}
		if !hasFinished {
			t.Error("finishedメッセージが配信されるはず")
		}
	})
}

func TestRuntimeStop(t *testing.T) {
	t.Run("停止時に全接続を閉じ多重停止してもパニックしない", func(t *testing.T) {
		rt, ca, cb := newTestRuntime()
		rt.stop()
		if !ca.closed || !cb.closed {
			t.Error("stopで全接続が閉じるはず")
		}
		// 多重 stop でパニックしない。
		rt.stop()
	})
}
