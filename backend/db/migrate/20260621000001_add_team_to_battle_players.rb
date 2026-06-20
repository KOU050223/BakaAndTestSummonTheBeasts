class AddTeamToBattlePlayers < ActiveRecord::Migration[8.1]
  # N:N（クラス単位）対戦のためにプレイヤーへ陣営情報を持たせる。
  # - team_id: 所属チーム識別子（クラス単位の宣戦布告では school_class_id を入れる）。
  #            1対1（無所属）の既存バトルでは NULL を許容する。
  # - leader:  チームリーダーか（将来の「リーダー撃破で敗北」ルール用。当面は false）。
  def change
    add_column :battle_players, :team_id, :string
    add_column :battle_players, :leader, :boolean, null: false, default: false
    add_index :battle_players, [ :battle_id, :team_id ]
  end
end
