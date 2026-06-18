require 'swagger_helper'

RSpec.describe "Admin Users API", type: :request do
  path '/api/admin/users' do
    get '管理者によるユーザー一覧取得' do
      tags 'Admin'
      produces 'application/json'
      security [ cookie_auth: [] ]

      parameter name: :role, in: :query, required: false, schema: { '$ref' => '#/components/schemas/Role' },
        description: 'ロールで絞り込む（未指定なら全件）'

      response '200', 'ユーザー一覧取得成功' do
        schema type: :object,
          properties: {
            users: { type: :array, items: { '$ref' => '#/components/schemas/User' } },
            stats: { '$ref' => '#/components/schemas/AdminUserSummary' }
          },
          required: %w[users stats]

        let(:role) { nil }
        let(:admin) { create(:user, :school_admin) }
        before do
          create(:user, role: 'student')
          create(:user, :teacher)
          cookies[:token] = JwtService.encode(user_id: admin.id)
        end

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['users']).to be_an(Array)
          expect(json['stats']['total_count']).to eq(3)
          expect(json['stats']['teacher_count']).to eq(1)
          expect(json['stats']['admin_count']).to eq(1)
        end
      end

      response '200', 'role 指定で絞り込む' do
        schema type: :object,
          properties: {
            users: { type: :array, items: { '$ref' => '#/components/schemas/User' } },
            stats: { '$ref' => '#/components/schemas/AdminUserSummary' }
          },
          required: %w[users stats]

        let(:role) { 'teacher' }
        let(:admin) { create(:user, :school_admin) }
        before do
          create(:user, role: 'student')
          create(:user, :teacher)
          create(:user, :teacher)
          cookies[:token] = JwtService.encode(user_id: admin.id)
        end

        run_test! do |response|
          json = JSON.parse(response.body)
          # users は teacher のみ。stats は絞り込みに関係なく全体集計のまま。
          expect(json['users'].map { |u| u['role'] }.uniq).to eq([ 'teacher' ])
          expect(json['users'].size).to eq(2)
          expect(json['stats']['total_count']).to eq(4)
        end
      end

      response '403', '権限なし（school_admin 以外）' do
        schema '$ref' => '#/components/schemas/error'

        let(:role) { nil }
        let(:teacher) { create(:user, :teacher) }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('forbidden')
        end
      end
    end

    post '管理者によるユーザー作成' do
      tags 'Admin'
      consumes 'application/json'
      produces 'application/json'
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: { '$ref' => '#/components/schemas/AdminUserCreateRequest' }

      response '201', 'ユーザー作成成功' do
        schema '$ref' => '#/components/schemas/AuthResponse'

        let(:admin) { create(:user, :school_admin) }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: '鈴木先生', email: 'teacher_new@example.com', password: 'password123', role: 'teacher' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['user']['role']).to eq('teacher')
        end
      end

      response '403', '権限なし（school_admin 以外）' do
        schema '$ref' => '#/components/schemas/error'

        let(:teacher) { create(:user, :teacher) }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }
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
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
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
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: '', email: '', password: '', role: 'invalid_role' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('validation_error')
          expect(json['error']['details']).to be_a(Hash)
        end
      end
    end
  end

  path '/api/admin/users/{id}' do
    parameter name: :id, in: :path, type: :integer, required: true

    patch '管理者によるユーザー更新' do
      tags 'Admin'
      consumes 'application/json'
      produces 'application/json'
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: { '$ref' => '#/components/schemas/AdminUserUpdateRequest' }

      response '200', 'ユーザー更新成功' do
        schema '$ref' => '#/components/schemas/AuthResponse'

        let(:admin) { create(:user, :school_admin) }
        let(:target) { create(:user, role: 'student') }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: '更新後', email: 'updated_admin@example.com', role: 'teacher' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['user']['name']).to eq('更新後')
          expect(json['user']['role']).to eq('teacher')
        end
      end

      response '403', '権限なし（school_admin 以外）' do
        schema '$ref' => '#/components/schemas/error'

        let(:teacher) { create(:user, :teacher) }
        let(:target) { create(:user) }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }
        let(:body) { { name: 'x', email: 'x_admin@example.com', role: 'student' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('forbidden')
        end
      end

      response '404', 'ユーザーが存在しない' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:id) { 0 }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: 'x', email: 'x_admin@example.com', role: 'student' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('not_found')
        end
      end

      response '409', 'メールアドレス重複' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:target) { create(:user) }
        let!(:other) { create(:user, email: 'taken_admin@example.com') }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: '重複', email: 'taken_admin@example.com', role: 'student' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('conflict')
        end
      end

      response '422', 'バリデーションエラー' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:target) { create(:user) }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }
        let(:body) { { name: '', email: '', role: 'invalid_role' } }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('validation_error')
        end
      end
    end

    delete '管理者によるユーザー削除' do
      tags 'Admin'
      produces 'application/json'
      security [ cookie_auth: [] ]

      response '204', 'ユーザー削除成功' do
        let(:admin) { create(:user, :school_admin) }
        let(:target) { create(:user) }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }

        run_test! do
          # 実際に DB から削除されていることを確認する。
          expect(User.exists?(target.id)).to be(false)
        end
      end

      response '403', '権限なし（school_admin 以外）' do
        schema '$ref' => '#/components/schemas/error'

        let(:teacher) { create(:user, :teacher) }
        let(:target) { create(:user) }
        let(:id) { target.id }
        before { cookies[:token] = JwtService.encode(user_id: teacher.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('forbidden')
        end
      end

      response '404', 'ユーザーが存在しない' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:id) { 0 }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('not_found')
        end
      end

      response '409', '自分自身は削除できない' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:id) { admin.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('conflict')
        end
      end

      response '409', '履歴に紐づくユーザーは削除できない' do
        schema '$ref' => '#/components/schemas/error'

        let(:admin) { create(:user, :school_admin) }
        let(:teacher) { create(:user, :teacher) }
        # 作成した試験が外部キーで teacher を参照している状態にする。
        let!(:exam) { create(:exam, created_by: teacher) }
        let(:id) { teacher.id }
        before { cookies[:token] = JwtService.encode(user_id: admin.id) }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json['error']['code']).to eq('conflict')
          expect(json['error']['message']).to be_present
        end
      end
    end
  end
end
