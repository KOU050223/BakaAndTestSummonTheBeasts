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
            user: {
              type: :object,
              properties: {
                id: { type: :integer },
                email: { type: :string },
                name: { type: :string },
                role: { type: :string }
              },
              required: %w[id email name role]
            }
          },
          required: %w[token user]

        let(:user) { create(:user, email: 'student@example.com', password: 'password123') }
        let(:body) { { email: user.email, password: 'password123' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['token']).to be_present
          expect(json['user']['email']).to eq('student@example.com')
        end
      end

      response '401', '認証失敗' do
        schema '$ref' => '#/components/schemas/error'

        let(:user) { create(:user, email: 'student@example.com', password: 'password123') }
        let(:body) { { email: user.email, password: 'wrongpassword' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']).to be_present
        end
      end

      response '422', 'バリデーションエラー' do
        schema type: :object,
          properties: {
            errors: {
              type: :object,
              additionalProperties: {
                type: :array,
                items: { type: :string }
              }
            }
          },
          required: [ 'errors' ]

        let(:body) { { email: '', password: '' } }

        run_test!
      end
    end
  end
end
