require "rails_helper"

RSpec.describe Battles::DeclareWar do
  let(:creator)        { create(:user, :teacher) }
  let(:attacker_class) { create(:school_class, name: "A組") }
  let(:defender_class) { create(:school_class, name: "B組") }
  let(:subjects)       { %w[math] }

  # 各クラスに生徒を配属する。
  let!(:attacker_students) do
    create_list(:user, 2).each { |u| create(:class_membership, user: u, school_class: attacker_class) }
  end
  let!(:defender_students) do
    create_list(:user, 3).each { |u| create(:class_membership, user: u, school_class: defender_class) }
  end

  def run
    described_class.new(
      created_by: creator,
      attacker_class_id: attacker_class.id,
      defender_class_id: defender_class.id,
      subjects: subjects
    ).call
  end

  it "両クラスの生徒全員を team_id 付きで参加させる" do
    battle = run
    teams = battle.battle_players.group_by(&:team_id).transform_values { |ps| ps.map(&:student_id) }

    expect(teams[attacker_class.id.to_s]).to match_array(attacker_students.map(&:id))
    expect(teams[defender_class.id.to_s]).to match_array(defender_students.map(&:id))
  end

  it "waiting 状態の N:N バトルを作成する" do
    battle = run
    expect(battle.status).to eq("waiting")
    expect(battle.battle_players.count).to eq(5)
  end

  it "各参加者の召喚獣を科目ごとにスナップショットする" do
    battle = run
    player = battle.battle_players.first
    expect(player.battle_summons.map(&:subject)).to match_array(subjects)
  end

  it "同じクラス同士の宣戦布告は弾く" do
    expect {
      described_class.new(
        created_by: creator,
        attacker_class_id: attacker_class.id,
        defender_class_id: attacker_class.id,
        subjects: subjects
      ).call
    }.to raise_error(ArgumentError)
  end

  it "生徒のいないクラスへの宣戦布告は弾く" do
    empty_class = create(:school_class, name: "C組")
    expect {
      described_class.new(
        created_by: creator,
        attacker_class_id: attacker_class.id,
        defender_class_id: empty_class.id,
        subjects: subjects
      ).call
    }.to raise_error(ArgumentError)
  end

  context "リーダー設定" do
    it "クラスにリーダーが設定されている場合、battle_players.leader が true になる" do
      leader = attacker_students.first
      attacker_class.class_memberships.find_by(user: leader).update!(leader: true)

      battle = run
      leader_player = battle.battle_players.find_by(student_id: leader.id)
      non_leader_player = battle.battle_players.find_by(student_id: attacker_students.last.id)

      expect(leader_player.leader).to be true
      expect(non_leader_player.leader).to be false
    end

    it "リーダーが設定されていない場合、全員 leader: false になる" do
      battle = run
      expect(battle.battle_players.where(leader: true).count).to eq(0)
    end
  end
end
