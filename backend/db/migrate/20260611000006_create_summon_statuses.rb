class CreateSummonStatuses < ActiveRecord::Migration[8.1]
  def change
    create_table :summon_statuses do |t|
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :subject, null: false
      t.integer :hp, null: false
      t.integer :attack, null: false
      t.integer :defense, null: false
      t.integer :speed, null: false

      t.timestamps
    end

    # 1生徒1科目につき1レコード（点数登録ごとに上書き）
    add_index :summon_statuses, [:student_id, :subject], unique: true
  end
end
