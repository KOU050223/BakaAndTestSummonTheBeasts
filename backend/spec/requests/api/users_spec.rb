require 'swagger_helper'

RSpec.describe 'GET /api/me', type: :request do
  path '/api/me' do
    get '認証ユーザー情報取得' do
      tags 'Users'
      produces 'application/json'
      security [ bearer_auth: [] ]

      response '200', '自分のユーザー情報' do
        schema type: :object,
          properties: {
            id: { type: :integer },
            email: { type: :string },
            name: { type: :string },
            role: { type: :string }
          },
          required: %w[id email name role]

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: user.id)}" }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['id']).to eq(user.id)
        end
      end

      response '401', 'Authorizationヘッダーなし' do
        schema '$ref' => '#/components/schemas/error'

        let(:Authorization) { nil }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('unauthorized')
          expect(json['error']['message']).to eq('認証が必要です')
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end
end
