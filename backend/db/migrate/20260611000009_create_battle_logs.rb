class CreateBattleLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :battle_logs do |t|
      t.references :battle, null: false, foreign_key: true
      t.integer :turn, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false  # MVPでは "attack" のみ
      t.references :target, null: false, foreign_key: { to_table: :users }
      t.integer :damage, null: false

      t.timestamps
    end

    add_index :battle_logs, [ :battle_id, :turn ]
  end
end
