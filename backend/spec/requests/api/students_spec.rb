require 'swagger_helper'

SUMMON_RESPONSE_SCHEMA = {
  type: :object,
  properties: {
    studentId: { type: :string },
    summons: {
      type: :object,
      additionalProperties: {
        type: :object,
        properties: {
          hp: { type: :integer },
          attack: { type: :integer },
          defense: { type: :integer },
          speed: { type: :integer }
        },
        required: %w[hp attack defense speed]
      }
    }
  },
  required: %w[studentId summons]
}.freeze

RSpec.describe 'GET /api/students/:id/summon', type: :request do
  path '/api/students/{id}/summon' do
    get '召喚獣ステータス取得' do
      tags 'Students'
      produces 'application/json'
      security [ cookie_auth: [] ]

      parameter name: :id, in: :path, type: :integer, required: true, description: '生徒ID'

      response '200', '召喚獣ステータス一覧' do
        schema SUMMON_RESPONSE_SCHEMA

        let(:user) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: user.id) }
        let(:id) { user.id }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['studentId']).to eq(user.id.to_s)
          expect(json['summons']).to be_a(Hash)
        end
      end

      response '200', 'teacher が他の生徒のステータスを参照できる' do
        schema SUMMON_RESPONSE_SCHEMA

        let(:teacher) { create(:user, :teacher) }
        let(:student) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }
        let(:id) { student.id }
        run_test!
      end

      response '200', 'school_admin が他の生徒のステータスを参照できる' do
        schema SUMMON_RESPONSE_SCHEMA

        let(:admin) { create(:user, :school_admin) }
        let(:student) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:id) { student.id }
        run_test!
      end

      response '401', '未認証' do
        schema '$ref' => '#/components/schemas/error'

        let(:id) { 1 }

        run_test!
      end

      response '403', '権限なし（他の生徒による参照は禁止）' do
        schema '$ref' => '#/components/schemas/error'

        let(:other_student) { create(:user) }
        let(:target_student) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: other_student.id) }
        let(:id) { target_student.id }

        run_test!
      end
    end
  end
end

RSpec.describe 'PATCH /api/students/:id/class', type: :request do
  path '/api/students/{id}/class' do
    patch '生徒のクラス変更' do
      tags 'Students'
      consumes 'application/json'
      produces 'application/json'
      security [ cookie_auth: [] ]

      parameter name: :id, in: :path, type: :integer, required: true, description: '生徒ID'
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: { class_id: { type: :integer, description: '変更先クラスID' } },
        required: %w[class_id]
      }

      response '200', 'クラス変更成功' do
        schema '$ref' => '#/components/schemas/ClassChangeResponse'

        let(:teacher)      { create(:user, :teacher) }
        let(:student)      { create(:user) }
        let(:school_class) { create(:school_class, grade: 2, name: 'Bクラス') }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }
        let(:id)   { student.id }
        let(:body) { { class_id: school_class.id } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['schoolClass']['id']).to eq(school_class.id)
          expect(student.reload.school_class).to eq(school_class)
        end
      end

      response '401', '未認証' do
        schema '$ref' => '#/components/schemas/error'
        let(:id)   { 1 }
        let(:body) { { class_id: 1 } }
        run_test!
      end

      response '403', '権限なし（student は禁止）' do
        schema '$ref' => '#/components/schemas/error'
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:id)   { create(:user).id }
        let(:body) { { class_id: 1 } }
        run_test!
      end

      response '404', '生徒が存在しない' do
        schema '$ref' => '#/components/schemas/error'
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id) }
        let(:id)   { 999_999 }
        let(:body) { { class_id: create(:school_class).id } }
        run_test!
      end
    end
  end
end
