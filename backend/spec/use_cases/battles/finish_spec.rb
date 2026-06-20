require "rails_helper"

RSpec.describe Battles::Finish do
  let(:winner)  { create(:user) }
  let(:loser)   { create(:user) }
  let(:battle)  { create(:battle, status: "active") }

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
      logs: logs
    ).call
  end

  it "バトルを finished にして勝者を確定する" do
    run
    battle.reload
    expect(battle.status).to eq("finished")
    expect(battle.winner_id).to eq(winner.id)
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

  it "ログが空でも勝敗だけは確定できる" do
    described_class.new(battle: battle, winner_id: winner.id, loser_id: loser.id, logs: []).call
    expect(battle.reload.status).to eq("finished")
    expect(battle.battle_logs.count).to eq(0)
  end
end
