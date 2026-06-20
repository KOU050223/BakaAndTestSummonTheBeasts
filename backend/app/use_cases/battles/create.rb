# リアルタイムアクションバトルを作成する（docs/domain/contexts/battle.md）。
#
# - 1対1（チームなし）でも N:N（クラス単位の陣営）でも作成できる。
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

  # 参加者1人分の指定。team_id/leader は N:N（クラス対戦）で使う。
  Participant = Struct.new(:student_id, :team_id, :leader, keyword_init: true)

  # @param created_by [User] バトルを作成したユーザー（教師または生徒）
  # @param subjects [Array<String>] 対戦科目（Exam::SUBJECTS のいずれか、1つ以上）
  # @param student_ids [Array<Integer>] 参加する生徒のID（チームなしの簡易指定）
  # @param participants [Array<Participant,Hash>] team_id/leader 付きの参加者指定（N:N用）。
  #   participants を渡した場合は student_ids より優先する。
  def initialize(created_by:, subjects:, student_ids: [], participants: nil)
    @created_by = created_by
    @subjects = Array(subjects)
    @participants =
      if participants
        normalize_participants(participants)
      else
        Array(student_ids).map { |id| Participant.new(student_id: id) }
      end
  end

  # @return [Battle]
  def call
    validate!

    ActiveRecord::Base.transaction do
      battle = ::Battle.create!(created_by: @created_by, status: "waiting")
      place_fields(battle)
      @participants.each { |participant| snapshot_player(battle, participant) }
      battle
    end
  end

  private

  def normalize_participants(participants)
    Array(participants).map do |p|
      next p if p.is_a?(Participant)

      Participant.new(
        student_id: p[:student_id] || p["student_id"],
        team_id: p[:team_id] || p["team_id"],
        leader: p[:leader] || p["leader"] || false
      )
    end
  end

  def validate!
    raise ArgumentError, "バトルは2人以上で行う" if @participants.size < 2
    raise ArgumentError, "対戦科目を1つ以上指定する" if @subjects.empty?
    ids = @participants.map(&:student_id)
    raise ArgumentError, "同じ生徒を重複して参加させられない" if ids.size != ids.uniq.size
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
  def snapshot_player(battle, participant)
    student = User.find(participant.student_id)
    player = battle.battle_players.create!(
      student: student,
      team_id: participant.team_id,
      leader: participant.leader || false
    )

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
