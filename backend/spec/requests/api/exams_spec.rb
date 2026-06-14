require "swagger_helper"

RSpec.describe "Exams API", type: :request do
  path "/api/exams" do
    get "試験一覧取得" do
      tags "Exams"
      produces "application/json"
      security [ bearer_auth: [] ]

      response "200", "試験一覧" do
        schema type: :object,
          properties: {
            exams: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id:        { type: :string },
                  title:     { type: :string },
                  subjectId: { type: :string },
                  createdBy: { type: :string }
                },
                required: %w[id title subjectId createdBy]
              }
            }
          },
          required: %w[exams]

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

    post "試験作成" do
      tags "Exams"
      consumes "application/json"
      produces "application/json"
      security [ bearer_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          title:     { type: :string, example: "数学 小テスト1" },
          subjectId: { type: :string, example: "math" },
          classId:   { type: :string, example: "class_a" },
          maxScore:  { type: :integer, example: 100 }
        },
        required: %w[title subjectId classId maxScore]
      }

      response "201", "試験作成成功" do
        schema type: :object,
          properties: {
            id:        { type: :string },
            title:     { type: :string },
            subjectId: { type: :string },
            classId:   { type: :string },
            maxScore:  { type: :integer }
          },
          required: %w[id title subjectId classId maxScore]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :teacher).id)}" }
        let(:body) { { title: "数学 小テスト1", subjectId: "math", classId: "class_a", maxScore: 100 } }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { nil }
        let(:body) { {} }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user).id)}" }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path "/api/exams/{exam_id}/scores" do
    get "試験別スコア一覧取得" do
      tags "Exams"
      produces "application/json"
      security [ bearer_auth: [] ]

      parameter name: :exam_id, in: :path, type: :string, required: true, description: "試験ID"

      response "200", "スコア一覧" do
        schema type: :object,
          properties: {
            examId: { type: :string },
            scores: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  studentId: { type: :string },
                  name:      { type: :string },
                  score:     { type: :integer }
                },
                required: %w[studentId name score]
              }
            }
          },
          required: %w[examId scores]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :teacher).id)}" }
        let(:exam_id) { "exam_1" }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { nil }
        let(:exam_id) { "exam_1" }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user).id)}" }
        let(:exam_id) { "exam_1" }
        run_test!
      end
    end
  end
end
