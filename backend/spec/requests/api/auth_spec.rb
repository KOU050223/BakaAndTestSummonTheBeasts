require 'swagger_helper'

RSpec.describe 'POST /api/auth/login', type: :request do
  path '/api/auth/login' do
    post 'ログイン' do
      tags 'Auth'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          email: { type: :string, example: 'student@example.com' },
          password: { type: :string, example: 'password123' }
        },
        required: %w[email password]
      }

      response '200', 'ログイン成功' do
        schema type: :object,
          properties: {
            token: { type: :string },
            user: { '$ref' => '#/components/schemas/User' }
          },
          required: %w[token user]

        let(:user) { create(:user, email: 'login_test@example.com', password: 'password123') }
        let(:body) { { email: user.email, password: 'password123' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['token']).to be_present
          expect(json['user']['email']).to eq('login_test@example.com')
        end
      end

      response '401', '認証失敗' do
        schema '$ref' => '#/components/schemas/error'

        let(:user) { create(:user, email: 'login_fail@example.com', password: 'password123') }
        let(:body) { { email: user.email, password: 'wrongpassword' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('unauthorized')
          expect(json['error']['message']).to be_present
          expect(json['error']['details']).to be_a(Hash)
        end
      end

      response '422', 'バリデーションエラー' do
        schema '$ref' => '#/components/schemas/error'

        let(:body) { { email: '', password: '' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('validation_error')
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end
end
