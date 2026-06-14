require 'swagger_helper'

RSpec.describe 'DELETE /api/auth/logout', type: :request do
  path '/api/auth/logout' do
    delete 'ログアウト' do
      tags 'Auth'
      produces 'application/json'
      security [ cookie_auth: [] ]

      response '200', 'ログアウト成功' do
        schema type: :object,
          properties: {
            message: { type: :string }
          },
          required: [ 'message' ]

        let(:user) { create(:user, email: 'logout_test@example.com', password: 'password123') }

        before do
          cookies[:token] = JwtService.encode(user_id: user.id)
        end

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['message']).to be_present
        end
      end

      response '200', 'Cookie なしでもログアウト成功（Cookie は削除済み扱い）' do
        schema type: :object,
          properties: {
            message: { type: :string }
          },
          required: [ 'message' ]

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['message']).to be_present
        end
      end
    end
  end
end
