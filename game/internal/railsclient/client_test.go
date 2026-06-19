package railsclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetchStartData(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Internal-Secret") != "s3cret" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if r.URL.Path != "/internal/battles/11/start-data" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		_ = json.NewEncoder(w).Encode(StartData{
			BattleID: "11",
			Fields:   []FieldData{{Subject: "math", CenterX: 5, CenterZ: 0, Radius: 3}},
			Players: []PlayerData{
				{UserID: "38", Name: "A", Summons: []SummonData{{Subject: "math", HP: 140, Attack: 30, Defense: 12, Speed: 8}}},
			},
		})
	}))
	defer ts.Close()

	c := New(ts.URL, "s3cret")
	data, err := c.FetchStartData(context.Background(), "11")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if data.BattleID != "11" || len(data.Fields) != 1 || data.Fields[0].Subject != "math" {
		t.Errorf("unexpected fields: %+v", data.Fields)
	}
	if data.Players[0].Summons[0].HP != 140 {
		t.Errorf("unexpected hp: %d", data.Players[0].Summons[0].HP)
	}
}

func TestFetchStartDataUnauthorized(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer ts.Close()

	c := New(ts.URL, "wrong")
	if _, err := c.FetchStartData(context.Background(), "11"); err == nil {
		t.Error("401 ではエラーになるはず")
	}
}

func TestPostFinish(t *testing.T) {
	var received FinishRequest
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.Header.Get("X-Internal-Secret") != "s3cret" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		_ = json.NewDecoder(r.Body).Decode(&received)
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	c := New(ts.URL, "s3cret")
	err := c.PostFinish(context.Background(), "11", FinishRequest{
		WinnerID: "38",
		LoserID:  "39",
		Logs:     []FinishLog{{Turn: 1, ActorID: "38", TargetID: "39", Action: "attack", Damage: 20}},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if received.WinnerID != "38" || len(received.Logs) != 1 {
		t.Errorf("payload not received correctly: %+v", received)
	}
}
