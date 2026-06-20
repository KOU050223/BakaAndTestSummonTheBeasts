# クラス単位の宣戦布告で N:N バトルを作成する（docs/domain/contexts/battle.md）。
#
# 宣戦布告したクラス（attacker）と布告されたクラス（defender）の生徒全員を、
# それぞれの school_class_id を team_id とする陣営として一括登録する。
# 召喚フィールドや召喚獣スナップショットの構築は Battles::Create に委譲する。
#
# 「各クラスの人が参加できる」要件は、宣戦布告時にクラス所属生徒を全員参加させる
# ことで満たす（クラス一括作成型）。
class Battles::DeclareWar
  # @param created_by [User] 宣戦布告したユーザー（教師または生徒）
  # @param attacker_class_id [Integer] 宣戦布告した側のクラスID
  # @param defender_class_id [Integer] 布告された側のクラスID
  # @param subjects [Array<String>] 対戦科目（1つ以上）
  def initialize(created_by:, attacker_class_id:, defender_class_id:, subjects:)
    @created_by = created_by
    @attacker_class_id = attacker_class_id
    @defender_class_id = defender_class_id
    @subjects = Array(subjects)
  end

  # @return [Battle]
  def call
    validate!

    Battles::Create.new(
      created_by: @created_by,
      subjects: @subjects,
      participants: participants
    ).call
  end

  private

  def validate!
    raise ArgumentError, "宣戦布告するクラスと相手クラスは別である必要がある" if @attacker_class_id == @defender_class_id
    raise ArgumentError, "両クラスに生徒が1人以上必要" if attacker_students.empty? || defender_students.empty?
  end

  # 両クラスの生徒を team_id 付きの参加者へ変換する。team_id にはクラスID（文字列）を使う。
  def participants
    build(attacker_students, @attacker_class_id) + build(defender_students, @defender_class_id)
  end

  def build(students, class_id)
    students.map do |student|
      Battles::Create::Participant.new(student_id: student.id, team_id: class_id.to_s, leader: false)
    end
  end

  def attacker_students
    @attacker_students ||= class_students(@attacker_class_id)
  end

  def defender_students
    @defender_students ||= class_students(@defender_class_id)
  end

  def class_students(class_id)
    school_class = SchoolClass.find(class_id)
    school_class.students.where(role: "student").to_a
  end
end
