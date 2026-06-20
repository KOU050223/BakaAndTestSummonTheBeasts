require "rails_helper"

# Go Game Server 連携 internal API のリクエストテスト。
# rswag ではなく通常の request spec とする（OpenAPI 公開対象は公開API のみ）。
RSpec.describe "Internal Battles API", type: :request do
  let(:secret) { "test-internal-secret" }

  around do |example|
    original = ENV["INTERNAL_API_SECRET"]
    ENV["INTERNAL_API_SECRET"] = secret
    example.run
    ENV["INTERNAL_API_SECRET"] = original
  end

  let(:creator)  { create(:user, :teacher) }
  let(:player_a) { create(:user) }
  let(:player_b) { create(:user) }
  let(:class_a)  { create(:school_class, name: "A組") }
  let(:class_b)  { create(:school_class, name: "B組") }

  let(:battle) do
    create(:summon_status, student: player_a, subject: "math", hp: 140, attack: 30, defense: 12, speed: 8)
    Battles::Create.new(created_by: creator, student_ids: [ player_a.id, player_b.id ], subjects: %w[math english]).call
  end

  def auth_headers(value = secret)
    { "X-Internal-Secret" => value }
  end

  describe "GET /internal/battles/:battle_id/start-data" do
    it "シークレットが正しければフィールドと科目別ステータスを返す" do
      get "/internal/battles/#{battle.id}/start-data", headers: auth_headers
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      expect(json["fields"].map { |f| f["subject"] }).to match_array(%w[math english])
      math = json["players"].first["summons"].find { |s| s["subject"] == "math" }
      expect(math["hp"]).to eq(140)
    end

    it "シークレットが無ければ 401" do
      get "/internal/battles/#{battle.id}/start-data"
      expect(response).to have_http_status(:unauthorized)
    end

    it "シークレットが誤っていれば 401" do
      get "/internal/battles/#{battle.id}/start-data", headers: auth_headers("wrong")
      expect(response).to have_http_status(:unauthorized)
    end

    it "存在しないバトルは 404" do
      get "/internal/battles/999999/start-data", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /internal/battles/:battle_id/finish" do
    let(:finish_params) do
      {
        winnerId: player_a.id.to_s,
        loserId: player_b.id.to_s,
        winnerTeam: class_a.id.to_s,
        loserTeam: class_b.id.to_s,
        logs: [ { turn: 1, actorId: player_a.id.to_s, targetId: player_b.id.to_s, action: "attack", damage: 20 } ]
      }
    end

    it "勝敗とログを保存して finished を返す" do
      post "/internal/battles/#{battle.id}/finish", params: finish_params, headers: auth_headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("finished")

      battle.reload
      expect(battle.winner_id).to eq(player_a.id)
      expect(battle.loser_id).to eq(player_b.id)
      expect(battle.winner_team).to eq(class_a)
      expect(battle.loser_team).to eq(class_b)
      expect(battle.battle_logs.count).to eq(1)
    end

    it "二重送信しても冪等（ログが増えない）" do
      post "/internal/battles/#{battle.id}/finish", params: finish_params, headers: auth_headers, as: :json
      expect {
        post "/internal/battles/#{battle.id}/finish", params: finish_params, headers: auth_headers, as: :json
      }.not_to change { BattleLog.count }
    end

    it "シークレットが無ければ 401" do
      post "/internal/battles/#{battle.id}/finish", params: finish_params, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
