require "swagger_helper"

RSpec.describe "GET /api/classes", type: :request do
  path "/api/classes" do
    get "クラス一覧取得" do
      tags "Classes"
      produces "application/json"
      security [ bearer_auth: [] ]

      response "200", "クラス一覧" do
        schema type: :object,
          properties: {
            classes: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id:   { type: :string },
                  name: { type: :string }
                },
                required: %w[id name]
              }
            }
          },
          required: %w[classes]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :teacher).id)}" }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { nil }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user).id)}" }
        run_test!
      end
    end
  end

  path "/api/classes/{class_id}/students" do
    get "クラス内生徒一覧取得" do
      tags "Classes"
      produces "application/json"
      security [ bearer_auth: [] ]

      parameter name: :class_id, in: :path, type: :string, required: true, description: "クラスID"

      response "200", "生徒一覧" do
        schema type: :object,
          properties: {
            classId:  { type: :string },
            students: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id:   { type: :string },
                  name: { type: :string }
                },
                required: %w[id name]
              }
            }
          },
          required: %w[classId students]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :teacher).id)}" }
        let(:class_id) { "class_a" }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { nil }
        let(:class_id) { "class_a" }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user).id)}" }
        let(:class_id) { "class_a" }
        run_test!
      end
    end
  end
end
