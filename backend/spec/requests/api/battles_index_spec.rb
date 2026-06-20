require "rails_helper"

# バトル一覧の opponentName 表示ロジック（1:1 / N:N）の検証。
# OpenAPI 生成は battles_spec.rb（rswag）が担うため、ここでは表示内容に集中する。
RSpec.describe "GET /api/battles (opponentName)", type: :request do
  let(:me) { create(:user) }
  before { cookies[:token] = JwtService.encode(user_id: me.id) }

  def battle_json(battle_id)
    get "/api/battles"
    body = JSON.parse(response.body)
    body["battles"].find { |b| b["battleId"] == battle_id.to_s }
  end

  context "1:1（チームなし）バトル" do
    it "相手プレイヤー名を opponentName に返す" do
      opponent = create(:user, name: "明久")
      battle = create(:battle, created_by: me)
      create(:battle_player, battle: battle, student: me)
      create(:battle_player, battle: battle, student: opponent)

      expect(battle_json(battle.id)["opponentName"]).to eq("明久")
    end
  end

  context "N:N（クラス戦）バトル" do
    it "相手チームのクラス名を opponentName に返す" do
      my_class = create(:school_class, name: "A組", grade: 2)
      enemy_class = create(:school_class, name: "B組", grade: 2)
      create(:class_membership, user: me, school_class: my_class)

      battle = create(:battle, created_by: me)
      create(:battle_player, battle: battle, student: me, team_id: my_class.id.to_s)
      create(:battle_player, battle: battle, student: create(:user), team_id: my_class.id.to_s)
      create(:battle_player, battle: battle, student: create(:user), team_id: enemy_class.id.to_s)

      expect(battle_json(battle.id)["opponentName"]).to eq("2年B組")
    end
  end
end
