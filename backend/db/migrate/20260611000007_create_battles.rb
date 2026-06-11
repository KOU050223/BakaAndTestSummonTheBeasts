class CreateBattles < ActiveRecord::Migration[8.1]
  def change
    create_table :battles do |t|
      t.string :subject, null: false
      t.string :status, null: false, default: "waiting"  # waiting / active / finished
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :winner, foreign_key: { to_table: :users }
      t.integer :turn_count

      t.timestamps
    end

    add_index :battles, :status
  end
end
