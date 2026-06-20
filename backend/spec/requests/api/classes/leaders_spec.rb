require "swagger_helper"

RSpec.describe "PATCH /api/classes/:class_id/leader", type: :request do
  path "/api/classes/{class_id}/leader" do
    patch "クラスのリーダーを設定する" do
      tags "Classes"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :class_id, in: :path, type: :integer, required: true
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          studentId: { type: :integer, nullable: true, description: "リーダーに設定する生徒ID。null でリーダー解除" }
        }
      }

      let(:school_class) { create(:school_class, grade: 2, name: "Aクラス") }
      let(:class_id) { school_class.id }

      response "200", "リーダー設定成功" do
        schema "$ref" => "#/components/schemas/ClassLeaderResponse"

        let(:student) { create(:user) }
        before do
          create(:class_membership, user: student, school_class: school_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { studentId: student.id } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json["classId"]).to eq(school_class.id)
          expect(json["leaderId"]).to eq(student.id)
          expect(school_class.class_memberships.find_by(user: student).leader).to be true
        end
      end

      response "200", "既存リーダーを切り替える" do
        schema "$ref" => "#/components/schemas/ClassLeaderResponse"

        let(:old_leader) { create(:user) }
        let(:new_leader) { create(:user) }
        before do
          create(:class_membership, user: old_leader, school_class: school_class, leader: true)
          create(:class_membership, user: new_leader, school_class: school_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { studentId: new_leader.id } }

        run_test! do
          expect(school_class.class_memberships.find_by(user: old_leader).leader).to be false
          expect(school_class.class_memberships.find_by(user: new_leader).leader).to be true
        end
      end

      response "200", "リーダーを解除する（studentId: null）" do
        schema "$ref" => "#/components/schemas/ClassLeaderResponse"

        let(:current_leader) { create(:user) }
        before do
          create(:class_membership, user: current_leader, school_class: school_class, leader: true)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { studentId: nil } }

        run_test! do
          expect(school_class.class_memberships.find_by(user: current_leader).leader).to be false
        end
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { { studentId: 1 } }
        run_test!
      end

      response "403", "権限なし（student は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { studentId: 1 } }
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:body) { { studentId: 1 } }
        run_test!
      end

      response "404", "クラスが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:class_id) { 999_999 }
        let(:body) { { studentId: 1 } }
        run_test!
      end

      response "404", "生徒がこのクラスに所属していない" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:body) { { studentId: create(:user).id } }
        run_test!
      end
    end
  end
end
