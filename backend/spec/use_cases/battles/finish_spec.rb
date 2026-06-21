require "rails_helper"

RSpec.describe Battles::Finish do
  let(:winner)  { create(:user) }
  let(:loser)   { create(:user) }
  let(:battle)  { create(:battle, status: "active") }
  let(:winner_class) { create(:school_class, name: "A組") }
  let(:loser_class)  { create(:school_class, name: "B組") }

  let(:logs) do
    [
      { turn: 1, actor_id: winner.id, target_id: loser.id, action: "attack", damage: 20 },
      { turn: 2, actor_id: loser.id,  target_id: winner.id, action: "attack", damage: 15 }
    ]
  end

  def run(battle_record = battle)
    described_class.new(
      battle: battle_record,
      winner_id: winner.id,
      loser_id: loser.id,
      winner_team_id: winner_class.id,
      loser_team_id: loser_class.id,
      logs: logs
    ).call
  end

  it "バトルを finished にして勝者を確定する" do
    run
    battle.reload
    expect(battle.status).to eq("finished")
    expect(battle.winner_id).to eq(winner.id)
    expect(battle.loser_id).to eq(loser.id)
  end

  it "クラス戦の勝敗を履歴として保存する" do
    run
    battle.reload
    expect(battle.winner_team).to eq(winner_class)
    expect(battle.loser_team).to eq(loser_class)
  end

  it "行動ログを保存する" do
    run
    expect(battle.battle_logs.count).to eq(2)
    first = battle.battle_logs.order(:turn).first
    expect(first.actor_id).to eq(winner.id)
    expect(first.damage).to eq(20)
  end

  it "ターン数を記録する" do
    run
    expect(battle.reload.turn_count).to eq(2)
  end

  it "既に finished のバトルに再実行しても二重保存しない（冪等）" do
    run
    expect { run(battle.reload) }.not_to change { BattleLog.count }
    expect(battle.reload.winner_id).to eq(winner.id)
  end

  it "更新前に読み込んだ別インスタンスから再実行しても二重保存しない" do
    stale_battle = Battle.find(battle.id)
    run

    expect { run(stale_battle) }.not_to change { BattleLog.count }
  end

  it "ログが空でも勝敗だけは確定できる" do
    described_class.new(battle: battle, winner_id: winner.id, loser_id: loser.id, logs: []).call
    expect(battle.reload.status).to eq("finished")
    expect(battle.battle_logs.count).to eq(0)
  end
end
