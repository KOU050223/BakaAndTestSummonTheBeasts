class RestructureBattlesForMultiSubject < ActiveRecord::Migration[8.1]
  # リアルタイムアクション・複数科目の召喚フィールド仕様へ移行する
  # （docs/domain/contexts/battle.md）。
  # - battles.subject（単一科目）を廃止し、複数の召喚フィールドを battle_fields で表現
  # - battle_players の単一スナップショットを廃止し、科目ごとのスナップショットを
  #   battle_summons へ分離（科目ごとに個別 HP を持つため）
  def change
    # バトルに配置される科目フィールド（先生中心の円）。
    create_table :battle_fields do |t|
      t.references :battle, null: false, foreign_key: true
      t.string :subject, null: false
      # AR 床上のフィールド中心座標と半径（メートル相当）。
      t.float :center_x, null: false, default: 0.0
      t.float :center_z, null: false, default: 0.0
      t.float :radius, null: false, default: 3.0

      t.timestamps
    end
    add_index :battle_fields, [ :battle_id, :subject ], unique: true

    # プレイヤーの科目別召喚獣スナップショット（バトル開始時点で固定）。
    create_table :battle_summons do |t|
      t.references :battle_player, null: false, foreign_key: true
      t.string :subject, null: false
      t.integer :initial_hp, null: false
      t.integer :initial_attack, null: false
      t.integer :initial_defense, null: false
      t.integer :initial_speed, null: false

      t.timestamps
    end
    add_index :battle_summons, [ :battle_player_id, :subject ], unique: true

    # battle_players からは単一スナップショット列を撤去（battle_summons へ移動）。
    remove_column :battle_players, :initial_hp, :integer
    remove_column :battle_players, :initial_attack, :integer
    remove_column :battle_players, :initial_defense, :integer
    remove_column :battle_players, :initial_speed, :integer

    # battles からは単一科目を撤去（battle_fields で複数科目を表現）。
    remove_column :battles, :subject, :string
  end
end
