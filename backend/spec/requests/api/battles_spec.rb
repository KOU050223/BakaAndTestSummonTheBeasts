require "swagger_helper"

RSpec.describe "Battles API", type: :request do
  path "/api/battles/opponents" do
    get "対戦相手候補一覧取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]
      description "対戦相手にできる生徒一覧（自分は除く、クラスを問わない）。宣戦布告の相手選択に使う。"

      response "200", "対戦相手候補一覧" do
        schema type: :object,
          properties: {
            opponents: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id:   { type: :integer },
                  name: { type: :string }
                },
                required: %w[id name]
              }
            }
          },
          required: %w[opponents]

        let(:me) { create(:user) }
        before do
          # クラスを問わず、他の生徒は全員候補になる。
          create(:user)
          create(:user)
          cookies[:token] = JwtService.encode(user_id: me.id)
        end
        run_test! do |response|
          body = JSON.parse(response.body)
          ids = body["opponents"].map { |o| o["id"] }
          expect(ids).not_to include(me.id)
          expect(ids.size).to eq(2)
        end
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        run_test!
      end
    end
  end

  path "/api/battles/opponent_classes" do
    get "クラス戦の相手クラス候補一覧取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]
      description "クラス戦の宣戦布告で相手クラスを選ぶための軽量一覧。生徒が在籍するクラスのみ返す（平均点・人数は含めない）。生徒・教師が利用できる。"

      response "200", "相手クラス候補一覧" do
        schema type: :object,
          properties: {
            classes: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id:    { type: :integer },
                  name:  { type: :string },
                  grade: { type: :integer }
                },
                required: %w[id name grade]
              }
            }
          },
          required: %w[classes]

        let(:my_class)    { create(:school_class, name: "A組") }
        let(:other_class) { create(:school_class, name: "B組") }
        before do
          me = create(:user)
          create(:class_membership, user: me, school_class: my_class)
          create(:class_membership, user: create(:user), school_class: other_class)
          # 生徒のいないクラスは候補に出ない。
          create(:school_class, name: "空き組")
          cookies[:token] = JwtService.encode(user_id: me.id)
        end
        run_test! do |response|
          body = JSON.parse(response.body)
          names = body["classes"].map { |c| c["name"] }
          expect(names).to include("A組", "B組")
          expect(names).not_to include("空き組")
        end
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        run_test!
      end
    end
  end

  path "/api/battles" do
    get "バトル一覧取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]

      response "200", "バトル一覧" do
        schema type: :object,
          properties: {
            battles: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  battleId:     { type: :string },
                  subjects:     { type: :array, items: { type: :string } },
                  status:       { type: :string },
                  opponentName: { type: :string, nullable: true }
                },
                required: %w[battleId subjects status]
              }
            }
          },
          required: %w[battles]

        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        run_test!
      end
    end

    post "バトル作成" do
      tags "Battles"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          opponentId: { type: :string, example: "2", description: "対戦相手の生徒ID" },
          subjects:   { type: :array, items: { type: :string }, example: %w[math english physics], description: "対戦科目（召喚フィールド）" }
        },
        required: %w[opponentId subjects]
      }

      response "201", "バトル作成成功" do
        schema type: :object,
          properties: {
            battleId: { type: :string },
            subjects: { type: :array, items: { type: :string } },
            status:   { type: :string }
          },
          required: %w[battleId subjects status]

        let(:opponent) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { opponentId: opponent.id.to_s, subjects: %w[math english physics] } }
        run_test!
      end

      response "422", "対戦科目が空（バリデーションエラー）" do
        schema "$ref" => "#/components/schemas/error"
        let(:opponent) { create(:user) }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        let(:body) { { opponentId: opponent.id.to_s, subjects: [] } }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { {} }
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path "/api/battles/declare_war" do
    post "クラス単位の宣戦布告（N:N対戦作成）" do
      tags "Battles"
      consumes "application/json"
      produces "application/json"
      security [ cookie_auth: [] ]
      description "宣戦布告したクラスと相手クラスの生徒全員を陣営に分けて N:N バトルを作成する。attackerClassId 省略時は布告者の所属クラスを使う。"

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          attackerClassId: { type: :string, nullable: true, example: "1", description: "宣戦布告する側のクラスID（省略時は布告者の所属クラス）" },
          defenderClassId: { type: :string, example: "2", description: "宣戦布告される側のクラスID" },
          subjects:        { type: :array, items: { type: :string }, example: %w[math english], description: "対戦科目（召喚フィールド）" }
        },
        required: %w[defenderClassId subjects]
      }

      response "201", "宣戦布告成功（N:Nバトル作成）" do
        schema type: :object,
          properties: {
            battleId: { type: :string },
            subjects: { type: :array, items: { type: :string } },
            status:   { type: :string }
          },
          required: %w[battleId subjects status]

        let(:attacker_class) { create(:school_class, name: "A組") }
        let(:defender_class) { create(:school_class, name: "B組") }
        let(:teacher) { create(:user, :teacher) }
        before do
          create(:class_membership, user: create(:user), school_class: attacker_class)
          create(:class_membership, user: create(:user), school_class: defender_class)
          cookies[:token] = JwtService.encode(user_id: teacher.id)
        end
        let(:body) { { attackerClassId: attacker_class.id.to_s, defenderClassId: defender_class.id.to_s, subjects: %w[math] } }
        run_test!
      end

      response "422", "同じクラス同士など不正な布告" do
        schema "$ref" => "#/components/schemas/error"
        let(:attacker_class) { create(:school_class, name: "A組") }
        before do
          create(:class_membership, user: create(:user), school_class: attacker_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { attackerClassId: attacker_class.id.to_s, defenderClassId: attacker_class.id.to_s, subjects: %w[math] } }
        run_test!
      end

      response "404", "クラスが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        let(:attacker_class) { create(:school_class, name: "A組") }
        before do
          create(:class_membership, user: create(:user), school_class: attacker_class)
          cookies[:token] = JwtService.encode(user_id: create(:user, :teacher).id)
        end
        let(:body) { { attackerClassId: attacker_class.id.to_s, defenderClassId: "999999", subjects: %w[math] } }
        run_test!
      end

      response "422", "生徒が所属しないクラスを attacker に指定（IDOR防止）" do
        schema "$ref" => "#/components/schemas/error"
        let(:my_class)    { create(:school_class, name: "A組") }
        let(:other_class) { create(:school_class, name: "B組") }
        let(:defender_class) { create(:school_class, name: "C組") }
        let(:student) { create(:user) }
        before do
          create(:class_membership, user: student, school_class: my_class)
          create(:class_membership, user: create(:user), school_class: other_class)
          create(:class_membership, user: create(:user), school_class: defender_class)
          cookies[:token] = JwtService.encode(user_id: student.id)
        end
        # 自分は A組所属なのに B組を attacker に詐称しようとする。
        let(:body) { { attackerClassId: other_class.id.to_s, defenderClassId: defender_class.id.to_s, subjects: %w[math] } }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:body) { {} }
        run_test!
      end

      response "403", "権限なし（school_admin は禁止）" do
        schema "$ref" => "#/components/schemas/error"
        before { cookies[:token] = JwtService.encode(user_id: create(:user, :school_admin).id) }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path "/api/battles/{id}/result" do
    get "バトル結果取得" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]

      parameter name: :id, in: :path, type: :string, required: true, description: "バトルID"

      response "200", "バトル結果" do
        schema type: :object,
          properties: {
            battleId:  { type: :string },
            winnerId:  { type: :string, nullable: true },
            loserId:   { type: :string, nullable: true },
            winnerTeamId: { type: :string, nullable: true },
            loserTeamId:  { type: :string, nullable: true },
            turnCount: { type: :integer },
            logs: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  turn:     { type: :integer },
                  actorId:  { type: :string },
                  action:   { type: :string },
                  targetId: { type: :string },
                  damage:   { type: :integer }
                },
                required: %w[turn actorId action targetId damage]
              }
            }
          },
          required: %w[battleId turnCount logs]

        let(:battle) do
          b = create(
            :battle,
            status: "finished",
            turn_count: 0,
            winner: create(:user),
            loser: create(:user),
            winner_team: create(:school_class, name: "A組"),
            loser_team: create(:school_class, name: "B組")
          )
          create(:battle_player, battle: b, student: create(:user))
          b
        end
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["winnerTeamId"]).to eq(battle.winner_team_id.to_s)
          expect(body["loserTeamId"]).to eq(battle.loser_team_id.to_s)
          expect(body["loserId"]).to eq(battle.loser_id.to_s)
        end
      end

      response "404", "バトルが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "999999" }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "1" }
        run_test!
      end
    end
  end

  path "/api/battles/{id}/token" do
    get "WebSocket接続用トークン発行" do
      tags "Battles"
      produces "application/json"
      security [ cookie_auth: [] ]
      description "Go Game Server への WebSocket 接続に使う JWT を発行する。バトルの参加者にのみ発行する。"

      parameter name: :id, in: :path, type: :string, required: true, description: "バトルID"

      response "200", "トークン発行成功" do
        schema type: :object,
          properties: {
            token: { type: :string }
          },
          required: %w[token]

        let(:student) { create(:user) }
        let(:battle) do
          b = create(:battle)
          create(:battle_player, battle: b, student: student)
          b
        end
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: student.id) }
        run_test!
      end

      response "403", "バトルの参加者でない" do
        schema "$ref" => "#/components/schemas/error"
        let(:battle) { create(:battle) }
        let(:id) { battle.id.to_s }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "404", "バトルが存在しない" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "999999" }
        before { cookies[:token] = JwtService.encode(user_id: create(:user).id) }
        run_test!
      end

      response "401", "未認証" do
        schema "$ref" => "#/components/schemas/error"
        let(:id) { "1" }
        run_test!
      end
    end
  end
end
