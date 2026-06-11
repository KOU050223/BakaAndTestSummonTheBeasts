class CreateBattlePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :battle_players do |t|
      t.references :battle, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      # バトル開始時点のスナップショット（点数変動の影響を受けないよう）
      t.integer :initial_hp, null: false
      t.integer :initial_attack, null: false
      t.integer :initial_defense, null: false
      t.integer :initial_speed, null: false

      t.timestamps
    end

    add_index :battle_players, [:battle_id, :student_id], unique: true
  end
end
