require "swagger_helper"

RSpec.describe "Exams API", type: :request do
  path "/api/exams" do
    get "試験一覧取得" do
      tags "Exams"
      produces "application/json"
      security [ cookie_auth: [] ]

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

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        run_test!
      end

      response "200", "school_admin も試験一覧を取得できる" do
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

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end

      response "200", "student は自分のクラスの試験一覧を取得できる" do
        schema type: :object,
          properties: {
            exams: {
              type: :array,
              items: { type: :object }
            }
          },
          required: %w[exams]

        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end
    end

    post "試験作成" do
      tags "Exams"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          title:     { type: :string, example: "数学 小テスト1" },
          subject:   { type: :string, example: "math" },
          class_id:  { type: :integer, example: 1 },
          max_score: { type: :integer, example: 100 }
        },
        required: %w[title subject class_id max_score]
      }

      response "201", "試験作成成功" do
        schema type: :object,
          properties: {
            id:        { type: :integer },
            title:     { type: :string },
            subject:   { type: :string },
            class_id:  { type: :integer },
            max_score: { type: :integer }
          },
          required: %w[id title subject class_id max_score]

        before do
          @school_class = create(:school_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { title: "数学 小テスト1", subject: "math", class_id: @school_class.id, max_score: 100 } }
        run_test!
      end

      response "201", "school_admin も試験を作成できる" do
        schema type: :object,
          properties: {
            id:        { type: :integer },
            title:     { type: :string },
            subject:   { type: :string },
            class_id:  { type: :integer },
            max_score: { type: :integer }
          },
          required: %w[id title subject class_id max_score]

        before do
          @school_class = create(:school_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id)
        end
        let(:body) { { title: "数学 小テスト1", subject: "math", class_id: @school_class.id, max_score: 100 } }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { {} }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path "/api/exams/{exam_id}/scores" do
    get "試験別スコア一覧取得" do
      tags "Exams"
      produces "application/json"
      security [ cookie_auth: [] ]

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

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:exam_id) { "exam_1" }
        run_test!
      end

      response "200", "school_admin も試験別スコアを取得できる" do
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

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:exam_id) { "exam_1" }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:exam_id) { "exam_1" }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:exam_id) { "exam_1" }
        run_test!
      end
    end
  end
end
