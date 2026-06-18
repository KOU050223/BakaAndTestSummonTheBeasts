require "swagger_helper"

RSpec.describe "GET /api/scores", type: :request do
  path "/api/scores" do
    get "自分の全試験スコア取得" do
      tags "Scores"
      produces "application/json"
      security [ cookie_auth: [] ]

      response "200", "取得成功" do
        schema type: :object,
          properties: {
            scores: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  exam_id:       { type: :integer },
                  exam_title:    { type: :string },
                  subject:       { type: :string, example: "math" },
                  subject_label: { type: :string, example: "数学" },
                  score:         { type: :integer },
                  max_score:     { type: :integer },
                  scored_at:     { type: :string, format: "date-time" }
                },
                required: %w[exam_id exam_title subject subject_label score max_score scored_at]
              }
            }
          },
          required: %w[scores]

        let(:student) { create(:user) }
        let(:exam) { create(:exam, subject: "math", title: "中間テスト") }

        before do
          create(:score, student: student, exam: exam, score: 88)
          cookies[:token] = JwtService.encode(user_id: student.id)
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          score = body["scores"].first
          expect(score["subject"]).to eq("math")
          expect(score["subject_label"]).to eq("数学")
        end
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end
    end
  end
end
