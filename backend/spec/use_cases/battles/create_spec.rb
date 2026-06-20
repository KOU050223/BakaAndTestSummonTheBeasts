require "rails_helper"

RSpec.describe Battles::Create do
  let(:creator)  { create(:user, :teacher) }
  let(:player_a) { create(:user) }
  let(:player_b) { create(:user) }
  let(:subjects) { %w[math english physics] }

  # 対戦科目の召喚獣ステータスを両プレイヤーに用意しておく。
  before do
    subjects.each do |subject|
      create(:summon_status, student: player_a, subject: subject, hp: 140, attack: 30, defense: 12, speed: 8)
      create(:summon_status, student: player_b, subject: subject, hp: 120, attack: 25, defense: 10, speed: 6)
    end
  end

  def run
    described_class.new(
      created_by: creator,
      student_ids: [ player_a.id, player_b.id ],
      subjects: subjects
    ).call
  end

  it "waiting 状態のバトルを作成する" do
    battle = run
    expect(battle).to be_persisted
    expect(battle.status).to eq("waiting")
    expect(battle.created_by).to eq(creator)
  end

  it "対戦科目ごとに召喚フィールドを配置する" do
    battle = run
    expect(battle.battle_fields.map(&:subject)).to match_array(subjects)
    # フィールドは互いに離れた座標に配置される（重ならない）。
    centers = battle.battle_fields.map { |f| [ f.center_x, f.center_z ] }
    expect(centers.uniq.size).to eq(subjects.size)
  end

  it "両プレイヤーを参加させる" do
    battle = run
    expect(battle.battle_players.map(&:student_id)).to match_array([ player_a.id, player_b.id ])
  end

  it "各プレイヤーの科目別召喚獣ステータスをスナップショットする" do
    battle = run
    player = battle.battle_players.find_by(student: player_a)
    math = player.battle_summons.find_by(subject: "math")
    expect(math.initial_hp).to eq(140)
    expect(math.initial_attack).to eq(30)
    expect(player.battle_summons.map(&:subject)).to match_array(subjects)
  end

  it "召喚獣ステータスが未登録の科目は0点扱いのステータスでスナップショットする" do
    no_status = create(:user)
    battle = described_class.new(
      created_by: creator,
      student_ids: [ player_a.id, no_status.id ],
      subjects: %w[math]
    ).call

    summon = battle.battle_players.find_by(student: no_status).battle_summons.find_by(subject: "math")
    default = Summon::StatusCalculator.default
    expect(summon.initial_hp).to eq(default.hp)
    expect(summon.initial_attack).to eq(default.attack)
  end

  it "1対1以外（プレイヤー2人でない）は弾く" do
    expect {
      described_class.new(created_by: creator, student_ids: [ player_a.id ], subjects: subjects).call
    }.to raise_error(ArgumentError)
  end

  it "対戦科目が空なら弾く" do
    expect {
      described_class.new(created_by: creator, student_ids: [ player_a.id, player_b.id ], subjects: []).call
    }.to raise_error(ArgumentError)
  end
end
