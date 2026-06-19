require "swagger_helper"

RSpec.describe "Battles API", type: :request do
  path "/api/battles" do
    get "バトル一覧取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]

      response "200", "バトル一覧" do
        schema type: :object,
          properties: {
            battles: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  battleId:     { type: :string },
                  subjects:     { type: :array, items: { type: :string } },
                  status:       { type: :string },
                  opponentName: { type: :string, nullable: true }
                },
                required: %w[battleId subjects status]
              }
            }
          },
          required: %w[battles]

        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        run_test!
      end
    end

    post "バトル作成" do
      tags "Battles"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          opponentId: { type: :string, example: "2", description: "対戦相手の生徒ID" },
          subjects:   { type: :array, items: { type: :string }, example: %w[math english physics], description: "対戦科目（召喚フィールド）" }
        },
        required: %w[opponentId subjects]
      }

      response "201", "バトル作成成功" do
        schema type: :object,
          properties: {
            battleId: { type: :string },
            subjects: { type: :array, items: { type: :string } },
            status:   { type: :string }
          },
          required: %w[battleId subjects status]

        let(:opponent) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { opponentId: opponent.id.to_s, subjects: %w[math english physics] } }
        run_test!
      end

      response "422", "対戦科目が空（バリデーションエラー）" do
        schema "$ref" => "#/components/schemas/error"
        let(:opponent) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { opponentId: opponent.id.to_s, subjects: [] } }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { {} }
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path "/api/battles/{id}/result" do
    get "バトル結果取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :id, in: :path, type: :string, required: true, description: "バトルID"

      response "200", "バトル結果" do
        schema type: :object,
          properties: {
            battleId:  { type: :string },
            winnerId:  { type: :string, nullable: true },
            loserId:   { type: :string, nullable: true },
            turnCount: { type: :integer },
            logs: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  turn:     { type: :integer },
                  actorId:  { type: :string },
                  action:   { type: :string },
                  targetId: { type: :string },
                  damage:   { type: :integer }
                },
                required: %w[turn actorId action targetId damage]
              }
            }
          },
          required: %w[battleId turnCount logs]

        let(:battle) do
          b = create(:battle, status: "finished", turn_count: 0)
          create(:battle_player, battle: b, student: create(:user))
          b
        end
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "404", "バトルが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "999999" }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "1" }
        run_test!
      end
    end
  end

  path "/api/battles/{id}/token" do
    get "WebSocket接続用トークン発行" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]
      description "Go Game Server への WebSocket 接続に使う JWT を発行する。バトルの参加者にのみ発行する。"

      parameter name: :id, in: :path, type: :string, required: true, description: "バトルID"

      response "200", "トークン発行成功" do
        schema type: :object,
          properties: {
            token: { type: :string }
          },
          required: %w[token]

        let(:student) { create(:user) }
        let(:battle) do
          b = create(:battle)
          create(:battle_player, battle: b, student: student)
          b
        end
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: student.id) }
        run_test!
      end

      response "403", "バトルの参加者でない" do
        schema "$ref" => "#/components/schemas/error"
        let(:battle) { create(:battle) }
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "404", "バトルが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "999999" }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "1" }
        run_test!
      end
    end
  end
end
