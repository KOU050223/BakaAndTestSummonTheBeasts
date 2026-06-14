require "swagger_helper"

RSpec.describe "POST /api/scores", type: :request do
  path "/api/scores" do
    post "点数一括登録" do
      tags "Scores"
      consumes "application/json"
      produces "application/json"
      security [ bearer_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          examId: { type: :string, example: "exam_1" },
          scores: {
            type: :array,
            items: {
              type: :object,
              properties: {
                studentId: { type: :string },
                score:     { type: :integer }
              },
              required: %w[studentId score]
            }
          }
        },
        required: %w[examId scores]
      }

      response "201", "登録成功" do
        schema type: :object,
          properties: {
            examId:          { type: :string },
            registeredCount: { type: :integer }
          },
          required: %w[examId registeredCount]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :teacher).id)}" }
        let(:body) do
          {
            examId: "exam_1",
            scores: [
              { studentId: "student_f1", score: 42 },
              { studentId: "student_f2", score: 55 }
            ]
          }
        end
        run_test!
      end

      response "201", "school_admin も点数を登録できる" do
        schema type: :object,
          properties: {
            examId:          { type: :string },
            registeredCount: { type: :integer }
          },
          required: %w[examId registeredCount]

        let(:Authorization) { "Bearer #{JwtService.encode(user_id: create(:user, :school_admin).id)}" }
        let(:body) do
          {
            examId: "exam_1",
            scores: [
              { studentId: "student_f1", score: 42 },
              { studentId: "student_f2", score: 55 }
            ]
          }
        end
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
end
