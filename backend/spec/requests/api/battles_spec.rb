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
                  subjectId:    { type: :string },
                  status:       { type: :string },
                  opponentName: { type: :string }
                },
                required: %w[battleId subjectId status opponentName]
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
          subjectId: { type: :string, example: "math" }
        },
        required: %w[subjectId]
      }

      response "201", "バトル作成成功" do
        schema type: :object,
          properties: {
            battleId:  { type: :string },
            subjectId: { type: :string },
            status:    { type: :string }
          },
          required: %w[battleId subjectId status]

        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { subjectId: "math" } }
        run_test!
      end

      response "201", "教師もバトル作成できる" do
        schema type: :object,
          properties: {
            battleId:  { type: :string },
            subjectId: { type: :string },
            status:    { type: :string }
          },
          required: %w[battleId subjectId status]

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) { { subjectId: "math" } }
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
            winnerId:  { type: :string },
            loserId:   { type: :string },
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
          required: %w[battleId winnerId loserId turnCount logs]

        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:id) { "battle_1" }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "battle_1" }
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:id) { "battle_1" }
        run_test!
      end
    end
  end
end
