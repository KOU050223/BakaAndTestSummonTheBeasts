require 'swagger_helper'

RSpec.describe 'GET /api/students/:id/summon', type: :request do
  path '/api/students/{id}/summon' do
    get '召喚獣ステータス取得' do
      tags 'Students'
      produces 'application/json'
      security [ bearer_auth: [] ]

      parameter name: :id, in: :path, type: :integer, required: true, description: '生徒ID'

      response '200', '召喚獣ステータス一覧' do
        schema type: :object,
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

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: user.id)}" }
        let(:id) { user.id }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['studentId']).to eq(user.id.to_s)
          expect(json['summons']).to be_a(Hash)
        end
      end

      response '401', '未認証' do
        schema '$ref' => '#/components/schemas/error'

        let(:Authorization) { nil }
        let(:id) { 1 }

        run_test!
      end
    end
  end
end
