require 'swagger_helper'

RSpec.describe 'POST /api/auth/signup', type: :request do
  path '/api/auth/signup' do
    post 'ユーザー登録' do
      tags 'Auth'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          name: { type: :string, example: '山田太郎' },
          email: { type: :string, example: 'newuser@example.com' },
          password: { type: :string, example: 'password123' }
        },
        required: %w[ name email password ]
      }

      response '201', '登録成功' do
        schema '$ref' => '#/components/schemas/AuthResponse'

        let(:body) { { name: '山田太郎', email: 'signup_test@example.com', password: 'password123' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['user']['email']).to eq('signup_test@example.com')
          expect(json).not_to have_key('token')
          expect(response.cookies['token']).to be_present
        end
      end

      response '409', 'メールアドレス重複' do
        schema '$ref' => '#/components/schemas/error'

        let!(:existing_user) { create(:user, email: 'duplicate@example.com', password: 'password123') }
        let(:body) { { name: '重複太郎', email: 'duplicate@example.com', password: 'password123' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('conflict')
          expect(json['error']['message']).to be_present
          expect(json['error']['details']).to be_a(Hash)
        end
      end

      response '422', 'バリデーションエラー' do
        schema '$ref' => '#/components/schemas/error'

        let(:body) { { name: '', email: '', password: '' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('validation_error')
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end
end
