class CreateScores < ActiveRecord::Migration[8.1]
  def change
    create_table :scores do |t|
      t.references :exam, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.integer :score, null: false  # 実際の点数（max_score換算前の生の値）

      t.timestamps
    end

    # 1試験につき1生徒1レコード
    add_index :scores, [:exam_id, :student_id], unique: true
  end
end
