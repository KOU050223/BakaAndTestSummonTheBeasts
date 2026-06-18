require "swagger_helper"

RSpec.describe "Classes API", type: :request do
  # クラス一覧・生徒一覧のレスポンス型は複数エンドポイントで共有するため、
  # spec/swagger_helper.rb の components.schemas に定義し $ref で参照する。
  classes_response_ref = { "$ref" => "#/components/schemas/ClassListResponse" }
  students_response_ref = { "$ref" => "#/components/schemas/ClassStudentListResponse" }

  path "/api/classes" do
    get "クラス一覧取得" do
      tags "Classes"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :grade, in: :query, type: :integer, required: false, description: "学年で絞り込む（省略時は全学年）"

      response "200", "クラス一覧" do
        schema(classes_response_ref)

        before do
          create(:school_class, grade: 2, name: "Aクラス")
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:grade) { nil }
        run_test!
      end

      response "200", "school_admin もクラス一覧を取得できる" do
        schema(classes_response_ref)

        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:grade) { nil }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:grade) { nil }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:grade) { nil }
        run_test!
      end
    end
  end

  path "/api/classes/{class_id}/students" do
    get "クラス内生徒一覧取得" do
      tags "Classes"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :class_id, in: :path, type: :integer, required: true, description: "クラスID"

      response "200", "生徒一覧" do
        schema(students_response_ref)

        let(:school_class) { create(:school_class, grade: 2, name: "Fクラス") }
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:class_id) { school_class.id }
        run_test!
      end

      response "200", "school_admin もクラス内生徒一覧を取得できる" do
        schema(students_response_ref)

        let(:school_class) { create(:school_class, grade: 2, name: "Eクラス") }
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:class_id) { school_class.id }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:class_id) { 1 }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:class_id) { 1 }
        run_test!
      end

      response "404", "クラスが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:class_id) { 999_999 }
        run_test!
      end
    end
  end
end
