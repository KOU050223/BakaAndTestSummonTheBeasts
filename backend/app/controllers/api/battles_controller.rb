module Api
  # バトル一覧・作成・結果取得（docs/apiSpec.md §3.7, §3.8）。
  # バトル進行は Go Game Server が担い、Rails は作成（スナップショット）と結果保存を担当する。
  class BattlesController < BaseController
    before_action -> { require_role!(:student, :teacher) }, only: %i[index create result token opponents]

    # 自分が参加している（または作成した）バトル一覧。
    def index
      battles = Battle
        .left_joins(:battle_players)
        .where("battle_players.student_id = :id OR battles.created_by_id = :id", id: current_user.id)
        .distinct
        .order(created_at: :desc)

      render json: { battles: battles.map { |b| index_json(b) } }, status: :ok
    end

    # 対戦相手の候補一覧（自分以外の生徒全員、クラスを問わない）。
    # 宣戦布告の相手選択に使う。
    def opponents
      candidates = User.where(role: "student").where.not(id: current_user.id).order(:id)
      render json: { opponents: candidates.map { |s| { id: s.id, name: s.name } } }, status: :ok
    end

    def create
      battle = Battles::Create.new(
        created_by: current_user,
        student_ids: participant_ids,
        subjects: Array(params[:subjects])
      ).call

      render json: { battleId: battle.id.to_s, subjects: battle.subjects, status: battle.status }, status: :created
    rescue ArgumentError => e
      render_error(code: "invalid_request", message: e.message, status: :unprocessable_entity)
    end

    def result
      battle = Battle.find_by(id: params[:id])
      return render_error(code: "not_found", message: "バトルが見つかりません", status: :not_found) if battle.nil?

      render json: BattleResultSerializer.new(battle), status: :ok
    end

    # Go Game Server への WebSocket 接続に使う JWT を発行する。
    # httpOnly Cookie の認証トークンは JS から読めないため、参加者本人にだけ
    # 同じ署名鍵（JwtService）の短命トークンを別途渡す。Go 側はこの user_id と
    # battleId の参加チェックで認可する。
    def token
      battle = Battle.find_by(id: params[:id])
      return render_error(code: "not_found", message: "バトルが見つかりません", status: :not_found) if battle.nil?

      unless battle.battle_players.exists?(student_id: current_user.id)
        return render_error(code: "forbidden", message: "このバトルの参加者ではありません", status: :forbidden)
      end

      render json: { token: JwtService.encode(user_id: current_user.id) }, status: :ok
    end

    private

    # 参加者IDを組み立てる。生徒が作成した場合は自分も参加者に含める。
    def participant_ids
      ids = Array(params[:studentIds]).map(&:to_i)
      ids << current_user.id if current_user.role == "student" && params[:opponentId].present?
      ids << params[:opponentId].to_i if params[:opponentId].present?
      ids.uniq
    end

    def index_json(battle)
      opponent = battle.battle_players.map(&:student).find { |s| s.id != current_user.id }
      {
        battleId: battle.id.to_s,
        subjects: battle.subjects,
        status: battle.status,
        opponentName: opponent&.name
      }
    end
  end
end
