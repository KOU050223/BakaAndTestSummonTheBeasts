require 'swagger_helper'

RSpec.describe 'DELETE /api/auth/logout', type: :request do
  path '/api/auth/logout' do
    delete 'ログアウト' do
      tags 'Auth'
      produces 'application/json'
      security [ bearer_auth: [] ]

      response '200', 'ログアウト成功' do
        schema type: :object,
          properties: {
            message: { type: :string }
          },
          required: [ 'message' ]

        let(:user) { create(:user, email: 'logout_test@example.com', password: 'password123') }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: user.id)}" }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['message']).to be_present
        end
      end

      response '401', '認証なし' do
        schema '$ref' => '#/components/schemas/error'

        let(:Authorization) { nil }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('unauthorized')
          expect(json['error']['message']).to be_present
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end
end
