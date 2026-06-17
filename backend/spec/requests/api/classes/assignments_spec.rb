require "swagger_helper"

RSpec.describe "PATCH /api/classes/assignments", type: :request do
  path "/api/classes/assignments" do
    patch "クラス振り分けの一括反映" do
      tags "Classes"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          assignments: {
            type: :array,
            items: {
              type: :object,
              properties: {
                studentId: { type: :integer },
                classId:   { type: :integer }
              },
              required: %w[studentId classId]
            }
          }
        },
        required: %w[assignments]
      }

      response "200", "一括反映成功" do
        schema "$ref" => "#/components/schemas/AssignmentUpdateResponse"

        let(:class_a)  { create(:school_class, grade: 2, name: "Aクラス") }
        let(:class_b)  { create(:school_class, grade: 2, name: "Bクラス") }
        let(:student1) { create(:user) }
        let(:student2) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) do
          { assignments: [
            { studentId: student1.id, classId: class_a.id },
            { studentId: student2.id, classId: class_b.id }
          ] }
        end

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json["updatedCount"]).to eq(2)
          expect(student1.reload.school_class).to eq(class_a)
          expect(student2.reload.school_class).to eq(class_b)
        end
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { { assignments: [] } }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { assignments: [] } }
        run_test!
      end

      response "404", "割り当て対象が存在しない" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) { { assignments: [ { studentId: 999_999, classId: 999_999 } ] } }
        run_test!
      end

      response "404", "一部不正時は全件ロールバックされる" do
        schema "$ref" => "#/components/schemas/error"

        let(:class_a)  { create(:school_class, grade: 2, name: "Aクラス") }
        let(:student1) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) do
          # 有効1件 + 無効1件。トランザクションで有効分も巻き戻ることを確認する。
          { assignments: [
            { studentId: student1.id, classId: class_a.id },
            { studentId: 999_999, classId: class_a.id }
          ] }
        end

        run_test! do
          expect(student1.reload.school_class).to be_nil
        end
      end

      response "422", "assignments が配列でない" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) { { assignments: nil } }
        run_test!
      end

      response "422", "assignments の要素が不正な形式" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        # 要素が studentId/classId を欠く（[] で例外にならず 422 になることを確認）。
        let(:body) { { assignments: [ { studentId: 1 } ] } }
        run_test!
      end
    end
  end
end
