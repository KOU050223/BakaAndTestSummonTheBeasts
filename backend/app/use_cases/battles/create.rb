# 1対1のリアルタイムアクションバトルを作成する（docs/domain/contexts/battle.md）。
#
# - 対戦科目ごとに召喚フィールドを AR 床上に円状配置する。
# - 各プレイヤーの科目別召喚獣ステータスをバトル開始時点でスナップショットする
#   （以降の点数変動に影響されないよう battle_summons に固定）。
# - 召喚獣ステータス未登録の科目は 0 点扱いの仮ステータスを用いる。
#
# UseCase 名前空間 Battles はモデル Battle との衝突を避けるため複数形にする。
class Battles::Create
  FIELD_RADIUS = 3.0
  # フィールドを並べる円の半径（中心からの距離）。
  FIELD_RING_RADIUS = 5.0

  # @param created_by [User] バトルを作成したユーザー（教師または生徒）
  # @param student_ids [Array<Integer>] 参加する生徒2人のID
  # @param subjects [Array<String>] 対戦科目（Exam::SUBJECTS のいずれか、1つ以上）
  def initialize(created_by:, student_ids:, subjects:)
    @created_by = created_by
    @student_ids = Array(student_ids)
    @subjects = Array(subjects)
  end

  # @return [Battle]
  def call
    validate!

    ActiveRecord::Base.transaction do
      battle = ::Battle.create!(created_by: @created_by, status: "waiting")
      place_fields(battle)
      @student_ids.each { |student_id| snapshot_player(battle, student_id) }
      battle
    end
  end

  private

  def validate!
    raise ArgumentError, "バトルは2人で行う" unless @student_ids.size == 2
    raise ArgumentError, "対戦科目を1つ以上指定する" if @subjects.empty?
  end

  # 対戦科目を中心円の上に等間隔で配置する（互いに重ならない座標を割り当てる）。
  def place_fields(battle)
    @subjects.each_with_index do |subject, index|
      angle = (2 * Math::PI * index) / @subjects.size
      battle.battle_fields.create!(
        subject: subject,
        center_x: (FIELD_RING_RADIUS * Math.cos(angle)).round(3),
        center_z: (FIELD_RING_RADIUS * Math.sin(angle)).round(3),
        radius: FIELD_RADIUS
      )
    end
  end

  # 生徒の科目別召喚獣ステータスをスナップショットする。
  def snapshot_player(battle, student_id)
    student = User.find(student_id)
    player = battle.battle_players.create!(student: student)

    @subjects.each do |subject|
      stats = snapshot_stats(student, subject)
      player.battle_summons.create!(
        subject: subject,
        initial_hp: stats.hp,
        initial_attack: stats.attack,
        initial_defense: stats.defense,
        initial_speed: stats.speed
      )
    end
  end

  # 保存済みの SummonStatus を使い、無ければ 0 点扱いの仮ステータスを返す。
  def snapshot_stats(student, subject)
    status = SummonStatus.find_by(student: student, subject: subject)
    return Summon::StatusCalculator.default if status.nil?

    Summon::StatusCalculator::Stats.new(
      hp: status.hp,
      attack: status.attack,
      defense: status.defense,
      speed: status.speed
    )
  end
end
