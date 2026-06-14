require 'swagger_helper'

RSpec.describe 'POST /api/admin/users', type: :request do
  path '/api/admin/users' do
    post '管理者によるユーザー作成' do
      tags 'Admin'
      consumes 'application/json'
      produces 'application/json'
      security [ bearer_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          name: { type: :string, example: '鈴木先生' },
          email: { type: :string, example: 'teacher@example.com' },
          password: { type: :string, example: 'password123' },
          role: { type: :string, example: 'teacher', enum: %w[ student teacher school_admin ] }
        },
        required: %w[ name email password role ]
      }

      response '201', 'ユーザー作成成功' do
        schema type: :object,
          properties: {
            user: {
              type: :object,
              properties: {
                id: { type: :integer },
                email: { type: :string },
                name: { type: :string },
                role: { type: :string }
              },
              required: %w[ id email name role ]
            }
          },
          required: [ 'user' ]

        let(:admin) { create(:user, :school_admin) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: admin.id)}" }
        let(:body) { { name: '鈴木先生', email: 'teacher_new@example.com', password: 'password123', role: 'teacher' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['user']['role']).to eq('teacher')
        end
      end

      response '403', '権限なし（school_admin 以外）' do
        schema '$ref' => '#/components/schemas/error'

        let(:teacher) { create(:user, :teacher) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: teacher.id)}" }
        let(:body) { { name: '誰か', email: 'someone@example.com', password: 'password123', role: 'student' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('forbidden')
          expect(json['error']['message']).to be_present
          expect(json['error']['details']).to be_a(Hash)
        end
      end

      response '409', 'メールアドレス重複' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: admin.id)}" }
        let!(:existing) { create(:user, email: 'dup_admin@example.com') }
        let(:body) { { name: '重複', email: 'dup_admin@example.com', password: 'password123', role: 'teacher' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('conflict')
          expect(json['error']['message']).to be_present
          expect(json['error']['details']).to be_a(Hash)
        end
      end

      response '422', 'バリデーションエラー' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:Authorization) { "Bearer #{JwtService.encode(user_id: admin.id)}" }
        let(:body) { { name: '', email: '', password: '', role: 'invalid_role' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('validation_error')
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end
end
