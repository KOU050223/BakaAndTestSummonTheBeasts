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
      security [ bearer_auth: [] ]

      parameter name: :id, in: :path, type: :integer, required: true, description: '生徒ID'

      response '200', '召喚獣ステータス一覧' do
        schema SUMMON_RESPONSE_SCHEMA

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: user.id)}" }
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
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: teacher.id)}" }
        let(:id) { student.id }
        run_test!
      end

      response '200', 'school_admin が他の生徒のステータスを参照できる' do
        schema SUMMON_RESPONSE_SCHEMA

        let(:admin) { create(:user, :school_admin) }
        let(:student) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: admin.id)}" }
        let(:id) { student.id }
        run_test!
      end

      response '401', '未認証' do
        schema '$ref' => '#/components/schemas/error'

        let(:Authorization) { nil }
        let(:id) { 1 }

        run_test!
      end

      response '403', '権限なし（他の生徒による参照は禁止）' do
        schema '$ref' => '#/components/schemas/error'

        let(:other_student) { create(:user) }
        let(:target_student) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: other_student.id)}" }
        let(:id) { target_student.id }

        run_test!
      end
    end
  end
end
