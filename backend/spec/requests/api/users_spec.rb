require 'swagger_helper'

RSpec.describe 'GET /api/me', type: :request do
  path '/api/me' do
    get '認証ユーザー情報取得' do
      tags 'Users'
      produces 'application/json'
      security [ cookie_auth: [] ]

      response '200', '自分のユーザー情報' do
        schema '$ref' => '#/components/schemas/User'

        let(:user) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: user.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['id']).to eq(user.id)
        end
      end

      response '401', '未認証（token Cookie なし）' do
        schema '$ref' => '#/components/schemas/error'


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
